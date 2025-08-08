import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";

export async function GET(request: NextRequest) {
  try {
    const ownershipTypes = await db.equipmentOwnershipType.findMany({
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

    return NextResponse.json(ownershipTypes);
  } catch (error) {
    console.error("Error fetching equipment ownership type options:", error);
    return NextResponse.json({ error: "Failed to fetch ownership type options" }, { status: 500 });
  }
}
