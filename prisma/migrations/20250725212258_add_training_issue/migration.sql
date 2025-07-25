-- AlterTable
ALTER TABLE "license_issue" ALTER COLUMN "endorsements" DROP NOT NULL,
ALTER COLUMN "endorsements" DROP DEFAULT,
ALTER COLUMN "restrictions" DROP NOT NULL,
ALTER COLUMN "restrictions" DROP DEFAULT;

-- CreateTable
CREATE TABLE "training_issue" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "trainingType" TEXT NOT NULL,
    "provider" TEXT,
    "instructor" TEXT,
    "location" TEXT,
    "completionDate" TIMESTAMP(3) NOT NULL,
    "expirationDate" TIMESTAMP(3) NOT NULL,
    "certificateNumber" TEXT,
    "hours" DOUBLE PRECISION,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "competencies" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_issue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "training_issue_issueId_key" ON "training_issue"("issueId");

-- AddForeignKey
ALTER TABLE "training_issue" ADD CONSTRAINT "training_issue_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
