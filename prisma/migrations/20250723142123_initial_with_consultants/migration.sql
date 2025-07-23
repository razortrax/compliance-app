-- CreateTable
CREATE TABLE "party" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',

    CONSTRAINT "party_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization" (
    "id" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dotNumber" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "phone" TEXT,
    "email" TEXT,

    CONSTRAINT "organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "person" (
    "id" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "licenseNumber" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,

    CONSTRAINT "person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment" (
    "id" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "vehicleType" TEXT NOT NULL,
    "make" TEXT,
    "model" TEXT,
    "year" INTEGER,
    "vinNumber" TEXT,
    "plateNumber" TEXT,
    "registrationExpiry" TIMESTAMP(3),

    CONSTRAINT "equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role" (
    "id" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "roleType" TEXT NOT NULL,
    "organizationId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "consultationId" TEXT,

    CONSTRAINT "role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "issue" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "issueType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "partyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "issue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "license_issue" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "licenseType" TEXT NOT NULL,
    "expirationDate" TIMESTAMP(3) NOT NULL,
    "renewalDate" TIMESTAMP(3),

    CONSTRAINT "license_issue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accident_issue" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "accidentDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "severity" TEXT NOT NULL,
    "reportNumber" TEXT,
    "isReportable" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "accident_issue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_issue" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "inspectionDate" TIMESTAMP(3) NOT NULL,
    "inspectorName" TEXT,
    "violationCount" INTEGER NOT NULL DEFAULT 0,
    "outOfService" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "inspection_issue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultant" (
    "id" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "licenseNumber" TEXT,
    "specializations" TEXT[],
    "yearsExperience" INTEGER,
    "hourlyRate" DECIMAL(65,30),
    "bio" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "consultant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultation" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientOrgId" TEXT NOT NULL,
    "consultantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "consultationType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "urgency" TEXT NOT NULL DEFAULT 'NORMAL',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "dataAccessExpiry" TIMESTAMP(3),
    "agreedRate" DECIMAL(65,30),
    "estimatedHours" INTEGER,
    "actualHours" DECIMAL(65,30),

    CONSTRAINT "consultation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_sharing_consent" (
    "id" TEXT NOT NULL,
    "consultationId" TEXT NOT NULL,
    "consentGivenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consentGivenBy" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "revokedAt" TIMESTAMP(3),
    "revokedBy" TEXT,
    "scopePermissions" JSONB NOT NULL,

    CONSTRAINT "data_sharing_consent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultant_access_log" (
    "id" TEXT NOT NULL,
    "consentId" TEXT NOT NULL,
    "accessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "consultant_access_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organization_partyId_key" ON "organization"("partyId");

-- CreateIndex
CREATE UNIQUE INDEX "organization_dotNumber_key" ON "organization"("dotNumber");

-- CreateIndex
CREATE UNIQUE INDEX "person_partyId_key" ON "person"("partyId");

-- CreateIndex
CREATE UNIQUE INDEX "person_licenseNumber_key" ON "person"("licenseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_partyId_key" ON "equipment"("partyId");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_vinNumber_key" ON "equipment"("vinNumber");

-- CreateIndex
CREATE UNIQUE INDEX "license_issue_issueId_key" ON "license_issue"("issueId");

-- CreateIndex
CREATE UNIQUE INDEX "accident_issue_issueId_key" ON "accident_issue"("issueId");

-- CreateIndex
CREATE UNIQUE INDEX "inspection_issue_issueId_key" ON "inspection_issue"("issueId");

-- CreateIndex
CREATE UNIQUE INDEX "consultant_partyId_key" ON "consultant"("partyId");

-- CreateIndex
CREATE UNIQUE INDEX "data_sharing_consent_consultationId_key" ON "data_sharing_consent"("consultationId");

-- AddForeignKey
ALTER TABLE "organization" ADD CONSTRAINT "organization_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "party"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person" ADD CONSTRAINT "person_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "party"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "party"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role" ADD CONSTRAINT "role_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "party"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issue" ADD CONSTRAINT "issue_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "party"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "license_issue" ADD CONSTRAINT "license_issue_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accident_issue" ADD CONSTRAINT "accident_issue_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_issue" ADD CONSTRAINT "inspection_issue_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultant" ADD CONSTRAINT "consultant_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "party"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultation" ADD CONSTRAINT "consultation_clientOrgId_fkey" FOREIGN KEY ("clientOrgId") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultation" ADD CONSTRAINT "consultation_consultantId_fkey" FOREIGN KEY ("consultantId") REFERENCES "consultant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_sharing_consent" ADD CONSTRAINT "data_sharing_consent_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "consultation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultant_access_log" ADD CONSTRAINT "consultant_access_log_consentId_fkey" FOREIGN KEY ("consentId") REFERENCES "data_sharing_consent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
