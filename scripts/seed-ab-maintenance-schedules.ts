import { db } from "@/db";

/**
 * Comprehensive A&B Maintenance Schedule Seeding
 * Based on industry standards for commercial vehicles
 *
 * A Schedule: Frequent, basic maintenance (every 90-120 days or 25,000-30,000 miles)
 * B Schedule: Comprehensive maintenance (every 180-365 days or 50,000-100,000 miles)
 */

interface ABScheduleItem {
  equipmentCategory: string;
  scheduleType: string;
  itemCode: string;
  itemDescription: string;
  intervalDays?: number;
  intervalMiles?: number;
  intervalType: string;
  category: string;
  component: string;
  taskType: string;
  estimatedHours?: number;
  estimatedCost?: number;
  dotRequired: boolean;
  priority: string;
  safetyRelated: boolean;
  sortOrder: number;
}

// POWER UNIT A&B MAINTENANCE SCHEDULE
const powerUnitSchedule: ABScheduleItem[] = [
  // === A SCHEDULE (Every 90 days or 25,000 miles) ===

  // Engine & Fluids
  {
    equipmentCategory: "POWER",
    scheduleType: "A",
    itemCode: "A1",
    itemDescription: "Engine Oil and Filter Change",
    intervalDays: 90,
    intervalMiles: 25000,
    intervalType: "DUAL_TRIGGER",
    category: "ENGINE",
    component: "Oil Filter",
    taskType: "REPLACE",
    estimatedHours: 1.0,
    estimatedCost: 150.0,
    dotRequired: true,
    priority: "ROUTINE",
    safetyRelated: true,
    sortOrder: 1,
  },
  {
    equipmentCategory: "POWER",
    scheduleType: "A",
    itemCode: "A2",
    itemDescription: "Fuel Filter Replacement",
    intervalDays: 90,
    intervalMiles: 25000,
    intervalType: "DUAL_TRIGGER",
    category: "FUEL_SYSTEM",
    component: "Fuel Filter",
    taskType: "REPLACE",
    estimatedHours: 0.5,
    estimatedCost: 75.0,
    dotRequired: true,
    priority: "ROUTINE",
    safetyRelated: true,
    sortOrder: 2,
  },
  {
    equipmentCategory: "POWER",
    scheduleType: "A",
    itemCode: "A3",
    itemDescription: "Air Filter Inspection and Cleaning",
    intervalDays: 90,
    intervalMiles: 25000,
    intervalType: "DUAL_TRIGGER",
    category: "ENGINE",
    component: "Air Filter",
    taskType: "INSPECT",
    estimatedHours: 0.3,
    estimatedCost: 25.0,
    dotRequired: false,
    priority: "ROUTINE",
    safetyRelated: false,
    sortOrder: 3,
  },

  // Cooling System
  {
    equipmentCategory: "POWER",
    scheduleType: "A",
    itemCode: "A4",
    itemDescription: "Coolant Level Check and Top-off",
    intervalDays: 90,
    intervalMiles: undefined, // Fixed: use undefined instead of null
    intervalType: "TIME_BASED",
    category: "COOLING",
    component: "Coolant",
    taskType: "INSPECT",
    estimatedHours: 0.2,
    estimatedCost: 20.0,
    dotRequired: true,
    priority: "ROUTINE",
    safetyRelated: true,
    sortOrder: 4,
  },

  // Brake System
  {
    equipmentCategory: "POWER",
    scheduleType: "A",
    itemCode: "A5",
    itemDescription: "Brake System Inspection",
    intervalDays: 90,
    intervalMiles: 25000,
    intervalType: "DUAL_TRIGGER",
    category: "BRAKES",
    component: "Brake Shoes",
    taskType: "INSPECT",
    estimatedHours: 1.5,
    estimatedCost: 100.0,
    dotRequired: true,
    priority: "HIGH",
    safetyRelated: true,
    sortOrder: 5,
  },
  {
    equipmentCategory: "POWER",
    scheduleType: "A",
    itemCode: "A6",
    itemDescription: "Air Brake System Check",
    intervalDays: 90,
    intervalMiles: undefined,
    intervalType: "TIME_BASED",
    category: "BRAKES",
    component: "Air System",
    taskType: "INSPECT",
    estimatedHours: 1.0,
    estimatedCost: 75.0,
    dotRequired: true,
    priority: "HIGH",
    safetyRelated: true,
    sortOrder: 6,
  },

  // Steering & Suspension
  {
    equipmentCategory: "POWER",
    scheduleType: "A",
    itemCode: "A7",
    itemDescription: "Steering System Inspection",
    intervalDays: 90,
    intervalMiles: 25000,
    intervalType: "DUAL_TRIGGER",
    category: "STEERING",
    component: "Steering Linkage",
    taskType: "INSPECT",
    estimatedHours: 1.0,
    estimatedCost: 60.0,
    dotRequired: true,
    priority: "HIGH",
    safetyRelated: true,
    sortOrder: 7,
  },
  {
    equipmentCategory: "POWER",
    scheduleType: "A",
    itemCode: "A8",
    itemDescription: "Suspension Components Check",
    intervalDays: 90,
    intervalMiles: 25000,
    intervalType: "DUAL_TRIGGER",
    category: "SUSPENSION",
    component: "Springs/Shocks",
    taskType: "INSPECT",
    estimatedHours: 1.5,
    estimatedCost: 80.0,
    dotRequired: true,
    priority: "HIGH",
    safetyRelated: true,
    sortOrder: 8,
  },

  // Tires & Wheels
  {
    equipmentCategory: "POWER",
    scheduleType: "A",
    itemCode: "A9",
    itemDescription: "Tire Pressure and Condition Check",
    intervalDays: 30,
    intervalMiles: undefined,
    intervalType: "TIME_BASED",
    category: "TIRES",
    component: "Tires",
    taskType: "INSPECT",
    estimatedHours: 0.5,
    estimatedCost: 25.0,
    dotRequired: true,
    priority: "HIGH",
    safetyRelated: true,
    sortOrder: 9,
  },
  {
    equipmentCategory: "POWER",
    scheduleType: "A",
    itemCode: "A10",
    itemDescription: "Wheel Fastener Torque Check",
    intervalDays: 90,
    intervalMiles: 25000,
    intervalType: "DUAL_TRIGGER",
    category: "TIRES",
    component: "Wheel Fasteners",
    taskType: "INSPECT",
    estimatedHours: 1.0,
    estimatedCost: 50.0,
    dotRequired: true,
    priority: "HIGH",
    safetyRelated: true,
    sortOrder: 10,
  },

  // Lighting & Electrical
  {
    equipmentCategory: "POWER",
    scheduleType: "A",
    itemCode: "A11",
    itemDescription: "Lighting System Check",
    intervalDays: 90,
    intervalMiles: undefined,
    intervalType: "TIME_BASED",
    category: "ELECTRICAL",
    component: "Lights",
    taskType: "INSPECT",
    estimatedHours: 0.5,
    estimatedCost: 30.0,
    dotRequired: true,
    priority: "ROUTINE",
    safetyRelated: true,
    sortOrder: 11,
  },

  // === B SCHEDULE (Every 180 days or 50,000 miles) ===

  // Transmission & Drivetrain
  {
    equipmentCategory: "POWER",
    scheduleType: "B",
    itemCode: "B1",
    itemDescription: "Transmission Fluid and Filter Service",
    intervalDays: 180,
    intervalMiles: 50000,
    intervalType: "DUAL_TRIGGER",
    category: "TRANSMISSION",
    component: "Transmission Filter",
    taskType: "REPLACE",
    estimatedHours: 2.5,
    estimatedCost: 350.0,
    dotRequired: false,
    priority: "ROUTINE",
    safetyRelated: false,
    sortOrder: 20,
  },
  {
    equipmentCategory: "POWER",
    scheduleType: "B",
    itemCode: "B2",
    itemDescription: "Differential Service",
    intervalDays: 180,
    intervalMiles: 50000,
    intervalType: "DUAL_TRIGGER",
    category: "DRIVETRAIN",
    component: "Differential",
    taskType: "SERVICE",
    estimatedHours: 1.5,
    estimatedCost: 200.0,
    dotRequired: false,
    priority: "ROUTINE",
    safetyRelated: false,
    sortOrder: 21,
  },

  // Engine - Comprehensive
  {
    equipmentCategory: "POWER",
    scheduleType: "B",
    itemCode: "B3",
    itemDescription: "Turbocharger Inspection",
    intervalDays: 180,
    intervalMiles: 50000,
    intervalType: "DUAL_TRIGGER",
    category: "ENGINE",
    component: "Turbocharger",
    taskType: "INSPECT",
    estimatedHours: 2.0,
    estimatedCost: 150.0,
    dotRequired: false,
    priority: "ROUTINE",
    safetyRelated: false,
    sortOrder: 22,
  },
  {
    equipmentCategory: "POWER",
    scheduleType: "B",
    itemCode: "B4",
    itemDescription: "EGR System Service",
    intervalDays: 180,
    intervalMiles: 50000,
    intervalType: "DUAL_TRIGGER",
    category: "EMISSIONS",
    component: "EGR Valve",
    taskType: "SERVICE",
    estimatedHours: 1.5,
    estimatedCost: 250.0,
    dotRequired: true,
    priority: "ROUTINE",
    safetyRelated: false,
    sortOrder: 23,
  },

  // Cooling System - Comprehensive
  {
    equipmentCategory: "POWER",
    scheduleType: "B",
    itemCode: "B5",
    itemDescription: "Radiator and Cooling System Flush",
    intervalDays: 365,
    intervalMiles: 100000,
    intervalType: "DUAL_TRIGGER",
    category: "COOLING",
    component: "Radiator",
    taskType: "SERVICE",
    estimatedHours: 2.0,
    estimatedCost: 300.0,
    dotRequired: false,
    priority: "ROUTINE",
    safetyRelated: true,
    sortOrder: 24,
  },

  // Electrical - Comprehensive
  {
    equipmentCategory: "POWER",
    scheduleType: "B",
    itemCode: "B6",
    itemDescription: "Battery and Charging System Test",
    intervalDays: 180,
    intervalMiles: undefined,
    intervalType: "TIME_BASED",
    category: "ELECTRICAL",
    component: "Battery",
    taskType: "INSPECT",
    estimatedHours: 1.0,
    estimatedCost: 75.0,
    dotRequired: false,
    priority: "ROUTINE",
    safetyRelated: false,
    sortOrder: 25,
  },

  // Fifth Wheel & Coupling
  {
    equipmentCategory: "POWER",
    scheduleType: "B",
    itemCode: "B7",
    itemDescription: "Fifth Wheel Lubrication and Inspection",
    intervalDays: 180,
    intervalMiles: 50000,
    intervalType: "DUAL_TRIGGER",
    category: "COUPLING",
    component: "Fifth Wheel",
    taskType: "LUBRICATE",
    estimatedHours: 1.0,
    estimatedCost: 80.0,
    dotRequired: true,
    priority: "ROUTINE",
    safetyRelated: true,
    sortOrder: 26,
  },
];

