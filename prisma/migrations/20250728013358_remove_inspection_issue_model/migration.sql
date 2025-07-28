/*
  Warnings:

  - You are about to drop the column `accidentTime` on the `accident_issue` table. All the data in the column will be lost.
  - You are about to drop the column `agencyName` on the `accident_issue` table. All the data in the column will be lost.
  - You are about to drop the column `destination` on the `accident_issue` table. All the data in the column will be lost.
  - You are about to drop the column `dotReportNumber` on the `accident_issue` table. All the data in the column will be lost.
  - You are about to drop the column `fatalitiesCount` on the `accident_issue` table. All the data in the column will be lost.
  - You are about to drop the column `isCitation` on the `accident_issue` table. All the data in the column will be lost.
  - You are about to drop the column `isFatality` on the `accident_issue` table. All the data in the column will be lost.
  - You are about to drop the column `isInjury` on the `accident_issue` table. All the data in the column will be lost.
  - You are about to drop the column `isTow` on the `accident_issue` table. All the data in the column will be lost.
  - You are about to drop the column `locationAddress` on the `accident_issue` table. All the data in the column will be lost.
  - You are about to drop the column `locationCity` on the `accident_issue` table. All the data in the column will be lost.
  - You are about to drop the column `locationState` on the `accident_issue` table. All the data in the column will be lost.
  - You are about to drop the column `locationZip` on the `accident_issue` table. All the data in the column will be lost.
  - You are about to drop the column `needsReport` on the `accident_issue` table. All the data in the column will be lost.
  - You are about to drop the column `officerName` on the `accident_issue` table. All the data in the column will be lost.
  - You are about to drop the column `origin` on the `accident_issue` table. All the data in the column will be lost.
  - You are about to drop the column `requiresDrugTest` on the `accident_issue` table. All the data in the column will be lost.
  - You are about to drop the column `specimenNumber` on the `accident_issue` table. All the data in the column will be lost.
  - You are about to drop the column `vehiclesCount` on the `accident_issue` table. All the data in the column will be lost.
  - Added the required column `severity` to the `accident_issue` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "issue" DROP CONSTRAINT "issue_partyId_fkey";

-- AlterTable
ALTER TABLE "accident_issue" DROP COLUMN "accidentTime",
DROP COLUMN "agencyName",
DROP COLUMN "destination",
DROP COLUMN "dotReportNumber",
DROP COLUMN "fatalitiesCount",
DROP COLUMN "isCitation",
DROP COLUMN "isFatality",
DROP COLUMN "isInjury",
DROP COLUMN "isTow",
DROP COLUMN "locationAddress",
DROP COLUMN "locationCity",
DROP COLUMN "locationState",
DROP COLUMN "locationZip",
DROP COLUMN "needsReport",
DROP COLUMN "officerName",
DROP COLUMN "origin",
DROP COLUMN "requiresDrugTest",
DROP COLUMN "specimenNumber",
DROP COLUMN "vehiclesCount",
ADD COLUMN     "location" TEXT,
ADD COLUMN     "severity" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "issue" ALTER COLUMN "status" SET DEFAULT 'open',
ALTER COLUMN "priority" SET DEFAULT 'medium';

-- AddForeignKey
ALTER TABLE "issue" ADD CONSTRAINT "issue_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "party"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
