-- CreateEnum
CREATE TYPE "MvrType" AS ENUM ('PreHire_Check', 'Annual_Review', 'Drug_Testing_Clearinghouse', 'After_Accident', 'Reasonable_Suspicion', 'Endorsement_Update', 'Med_Cert_Update');

-- CreateEnum
CREATE TYPE "MvrResult" AS ENUM ('Pass', 'Fail', 'Scheduled', 'Old_Certificate', 'Inactive');

-- CreateEnum
CREATE TYPE "MvrResultDach" AS ENUM ('Pass', 'Fail', 'Not_Required');

-- CreateEnum
CREATE TYPE "MvrResultStatus" AS ENUM ('Result_Meets', 'Result_Does_Not_Meet', 'Result_Disqualified');

-- CreateEnum
CREATE TYPE "MvrCertification" AS ENUM ('NonExcepted_Interstate', 'Excepted_Interstate', 'NonExcepted_Intrastate', 'ExceptedIntrastate', 'None');

-- CreateEnum
CREATE TYPE "MvrStatus" AS ENUM ('Not_Released', 'Active', 'Inactive', 'Disqualified', 'Not_Driver', 'One_Time_Training');

-- CreateTable
CREATE TABLE "mvr_issue" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "violationsCount" INTEGER NOT NULL DEFAULT 0,
    "cleanRecord" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "type" "MvrType",
    "result" "MvrResult",
    "result_dach" "MvrResultDach",
    "result_status" "MvrResultStatus",
    "reviewedBy" JSONB,
    "certification" "MvrCertification",
    "status" "MvrStatus",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mvr_issue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mvr_issue_issueId_key" ON "mvr_issue"("issueId");

-- AddForeignKey
ALTER TABLE "mvr_issue" ADD CONSTRAINT "mvr_issue_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
