/**
 * Aptitude test platform (MCQ, timed, auto-graded).
 *
 *  Company  : build a test for a job, publish it, see ranked results.
 *  Student  : sees tests for applications in the `aptitude` stage, takes them in a server-timed session.
 *
 *  Integrity rules enforced SERVER-side:
 *   - the correct answers are never sent to the student
 *   - the timer lives in AptitudeAttempt.expiresAt (client clock is only cosmetic)
 *   - one attempt per application (unique constraint) – refresh/re-open resumes the same attempt
 *   - answers are auto-saved; if the browser dies the attempt is graded from the last save when it expires
 */
import { PrismaClient } from "@prisma/client";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { emailOptions, emailQueue } from "../queues/email-queue.js";
import { redisConnection } from "../config/redis.js";
import { resolveCompanyContext, bustPipelineCache } from "../utils/companyContext.js";

const prisma = new PrismaClient();
const GRACE_MS = 30 * 1000;

/* ---------------------------- grading ---------------------------- */
export function gradeAnswers(questions, test, answers = {}) {
  let score = 0;
  let totalMarks = 0;
  for (const q of questions) {
    totalMarks += q.marks;
    const given = answers[q.id];
    if (given === undefined || given === null) continue;
    score += given === q.correctIndex ? q.marks : -q.marks * test.negativeMarking;
  }
  score = Math.max(0, Math.round(score * 100) / 100);
  const percent = totalMarks ? Math.round((score / totalMarks) * 10000) / 100 : 0;
  return { score, totalMarks, percent, passed: percent >= test.passingPercent };
}

/** Idempotent: only the first caller flips in_progress -> submitted/expired. */
export async function finalizeAttempt(attemptId, { answers, status = "submitted" } = {}) {
  const attempt = await prisma.aptitudeAttempt.findUnique({
    where: { id: attemptId },
    include: {
      test: { include: { questions: true } },
      application: {
        select: {
          id: true, status: true, jobId: true,
          student: { select: { user: { select: { name: true, email: true } } } },
          job: { select: { title: true, company: { select: { name: true } } } },
        },
      },
    },
  });
  if (!attempt) throw new ApiError(404, "attempt not found");
  if (attempt.status !== "in_progress") return attempt;

  const finalAnswers = answers ?? attempt.answers ?? {};
  const result = gradeAnswers(attempt.test.questions, attempt.test, finalAnswers);

  const upd = await prisma.aptitudeAttempt.updateMany({
    where: { id: attemptId, status: "in_progress" },
    data: { status, submittedAt: new Date(), answers: finalAnswers, ...result },
  });
  if (upd.count === 0) return prisma.aptitudeAttempt.findUnique({ where: { id: attemptId } });

  if (!result.passed && attempt.test.autoRejectOnFail) {
    const r = await prisma.application.updateMany({
      where: { id: attempt.application.id, status: "aptitude" },
      data: { status: "rejected" },
    });
    if (r.count === 1) {
      await emailQueue.add("student-application-decision-company", {
        studentName: attempt.application.student.user.name,
        companyName: attempt.application.job.company.name,
        jobTitle: attempt.application.job.title,
        status: "rejected",
        studentEmail: attempt.application.student.user.email,
      }, emailOptions);
    }
  }
  await bustPipelineCache(redisConnection, attempt.application.jobId);
  return { ...attempt, ...result, status };
}

/** Called from a cron job – grades attempts whose browser never submitted. */
export async function expireStaleAttempts() {
  const stale = await prisma.aptitudeAttempt.findMany({
    where: { status: "in_progress", expiresAt: { lt: new Date(Date.now() - GRACE_MS) } },
    select: { id: true },
    take: 200,
  });
  for (const { id } of stale) await finalizeAttempt(id, { status: "expired" }).catch(() => {});
  return stale.length;
}

