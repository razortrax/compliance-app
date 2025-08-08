import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";

// GET /api/organizations/[id] - Get a single organization
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  // Declare variables at function scope for error handling
  let userId: string | null = null;
  let organizationId: string | null = null;

  try {
    const authResult = await auth();
    userId = authResult.userId;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    organizationId = params.id;
    console.log(`🏢 GET /api/organizations/${organizationId} - User: ${userId}`);

    // Simplified access control - check if user is a master first
    const userMasterOrg = await db.organization.findFirst({
      where: { party: { userId } },
      select: { id: true, partyId: true, name: true },
    });

    console.log("🔍 User Master Org:", userMasterOrg?.name || "None");

    let organization = null;

    if (userMasterOrg) {
      // Master user can access any organization
      organization = await db.organization.findFirst({
        where: { id: organizationId },
        include: {
          party: {
            select: {
              id: true,
              userId: true,
              status: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });
      console.log("✅ Master user - organization access:", organization?.name || "NOT FOUND");
    } else {
      // Non-master user - check direct access only
      organization = await db.organization.findFirst({
        where: {
          id: organizationId,
          OR: [
            // User owns this organization directly
            { party: { userId } },
            // User has a role in this organization
            { party: { role: { some: { party: { userId }, isActive: true } } } },
          ],
        },
        include: {
          party: {
            select: {
              id: true,
              userId: true,
              status: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });
      console.log("🔍 Direct access check:", organization?.name || "NOT FOUND");
    }

    if (!organization) {
      console.log(
        `❌ Organization ${organizationId} not found or access denied for user ${userId}`,
      );
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    console.log(`✅ Successfully found organization: ${organization.name}`);
    return NextResponse.json(organization);
  } catch (error) {
    console.error("🔥 Error in organizations API:", error);
    console.error("🔥 Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      organizationId,
      userId,
    });
    return NextResponse.json(
      {
        error: "Failed to fetch organization",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// PUT /api/organizations/[id] - Update an organization
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = params.id;
    const body = await request.json();

    // First, check if user has a master company
    const userMasterOrg = await db.organization.findFirst({
      where: {
        party: {
          userId: userId,
        },
      },
      select: {
        id: true,
        partyId: true,
      },
    });

    // If user has a master company, find all organizations managed by that master company
    let managedOrgIds: string[] = [];
    if (userMasterOrg) {
      const managedRoles = await db.role.findMany({
        where: {
          roleType: "master",
          partyId: userMasterOrg.partyId,
          isActive: true,
        },
        select: {
          organizationId: true,
        },
      });
      managedOrgIds = managedRoles.map((role) => role.organizationId).filter(Boolean) as string[];
    }

    // Verify the user has permission to update this organization
    const organization = await db.organization.findFirst({
      where: {
        id: organizationId,
        OR: [
          // User owns this organization (is their master company)
          {
            id: userMasterOrg?.id,
          },
          // This organization is managed by user's master company
          {
            id: { in: managedOrgIds.length > 0 ? managedOrgIds : [""] },
          },
        ],
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found or access denied" },
        { status: 404 },
      );
    }

    // Update the organization
    const updatedOrganization = await db.organization.update({
      where: { id: organizationId },
      data: {
        name: body.name,
        dotNumber: body.dotNumber || null,
        phone: body.phone || null,
        address: body.address || null,
        city: body.city || null,
        state: body.state || null,
        zipCode: body.zipCode || null,
      },
      include: {
        party: {
          select: {
            id: true,
            userId: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    return NextResponse.json(updatedOrganization);
  } catch (error) {
    console.error("Failed to update organization:", error);
    return NextResponse.json({ error: "Failed to update organization" }, { status: 500 });
  }
}

// DELETE /api/organizations/[id] - Delete (soft delete) an organization
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = params.id;

    // Verify the user owns this organization (only owners can delete)
    const organization = await db.organization.findFirst({
      where: {
        id: organizationId,
        party: {
          userId: userId,
        },
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found or access denied" },
        { status: 404 },
      );
    }

    // Soft delete by updating the party status
    await db.party.update({
      where: { id: organization.partyId },
      data: { status: "inactive" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete organization:", error);
    return NextResponse.json({ error: "Failed to delete organization" }, { status: 500 });
  }
}
