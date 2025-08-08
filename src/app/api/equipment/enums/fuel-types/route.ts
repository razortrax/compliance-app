import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { captureAPIError } from "@/lib/sentry-utils";

export async function GET(request: NextRequest) {
  try {
    const fuelTypes = await db.equipmentFuelType.findMany({
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

    return NextResponse.json(fuelTypes);
  } catch (error) {
    console.error("Error fetching equipment fuel type options:", error);
    captureAPIError(error instanceof Error ? error : new Error("Unknown error"), {
      endpoint: "/api/equipment/enums/fuel-types",
      method: "GET",
    });
    return NextResponse.json({ error: "Failed to fetch fuel type options" }, { status: 500 });
  }
}
