-- CreateEnum
CREATE TYPE "public"."AnnualInspectionResult" AS ENUM ('Pass', 'Fail');

-- CreateEnum
CREATE TYPE "public"."AnnualInspectionStatus" AS ENUM ('Active', 'Inactive');

-- CreateTable
CREATE TABLE "public"."annual_inspection_issue" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "inspectorName" TEXT NOT NULL,
    "inspectionDate" TIMESTAMP(3) NOT NULL,
    "expirationDate" TIMESTAMP(3) NOT NULL,
    "result" "public"."AnnualInspectionResult" NOT NULL,
    "status" "public"."AnnualInspectionStatus" NOT NULL DEFAULT 'Active',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "annual_inspection_issue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "annual_inspection_issue_issueId_key" ON "public"."annual_inspection_issue"("issueId");

-- AddForeignKey
ALTER TABLE "public"."annual_inspection_issue" ADD CONSTRAINT "annual_inspection_issue_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "public"."issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
