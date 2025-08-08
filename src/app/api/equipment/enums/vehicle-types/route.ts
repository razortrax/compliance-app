import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { captureAPIError } from "@/lib/sentry-utils";

export async function GET(request: NextRequest) {
  try {
    const vehicleTypes = await db.equipmentVehicleType.findMany({
      where: {
        isActive: true,
        organizationId: null, // System defaults
      },
      orderBy: [{ isDefault: "desc" }, { label: "asc" }],
      select: {
        id: true,
        code: true,
        label: true,
        isDefault: true,
      },
    });

    return NextResponse.json(vehicleTypes);
  } catch (error) {
    console.error("Error fetching equipment vehicle type options:", error);
    captureAPIError(error instanceof Error ? error : new Error("Unknown error"), {
      endpoint: "/api/equipment/enums/vehicle-types",
      method: "GET",
    });
    return NextResponse.json({ error: "Failed to fetch vehicle type options" }, { status: 500 });
  }
}
