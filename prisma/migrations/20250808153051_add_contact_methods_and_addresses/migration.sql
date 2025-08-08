-- CreateEnum
CREATE TYPE "public"."ContactMethodType" AS ENUM ('PHONE', 'EMAIL', 'SOCIAL', 'WEBSITE');

-- CreateEnum
CREATE TYPE "public"."ContactScope" AS ENUM ('WORK', 'PERSONAL');

-- CreateEnum
CREATE TYPE "public"."AddressType" AS ENUM ('PHYSICAL', 'MAILING', 'BILLING');

-- CreateTable
CREATE TABLE "public"."contact_method" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "personId" TEXT,
    "roleId" TEXT,
    "type" "public"."ContactMethodType" NOT NULL,
    "scope" "public"."ContactScope" NOT NULL DEFAULT 'WORK',
    "label" TEXT,
    "value" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_method_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."contact_address" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "personId" TEXT,
    "roleId" TEXT,
    "scope" "public"."ContactScope" NOT NULL DEFAULT 'WORK',
    "addressType" "public"."AddressType" NOT NULL DEFAULT 'PHYSICAL',
    "label" TEXT,
    "line1" TEXT NOT NULL,
    "line2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'US',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_address_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contact_method_organizationId_idx" ON "public"."contact_method"("organizationId");

-- CreateIndex
CREATE INDEX "contact_method_personId_idx" ON "public"."contact_method"("personId");

-- CreateIndex
CREATE INDEX "contact_method_roleId_idx" ON "public"."contact_method"("roleId");

-- CreateIndex
CREATE INDEX "contact_method_type_idx" ON "public"."contact_method"("type");

-- CreateIndex
CREATE INDEX "contact_address_organizationId_idx" ON "public"."contact_address"("organizationId");

-- CreateIndex
CREATE INDEX "contact_address_personId_idx" ON "public"."contact_address"("personId");

-- CreateIndex
CREATE INDEX "contact_address_roleId_idx" ON "public"."contact_address"("roleId");

-- AddForeignKey
ALTER TABLE "public"."contact_method" ADD CONSTRAINT "contact_method_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contact_method" ADD CONSTRAINT "contact_method_personId_fkey" FOREIGN KEY ("personId") REFERENCES "public"."person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contact_method" ADD CONSTRAINT "contact_method_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contact_address" ADD CONSTRAINT "contact_address_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contact_address" ADD CONSTRAINT "contact_address_personId_fkey" FOREIGN KEY ("personId") REFERENCES "public"."person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contact_address" ADD CONSTRAINT "contact_address_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