/* ---------------------------- validation ---------------------------- */
function validateTestBody(b) {
  const errors = [];
  if (!b.title?.trim()) errors.push("title is required");
  const duration = Number(b.durationMins ?? 30);
  if (!(duration >= 5 && duration <= 240)) errors.push("durationMins must be 5-240");
  const pass = Number(b.passingPercent ?? 50);
  if (!(pass >= 0 && pass <= 100)) errors.push("passingPercent must be 0-100");
  const neg = Number(b.negativeMarking ?? 0);
  if (!(neg >= 0 && neg <= 1)) errors.push("negativeMarking must be between 0 and 1");
  if (!Array.isArray(b.questions) || b.questions.length < 1 || b.questions.length > 100) errors.push("provide 1-100 questions");
  else {
    b.questions.forEach((q, i) => {
      const n = `question ${i + 1}`;
      if (!q.text?.trim()) errors.push(`${n}: text required`);
      if (!Array.isArray(q.options) || q.options.length < 2 || q.options.length > 6 || q.options.some((o) => !String(o).trim()))
        errors.push(`${n}: 2-6 non-empty options required`);
      else if (!Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex >= q.options.length)
        errors.push(`${n}: correctIndex out of range`);
      if (q.marks !== undefined && !(Number.isInteger(q.marks) && q.marks >= 1 && q.marks <= 10)) errors.push(`${n}: marks must be 1-10`);
    });
  }
  const opens = b.opensAt ? new Date(b.opensAt) : null;
  const closes = b.closesAt ? new Date(b.closesAt) : null;
  if (opens && closes && closes <= opens) errors.push("closesAt must be after opensAt");
  if (errors.length) throw new ApiError(400, errors.join("; "));
  return { duration, pass, neg, opens, closes };
}

async function ownedJob(jobId, companyId) {
  const job = await prisma.job.findFirst({ where: { id: jobId, companyId }, select: { id: true, title: true } });
  if (!job) throw new ApiError(404, "job not found");
  return job;
}

/* =========================== COMPANY =========================== */
export const upsertTest = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const { companyId } = await resolveCompanyContext(prisma, req.user);
  await ownedJob(jobId, companyId);
  const b = req.body ?? {};
  const { duration, pass, neg, opens, closes } = validateTestBody(b);

  const existing = await prisma.aptitudeTest.findUnique({ where: { jobId }, include: { _count: { select: { attempts: true } } } });
  if (existing?._count.attempts > 0) throw new ApiError(409, "students have already started this test; it can no longer be edited");

  const test = await prisma.$transaction(async (tx) => {
    const data = {
      title: b.title.trim(), instructions: b.instructions?.trim() || null,
      durationMins: duration, passingPercent: pass, negativeMarking: neg,
      autoRejectOnFail: !!b.autoRejectOnFail, opensAt: opens, closesAt: closes,
    };
    const t = existing
      ? await tx.aptitudeTest.update({ where: { id: existing.id }, data })
      : await tx.aptitudeTest.create({ data: { ...data, jobId, companyId } });
    await tx.aptitudeQuestion.deleteMany({ where: { testId: t.id } });
    await tx.aptitudeQuestion.createMany({
      data: b.questions.map((q, i) => ({
        testId: t.id, text: q.text.trim(), options: q.options.map((o) => String(o).trim()),
        correctIndex: q.correctIndex, marks: q.marks ?? 1, section: q.section?.trim() || null, order: i,
      })),
    });
    return t;
  });
  await bustPipelineCache(redisConnection, jobId);
  res.status(existing ? 200 : 201).json(new ApiResponse(200, { id: test.id }, existing ? "test updated" : "test created (publish it to assign it to shortlisted students)"));
});

export const getTestForJob = asyncHandler(async (req, res) => {
  const { companyId } = await resolveCompanyContext(prisma, req.user);
  await ownedJob(req.params.jobId, companyId);
  const test = await prisma.aptitudeTest.findUnique({
    where: { jobId: req.params.jobId },
    include: { questions: { orderBy: { order: "asc" } }, _count: { select: { attempts: true } } },
  });
  res.json(new ApiResponse(200, test, test ? "test" : "no test for this job"));
});

