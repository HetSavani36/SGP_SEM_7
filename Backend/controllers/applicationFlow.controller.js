/**
 * Corrected placement flow
 *
 *   Student applies
 *      -> MENTOR approves / rejects          (gate #1, college quality filter)
 *      -> COMPANY shortlists / rejects       (only sees mentor-approved applications)
 *      -> APTITUDE TEST (if the job has a published test)   auto-assigned on shortlist
 *      -> INTERVIEW scheduled (Google Meet + Calendar)
 *      -> COMPANY hires / rejects
 *
 * The old code let the company shortlist BEFORE the mentor looked at the application, and the company
 * endpoints never checked that the application belonged to the caller's company.
 */
import { PrismaClient } from "@prisma/client";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { emailOptions, emailQueue } from "../queues/email-queue.js";
import { redisConnection } from "../config/redis.js";
import { log } from "../utils/logger.js";
import { canApprovalTransition } from "../domain/approvalStateMachine.js";
import { canStudentApplicationTransition } from "../domain/studentApplicationStateMachine.js";
import { resolveCompanyContext, bustPipelineCache } from "../utils/companyContext.js";

const prisma = new PrismaClient();

/* ===================== MENTOR (gate #1) ===================== */
export const mentorDecision = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;
  const { result } = req.body ?? {};
  if (!["approved", "rejected"].includes(result)) throw new ApiError(400, "result must be 'approved' or 'rejected'");

  let snapshot = null;
  let changed = false;

  await prisma.$transaction(async (tx) => {
    const app = await tx.application.findUnique({
      where: { id: applicationId },
      select: {
        id: true, status: true, mentorApproval: true, mentorId: true,
        student: { select: { user: { select: { name: true, email: true } } } },
        mentor: { select: { user: { select: { id: true, name: true } } } },
        job: { select: { id: true, title: true, dueDate: true, company: { select: { name: true } } } },
      },
    });
    if (!app || !app.mentorId) throw new ApiError(404, "no such application found");
    if (app.mentor.user.id !== req.user.id) throw new ApiError(403, "this application is not assigned to you");

    snapshot = app;
    if (app.mentorApproval === result) return; // idempotent
    if (!canApprovalTransition(app.mentorApproval, result)) {
      throw new ApiError(409, `cannot move from ${app.mentorApproval} to ${result}`);
    }
    if (app.status !== "pending") throw new ApiError(409, "application is already past the mentor stage");
    if (app.job.dueDate && app.job.dueDate < new Date()) throw new ApiError(403, "the job deadline has passed");

    const upd = await tx.application.updateMany({
      where: { id: app.id, mentorApproval: "pending", status: "pending" },
      data: { mentorApproval: result, ...(result === "rejected" && { status: "rejected" }) },
    });
    changed = upd.count === 1;
  });

  if (changed) {
    await emailQueue.add("mentor-decision", {
      studentName: snapshot.student.user.name,
      mentorName: snapshot.mentor.user.name,
      companyName: snapshot.job.company.name,
      jobTitle: snapshot.job.title,
      status: result,
      studentEmail: snapshot.student.user.email,
    }, emailOptions);
    await bustPipelineCache(redisConnection, snapshot.job.id);
  }
  res.json(new ApiResponse(200, { id: snapshot.id, mentorApproval: result }, `application ${result} by mentor`));
});

/* ===================== COMPANY: shortlist / reject ===================== */
export const companyShortlistDecision = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;
  const { result } = req.body ?? {};
  if (!["1", "0"].includes(result)) throw new ApiError(400, "result must be '1' (shortlist) or '0' (reject)");

  const { companyId } = await resolveCompanyContext(prisma, req.user);
  let snapshot = null;
  let nextStatus = null;
  let changed = false;

  await prisma.$transaction(async (tx) => {
    const app = await tx.application.findUnique({
      where: { id: applicationId },
      select: {
        id: true, status: true, mentorApproval: true,
        student: { select: { user: { select: { name: true, email: true } } } },
        job: {
          select: {
            id: true, title: true, companyId: true, status: true, isApproved: true, dueDate: true,
            company: { select: { name: true } },
            aptitudeTest: { select: { isPublished: true, title: true, durationMins: true, closesAt: true } },
          },
        },
      },
    });
    if (!app || app.job.companyId !== companyId) throw new ApiError(404, "no such application found"); // 404 on purpose: don't leak other companies' ids
    if (app.mentorApproval !== "approved") throw new ApiError(409, "the college mentor has not approved this application yet");
    if (app.job.status === "closed" || !app.job.isApproved) throw new ApiError(403, "this job is not open for decisions");

    snapshot = app;
    const hasTest = !!app.job.aptitudeTest?.isPublished;
    nextStatus = result === "0" ? "rejected" : hasTest ? "aptitude" : "shortlisted";

    if (app.status === nextStatus) return; // idempotent
    // shortlisted-with-test is two legal steps in one: pending -> shortlisted -> aptitude
    const legal = nextStatus === "aptitude"
      ? canStudentApplicationTransition(app.status, "shortlisted") && canStudentApplicationTransition("shortlisted", "aptitude")
      : canStudentApplicationTransition(app.status, nextStatus);
    if (!legal) throw new ApiError(409, `cannot move from ${app.status} to ${nextStatus}`);

    const upd = await tx.application.updateMany({ where: { id: app.id, status: app.status }, data: { status: nextStatus } });
    changed = upd.count === 1;
  });

  if (changed) {
    await emailQueue.add("student-application-decision-company", {
      studentName: snapshot.student.user.name,
      companyName: snapshot.job.company.name,
      jobTitle: snapshot.job.title,
      status: nextStatus === "rejected" ? "rejected" : "shortlisted",
      aptitude: nextStatus === "aptitude" ? snapshot.job.aptitudeTest : null,
      studentEmail: snapshot.student.user.email,
    }, emailOptions);
    await bustPipelineCache(redisConnection, snapshot.job.id);
  }
  log.info("company.shortlist_decision", { applicationId, nextStatus, changed });
  res.json(new ApiResponse(200, { id: applicationId, status: nextStatus }, `the student has been ${nextStatus}`));
});

