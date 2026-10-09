import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import authorizeRole from "../middlewares/authorizableRole.js";
import { requestIdMiddleware } from "../middlewares/requestId.js";
import {
  googleConnectUrl, googleCallback, googleStatus, googleDisconnect,
  scheduleInterview, rescheduleInterview, cancelInterview, companyInterviews, myInterviews,
} from "../controllers/interview.controller.js";

const router = Router();

// Public: Google redirects the browser here (identity = signed `state`, not a cookie).
router.get("/google/callback", googleCallback);

router.use(verifyJWT);
router.use(requestIdMiddleware);

const company = authorizeRole("companyAdmin", "employee");

router.get("/google/connect", company, googleConnectUrl);
router.get("/google/status", company, googleStatus);
router.delete("/google", company, googleDisconnect);

router.post("/schedule", company, scheduleInterview);
router.get("/company", company, companyInterviews);
router.patch("/:id/reschedule", company, rescheduleInterview);
router.post("/:id/cancel", company, cancelInterview);

router.get("/my", authorizeRole("student"), myInterviews);

export default router;
