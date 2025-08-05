-- AlterEnum
ALTER TYPE "public"."AnnualInspectionResult" ADD VALUE 'Pending';

-- AlterEnum
ALTER TYPE "public"."AnnualInspectionStatus" ADD VALUE 'Scheduled';

-- AlterTable
ALTER TABLE "public"."annual_inspection_issue" ALTER COLUMN "result" SET DEFAULT 'Pass';
