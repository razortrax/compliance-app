-- AlterTable
ALTER TABLE "equipment" ADD COLUMN     "locationId" TEXT;

-- AlterTable
ALTER TABLE "role" ADD COLUMN     "locationId" TEXT;

-- CreateTable
CREATE TABLE "location" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "locationType" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "isMainLocation" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "location_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location" ADD CONSTRAINT "location_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role" ADD CONSTRAINT "role_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
