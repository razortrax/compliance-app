-- CreateEnum
CREATE TYPE "public"."TrainingCategory" AS ENUM ('MANDATORY_DOT', 'MANDATORY_ORG', 'VOLUNTARY');

-- AlterTable
ALTER TABLE "public"."training_issue" ADD COLUMN     "category" "public"."TrainingCategory" NOT NULL DEFAULT 'VOLUNTARY',
ADD COLUMN     "expirationPeriodMonths" INTEGER,
ALTER COLUMN "expirationDate" DROP NOT NULL;
