/**
 * Two-way collaboration (company <-> college).
 *
 *  company -> college : POST /api/company/collab/:collegeId          (collabWithCollege)
 *  college -> company : POST /api/college/collab/invite/:companyId   (inviteCompany)
 *
 *  The RECEIVER decides:
 *  college decides company requests : POST /api/college/collab/request/:companyId  (collegeDecision)
 *  company decides college invites  : POST /api/company/collab/respond/:collegeId  (companyDecision)
 *
 *  If both sides request each other at the same time, the second request auto-accepts.
 *  A rejected collaboration can be re-requested (rejected -> pending).
 */
import { PrismaClient } from "@prisma/client";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getPagination } from "../utils/pagination.js";
import { emailOptions, emailQueue } from "../queues/email-queue.js";
import { redisConnection } from "../config/redis.js";
import { log } from "../utils/logger.js";
import { canCollabTransition } from "../domain/collabStateMachine.js";
import { resolveCompanyContext, resolveCollegeId } from "../utils/companyContext.js";

const prisma = new PrismaClient();

async function bustCollabCaches(collegeId, companyId) {
  await Promise.all([
    redisConnection.incr(`college:${collegeId}:collab:requests:version`),
    redisConnection.incr(`college:${collegeId}:version`),
    redisConnection.incr(`company:${companyId}:version`),
    redisConnection.incr(`colleges:version`),
    redisConnection.incr(`companies:version`),
  ]);
}

/** Shared creator – `from` is who is sending ("college" | "company"). */
async function sendRequest({ from, collegeId, companyId }) {
  const [college, company] = await Promise.all([
    prisma.college.findUnique({ where: { id: collegeId }, select: { id: true, name: true, email: true } }),
    prisma.company.findUnique({ where: { id: companyId }, select: { id: true, name: true, email: true } }),
  ]);
  if (!college) throw new ApiError(404, "no such college found");
  if (!company) throw new ApiError(404, "no such company found");

  let result; // { collab, outcome }
  await prisma.$transaction(async (tx) => {
    const existing = await tx.collab.findUnique({
      where: { collegeId_companyId: { collegeId, companyId } },
    });

    if (!existing) {
      const collab = await tx.collab.create({ data: { collegeId, companyId, initiatedBy: from } });
      result = { collab, outcome: "created" };
      return;
    }

    if (existing.status === "accepted") {
      result = { collab: existing, outcome: "already_accepted" };
      return;
    }

    if (existing.status === "pending") {
      if (existing.initiatedBy === from) {
        result = { collab: existing, outcome: "already_pending" };
      } else {
        // The other side already asked us -> mutual interest, accept straight away.
        const collab = await tx.collab.update({ where: { id: existing.id }, data: { status: "accepted" } });
        result = { collab, outcome: "auto_accepted" };
      }
      return;
    }

    // rejected -> pending again, now initiated by the re-requester
    if (!canCollabTransition("rejected", "pending")) throw new ApiError(409, "cannot re-request");
    const collab = await tx.collab.update({
      where: { id: existing.id },
      data: { status: "pending", initiatedBy: from },
    });
    result = { collab, outcome: "re_requested" };
  });

  if (["created", "re_requested"].includes(result.outcome)) {
    if (from === "company") {
      await emailQueue.add("collab-request", { collegeEmail: college.email, collegeName: college.name, companyName: company.name }, emailOptions);
    } else {
      await emailQueue.add("collab-invite", { companyEmail: company.email, companyName: company.name, collegeName: college.name }, emailOptions);
    }
  }
  if (result.outcome === "auto_accepted") {
    const target = from === "company" ? { collegeEmail: college.email } : { companyEmail: company.email };
    await emailQueue.add("collab-decision-both", { ...target, companyName: company.name, collegeName: college.name, status: "accepted", notify: from === "company" ? "college" : "company" }, emailOptions);
  }
  if (result.outcome !== "already_pending" && result.outcome !== "already_accepted") {
    await bustCollabCaches(collegeId, companyId);
  }
  return result;
}

const MESSAGES = {
  created: "collaboration request sent",
  re_requested: "collaboration request sent again",
  already_pending: "a request from you is already pending",
  already_accepted: "you are already collaborating",
  auto_accepted: "they had already requested you - collaboration accepted",
};

/* ---------------- company -> college (replaces old collabWithCollege) ---------------- */
export const collabWithCollege = asyncHandler(async (req, res) => {
  const { collegeId } = req.params;
  if (!collegeId) throw new ApiError(400, "please provide college id");
  const { companyId } = await resolveCompanyContext(prisma, req.user);

  const { collab, outcome } = await sendRequest({ from: "company", collegeId, companyId });
  log.info("collab.company_request", { collegeId, companyId, outcome });
  res.status(outcome === "created" ? 201 : 200).json(new ApiResponse(200, { ...collab, outcome }, MESSAGES[outcome]));
});

