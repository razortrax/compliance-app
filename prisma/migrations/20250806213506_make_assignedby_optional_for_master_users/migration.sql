-- DropForeignKey
ALTER TABLE "public"."corrective_action_form" DROP CONSTRAINT "corrective_action_form_assignedBy_fkey";

-- AlterTable
ALTER TABLE "public"."corrective_action_form" ALTER COLUMN "assignedBy" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."corrective_action_form" ADD CONSTRAINT "corrective_action_form_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "public"."staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
