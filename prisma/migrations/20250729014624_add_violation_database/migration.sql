-- AlterTable
ALTER TABLE "corrective_action_form" ADD COLUMN     "correctiveActions" TEXT,
ADD COLUMN     "notes" TEXT;

-- CreateTable
CREATE TABLE "violation_code" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "violationType" TEXT NOT NULL,
    "totalInspections" INTEGER,
    "totalViolations" INTEGER,
    "percentOfTotal" DOUBLE PRECISION,
    "oosViolations" INTEGER,
    "oosPercent" DOUBLE PRECISION,
    "riskScore" DOUBLE PRECISION,
    "isHighRisk" BOOLEAN NOT NULL DEFAULT false,
    "isCritical" BOOLEAN NOT NULL DEFAULT false,
    "cfrPart" INTEGER,
    "cfrSection" TEXT,
    "effectiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retiredAt" TIMESTAMP(3),
    "lastUpdated" TIMESTAMP(3) NOT NULL,
    "dataSource" TEXT NOT NULL DEFAULT 'FMCSA_CSV',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "violation_code_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "violation_snapshot" (
    "id" TEXT NOT NULL,
    "monthKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "recordCount" INTEGER NOT NULL,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "importedBy" TEXT,
    "filePath" TEXT,
    "notes" TEXT,

    CONSTRAINT "violation_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "violation_code_code_key" ON "violation_code"("code");

-- AddForeignKey
ALTER TABLE "rins_violation" ADD CONSTRAINT "rins_violation_violationCode_fkey" FOREIGN KEY ("violationCode") REFERENCES "violation_code"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
