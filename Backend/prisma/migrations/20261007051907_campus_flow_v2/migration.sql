/*
  Warnings:

  - You are about to drop the column `date` on the `Interview` table. All the data in the column will be lost.
  - You are about to drop the column `selected` on the `Interview` table. All the data in the column will be lost.
  - You are about to drop the column `time` on the `Interview` table. All the data in the column will be lost.
  - Added the required column `endsAt` to the `Interview` table without a default value. This is not possible if the table is not empty.
  - Added the required column `scheduledByUserId` to the `Interview` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startsAt` to the `Interview` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Interview` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "InterviewMode" AS ENUM ('online', 'offline');

-- CreateEnum
CREATE TYPE "InterviewStatus" AS ENUM ('scheduled', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "CollabInitiator" AS ENUM ('company', 'college');

-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('in_progress', 'submitted', 'expired');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ApplicationStatus" ADD VALUE 'aptitude';
ALTER TYPE "ApplicationStatus" ADD VALUE 'interview';

-- DropForeignKey
ALTER TABLE "Interview" DROP CONSTRAINT "Interview_employeeId_fkey";

-- AlterTable
ALTER TABLE "Collab" ADD COLUMN     "initiatedBy" "CollabInitiator" NOT NULL DEFAULT 'company';

-- AlterTable
ALTER TABLE "Interview" DROP COLUMN "date",
DROP COLUMN "selected",
DROP COLUMN "time",
ADD COLUMN     "calendarEventId" TEXT,
ADD COLUMN     "calendarOwnerId" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "endsAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "meetLink" TEXT,
ADD COLUMN     "mode" "InterviewMode" NOT NULL DEFAULT 'online',
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "scheduledByUserId" TEXT NOT NULL,
ADD COLUMN     "startsAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "status" "InterviewStatus" NOT NULL DEFAULT 'scheduled',
ADD COLUMN     "timeZone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "employeeId" DROP NOT NULL,
ALTER COLUMN "address" DROP NOT NULL;

-- CreateTable
CREATE TABLE "GoogleCredential" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "googleEmail" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "scope" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoogleCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AptitudeTest" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "instructions" TEXT,
    "durationMins" INTEGER NOT NULL DEFAULT 30,
    "passingPercent" INTEGER NOT NULL DEFAULT 50,
    "negativeMarking" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "autoRejectOnFail" BOOLEAN NOT NULL DEFAULT false,
    "opensAt" TIMESTAMP(3),
    "closesAt" TIMESTAMP(3),
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AptitudeTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AptitudeQuestion" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "correctIndex" INTEGER NOT NULL,
    "marks" INTEGER NOT NULL DEFAULT 1,
    "section" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AptitudeQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AptitudeAttempt" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" "AttemptStatus" NOT NULL DEFAULT 'in_progress',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "answers" JSONB,
    "score" DOUBLE PRECISION,
    "totalMarks" INTEGER,
    "percent" DOUBLE PRECISION,
    "passed" BOOLEAN,
    "tabSwitches" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AptitudeAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GoogleCredential_userId_key" ON "GoogleCredential"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AptitudeTest_jobId_key" ON "AptitudeTest"("jobId");

-- CreateIndex
CREATE INDEX "AptitudeTest_companyId_idx" ON "AptitudeTest"("companyId");

-- CreateIndex
CREATE INDEX "AptitudeQuestion_testId_idx" ON "AptitudeQuestion"("testId");

-- CreateIndex
CREATE UNIQUE INDEX "AptitudeAttempt_applicationId_key" ON "AptitudeAttempt"("applicationId");

-- CreateIndex
CREATE INDEX "AptitudeAttempt_testId_idx" ON "AptitudeAttempt"("testId");

-- CreateIndex
CREATE INDEX "AptitudeAttempt_studentId_idx" ON "AptitudeAttempt"("studentId");

-- CreateIndex
CREATE INDEX "AptitudeAttempt_status_expiresAt_idx" ON "AptitudeAttempt"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "Interview_startsAt_idx" ON "Interview"("startsAt");

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AptitudeTest" ADD CONSTRAINT "AptitudeTest_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AptitudeQuestion" ADD CONSTRAINT "AptitudeQuestion_testId_fkey" FOREIGN KEY ("testId") REFERENCES "AptitudeTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AptitudeAttempt" ADD CONSTRAINT "AptitudeAttempt_testId_fkey" FOREIGN KEY ("testId") REFERENCES "AptitudeTest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AptitudeAttempt" ADD CONSTRAINT "AptitudeAttempt_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
