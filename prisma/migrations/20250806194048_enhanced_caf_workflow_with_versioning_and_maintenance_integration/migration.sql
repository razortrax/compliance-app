-- AlterTable
ALTER TABLE "public"."corrective_action_form" ADD COLUMN     "cancelReason" TEXT,
ADD COLUMN     "incidentId" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "maintenanceIssueId" TEXT,
ADD COLUMN     "parentCafId" TEXT,
ADD COLUMN     "pdfGenerated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pdfUrl" TEXT,
ADD COLUMN     "requiresMaintenance" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "returnedPdfUrl" TEXT,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "violationCodes" JSONB,
ADD COLUMN     "violationSummary" TEXT,
ADD COLUMN     "violationType" "public"."ViolationType";

-- AlterTable
ALTER TABLE "public"."maintenance_issue" ADD COLUMN     "cafId" TEXT;

-- AlterTable
ALTER TABLE "public"."staff" ADD COLUMN     "autoAssignCompanyCAFs" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "autoAssignDriverCAFs" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "autoAssignEquipmentCAFs" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maintained_equipment" JSONB,
ADD COLUMN     "supervised_drivers" JSONB;

-- AddForeignKey
ALTER TABLE "public"."maintenance_issue" ADD CONSTRAINT "maintenance_issue_cafId_fkey" FOREIGN KEY ("cafId") REFERENCES "public"."corrective_action_form"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."corrective_action_form" ADD CONSTRAINT "corrective_action_form_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "public"."incident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."corrective_action_form" ADD CONSTRAINT "corrective_action_form_parentCafId_fkey" FOREIGN KEY ("parentCafId") REFERENCES "public"."corrective_action_form"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."corrective_action_form" ADD CONSTRAINT "corrective_action_form_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "public"."staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
