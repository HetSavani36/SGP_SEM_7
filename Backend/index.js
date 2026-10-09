import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import cron from "node-cron";
import { cleanupSessions } from "./service/sessionCleanUp.js";

const app = express();
dotenv.config({
  path: "./.env",
});

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "idempotency-key"],
  }),
);

app.use(express.static("public"));
app.use(cookieParser());
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

app.use((req, res, next) => {
  const label = `Request-${Date.now()}`;
  console.time(label);

  res.on("finish", () => {
    console.timeEnd(label);
  });

  next();
});

import authRouter from "./routes/auth.route.js";
import collegeRouter from "./routes/college.route.js";
import userRouter from "./routes/user.route.js";
import companyRouter from "./routes/company.route.js";
import studentRouter from "./routes/student.route.js";
import mentorRouter from "./routes/mentor.route.js";
import { cleanupIdempotencyKeys } from "./service/idempotencyKeysCleanUp.js";
import aptitudeRouter from "./routes/aptitude.route.js";
import interviewRouter from "./routes/interview.route.js";
import { expireStaleAttempts } from "./controllers/aptitude.controller.js";

app.use("/api/auth", authRouter);
app.use("/api/college", collegeRouter);
app.use("/api/user", userRouter);
app.use("/api/company", companyRouter);
app.use("/api/student", studentRouter);
app.use("/api/mentor", mentorRouter);
app.use("/api/aptitude", aptitudeRouter); // NEW
app.use("/api/interview", interviewRouter); // NEW

// 404 (the old handler logged but never replied, so unknown URLs hung forever)
app.use((req, res) => {
  res
    .status(404)
    .json({ success: false, statusCode: 404, message: "Route not found" });
});

// JSON errors, so the frontend's `await res.json()` works for every failure (ApiError, Prisma, JWT ...)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  if (statusCode >= 500) console.error(err);
  res.status(statusCode).json({
    success: false,
    statusCode,
    message: statusCode >= 500 ? "Internal server error" : err.message,
    errors: err.errors ?? [],
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`server running on : http://localhost:${PORT}`);
  console.log(`Api Available at : http://localhost:${PORT}/api`);
});

cron.schedule("0 3 * * *", async () => {
  await cleanupSessions();
});

cron.schedule("0 * * * *", async () => {
  await cleanupIdempotencyKeys();
});

// grade aptitude attempts whose browser never submitted
cron.schedule("*/5 * * * *", async () => {
  await expireStaleAttempts();
});

export { app };
