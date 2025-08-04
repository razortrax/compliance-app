/*
  Warnings:

  - You are about to drop the column `vehicleType` on the `equipment` table. All the data in the column will be lost.
  - You are about to drop the column `vinNumber` on the `equipment` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[vin]` on the table `equipment` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."equipment_vinNumber_key";

-- AlterTable
ALTER TABLE "public"."equipment" DROP COLUMN "vehicleType",
DROP COLUMN "vinNumber",
ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "colorId" TEXT,
ADD COLUMN     "countAxles" INTEGER,
ADD COLUMN     "countCylinders" INTEGER,
ADD COLUMN     "dateOfManufacture" TIMESTAMP(3),
ADD COLUMN     "driveType" TEXT,
ADD COLUMN     "engineDisplacement" TEXT,
ADD COLUMN     "engineModel" TEXT,
ADD COLUMN     "eqpWeightGross" INTEGER,
ADD COLUMN     "eqpWeightGrossRating" INTEGER,
ADD COLUMN     "eqpWeightGrossTagged" INTEGER,
ADD COLUMN     "fuelTypeId" TEXT,
ADD COLUMN     "ownershipTypeId" TEXT,
ADD COLUMN     "retireDate" TIMESTAMP(3),
ADD COLUMN     "retireMileage" INTEGER,
ADD COLUMN     "startDate" TIMESTAMP(3),
ADD COLUMN     "startMileage" INTEGER,
ADD COLUMN     "statusId" TEXT,
ADD COLUMN     "tireSize" TEXT,
ADD COLUMN     "vehicleTypeId" TEXT,
ADD COLUMN     "vin" TEXT;

-- CreateTable
CREATE TABLE "public"."equipment_status" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT,

    CONSTRAINT "equipment_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."equipment_fuel_type" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT,

    CONSTRAINT "equipment_fuel_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."equipment_vehicle_type" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT,

    CONSTRAINT "equipment_vehicle_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."equipment_color" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT,

    CONSTRAINT "equipment_color_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."equipment_ownership_type" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT,

    CONSTRAINT "equipment_ownership_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."equipment_category" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT,

    CONSTRAINT "equipment_category_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "equipment_status_code_organizationId_key" ON "public"."equipment_status"("code", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_fuel_type_code_organizationId_key" ON "public"."equipment_fuel_type"("code", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_vehicle_type_code_organizationId_key" ON "public"."equipment_vehicle_type"("code", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_color_code_organizationId_key" ON "public"."equipment_color"("code", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_ownership_type_code_organizationId_key" ON "public"."equipment_ownership_type"("code", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_category_code_organizationId_key" ON "public"."equipment_category"("code", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_vin_key" ON "public"."equipment"("vin");

-- AddForeignKey
ALTER TABLE "public"."equipment" ADD CONSTRAINT "equipment_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "public"."equipment_status"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."equipment" ADD CONSTRAINT "equipment_fuelTypeId_fkey" FOREIGN KEY ("fuelTypeId") REFERENCES "public"."equipment_fuel_type"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."equipment" ADD CONSTRAINT "equipment_colorId_fkey" FOREIGN KEY ("colorId") REFERENCES "public"."equipment_color"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."equipment" ADD CONSTRAINT "equipment_vehicleTypeId_fkey" FOREIGN KEY ("vehicleTypeId") REFERENCES "public"."equipment_vehicle_type"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."equipment" ADD CONSTRAINT "equipment_ownershipTypeId_fkey" FOREIGN KEY ("ownershipTypeId") REFERENCES "public"."equipment_ownership_type"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."equipment" ADD CONSTRAINT "equipment_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."equipment_category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."equipment_status" ADD CONSTRAINT "equipment_status_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."equipment_fuel_type" ADD CONSTRAINT "equipment_fuel_type_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."equipment_vehicle_type" ADD CONSTRAINT "equipment_vehicle_type_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."equipment_color" ADD CONSTRAINT "equipment_color_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."equipment_ownership_type" ADD CONSTRAINT "equipment_ownership_type_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."equipment_category" ADD CONSTRAINT "equipment_category_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
