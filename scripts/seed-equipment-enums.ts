#!/usr/bin/env tsx

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedEquipmentEnums() {
  console.log("🌱 Seeding equipment enum tables...");

  // Equipment Status
  const statusOptions = [
    { code: "ACTIVE", label: "Active", description: "Equipment is in active use", isDefault: true },
    { code: "INACTIVE", label: "Inactive", description: "Equipment is not currently in use" },
    { code: "MAINTENANCE", label: "Maintenance", description: "Equipment is under maintenance" },
    { code: "RETIRED", label: "Retired", description: "Equipment has been retired from service" },
  ];

  for (const status of statusOptions) {
    // Check if exists first
    const existing = await prisma.equipmentStatus.findFirst({
      where: { code: status.code, organizationId: null },
    });

    if (!existing) {
      await prisma.equipmentStatus.create({
        data: status,
      });
    }
  }

  // Equipment Fuel Types
  const fuelTypes = [
    { code: "Gasoline", label: "Gasoline", isDefault: true },
    { code: "Diesel", label: "Diesel" },
    { code: "Propane", label: "Propane" },
    { code: "Electric", label: "Electric" },
  ];

  for (const fuelType of fuelTypes) {
    const existing = await prisma.equipmentFuelType.findFirst({
      where: { code: fuelType.code, organizationId: null },
    });

    if (!existing) {
      await prisma.equipmentFuelType.create({
        data: fuelType,
      });
    }
  }

  // Equipment Vehicle Types
  const vehicleTypes = [
    { code: "PDC-Day Cab", label: "Day Cab" },
    { code: "PSC-Sleeper Cab", label: "Sleeper Cab" },
    { code: "PBT-Box Truck", label: "Box Truck" },
    { code: "PST-Straight Truck", label: "Straight Truck" },
    { code: "PSV-Sprinter Van", label: "Sprinter Van" },
    { code: "PTT-Tractor Truck", label: "Tractor Truck", isDefault: true },
    { code: "TR-Gas Tractor Truck", label: "Gas Tractor Truck" },
    { code: "TRC-Tractor Truck", label: "Tractor Truck (Commercial)" },
    { code: "DMP-Dump Truck", label: "Dump Truck" },
    { code: "DS-Diesel Tractor Truck", label: "Diesel Tractor Truck" },
    { code: "CAR-Car", label: "Car" },
    { code: "PK-Pickup Truck", label: "Pickup Truck" },
    { code: "FKL-Forklift", label: "Forklift" },
    { code: "CRN-Crane", label: "Crane" },
    { code: "TLH-Telehandler", label: "Telehandler" },
    { code: "Trolly", label: "Trolly" },
    { code: "ROL-Roll off", label: "Roll off" },
    { code: "PMP-Pump Off Truck", label: "Pump Off Truck" },
    { code: "Winch Truck", label: "Winch Truck" },
  ];

  for (const vehicleType of vehicleTypes) {
    const existing = await prisma.equipmentVehicleType.findFirst({
      where: { code: vehicleType.code, organizationId: null },
    });

    if (!existing) {
      await prisma.equipmentVehicleType.create({
        data: vehicleType,
      });
    }
  }

  // Equipment Colors
  const colors = [
    { code: "White", label: "White", isDefault: true },
    { code: "Black", label: "Black" },
    { code: "Red", label: "Red" },
    { code: "Blue", label: "Blue" },
    { code: "Yellow", label: "Yellow" },
    { code: "Silver", label: "Silver" },
    { code: "Tan", label: "Tan" },
    { code: "Maroon", label: "Maroon" },
    { code: "Brown", label: "Brown" },
    { code: "Gray", label: "Gray" },
    { code: "Green", label: "Green" },
    { code: "Coral", label: "Coral" },
    { code: "Champagne", label: "Champagne" },
    { code: "Orange", label: "Orange" },
    { code: "White and Red", label: "White and Red" },
    { code: "Purple", label: "Purple" },
    { code: "Gold", label: "Gold" },
    { code: "Burgundy", label: "Burgundy" },
    { code: "Black & White", label: "Black & White" },
    { code: "Blue/White", label: "Blue/White" },
    { code: "Bronze", label: "Bronze" },
    { code: "Copper/Brown", label: "Copper/Brown" },
    { code: "Brown/Black", label: "Brown/Black" },
    { code: "None", label: "None" },
  ];

  for (const color of colors) {
    const existing = await prisma.equipmentColor.findFirst({
      where: { code: color.code, organizationId: null },
    });

    if (!existing) {
      await prisma.equipmentColor.create({
        data: color,
      });
    }
  }

  // Equipment Ownership Types
  const ownershipTypes = [
    { code: "Owner Operator", label: "Owner Operator" },
    { code: "Leased", label: "Leased" },
    { code: "Owned", label: "Owned", isDefault: true },
    { code: "Rent", label: "Rent" },
  ];

  for (const ownershipType of ownershipTypes) {
    const existing = await prisma.equipmentOwnershipType.findFirst({
      where: { code: ownershipType.code, organizationId: null },
    });

    if (!existing) {
      await prisma.equipmentOwnershipType.create({
        data: ownershipType,
      });
    }
  }

  // Equipment Categories
  const categories = [
    { code: "Power", label: "Power Unit", isDefault: true },
    { code: "Trailer", label: "Trailer" },
  ];

  for (const category of categories) {
    const existing = await prisma.equipmentCategory.findFirst({
      where: { code: category.code, organizationId: null },
    });

    if (!existing) {
      await prisma.equipmentCategory.create({
        data: category,
      });
    }
  }

  console.log("✅ Equipment enum tables seeded successfully!");
}

async function main() {
  try {
    await seedEquipmentEnums();
  } catch (error) {
    console.error("❌ Error seeding equipment enums:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