// TRAILER A&B MAINTENANCE SCHEDULE
const trailerSchedule: ABScheduleItem[] = [
  // === A SCHEDULE (Every 90 days or 25,000 miles) ===

  // Brake System
  {
    equipmentCategory: "TRAILER",
    scheduleType: "A",
    itemCode: "TA1",
    itemDescription: "Brake System Inspection",
    intervalDays: 90,
    intervalMiles: 25000,
    intervalType: "DUAL_TRIGGER",
    category: "BRAKES",
    component: "Brake Shoes",
    taskType: "INSPECT",
    estimatedHours: 1.5,
    estimatedCost: 100.0,
    dotRequired: true,
    priority: "HIGH",
    safetyRelated: true,
    sortOrder: 1,
  },
  {
    equipmentCategory: "TRAILER",
    scheduleType: "A",
    itemCode: "TA2",
    itemDescription: "Air Brake System Check",
    intervalDays: 90,
    intervalMiles: undefined,
    intervalType: "TIME_BASED",
    category: "BRAKES",
    component: "Air Lines",
    taskType: "INSPECT",
    estimatedHours: 0.5,
    estimatedCost: 40.0,
    dotRequired: true,
    priority: "HIGH",
    safetyRelated: true,
    sortOrder: 2,
  },

  // Tires & Wheels
  {
    equipmentCategory: "TRAILER",
    scheduleType: "A",
    itemCode: "TA3",
    itemDescription: "Tire Pressure and Condition Check",
    intervalDays: 30,
    intervalMiles: undefined,
    intervalType: "TIME_BASED",
    category: "TIRES",
    component: "Tires",
    taskType: "INSPECT",
    estimatedHours: 0.5,
    estimatedCost: 25.0,
    dotRequired: true,
    priority: "HIGH",
    safetyRelated: true,
    sortOrder: 3,
  },
  {
    equipmentCategory: "TRAILER",
    scheduleType: "A",
    itemCode: "TA4",
    itemDescription: "Wheel Fastener Torque Check",
    intervalDays: 90,
    intervalMiles: 25000,
    intervalType: "DUAL_TRIGGER",
    category: "TIRES",
    component: "Wheel Fasteners",
    taskType: "INSPECT",
    estimatedHours: 1.0,
    estimatedCost: 50.0,
    dotRequired: true,
    priority: "HIGH",
    safetyRelated: true,
    sortOrder: 4,
  },

  // Suspension & Frame
  {
    equipmentCategory: "TRAILER",
    scheduleType: "A",
    itemCode: "TA5",
    itemDescription: "Suspension Components Inspection",
    intervalDays: 90,
    intervalMiles: 25000,
    intervalType: "DUAL_TRIGGER",
    category: "SUSPENSION",
    component: "Springs/Airbags",
    taskType: "INSPECT",
    estimatedHours: 1.0,
    estimatedCost: 60.0,
    dotRequired: true,
    priority: "HIGH",
    safetyRelated: true,
    sortOrder: 5,
  },
  {
    equipmentCategory: "TRAILER",
    scheduleType: "A",
    itemCode: "TA6",
    itemDescription: "Frame and Cross Members Check",
    intervalDays: 90,
    intervalMiles: 25000,
    intervalType: "DUAL_TRIGGER",
    category: "FRAME",
    component: "Frame Rails",
    taskType: "INSPECT",
    estimatedHours: 1.5,
    estimatedCost: 75.0,
    dotRequired: true,
    priority: "HIGH",
    safetyRelated: true,
    sortOrder: 6,
  },

  // Lighting & Electrical
  {
    equipmentCategory: "TRAILER",
    scheduleType: "A",
    itemCode: "TA7",
    itemDescription: "Lighting System Check",
    intervalDays: 90,
    intervalMiles: undefined,
    intervalType: "TIME_BASED",
    category: "ELECTRICAL",
    component: "Lights",
    taskType: "INSPECT",
    estimatedHours: 0.5,
    estimatedCost: 30.0,
    dotRequired: true,
    priority: "ROUTINE",
    safetyRelated: true,
    sortOrder: 7,
  },
  {
    equipmentCategory: "TRAILER",
    scheduleType: "A",
    itemCode: "TA8",
    itemDescription: "Electrical Connections Check",
    intervalDays: 90,
    intervalMiles: undefined,
    intervalType: "TIME_BASED",
    category: "ELECTRICAL",
    component: "Wiring",
    taskType: "INSPECT",
    estimatedHours: 0.5,
    estimatedCost: 25.0,
    dotRequired: true,
    priority: "ROUTINE",
    safetyRelated: true,
    sortOrder: 8,
  },

  // Coupling & Kingpin
  {
    equipmentCategory: "TRAILER",
    scheduleType: "A",
    itemCode: "TA9",
    itemDescription: "Kingpin and Upper Coupler Inspection",
    intervalDays: 90,
    intervalMiles: 25000,
    intervalType: "DUAL_TRIGGER",
    category: "COUPLING",
    component: "Kingpin",
    taskType: "INSPECT",
    estimatedHours: 0.5,
    estimatedCost: 40.0,
    dotRequired: true,
    priority: "HIGH",
    safetyRelated: true,
    sortOrder: 9,
  },

  // Landing Gear
  {
    equipmentCategory: "TRAILER",
    scheduleType: "A",
    itemCode: "TA10",
    itemDescription: "Landing Gear Operation Check",
    intervalDays: 90,
    intervalMiles: undefined,
    intervalType: "TIME_BASED",
    category: "LANDING_GEAR",
    component: "Landing Gear",
    taskType: "INSPECT",
    estimatedHours: 0.5,
    estimatedCost: 35.0,
    dotRequired: true,
    priority: "ROUTINE",
    safetyRelated: false,
    sortOrder: 10,
  },

  // === B SCHEDULE (Every 180 days or 50,000 miles) ===

  // Brake System - Comprehensive
  {
    equipmentCategory: "TRAILER",
    scheduleType: "B",
    itemCode: "TB1",
    itemDescription: "Brake Adjustment and Lubrication",
    intervalDays: 180,
    intervalMiles: 50000,
    intervalType: "DUAL_TRIGGER",
    category: "BRAKES",
    component: "Brake Adjusters",
    taskType: "SERVICE",
    estimatedHours: 2.0,
    estimatedCost: 150.0,
    dotRequired: true,
    priority: "HIGH",
    safetyRelated: true,
    sortOrder: 20,
  },

  // Suspension - Comprehensive
  {
    equipmentCategory: "TRAILER",
    scheduleType: "B",
    itemCode: "TB2",
    itemDescription: "Air Suspension System Service",
    intervalDays: 180,
    intervalMiles: 50000,
    intervalType: "DUAL_TRIGGER",
    category: "SUSPENSION",
    component: "Air Bags",
    taskType: "SERVICE",
    estimatedHours: 1.5,
    estimatedCost: 200.0,
    dotRequired: false,
    priority: "ROUTINE",
    safetyRelated: true,
    sortOrder: 21,
  },

  // Landing Gear - Comprehensive
  {
    equipmentCategory: "TRAILER",
    scheduleType: "B",
    itemCode: "TB3",
    itemDescription: "Landing Gear Lubrication and Service",
    intervalDays: 180,
    intervalMiles: undefined,
    intervalType: "TIME_BASED",
    category: "LANDING_GEAR",
    component: "Landing Gear Gears",
    taskType: "LUBRICATE",
    estimatedHours: 1.0,
    estimatedCost: 75.0,
    dotRequired: false,
    priority: "ROUTINE",
    safetyRelated: false,
    sortOrder: 22,
  },

  // Doors & Cargo Handling
  {
    equipmentCategory: "TRAILER",
    scheduleType: "B",
    itemCode: "TB4",
    itemDescription: "Door Hinges and Hardware Lubrication",
    intervalDays: 180,
    intervalMiles: undefined,
    intervalType: "TIME_BASED",
    category: "CARGO",
    component: "Door Hinges",
    taskType: "LUBRICATE",
    estimatedHours: 0.5,
    estimatedCost: 40.0,
    dotRequired: false,
    priority: "ROUTINE",
    safetyRelated: false,
    sortOrder: 23,
  },

  // Floor & Cargo Area
  {
    equipmentCategory: "TRAILER",
    scheduleType: "B",
    itemCode: "TB5",
    itemDescription: "Floor and Cargo Area Inspection",
    intervalDays: 365,
    intervalMiles: undefined,
    intervalType: "TIME_BASED",
    category: "CARGO",
    component: "Floor",
    taskType: "INSPECT",
    estimatedHours: 1.0,
    estimatedCost: 50.0,
    dotRequired: false,
    priority: "ROUTINE",
    safetyRelated: false,
    sortOrder: 24,
  },
];

