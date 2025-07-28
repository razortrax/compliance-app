-- CreateEnum
CREATE TYPE "CafPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "CafCategory" AS ENUM ('DRIVER_PERFORMANCE', 'DRIVER_QUALIFICATION', 'EQUIPMENT_MAINTENANCE', 'COMPANY_OPERATIONS', 'SAFETY_MANAGEMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "CafStatus" AS ENUM ('ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SignatureType" AS ENUM ('COMPLETION', 'APPROVAL', 'WITNESS');

-- AlterTable
ALTER TABLE "attachment" ADD COLUMN     "cafId" TEXT,
ALTER COLUMN "issueId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "staff" (
    "id" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "employeeId" TEXT,
    "position" TEXT,
    "department" TEXT,
    "supervisorId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "canApproveCAFs" BOOLEAN NOT NULL DEFAULT false,
    "canSignCAFs" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "corrective_action_form" (
    "id" TEXT NOT NULL,
    "cafNumber" TEXT NOT NULL,
    "rinsViolationId" TEXT,
    "accidentViolationId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "CafPriority" NOT NULL DEFAULT 'MEDIUM',
    "category" "CafCategory" NOT NULL,
    "assignedStaffId" TEXT NOT NULL,
    "assignedBy" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "status" "CafStatus" NOT NULL DEFAULT 'ASSIGNED',
    "completionNotes" TEXT,
    "completedAt" TIMESTAMP(3),
    "requiresApproval" BOOLEAN NOT NULL DEFAULT true,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "corrective_action_form_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "caf_signature" (
    "id" TEXT NOT NULL,
    "cafId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "signatureType" "SignatureType" NOT NULL,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "digitalSignature" TEXT,
    "ipAddress" TEXT,
    "notes" TEXT,

    CONSTRAINT "caf_signature_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "staff_partyId_key" ON "staff"("partyId");

-- CreateIndex
CREATE UNIQUE INDEX "corrective_action_form_cafNumber_key" ON "corrective_action_form"("cafNumber");

-- CreateIndex
CREATE UNIQUE INDEX "caf_signature_cafId_staffId_signatureType_key" ON "caf_signature"("cafId", "staffId", "signatureType");

-- AddForeignKey
ALTER TABLE "attachment" ADD CONSTRAINT "attachment_cafId_fkey" FOREIGN KEY ("cafId") REFERENCES "corrective_action_form"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "party"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "corrective_action_form" ADD CONSTRAINT "corrective_action_form_rinsViolationId_fkey" FOREIGN KEY ("rinsViolationId") REFERENCES "rins_violation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "corrective_action_form" ADD CONSTRAINT "corrective_action_form_assignedStaffId_fkey" FOREIGN KEY ("assignedStaffId") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "corrective_action_form" ADD CONSTRAINT "corrective_action_form_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "corrective_action_form" ADD CONSTRAINT "corrective_action_form_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "caf_signature" ADD CONSTRAINT "caf_signature_cafId_fkey" FOREIGN KEY ("cafId") REFERENCES "corrective_action_form"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "caf_signature" ADD CONSTRAINT "caf_signature_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
