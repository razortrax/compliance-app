/*
  Warnings:

  - You are about to drop the column `location` on the `accident_issue` table. All the data in the column will be lost.
  - You are about to drop the column `severity` on the `accident_issue` table. All the data in the column will be lost.
  - You are about to drop the `inspection_issue` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "inspection_issue" DROP CONSTRAINT "inspection_issue_issueId_fkey";

-- DropForeignKey
ALTER TABLE "issue" DROP CONSTRAINT "issue_partyId_fkey";

-- AlterTable
ALTER TABLE "accident_issue" DROP COLUMN "location",
DROP COLUMN "severity",
ADD COLUMN     "accidentTime" TEXT,
ADD COLUMN     "agencyName" TEXT,
ADD COLUMN     "destination" TEXT,
ADD COLUMN     "dotReportNumber" TEXT,
ADD COLUMN     "fatalitiesCount" INTEGER,
ADD COLUMN     "isCitation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isFatality" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isInjury" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isTow" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "locationAddress" TEXT,
ADD COLUMN     "locationCity" TEXT,
ADD COLUMN     "locationState" TEXT,
ADD COLUMN     "locationZip" TEXT,
ADD COLUMN     "needsReport" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "officerName" TEXT,
ADD COLUMN     "origin" TEXT,
ADD COLUMN     "requiresDrugTest" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "specimenNumber" TEXT,
ADD COLUMN     "vehiclesCount" INTEGER;

-- AlterTable
ALTER TABLE "issue" ALTER COLUMN "status" DROP DEFAULT,
ALTER COLUMN "priority" DROP DEFAULT;

-- DropTable
DROP TABLE "inspection_issue";

-- AddForeignKey
ALTER TABLE "issue" ADD CONSTRAINT "issue_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "party"("id") ON DELETE CASCADE ON UPDATE CASCADE;