async function seedABSchedules() {
  console.log("🔧 Starting A&B Maintenance Schedule seeding...");

  try {
    // Combine both schedules
    const allScheduleItems = [...powerUnitSchedule, ...trailerSchedule];

    console.log(`📋 Seeding ${allScheduleItems.length} A&B schedule items...`);
    console.log(`   - Power Unit items: ${powerUnitSchedule.length}`);
    console.log(`   - Trailer items: ${trailerSchedule.length}`);

    // Clear existing default schedule items
    await db.equipment_ab_schedule.deleteMany({
      where: {
        isDefault: true,
        organizationId: null, // Only delete system defaults
      },
    });

    // Insert new schedule items
    for (const item of allScheduleItems) {
      await db.equipment_ab_schedule.create({
        data: {
          organizationId: null, // System default
          equipmentCategory: item.equipmentCategory,
          scheduleType: item.scheduleType,
          itemCode: item.itemCode,
          itemDescription: item.itemDescription,
          intervalDays: item.intervalDays,
          intervalMiles: item.intervalMiles,
          intervalType: item.intervalType as any, // Type assertion for enum
          category: item.category,
          component: item.component,
          taskType: item.taskType,
          estimatedHours: item.estimatedHours,
          estimatedCost: item.estimatedCost,
          dotRequired: item.dotRequired,
          priority: item.priority as any, // Type assertion for enum
          safetyRelated: item.safetyRelated,
          sortOrder: item.sortOrder,
          isActive: true,
          isDefault: true,
        },
      });
    }

    console.log("✅ A&B Maintenance Schedule seeding completed successfully!");
    console.log("");
    console.log("📊 Summary:");
    console.log("   Power Unit A Schedule: Engine, brakes, tires, steering (90 days/25K miles)");
    console.log(
      "   Power Unit B Schedule: Transmission, differential, comprehensive (180 days/50K miles)",
    );
    console.log("   Trailer A Schedule: Brakes, tires, suspension, lighting (90 days/25K miles)");
    console.log(
      "   Trailer B Schedule: Comprehensive brake/suspension service (180 days/50K miles)",
    );
    console.log("");
    console.log("🔄 Organizations can now customize these schedules in their preferences.");
  } catch (error) {
    console.error("❌ Error seeding A&B schedules:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedABSchedules()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { seedABSchedules };
