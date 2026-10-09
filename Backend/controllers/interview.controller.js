/**
 * Interview scheduling with Google Calendar + Google Meet.
 *
 *  1. The interviewer (company admin / employee) connects Google ONCE   -> GET /api/interview/google/connect
 *  2. Company schedules from the pipeline board                          -> POST /api/interview/schedule
 *       - a Google Calendar event is created on THEIR calendar
 *       - a Meet link is generated, the student gets Google's invite email + our CampusHire email
 *  3. Fallbacks: paste any meeting link (Zoom/Teams) or choose offline (address). An .ics file is
 *     attached to our email whenever Google did not send an invite.
 */
import { PrismaClient } from "@prisma/client";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { emailOptions, emailQueue } from "../queues/email-queue.js";
import { redisConnection } from "../config/redis.js";
import { log } from "../utils/logger.js";
import { resolveCompanyContext, bustPipelineCache } from "../utils/companyContext.js";
import * as gcal from "../service/googleCalendar.service.js";

const prisma = new PrismaClient();
const DEFAULT_TZ = process.env.DEFAULT_TIMEZONE || "Asia/Kolkata";
const SCHEDULABLE = ["shortlisted", "aptitude", "interview"];

/* ------------------------- Google connection ------------------------- */
export const googleConnectUrl = asyncHandler(async (req, res) => {
  res.json(new ApiResponse(200, { url: gcal.getAuthUrl(req.user.id) }, "open this url to connect Google"));
});

// PUBLIC route (Google redirects the browser here). Identity comes from the signed `state`.
export const googleCallback = async (req, res) => {
  const front = process.env.FRONTEND_URL || "http://localhost:5173";
  try {
    if (req.query.error) throw new Error(req.query.error);
    await gcal.handleOAuthCallback(req.query.code, req.query.state);
    res.redirect(`${front}/company/settings?google=connected`);
  } catch (e) {
    log.error("google.callback_failed", { message: e.message });
    res.redirect(`${front}/company/settings?google=error`);
  }
};

export const googleStatus = asyncHandler(async (req, res) => {
  const conn = await gcal.getConnection(req.user.id);
  res.json(new ApiResponse(200, { connected: !!conn, googleEmail: conn?.googleEmail ?? null }, "google status"));
});

export const googleDisconnect = asyncHandler(async (req, res) => {
  await gcal.disconnect(req.user.id);
  res.json(new ApiResponse(200, null, "google disconnected"));
});

/* ------------------------- helpers ------------------------- */
function parseWindow(body, { requireFuture = true } = {}) {
  const startsAt = new Date(body.startsAt);
  if (Number.isNaN(startsAt.getTime())) throw new ApiError(400, "startsAt is not a valid date");
  if (requireFuture && startsAt.getTime() < Date.now() + 5 * 60 * 1000) throw new ApiError(400, "interview must start at least 5 minutes from now");
  const mins = Number(body.durationMins ?? 45);
  if (!(mins >= 15 && mins <= 240)) throw new ApiError(400, "durationMins must be 15-240");
  return { startsAt, endsAt: new Date(startsAt.getTime() + mins * 60 * 1000) };
}

async function assertNoClash({ startsAt, endsAt, userId, studentId, ignoreId }) {
  const clash = await prisma.interview.findFirst({
    where: {
      status: "scheduled",
      ...(ignoreId && { id: { not: ignoreId } }),
      startsAt: { lt: endsAt }, endsAt: { gt: startsAt },
      OR: [{ scheduledByUserId: userId }, { studentId }],
    },
    select: { scheduledByUserId: true },
  });
  if (clash) throw new ApiError(409, clash.scheduledByUserId === userId ? "you already have an interview in that slot" : "the student already has an interview in that slot");
}

const isHttps = (u) => { try { return new URL(u).protocol === "https:"; } catch { return false; } };

async function loadOwnedApplication(applicationId, companyId) {
  const app = await prisma.application.findFirst({
    where: { id: applicationId, job: { companyId } },
    select: {
      id: true, status: true, mentorApproval: true, studentId: true,
      student: { select: { user: { select: { name: true, email: true } } } },
      job: { select: { id: true, title: true, company: { select: { name: true } }, aptitudeTest: { select: { isPublished: true } } } },
      aptitudeAttempt: { select: { status: true, passed: true } },
      interview: true,
    },
  });
  if (!app) throw new ApiError(404, "application not found");
  return app;
}