/* ---------------- college -> company (NEW) ---------------- */
export const inviteCompany = asyncHandler(async (req, res) => {
  const { companyId } = req.params;
  if (!companyId) throw new ApiError(400, "please provide company id");
  const college = await resolveCollegeId(prisma, req.user);

  const { collab, outcome } = await sendRequest({ from: "college", collegeId: college.id, companyId });
  log.info("collab.college_invite", { collegeId: college.id, companyId, outcome });
  res.status(outcome === "created" ? 201 : 200).json(new ApiResponse(200, { ...collab, outcome }, MESSAGES[outcome]));
});

/** Generic receiver decision. */
async function decide({ receiver, collegeId, companyId, result }) {
  if (!["1", "0"].includes(result)) throw new ApiError(400, "result must be '1' (accept) or '0' (reject)");
  const nextStatus = result === "1" ? "accepted" : "rejected";

  const [college, company] = await Promise.all([
    prisma.college.findUnique({ where: { id: collegeId }, select: { id: true, name: true, email: true } }),
    prisma.company.findUnique({ where: { id: companyId }, select: { id: true, name: true, email: true } }),
  ]);
  if (!college || !company) throw new ApiError(404, "college or company not found");

  const sender = receiver === "college" ? "company" : "college";
  let changed = false;

  await prisma.$transaction(async (tx) => {
    const collab = await tx.collab.findUnique({ where: { collegeId_companyId: { collegeId, companyId } } });
    if (!collab) throw new ApiError(404, "no such collab request found");
    if (collab.initiatedBy !== sender) throw new ApiError(403, "you cannot respond to a request that you sent yourself");
    if (!canCollabTransition(collab.status, nextStatus)) return; // already decided -> idempotent
    const upd = await tx.collab.updateMany({ where: { id: collab.id, status: collab.status }, data: { status: nextStatus } });
    changed = upd.count === 1;
  });

  if (changed) {
    if (receiver === "college") {
      await emailQueue.add("collab-decision", { companyName: company.name, collegeName: college.name, status: nextStatus, companyEmail: company.email }, emailOptions);
    } else {
      await emailQueue.add("collab-decision-college", { companyName: company.name, collegeName: college.name, status: nextStatus, collegeEmail: college.email }, emailOptions);
    }
    await bustCollabCaches(collegeId, companyId);
  }
  return nextStatus;
}

/* college answers a company's request (replaces old collabDecision) */
export const collabDecision = asyncHandler(async (req, res) => {
  const { companyId } = req.params;
  const college = await resolveCollegeId(prisma, req.user);
  const status = await decide({ receiver: "college", collegeId: college.id, companyId, result: req.body?.result });
  res.json(new ApiResponse(200, status, `the collab request is ${status}`));
});

/* company answers a college's invite (NEW) */
export const companyCollabDecision = asyncHandler(async (req, res) => {
  const { collegeId } = req.params;
  const { companyId } = await resolveCompanyContext(prisma, req.user);
  const status = await decide({ receiver: "company", collegeId, companyId, result: req.body?.result });
  res.json(new ApiResponse(200, status, `the collaboration invite is ${status}`));
});

/* company: invites received from colleges (NEW) */
export const getIncomingCollabInvites = asyncHandler(async (req, res) => {
  const { companyId } = await resolveCompanyContext(prisma, req.user);
  const status = ["pending", "accepted", "rejected"].includes(req.query.status) ? req.query.status : "pending";
  const { page, limit, skip } = getPagination(req.query);

  const where = { companyId, status, initiatedBy: "college" };
  const [rows, total] = await prisma.$transaction([
    prisma.collab.findMany({
      where, skip, take: limit, orderBy: { createdAt: "desc" },
      select: { id: true, createdAt: true, college: { select: { id: true, name: true, address: true, email: true } } },
    }),
    prisma.collab.count({ where }),
  ]);
  res.json(new ApiResponse(200, { invites: rows, pagination: { page, limit, total, hasNextPage: skip + rows.length < total } }, "collab invites"));
});

/* college: browse companies + collaboration state (NEW, mirrors company's college list) */
export const getAllCompaniesForCollege = asyncHandler(async (req, res) => {
  const college = await resolveCollegeId(prisma, req.user);
  const search = (req.query.search || "").trim();
  const { page, limit, skip } = getPagination(req.query);

  const where = {
    status: "active",
    ...(search && { name: { contains: search, mode: "insensitive" } }),
  };
  const [companies, total] = await prisma.$transaction([
    prisma.company.findMany({
      where, skip, take: limit, orderBy: { name: "asc" },
      select: {
        id: true, name: true, address: true,
        collabs: { where: { collegeId: college.id }, select: { status: true, initiatedBy: true } },
      },
    }),
    prisma.company.count({ where }),
  ]);

  const data = companies.map(({ collabs, ...c }) => {
    const collab = collabs[0];
    let collabState = "none"; // none | sent | received | collaborated | rejected
    if (collab) {
      if (collab.status === "accepted") collabState = "collaborated";
      else if (collab.status === "rejected") collabState = "rejected";
      else collabState = collab.initiatedBy === "college" ? "sent" : "received";
    }
    return { ...c, collabState };
  });
  res.json(new ApiResponse(200, { companies: data, pagination: { page, limit, total, hasNextPage: skip + data.length < total } }, "companies"));
});
