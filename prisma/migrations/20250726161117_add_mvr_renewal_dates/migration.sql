-- AlterTable
ALTER TABLE "mvr_issue" ADD COLUMN     "expirationDate" TIMESTAMP(3),
ADD COLUMN     "renewalDate" TIMESTAMP(3),
ADD COLUMN     "startDate" TIMESTAMP(3);