const emailPayload = (app, iv, extra = {}) => ({
  studentName: app.student.user.name, studentEmail: app.student.user.email,
  companyName: app.job.company.name, jobTitle: app.job.title,
  startsAt: iv.startsAt, endsAt: iv.endsAt, timeZone: iv.timeZone, mode: iv.mode,
  meetLink: iv.meetLink, address: iv.address, notes: iv.notes, interviewId: iv.id, ...extra,
});

/* ------------------------- schedule ------------------------- */
export const scheduleInterview = asyncHandler(async (req, res) => {
  const b = req.body ?? {};
  if (!b.applicationId) throw new ApiError(400, "applicationId is required");
  const mode = b.mode === "offline" ? "offline" : "online";
  const timeZone = b.timeZone || DEFAULT_TZ;
  const { startsAt, endsAt } = parseWindow(b);
  const { companyId, employeeId } = await resolveCompanyContext(prisma, req.user);

  const app = await loadOwnedApplication(b.applicationId, companyId);

  if (app.mentorApproval !== "approved") throw new ApiError(409, "mentor approval is missing");
  if (!SCHEDULABLE.includes(app.status)) throw new ApiError(409, `cannot schedule an interview while the application is '${app.status}'`);
  if (app.job.aptitudeTest?.isPublished && !app.aptitudeAttempt?.passed) throw new ApiError(409, "the student has not passed the aptitude test yet");
  if (app.interview && app.interview.status === "scheduled") throw new ApiError(409, "an interview is already scheduled - reschedule it instead");
  if (app.status === "interview" && app.interview?.status !== "cancelled") throw new ApiError(409, "interview stage already reached");

  if (mode === "offline" && !b.address?.trim()) throw new ApiError(400, "address is required for offline interviews");
  if (b.meetLink && !isHttps(b.meetLink)) throw new ApiError(400, "meetLink must be a valid https link");

  await assertNoClash({ startsAt, endsAt, userId: req.user.id, studentId: app.studentId });

  /* --- external side effect FIRST (can't be rolled back by the DB transaction) --- */
  let meetLink = b.meetLink?.trim() || null;
  let calendarEventId = null;
  let calendarOwnerId = null;
  let googleInvited = false;

  if (mode === "online" || b.addToCalendar) {
    const conn = await gcal.getConnection(req.user.id);
    if (conn) {
      const ev = await gcal.createMeetEvent({
        userId: req.user.id,
        summary: `Interview: ${app.student.user.name} - ${app.job.title} (${app.job.company.name})`,
        description: `${b.notes ?? ""}\n\nScheduled via CampusHire.`.trim(),
        startsAt, endsAt, timeZone,
        attendees: [app.student.user.email, req.user.email],
      });
      calendarEventId = ev.eventId;
      calendarOwnerId = req.user.id;
      googleInvited = true;
      if (mode === "online" && !meetLink) meetLink = ev.meetLink; // Google generated Meet link
    } else if (mode === "online" && !meetLink) {
      throw new ApiError(400, "Connect your Google account (Settings) or paste a meeting link to schedule an online interview");
    }
  }

  let interview;
  try {
    interview = await prisma.$transaction(async (tx) => {
      const moved = await tx.application.updateMany({
        where: { id: app.id, status: { in: SCHEDULABLE }, mentorApproval: "approved" },
        data: { status: "interview" },
      });
      if (moved.count !== 1) throw new ApiError(409, "application changed, refresh and retry");
      const data = {
        studentId: app.studentId, employeeId, scheduledByUserId: req.user.id,
        startsAt, endsAt, timeZone, mode, meetLink,
        address: mode === "offline" ? b.address.trim() : null,
        calendarEventId, calendarOwnerId, notes: b.notes?.trim() || null, status: "scheduled",
      };
      return app.interview
        ? tx.interview.update({ where: { id: app.interview.id }, data })
        : tx.interview.create({ data: { ...data, applicationId: app.id } });
    });
  } catch (e) {
    if (calendarEventId) await gcal.cancelEvent({ userId: req.user.id, eventId: calendarEventId }).catch(() => {});
    throw e;
  }

  await emailQueue.add("interview-scheduled", emailPayload(app, interview, { attachIcs: !googleInvited, organizerEmail: req.user.email }), emailOptions);
  await bustPipelineCache(redisConnection, app.job.id);
  log.info("interview.scheduled", { interviewId: interview.id, mode, googleInvited });

  res.status(201).json(new ApiResponse(201, interview, googleInvited ? "interview scheduled - Google Calendar invite sent" : "interview scheduled"));
});