export const setPublished = asyncHandler(async (req, res) => {
  const { testId } = req.params;
  const publish = req.body?.publish !== false;
  const { companyId } = await resolveCompanyContext(prisma, req.user);

  const test = await prisma.aptitudeTest.findFirst({
    where: { id: testId, companyId },
    include: { _count: { select: { questions: true, attempts: true } } },
  });
  if (!test) throw new ApiError(404, "test not found");
  if (publish && test._count.questions === 0) throw new ApiError(400, "add questions first");
  if (!publish && test._count.attempts > 0) throw new ApiError(409, "cannot unpublish after students started");

  await prisma.$transaction(async (tx) => {
    await tx.aptitudeTest.update({ where: { id: testId }, data: { isPublished: publish } });
    if (publish) {
      // Candidates that were shortlisted BEFORE the test existed get it now.
      await tx.application.updateMany({
        where: { jobId: test.jobId, status: "shortlisted", mentorApproval: "approved" },
        data: { status: "aptitude" },
      });
    }
  });
  await bustPipelineCache(redisConnection, test.jobId);
  res.json(new ApiResponse(200, { isPublished: publish }, publish ? "published" : "unpublished"));
});

export const getResults = asyncHandler(async (req, res) => {
  const { testId } = req.params;
  const { companyId } = await resolveCompanyContext(prisma, req.user);
  const test = await prisma.aptitudeTest.findFirst({ where: { id: testId, companyId }, select: { id: true, title: true, passingPercent: true } });
  if (!test) throw new ApiError(404, "test not found");

  const attempts = await prisma.aptitudeAttempt.findMany({
    where: { testId },
    orderBy: [{ percent: { sort: "desc", nulls: "last" } }, { submittedAt: "asc" }],
    select: {
      id: true, status: true, percent: true, score: true, totalMarks: true, passed: true, submittedAt: true, tabSwitches: true,
      applicationId: true,
      application: { select: { status: true, student: { select: { rollNo: true, branch: true, user: { select: { name: true, email: true } } } } } },
    },
  });
  const done = attempts.filter((a) => a.percent !== null);
  const stats = {
    attempted: attempts.length,
    passed: done.filter((a) => a.passed).length,
    average: done.length ? Math.round((done.reduce((s, a) => s + a.percent, 0) / done.length) * 100) / 100 : 0,
  };
  res.json(new ApiResponse(200, { test, stats, attempts }, "results"));
});

/* =========================== STUDENT =========================== */
async function studentOf(user) {
  const s = await prisma.student.findUnique({ where: { userId: user.id }, select: { id: true } });
  if (!s) throw new ApiError(404, "student profile not found");
  return s;
}

