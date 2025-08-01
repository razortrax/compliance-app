/*
  Warnings:

  - You are about to drop the column `renewalDate` on the `physical_issue` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."PhysicalResult" AS ENUM ('Three_Month', 'Six_Month', 'One_Year', 'Two_Years', 'Disqualified');

-- CreateEnum
CREATE TYPE "public"."PhysicalStatus" AS ENUM ('Qualified', 'Disqualified');

-- AlterTable
ALTER TABLE "public"."physical_issue" DROP COLUMN "renewalDate",
ADD COLUMN     "backInServiceDate" TIMESTAMP(3),
ADD COLUMN     "outOfServiceDate" TIMESTAMP(3),
ADD COLUMN     "result" "public"."PhysicalResult",
ADD COLUMN     "status" "public"."PhysicalStatus" NOT NULL DEFAULT 'Qualified';
