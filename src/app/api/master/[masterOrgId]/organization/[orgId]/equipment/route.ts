import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { masterOrgId: string; orgId: string } },
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgId } = params;

    // Simplified authorization - just verify organization exists
    const organization = await db.organization.findUnique({
      where: { id: orgId },
    });

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Get all active equipment for this organization (simplified query)
    const equipmentRoles = await db.role.findMany({
      where: {
        organizationId: orgId,
        roleType: "equipment",
        isActive: true,
      },
      include: {
        party: {
          include: {
            equipment: {
              include: {
                location: {
                  select: {
                    id: true,
                    name: true,
                    address: true,
                    city: true,
                    state: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        startDate: "desc",
      },
    });

    // Extract equipment from roles
    const equipment = equipmentRoles
      .map((role) => role.party?.equipment)
      .filter((item): item is NonNullable<typeof item> => item !== null && item !== undefined);

    // Transform equipment data with basic info (maintenance system to be implemented later)
    const equipmentWithStatus = equipment.map((item) => {
      return {
        id: item.id,
        vehicleTypeId: item.vehicleTypeId,
        make: item.make,
        model: item.model,
        year: item.year,
        vin: item.vin,
        plateNumber: item.plateNumber,
        registrationExpiry: item.registrationExpiry,
        location: item.location,
        // Placeholder for future maintenance system
        maintenance: {
          status: "unknown" as const,
          daysSinceLastMaintenance: null,
          isOverdue: false,
        },
      };
    });

    // Calculate summary statistics
    const totalEquipment = equipment.length;
    const activeEquipment = totalEquipment; // All equipment in roles are considered active
    const inactiveEquipment = 0;
    const maintenanceOverdue = 0; // Placeholder until maintenance system is implemented
    const maintenanceDue = 0;

    // Group by vehicle type for summary
    const equipmentByType = equipment.reduce(
      (acc, item) => {
        const type = item.vehicleTypeId || "Unknown";
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    console.log(
      `📊 Org ${orgId}: Found ${totalEquipment} pieces of equipment, ${maintenanceOverdue} overdue for maintenance`,
    );

    return NextResponse.json({
      organization: {
        id: organization.id,
        name: organization.name,
        dotNumber: organization.dotNumber,
      },
      equipment: equipmentWithStatus,
      summary: {
        totalEquipment,
        activeEquipment,
        inactiveEquipment,
        maintenanceOverdue,
        maintenanceDue,
        equipmentByType,
      },
    });
  } catch (error) {
    console.error("Error fetching organization equipment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
