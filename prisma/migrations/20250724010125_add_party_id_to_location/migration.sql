/*
  Warnings:

  - A unique constraint covering the columns `[partyId]` on the table `location` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "location" ADD COLUMN     "partyId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "location_partyId_key" ON "location"("partyId");

-- AddForeignKey
ALTER TABLE "location" ADD CONSTRAINT "location_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "party"("id") ON DELETE CASCADE ON UPDATE CASCADE;
