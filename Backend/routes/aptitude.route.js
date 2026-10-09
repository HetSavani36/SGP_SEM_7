import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import authorizeRole from "../middlewares/authorizableRole.js";
import { requestIdMiddleware } from "../middlewares/requestId.js";
import {
  upsertTest, getTestForJob, setPublished, getResults,
  listMyTests, startAttempt, saveAnswers, submitAttempt, reportViolation,
} from "../controllers/aptitude.controller.js";

const router = Router();
router.use(verifyJWT);
router.use(requestIdMiddleware);

const company = authorizeRole("companyAdmin", "employee");
const student = authorizeRole("student");

/* company */
router.post("/job/:jobId", company, upsertTest);
router.get("/job/:jobId", company, getTestForJob);
router.patch("/:testId/publish", company, setPublished);
router.get("/:testId/results", company, getResults);

/* student */
router.get("/my", student, listMyTests);
router.post("/:testId/start", student, startAttempt);
router.patch("/attempt/:attemptId/save", student, saveAnswers);
router.post("/attempt/:attemptId/submit", student, submitAttempt);
router.post("/attempt/:attemptId/violation", student, reportViolation);

export default router;
