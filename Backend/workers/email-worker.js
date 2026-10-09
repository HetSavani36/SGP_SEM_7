import { Worker } from "bullmq";
import { redisConnection } from "../config/redis.js";
import {
  sendCollabDecisionMail,
  sendCollabRequestRecievedMail,
  sendEmployeeCredentialsMail,
  sendJobDecisionMail,
  sendMentorCredentialsMail,
  sendMentorJobAssignMail,
  sendPasswordChangeMail,
  sendRegisterCollegeMail,
  sendRegisterCompanyMail,
  sendResetPasswordMail,
  sendStudentApplicationDecisionMail,
  sendStudentJobAppliedMail,
  sendStudentJobNotificationMail,
  sendStudentMentorDecisionMail,
  sendStudentsCredentialsMail,
} from "./email-handler.js";
import {
  sendCollabInviteMail,
  sendCollabDecisionCollegeMail,
  sendCollabAutoAcceptedMail,
  sendAptitudeAssignedMail,
  sendInterviewScheduledMail,
  sendInterviewCancelledMail,
  sendFinalDecisionMail,
} from "./email-handler.v2.js";
import { transporter } from "../utils/email-transporter.js";


transporter.verify((error, success) => {
  if (error) {
    console.error("Transporter error:", error);
  } else {
    console.log("Server is ready to send emails");
  }
});


const emailWorker = new Worker(
  "email-queue",
  async (job) => {
    const { name, data } = job;

    switch (name) {
      case "register-college":
        await sendRegisterCollegeMail(data);
        break;

      case "register-company":
        await sendRegisterCompanyMail(data);
        break;

      case "mentor-credentials":
        await sendMentorCredentialsMail(data);
        break;

      case "collab-decision":
        await sendCollabDecisionMail(data);
        break;

      case "reset-password":
        await sendResetPasswordMail(data);
        break;

      case "job-decision":
        await sendJobDecisionMail(data);
        break;

      case "assign-mentor":
        await sendMentorJobAssignMail(data);
        break;

      case "employee-credentials":
        await sendEmployeeCredentialsMail(data);
        break;

      case "collab-request":
        await sendCollabRequestRecievedMail({ ...data, collegEmail: data.collegeEmail }); // fixes collegEmail typo (mail was never delivered)
        break;

      case "post-job":
        await sendJobAddedMail(data);
        break;

      case "student-application-decision-company":
        await sendStudentApplicationDecisionMail(data);
        if (data.aptitude) await sendAptitudeAssignedMail({ ...data, aptitude: data.aptitude });
        break;

      case "job-notification":
        await sendStudentJobNotificationMail(data);
        break;

      case "mentor-decision":
        await sendStudentMentorDecisionMail(data);
        break;

      case "student-credentials":
        await sendStudentsCredentialsMail(data);
        break;

      case "job-applied":
        await sendStudentJobAppliedMail(data);
        break;

      case "password-change":
        await sendPasswordChangeMail(data);
        break;

      case "collab-invite":
        await sendCollabInviteMail(data);
        break;

      case "collab-decision-college":
        await sendCollabDecisionCollegeMail(data);
        break;

      case "collab-decision-both":
        await sendCollabAutoAcceptedMail(data);
        break;

      case "interview-scheduled":
        await sendInterviewScheduledMail(data);
        break;

      case "interview-cancelled":
        await sendInterviewCancelledMail(data);
        break;

      case "final-decision":
        await sendFinalDecisionMail(data);
        break;

      default:
        throw new Error(`Unknown job name: ${name}`);
    }
  },
  {
    connection: redisConnection,
    concurrency: 2,
  }
);

emailWorker.on("completed", (job) => {
  console.log(`✅ Email job ${job.name} completed`);
});

emailWorker.on("failed", (job, err) => {
  console.error(`❌ Email job ${job?.name} failed`, err);
});
