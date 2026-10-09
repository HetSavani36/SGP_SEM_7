import { google } from "googleapis";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { PrismaClient } from "@prisma/client";
import ApiError from "../utils/ApiError.js";
import { encrypt, decrypt } from "../utils/crypto.util.js";

const prisma = new PrismaClient();

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/userinfo.email",
];

const oauthClient = () =>
  new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI, // e.g. http://localhost:3000/api/interview/google/callback
  );

/** Step 1 – URL the interviewer opens once to connect their Google account. */
export function getAuthUrl(userId) {
  const state = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET_KEY, { expiresIn: "10m" });
  return oauthClient().generateAuthUrl({
    access_type: "offline",
    prompt: "consent", // forces a refresh_token every time
    scope: SCOPES,
    state,
  });
}

/** Step 2 – Google redirects back with ?code&state. */
export async function handleOAuthCallback(code, state) {
  let payload;
  try {
    payload = jwt.verify(state, process.env.ACCESS_TOKEN_SECRET_KEY);
  } catch {
    throw new ApiError(400, "invalid or expired state");
  }

  const client = oauthClient();
  const { tokens } = await client.getToken(code);
  if (!tokens.refresh_token) {
    throw new ApiError(400, "Google did not return a refresh token. Remove CampusHire from your Google account permissions and reconnect.");
  }
  client.setCredentials(tokens);
  const { data: me } = await google.oauth2({ version: "v2", auth: client }).userinfo.get();

  await prisma.googleCredential.upsert({
    where: { userId: payload.userId },
    update: { refreshToken: encrypt(tokens.refresh_token), googleEmail: me.email, scope: tokens.scope },
    create: { userId: payload.userId, refreshToken: encrypt(tokens.refresh_token), googleEmail: me.email, scope: tokens.scope },
  });
  return me.email;
}

export async function getConnection(userId) {
  return prisma.googleCredential.findUnique({
    where: { userId },
    select: { googleEmail: true, createdAt: true },
  });
}

export async function disconnect(userId) {
  await prisma.googleCredential.deleteMany({ where: { userId } });
}

async function calendarFor(userId) {
  const cred = await prisma.googleCredential.findUnique({ where: { userId } });
  if (!cred) return null;
  const client = oauthClient();
  client.setCredentials({ refresh_token: decrypt(cred.refreshToken) });
  return google.calendar({ version: "v3", auth: client });
}

/**
 * Creates a calendar event WITH a Google Meet link and emails invites to attendees.
 * Returns { eventId, meetLink, htmlLink } or null if the user hasn't connected Google.
 */
export async function createMeetEvent({ userId, summary, description, startsAt, endsAt, timeZone, attendees }) {
  const calendar = await calendarFor(userId);
  if (!calendar) return null;

  const { data } = await calendar.events.insert({
    calendarId: "primary",
    conferenceDataVersion: 1, // REQUIRED for Meet link generation
    sendUpdates: "all", // Google emails the invite to every attendee
    requestBody: {
      summary,
      description,
      start: { dateTime: new Date(startsAt).toISOString(), timeZone },
      end: { dateTime: new Date(endsAt).toISOString(), timeZone },
      attendees: attendees.map((email) => ({ email })),
      conferenceData: {
        createRequest: {
          requestId: crypto.randomUUID(),
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
      reminders: { useDefault: false, overrides: [{ method: "email", minutes: 60 }, { method: "popup", minutes: 15 }] },
    },
  });
  return { eventId: data.id, meetLink: data.hangoutLink ?? null, htmlLink: data.htmlLink };
}

export async function rescheduleEvent({ userId, eventId, startsAt, endsAt, timeZone }) {
  const calendar = await calendarFor(userId);
  if (!calendar || !eventId) return false;
  await calendar.events.patch({
    calendarId: "primary",
    eventId,
    sendUpdates: "all",
    requestBody: {
      start: { dateTime: new Date(startsAt).toISOString(), timeZone },
      end: { dateTime: new Date(endsAt).toISOString(), timeZone },
    },
  });
  return true;
}

export async function cancelEvent({ userId, eventId }) {
  const calendar = await calendarFor(userId);
  if (!calendar || !eventId) return false;
  try {
    await calendar.events.delete({ calendarId: "primary", eventId, sendUpdates: "all" });
  } catch (e) {
    if (e?.code !== 404 && e?.code !== 410) throw e; // already gone is fine
  }
  return true;
}
