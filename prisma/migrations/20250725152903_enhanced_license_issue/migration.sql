/*
  Warnings:

  - Added the required column `certification` to the `license_issue` table without a default value. This is not possible if the table is not empty.
  - Added the required column `licenseNumber` to the `license_issue` table without a default value. This is not possible if the table is not empty.
  - Added the required column `licenseState` to the `license_issue` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `license_issue` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "license_issue" ADD COLUMN     "certification" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "endorsements" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "licenseNumber" TEXT NOT NULL,
ADD COLUMN     "licenseState" TEXT NOT NULL,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "restrictions" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
