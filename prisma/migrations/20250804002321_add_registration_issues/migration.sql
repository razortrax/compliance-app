-- CreateEnum
CREATE TYPE "public"."RegistrationStatus" AS ENUM ('Active', 'Expired');

-- CreateTable
CREATE TABLE "public"."registration_issue" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "plateNumber" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "expirationDate" TIMESTAMP(3) NOT NULL,
    "renewalDate" TIMESTAMP(3),
    "status" "public"."RegistrationStatus" NOT NULL DEFAULT 'Active',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registration_issue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "registration_issue_issueId_key" ON "public"."registration_issue"("issueId");

-- AddForeignKey
ALTER TABLE "public"."registration_issue" ADD CONSTRAINT "registration_issue_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "public"."issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
