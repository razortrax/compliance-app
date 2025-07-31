/*
  Warnings:

  - You are about to drop the column `accidentViolationId` on the `corrective_action_form` table. All the data in the column will be lost.
  - You are about to drop the column `rinsViolationId` on the `corrective_action_form` table. All the data in the column will be lost.
  - You are about to drop the `accident_issue` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `rins_equipment_involvement` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `rins_violation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `roadside_inspection_issue` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."IncidentType" AS ENUM ('ACCIDENT', 'ROADSIDE_INSPECTION');

-- DropForeignKey
ALTER TABLE "public"."accident_issue" DROP CONSTRAINT "accident_issue_issueId_fkey";

-- DropForeignKey
ALTER TABLE "public"."corrective_action_form" DROP CONSTRAINT "corrective_action_form_rinsViolationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."rins_equipment_involvement" DROP CONSTRAINT "rins_equipment_involvement_rinsId_fkey";

-- DropForeignKey
ALTER TABLE "public"."rins_violation" DROP CONSTRAINT "rins_violation_rinsId_fkey";

-- DropForeignKey
ALTER TABLE "public"."rins_violation" DROP CONSTRAINT "rins_violation_violationCode_fkey";

-- DropForeignKey
ALTER TABLE "public"."roadside_inspection_issue" DROP CONSTRAINT "roadside_inspection_issue_issueId_fkey";

-- AlterTable
ALTER TABLE "public"."corrective_action_form" DROP COLUMN "accidentViolationId",
DROP COLUMN "rinsViolationId",
ADD COLUMN     "incidentViolationId" TEXT;

-- DropTable
DROP TABLE "public"."accident_issue";

-- DropTable
DROP TABLE "public"."rins_equipment_involvement";

-- DropTable
DROP TABLE "public"."rins_violation";

-- DropTable
DROP TABLE "public"."roadside_inspection_issue";

-- CreateTable
CREATE TABLE "public"."incident" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "incidentType" "public"."IncidentType" NOT NULL,
    "incidentDate" TIMESTAMP(3) NOT NULL,
    "incidentTime" TEXT,
    "officerName" TEXT NOT NULL,
    "agencyName" TEXT,
    "officerBadge" TEXT,
    "reportNumber" TEXT,
    "locationAddress" TEXT,
    "locationCity" TEXT,
    "locationState" TEXT,
    "locationZip" TEXT,
    "accidentData" JSONB,
    "roadsideData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."incident_equipment_involvement" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "unitNumber" INTEGER NOT NULL,
    "equipmentId" TEXT,
    "unitType" TEXT,
    "make" TEXT,
    "model" TEXT,
    "year" INTEGER,
    "plateNumber" TEXT,
    "plateState" TEXT,
    "vin" TEXT,
    "cvsaSticker" TEXT,
    "oosSticker" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incident_equipment_involvement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."incident_violation" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "violationCode" TEXT NOT NULL,
    "section" TEXT,
    "unitNumber" INTEGER,
    "outOfService" BOOLEAN NOT NULL DEFAULT false,
    "outOfServiceDate" TIMESTAMP(3),
    "backInServiceDate" TIMESTAMP(3),
    "citationNumber" TEXT,
    "severity" "public"."ViolationSeverity",
    "description" TEXT NOT NULL,
    "inspectorComments" TEXT,
    "violationType" "public"."ViolationType",
    "assignedPartyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incident_violation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."activity_log" (
    "id" TEXT NOT NULL,
    "issueId" TEXT,
    "organizationId" TEXT,
    "personId" TEXT,
    "equipmentId" TEXT,
    "locationId" TEXT,
    "cafId" TEXT,
    "activityType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "fileName" TEXT,
    "fileType" TEXT,
    "fileSize" INTEGER,
    "filePath" TEXT,
    "username" TEXT,
    "password" TEXT,
    "portalUrl" TEXT,
    "dueDate" TIMESTAMP(3),
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "priority" TEXT,
    "tags" TEXT[],
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."organization_tag" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "tagName" TEXT NOT NULL,
    "tagColor" TEXT,
    "tagIcon" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_tag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "incident_issueId_key" ON "public"."incident"("issueId");

-- CreateIndex
CREATE UNIQUE INDEX "organization_tag_organizationId_tagName_key" ON "public"."organization_tag"("organizationId", "tagName");

-- AddForeignKey
ALTER TABLE "public"."incident" ADD CONSTRAINT "incident_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "public"."issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."incident_equipment_involvement" ADD CONSTRAINT "incident_equipment_involvement_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "public"."incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."incident_equipment_involvement" ADD CONSTRAINT "incident_equipment_involvement_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "public"."equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."incident_violation" ADD CONSTRAINT "incident_violation_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "public"."incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."incident_violation" ADD CONSTRAINT "incident_violation_violationCode_fkey" FOREIGN KEY ("violationCode") REFERENCES "public"."violation_code"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activity_log" ADD CONSTRAINT "activity_log_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "public"."issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activity_log" ADD CONSTRAINT "activity_log_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activity_log" ADD CONSTRAINT "activity_log_personId_fkey" FOREIGN KEY ("personId") REFERENCES "public"."person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activity_log" ADD CONSTRAINT "activity_log_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "public"."equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activity_log" ADD CONSTRAINT "activity_log_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "public"."location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activity_log" ADD CONSTRAINT "activity_log_cafId_fkey" FOREIGN KEY ("cafId") REFERENCES "public"."corrective_action_form"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."organization_tag" ADD CONSTRAINT "organization_tag_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."corrective_action_form" ADD CONSTRAINT "corrective_action_form_incidentViolationId_fkey" FOREIGN KEY ("incidentViolationId") REFERENCES "public"."incident_violation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
