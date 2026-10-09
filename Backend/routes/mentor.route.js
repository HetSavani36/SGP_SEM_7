import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import authorizeRole from "../middlewares/authorizableRole.js";
import { getAllJobs, getJobDetails, getJobsWithApplicationSummary, getStudentHistoryForMentor, getStudentsListForMentor } from "../controllers/mentor.controller.js";
import { rateLimitStudentApplicationDecisionForMentor } from "../middlewares/rateLimit.js";
import { mentorDecision } from "../controllers/applicationFlow.controller.js";
import { requestIdMiddleware } from "../middlewares/requestId.js";

const router = Router();

router.use(verifyJWT)
router.use(requestIdMiddleware)

router.put("/application/:applicationId/decision",authorizeRole("mentor"),rateLimitStudentApplicationDecisionForMentor,mentorDecision);
router.get("/job/:jobId",authorizeRole("mentor"),getJobDetails);
router.get("/jobs",authorizeRole("mentor"),getAllJobs);
router.get("/student/:studentId/history", authorizeRole("mentor"), getStudentHistoryForMentor);
router.get("/students", authorizeRole("mentor"), getStudentsListForMentor);
router.get("/jobs-with-applications", authorizeRole("mentor"), getJobsWithApplicationSummary);

export default router;