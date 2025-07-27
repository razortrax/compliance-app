-- CreateEnum
CREATE TYPE "PhysicalType" AS ENUM ('Annual', 'Bi_Annual', 'Return_to_Duty', 'Post_Accident', 'One_Month', 'Three_Month', 'Six_Month', 'Pre_Hire', 'No_Physical_Issue');

-- CreateEnum
CREATE TYPE "DrugAlcoholResult" AS ENUM ('Negative', 'Positive', 'Negative_Dilute');

-- CreateEnum
CREATE TYPE "DrugAlcoholReason" AS ENUM ('PreEmployment', 'Random', 'Reasonable_Suspicion', 'Post_Accident', 'Return_to_Duty', 'FollowUp', 'Other');

-- CreateEnum
CREATE TYPE "DrugAlcoholAgency" AS ENUM ('FMCSA', 'PHMSA', 'Non_DOT', 'Drug_Testing_Clearinghouse', 'Water_Tech_Energy');

-- CreateEnum
CREATE TYPE "RinsLevel" AS ENUM ('Level_I', 'Level_II', 'Level_III', 'Level_IV', 'Level_V', 'Level_VI');

-- CreateEnum
CREATE TYPE "RinsResult" AS ENUM ('Pass', 'Warning', 'Out_Of_Service');

-- CreateEnum
CREATE TYPE "DverSource" AS ENUM ('Driver_Reported', 'FMCSA_Portal_Check', 'Third_Party_Report');

-- CreateEnum
CREATE TYPE "EntryMethod" AS ENUM ('Manual_Entry', 'OCR_Upload', 'API_Import');

-- CreateEnum
CREATE TYPE "ViolationType" AS ENUM ('Company', 'Driver_Qualification', 'Driver_Performance', 'Equipment');

-- CreateEnum
CREATE TYPE "ViolationSeverity" AS ENUM ('Warning', 'Citation', 'Out_Of_Service');

-- CreateTable
CREATE TABLE "physical_issue" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "type" "PhysicalType",
    "medicalExaminer" TEXT,
    "selfCertified" BOOLEAN NOT NULL DEFAULT false,
    "nationalRegistry" BOOLEAN NOT NULL DEFAULT false,
    "startDate" TIMESTAMP(3),
    "expirationDate" TIMESTAMP(3),
    "renewalDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "physical_issue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drugalcohol_issue" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "result" "DrugAlcoholResult",
    "substance" TEXT,
    "lab" TEXT,
    "accreditedBy" TEXT,
    "notes" TEXT,
    "reason" "DrugAlcoholReason",
    "agency" "DrugAlcoholAgency",
    "specimenNumber" TEXT,
    "isDrug" BOOLEAN NOT NULL DEFAULT false,
    "isAlcohol" BOOLEAN NOT NULL DEFAULT false,
    "clinic" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drugalcohol_issue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roadside_inspection_issue" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "reportNumber" TEXT,
    "inspectionDate" TIMESTAMP(3) NOT NULL,
    "inspectionTime" TEXT,
    "inspectorName" TEXT NOT NULL,
    "inspectorBadge" TEXT,
    "inspectionLocation" TEXT NOT NULL,
    "facilityName" TEXT,
    "facilityAddress" TEXT,
    "facilityCity" TEXT,
    "facilityState" TEXT,
    "facilityZip" TEXT,
    "inspectionLevel" "RinsLevel",
    "overallResult" "RinsResult",
    "driverLicense" TEXT,
    "driverLicenseState" TEXT,
    "driverDOB" TIMESTAMP(3),
    "dverReceived" BOOLEAN NOT NULL DEFAULT false,
    "dverSource" "DverSource",
    "entryMethod" "EntryMethod" NOT NULL DEFAULT 'Manual_Entry',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roadside_inspection_issue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rins_equipment_involvement" (
    "id" TEXT NOT NULL,
    "rinsId" TEXT NOT NULL,
    "unitNumber" INTEGER NOT NULL,
    "unitType" TEXT,
    "make" TEXT,
    "model" TEXT,
    "year" INTEGER,
    "plateNumber" TEXT,
    "plateState" TEXT,
    "vin" TEXT,
    "equipmentId" TEXT,
    "cvsaSticker" TEXT,
    "oosSticker" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rins_equipment_involvement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rins_violation" (
    "id" TEXT NOT NULL,
    "rinsId" TEXT NOT NULL,
    "violationCode" TEXT NOT NULL,
    "section" TEXT,
    "unitNumber" INTEGER,
    "outOfService" BOOLEAN NOT NULL DEFAULT false,
    "outOfServiceDate" TIMESTAMP(3),
    "backInServiceDate" TIMESTAMP(3),
    "citationNumber" TEXT,
    "severity" "ViolationSeverity",
    "description" TEXT NOT NULL,
    "inspectorComments" TEXT,
    "violationType" "ViolationType",
    "assignedPartyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rins_violation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "physical_issue_issueId_key" ON "physical_issue"("issueId");

-- CreateIndex
CREATE UNIQUE INDEX "drugalcohol_issue_issueId_key" ON "drugalcohol_issue"("issueId");

-- CreateIndex
CREATE UNIQUE INDEX "roadside_inspection_issue_issueId_key" ON "roadside_inspection_issue"("issueId");

-- AddForeignKey
ALTER TABLE "physical_issue" ADD CONSTRAINT "physical_issue_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drugalcohol_issue" ADD CONSTRAINT "drugalcohol_issue_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roadside_inspection_issue" ADD CONSTRAINT "roadside_inspection_issue_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rins_equipment_involvement" ADD CONSTRAINT "rins_equipment_involvement_rinsId_fkey" FOREIGN KEY ("rinsId") REFERENCES "roadside_inspection_issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rins_violation" ADD CONSTRAINT "rins_violation_rinsId_fkey" FOREIGN KEY ("rinsId") REFERENCES "roadside_inspection_issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