/* ------------------------- reschedule / cancel ------------------------- */
async function loadOwnedInterview(id, companyId) {
  const iv = await prisma.interview.findFirst({
    where: { id, application: { job: { companyId } } },
    include: {
      application: {
        select: {
          id: true,
          student: { select: { user: { select: { name: true, email: true } } } },
          job: { select: { id: true, title: true, company: { select: { name: true } } } },
        },
      },
    },
  });
  if (!iv) throw new ApiError(404, "interview not found");
  return iv;
}

export const rescheduleInterview = asyncHandler(async (req, res) => {
  const { companyId } = await resolveCompanyContext(prisma, req.user);
  const iv = await loadOwnedInterview(req.params.id, companyId);
  if (iv.status !== "scheduled") throw new ApiError(409, `interview is ${iv.status}`);

  const { startsAt, endsAt } = parseWindow(req.body ?? {});
  const timeZone = req.body.timeZone || iv.timeZone;
  await assertNoClash({ startsAt, endsAt, userId: iv.scheduledByUserId, studentId: iv.studentId, ignoreId: iv.id });

  let googleUpdated = false;
  if (iv.calendarEventId && iv.calendarOwnerId) {
    googleUpdated = await gcal.rescheduleEvent({ userId: iv.calendarOwnerId, eventId: iv.calendarEventId, startsAt, endsAt, timeZone });
  }
  const updated = await prisma.interview.update({ where: { id: iv.id }, data: { startsAt, endsAt, timeZone, ...(req.body.notes !== undefined && { notes: req.body.notes }) } });

  await emailQueue.add("interview-scheduled", emailPayload(iv.application, updated, { rescheduled: true, attachIcs: !googleUpdated, organizerEmail: req.user.email }), emailOptions);
  await bustPipelineCache(redisConnection, iv.application.job.id);
  res.json(new ApiResponse(200, updated, "interview rescheduled"));
});

export const cancelInterview = asyncHandler(async (req, res) => {
  const { companyId } = await resolveCompanyContext(prisma, req.user);
  const iv = await loadOwnedInterview(req.params.id, companyId);
  if (iv.status !== "scheduled") throw new ApiError(409, `interview is already ${iv.status}`);

  if (iv.calendarEventId && iv.calendarOwnerId) await gcal.cancelEvent({ userId: iv.calendarOwnerId, eventId: iv.calendarEventId });
  const updated = await prisma.interview.update({ where: { id: iv.id }, data: { status: "cancelled" } });

  await emailQueue.add("interview-cancelled", emailPayload(iv.application, updated), emailOptions);
  await bustPipelineCache(redisConnection, iv.application.job.id);
  res.json(new ApiResponse(200, updated, "interview cancelled - you can schedule a new slot"));
});

/* ------------------------- lists ------------------------- */
export const companyInterviews = asyncHandler(async (req, res) => {
  const { companyId } = await resolveCompanyContext(prisma, req.user);
  const upcomingOnly = req.query.upcoming !== "false";
  const rows = await prisma.interview.findMany({
    where: { application: { job: { companyId } }, ...(upcomingOnly && { status: "scheduled", endsAt: { gte: new Date() } }) },
    orderBy: { startsAt: "asc" }, take: 100,
    select: {
      id: true, startsAt: true, endsAt: true, mode: true, meetLink: true, address: true, status: true, timeZone: true,
      application: { select: { id: true, job: { select: { id: true, title: true } }, student: { select: { rollNo: true, user: { select: { name: true } } } } } },
    },
  });
  res.json(new ApiResponse(200, rows, "interviews"));
});

export const myInterviews = asyncHandler(async (req, res) => {
  const student = await prisma.student.findUnique({ where: { userId: req.user.id }, select: { id: true } });
  if (!student) throw new ApiError(404, "student profile not found");
  const rows = await prisma.interview.findMany({
    where: { studentId: student.id },
    orderBy: { startsAt: "asc" },
    select: {
      id: true, startsAt: true, endsAt: true, mode: true, meetLink: true, address: true, status: true, timeZone: true, notes: true,
      application: { select: { job: { select: { title: true, company: { select: { name: true } } } } } },
    },
  });
  res.json(new ApiResponse(200, rows, "my interviews"));
});
