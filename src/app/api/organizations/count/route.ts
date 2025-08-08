import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Count organizations for this user
    // For now, we'll return a mock count since we haven't implemented user-organization relationships yet
    // TODO: Implement proper user-organization relationship tracking

    const organizationCount = await db.organization.count();

    return NextResponse.json({
      count: organizationCount,
      hasMultipleOrganizations: organizationCount > 1,
    });
  } catch (error) {
    console.error("Error counting organizations:", error);
    return NextResponse.json({ error: "Failed to count organizations" }, { status: 500 });
  }
}