export const listMyTests = asyncHandler(async (req, res) => {
  const student = await studentOf(req.user);
  const apps = await prisma.application.findMany({
    where: { studentId: student.id, job: { aptitudeTest: { isPublished: true } }, OR: [{ status: "aptitude" }, { aptitudeAttempt: { isNot: null } }] },
    select: {
      id: true, status: true,
      job: { select: { title: true, company: { select: { name: true } }, aptitudeTest: { select: { id: true, title: true, durationMins: true, passingPercent: true, opensAt: true, closesAt: true, _count: { select: { questions: true } } } } } },
      aptitudeAttempt: { select: { id: true, status: true, expiresAt: true, percent: true, passed: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
  res.json(new ApiResponse(200, apps, "my aptitude tests"));
});

export const startAttempt = asyncHandler(async (req, res) => {
  const { testId } = req.params;
  const student = await studentOf(req.user);

  const app = await prisma.application.findFirst({
    where: { studentId: student.id, status: "aptitude", job: { aptitudeTest: { id: testId, isPublished: true } } },
    select: { id: true, job: { select: { aptitudeTest: { include: { questions: { orderBy: { order: "asc" } } } } } } },
  });
  // also allow resuming an in-progress attempt even if status changed meanwhile
  let attempt = await prisma.aptitudeAttempt.findFirst({ where: { testId, studentId: student.id } });
  if (!app && !attempt) throw new ApiError(403, "you are not eligible for this test");

  const test = app?.job.aptitudeTest ?? (await prisma.aptitudeTest.findUnique({ where: { id: testId }, include: { questions: { orderBy: { order: "asc" } } } }));
  const now = new Date();

  if (attempt && attempt.status === "in_progress" && attempt.expiresAt.getTime() + GRACE_MS < now.getTime()) {
    await finalizeAttempt(attempt.id, { status: "expired" });
    attempt = await prisma.aptitudeAttempt.findUnique({ where: { id: attempt.id } });
  }
  if (attempt && attempt.status !== "in_progress") throw new ApiError(409, "you have already attempted this test");

  if (!attempt) {
    if (test.opensAt && now < test.opensAt) throw new ApiError(403, `test opens at ${test.opensAt.toISOString()}`);
    if (test.closesAt && now > test.closesAt) throw new ApiError(403, "test window is closed");
    const byDuration = now.getTime() + test.durationMins * 60 * 1000;
    const expiresAt = new Date(test.closesAt ? Math.min(byDuration, test.closesAt.getTime()) : byDuration);
    try {
      attempt = await prisma.aptitudeAttempt.create({ data: { testId, applicationId: app.id, studentId: student.id, expiresAt, answers: {} } });
    } catch (e) {
      if (e.code !== "P2002") throw e; // double-click race -> reuse the winner
      attempt = await prisma.aptitudeAttempt.findFirst({ where: { testId, studentId: student.id } });
    }
  }

  res.json(new ApiResponse(200, {
    attemptId: attempt.id,
    title: test.title, instructions: test.instructions,
    expiresAt: attempt.expiresAt, serverNow: new Date(), // client derives its offset from serverNow
    answers: attempt.answers ?? {},
    questions: test.questions.map(({ id, text, options, marks, section }) => ({ id, text, options, marks, section })), // NO correctIndex
  }, "attempt started"));
});

async function myOpenAttempt(attemptId, user) {
  const student = await studentOf(user);
  const attempt = await prisma.aptitudeAttempt.findFirst({ where: { id: attemptId, studentId: student.id }, include: { test: { include: { questions: { select: { id: true, options: true } } } } } });
  if (!attempt) throw new ApiError(404, "attempt not found");
  return attempt;
}

function cleanAnswers(raw, questions) {
  const out = {};
  const byId = new Map(questions.map((q) => [q.id, q]));
  for (const [qid, idx] of Object.entries(raw ?? {})) {
    const q = byId.get(qid);
    if (q && Number.isInteger(idx) && idx >= 0 && idx < q.options.length) out[qid] = idx;
  }
  return out;
}

export const saveAnswers = asyncHandler(async (req, res) => {
  const attempt = await myOpenAttempt(req.params.attemptId, req.user);
  if (attempt.status !== "in_progress" || attempt.expiresAt.getTime() + GRACE_MS < Date.now()) throw new ApiError(409, "attempt is closed");
  await prisma.aptitudeAttempt.update({ where: { id: attempt.id }, data: { answers: cleanAnswers(req.body?.answers, attempt.test.questions) } });
  res.json(new ApiResponse(200, { saved: true }, "saved"));
});

export const submitAttempt = asyncHandler(async (req, res) => {
  const attempt = await myOpenAttempt(req.params.attemptId, req.user);
  if (attempt.status !== "in_progress") {
    return res.json(new ApiResponse(200, { percent: attempt.percent, passed: attempt.passed, status: attempt.status }, "already submitted"));
  }
  const late = Date.now() > attempt.expiresAt.getTime() + GRACE_MS;
  const answers = late ? attempt.answers ?? {} : cleanAnswers(req.body?.answers, attempt.test.questions);
  const done = await finalizeAttempt(attempt.id, { answers, status: late ? "expired" : "submitted" });
  res.json(new ApiResponse(200, { percent: done.percent, passed: done.passed, status: done.status, late }, late ? "time was over - last saved answers were graded" : "submitted"));
});

export const reportViolation = asyncHandler(async (req, res) => {
  const attempt = await myOpenAttempt(req.params.attemptId, req.user);
  if (attempt.status === "in_progress") {
    await prisma.aptitudeAttempt.update({ where: { id: attempt.id }, data: { tabSwitches: { increment: 1 } } });
  }
  res.json(new ApiResponse(200, null, "logged"));
});
