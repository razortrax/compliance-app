import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/db";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { organizationName } = await request.json();

    if (!organizationName?.trim()) {
      return NextResponse.json({ error: "Organization name is required" }, { status: 400 });
    }

    // Find the user's organization
    const userParty = await db.party.findFirst({
      where: { userId },
      include: {
        organization: true,
        role: {
          where: { isActive: true },
        },
      },
    });

    if (!userParty) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    // For master users, find their organization through roles
    // For org/location users, update their direct organization
    let organization = userParty.organization;

    if (!organization && userParty.role.length > 0) {
      // Find organization through role for master users
      const role = userParty.role[0];
      if (role.organizationId) {
        organization = await db.organization.findUnique({
          where: { id: role.organizationId },
        });
      }
    }

    if (!organization) {
      return NextResponse.json({ error: "No organization found to update" }, { status: 404 });
    }

    // Update the organization name
    const updatedOrganization = await db.organization.update({
      where: { id: organization.id },
      data: {
        name: organizationName.trim(),
      },
    });

    return NextResponse.json({
      message: "Organization name updated successfully",
      organization: updatedOrganization,
    });
  } catch (error) {
    console.error("Organization update error:", error);
    return NextResponse.json({ error: "Failed to update organization name" }, { status: 500 });
  } finally {
    // No need to disconnect when using shared db instance
  }
}
