-- CreateEnum
CREATE TYPE "public"."MaintenanceType" AS ENUM ('A_SCHEDULE', 'B_SCHEDULE', 'CORRECTIVE', 'REPAIR', 'PREVENTIVE', 'WARRANTY', 'RECALL', 'UPGRADE');

-- CreateEnum
CREATE TYPE "public"."MaintenanceSourceType" AS ENUM ('ANNUAL_INSPECTION', 'ROADSIDE_INSPECTION', 'ROUTINE', 'ACCIDENT', 'BREAKDOWN', 'DRIVER_REPORT', 'PREVENTIVE', 'WARRANTY', 'RECALL', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."MaintenanceStatus" AS ENUM ('SCHEDULED', 'OVERDUE', 'IN_PROGRESS', 'COMPLETED', 'PARTIAL', 'DEFERRED', 'CANCELLED', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "public"."MaintenanceResult" AS ENUM ('COMPLETED', 'PARTIAL', 'FAILED', 'DEFERRED', 'NO_WORK_NEEDED', 'REFERRED');

-- CreateEnum
CREATE TYPE "public"."MaintenancePriority" AS ENUM ('CRITICAL', 'HIGH', 'ROUTINE', 'PREVENTIVE', 'OPTIONAL');

-- CreateEnum
CREATE TYPE "public"."MaintenanceInterval" AS ENUM ('TIME_BASED', 'MILEAGE_BASED', 'DUAL_TRIGGER', 'DUAL_REQUIRED');

-- CreateTable
CREATE TABLE "public"."maintenance_issue" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "maintenanceType" "public"."MaintenanceType" NOT NULL,
    "sourceType" "public"."MaintenanceSourceType" NOT NULL,
    "sourceId" TEXT,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "completedDate" TIMESTAMP(3),
    "scheduledDate" TIMESTAMP(3),
    "intervalDays" INTEGER,
    "intervalMiles" INTEGER,
    "abScheduleItemId" TEXT,
    "abScheduleCode" TEXT,
    "currentMileage" INTEGER,
    "mileageAtDue" INTEGER,
    "lastServiceDate" TIMESTAMP(3),
    "lastServiceMiles" INTEGER,
    "technicianName" TEXT,
    "technicianCert" TEXT,
    "facilityName" TEXT,
    "facilityAddress" TEXT,
    "workDescription" TEXT NOT NULL,
    "partsUsed" JSONB,
    "laborHours" DOUBLE PRECISION,
    "status" "public"."MaintenanceStatus" NOT NULL DEFAULT 'SCHEDULED',
    "result" "public"."MaintenanceResult",
    "priority" "public"."MaintenancePriority" NOT NULL DEFAULT 'ROUTINE',
    "dotCompliant" BOOLEAN NOT NULL DEFAULT true,
    "warrantyWork" BOOLEAN NOT NULL DEFAULT false,
    "costEstimate" DOUBLE PRECISION,
    "actualCost" DOUBLE PRECISION,
    "defectsFound" JSONB,
    "correctiveActions" JSONB,
    "followUpRequired" BOOLEAN NOT NULL DEFAULT false,
    "followUpDate" TIMESTAMP(3),
    "notes" TEXT,
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,
    "reminderDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_issue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."equipment_ab_schedule" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "equipmentCategory" TEXT NOT NULL,
    "vehicleTypeId" TEXT,
    "scheduleType" TEXT NOT NULL,
    "itemCode" TEXT NOT NULL,
    "itemDescription" TEXT NOT NULL,
    "intervalDays" INTEGER,
    "intervalMiles" INTEGER,
    "intervalType" "public"."MaintenanceInterval" NOT NULL,
    "category" TEXT NOT NULL,
    "component" TEXT NOT NULL,
    "taskType" TEXT NOT NULL,
    "estimatedHours" DOUBLE PRECISION,
    "estimatedCost" DOUBLE PRECISION,
    "dotRequired" BOOLEAN NOT NULL DEFAULT false,
    "priority" "public"."MaintenancePriority" NOT NULL DEFAULT 'ROUTINE',
    "safetyRelated" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipment_ab_schedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "maintenance_issue_issueId_key" ON "public"."maintenance_issue"("issueId");

-- CreateIndex
CREATE INDEX "equipment_ab_schedule_organizationId_equipmentCategory_sche_idx" ON "public"."equipment_ab_schedule"("organizationId", "equipmentCategory", "scheduleType");

-- CreateIndex
CREATE INDEX "equipment_ab_schedule_equipmentCategory_isDefault_isActive_idx" ON "public"."equipment_ab_schedule"("equipmentCategory", "isDefault", "isActive");

-- AddForeignKey
ALTER TABLE "public"."maintenance_issue" ADD CONSTRAINT "maintenance_issue_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "public"."issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."maintenance_issue" ADD CONSTRAINT "maintenance_issue_abScheduleItemId_fkey" FOREIGN KEY ("abScheduleItemId") REFERENCES "public"."equipment_ab_schedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."equipment_ab_schedule" ADD CONSTRAINT "equipment_ab_schedule_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