/* ===================== COMPANY: final hire / reject ===================== */
export const companyFinalDecision = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;
  const { result } = req.body ?? {};
  if (!["hire", "reject"].includes(result)) throw new ApiError(400, "result must be 'hire' or 'reject'");

  const { companyId } = await resolveCompanyContext(prisma, req.user);
  const nextStatus = result === "hire" ? "hired" : "rejected";
  let snapshot = null;
  let changed = false;

  await prisma.$transaction(async (tx) => {
    const app = await tx.application.findUnique({
      where: { id: applicationId },
      select: {
        id: true, status: true, mentorApproval: true,
        student: { select: { user: { select: { name: true, email: true } } } },
        job: { select: { id: true, title: true, companyId: true, company: { select: { name: true } } } },
      },
    });
    if (!app || app.job.companyId !== companyId) throw new ApiError(404, "no such application found");
    snapshot = app;
    if (app.status === nextStatus) return;
    if (app.status !== "interview") throw new ApiError(409, "schedule an interview before the final decision");
    if (app.mentorApproval !== "approved") throw new ApiError(409, "mentor approval missing");

    const upd = await tx.application.updateMany({ where: { id: app.id, status: "interview" }, data: { status: nextStatus } });
    changed = upd.count === 1;
    if (changed) await tx.interview.updateMany({ where: { applicationId: app.id, status: "scheduled" }, data: { status: "completed" } });
  });

  if (changed) {
    await emailQueue.add("final-decision", {
      studentName: snapshot.student.user.name,
      companyName: snapshot.job.company.name,
      jobTitle: snapshot.job.title,
      status: nextStatus,
      studentEmail: snapshot.student.user.email,
    }, emailOptions);
    await bustPipelineCache(redisConnection, snapshot.job.id);
  }
  res.json(new ApiResponse(200, { id: applicationId, status: nextStatus }, `Student has been ${nextStatus}`));
});

/* ===================== COMPANY: pipeline board (replaces getJobPipeline) ===================== */
export const getJobPipeline = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const { companyId } = await resolveCompanyContext(prisma, req.user);

  const version = Number(await redisConnection.get(`company:job:pipeline:${jobId}:version`)) || 1;
  const cacheKey = `company:job:pipeline:${jobId}:v${version}`;
  const cached = await redisConnection.get(cacheKey);
  if (cached) {
    const parsed = JSON.parse(cached);
    if (parsed.companyId !== companyId) throw new ApiError(404, "Job not found");
    return res.json(new ApiResponse(200, parsed.job, "company job pipeline(cached)"));
  }

  const job = await prisma.job.findFirst({
    where: { id: jobId, companyId },
    select: {
      id: true, title: true, dueDate: true, isApproved: true, status: true,
      college: { select: { name: true } },
      aptitudeTest: { select: { id: true, isPublished: true, passingPercent: true, durationMins: true } },
      _count: { select: { applications: { where: { mentorApproval: "pending", status: "pending" } } } },
      applications: {
        where: { mentorApproval: "approved" }, // company only ever sees mentor-approved candidates
        orderBy: { appliedAt: "desc" },
        select: {
          id: true, status: true, mentorApproval: true, appliedAt: true,
          aptitudeAttempt: { select: { status: true, percent: true, passed: true, submittedAt: true, tabSwitches: true } },
          interview: { select: { id: true, startsAt: true, endsAt: true, mode: true, meetLink: true, address: true, status: true } },
          student: {
            select: {
              id: true, branch: true, year: true, rollNo: true, resume: true, aboutMe: true,
              user: { select: { name: true, email: true } },
              skills: { select: { skill: { select: { name: true } } } },
            },
          },
        },
      },
    },
  });
  if (!job) throw new ApiError(404, "Job not found");

  const { _count, ...rest } = job;
  const payload = { ...rest, awaitingMentorCount: _count.applications };
  await redisConnection.setex(cacheKey, 120, JSON.stringify({ companyId, job: payload }));
  res.json(new ApiResponse(200, payload, "Job pipeline fetched"));
});
