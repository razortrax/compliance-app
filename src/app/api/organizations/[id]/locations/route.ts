import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { createId } from "@paralleldrive/cuid2";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: organizationId } = await context.params;

    // First check if user has a master organization
    const userMasterOrg = await db.organization.findFirst({
      where: {
        party: {
          userId: userId,
        },
      },
    });

    let hasAccess = false;
    let organization = null;

    // Check if this is the user's master organization
    if (userMasterOrg && userMasterOrg.id === organizationId) {
      hasAccess = true;
      organization = userMasterOrg;
    } else if (userMasterOrg) {
      // Check if the user's master org manages this organization
      const masterRole = await db.role.findFirst({
        where: {
          roleType: "master",
          partyId: userMasterOrg.partyId,
          organizationId: organizationId,
          isActive: true,
        },
      });

      if (masterRole) {
        hasAccess = true;
        organization = await db.organization.findUnique({
          where: { id: organizationId },
        });
      }
    }

    // If not master access, check for direct access
    if (!hasAccess) {
      // Check if user owns the organization
      organization = await db.organization.findFirst({
        where: {
          id: organizationId,
          party: { userId },
        },
      });

      if (organization) {
        hasAccess = true;
      } else {
        // Check if user has an active role in this organization
        const hasRole = await db.role.findFirst({
          where: {
            party: { userId },
            organizationId: organizationId,
            isActive: true,
          },
        });

        if (hasRole) {
          hasAccess = true;
          organization = await db.organization.findUnique({
            where: { id: organizationId },
          });
        }
      }
    }

    if (!hasAccess || !organization) {
      return NextResponse.json(
        { error: "Organization not found or access denied" },
        { status: 404 },
      );
    }

    // Get locations for this organization
    const locations = await db.location.findMany({
      where: { organizationId },
      include: {
        _count: {
          select: {
            equipment: true,
            role: true,
          },
        },
      },
      orderBy: [{ isMainLocation: "desc" }, { name: "asc" }],
    });

    console.log(
      "Found locations for org",
      organizationId + ":",
      locations.map((l) => ({ id: l.id, name: l.name })),
    );
    return NextResponse.json(locations);
  } catch (error) {
    console.error("Error fetching locations:", error);
    return NextResponse.json({ error: "Failed to fetch locations" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: organizationId } = await context.params;

    // Use the same authorization logic as GET
    const userMasterOrg = await db.organization.findFirst({
      where: {
        party: {
          userId: userId,
        },
      },
    });

    let hasAccess = false;

    // Check if this is the user's master organization
    if (userMasterOrg && userMasterOrg.id === organizationId) {
      hasAccess = true;
    } else if (userMasterOrg) {
      // Check if the user's master org manages this organization
      const masterRole = await db.role.findFirst({
        where: {
          roleType: "master",
          partyId: userMasterOrg.partyId,
          organizationId: organizationId,
          isActive: true,
        },
      });

      if (masterRole) {
        hasAccess = true;
      }
    }

    // If not master access, check for direct ownership or role
    if (!hasAccess) {
      const userOrg = await db.organization.findFirst({
        where: {
          id: organizationId,
          party: {
            userId: userId,
          },
        },
      });

      const userRole = await db.role.findFirst({
        where: {
          party: {
            userId: userId,
          },
          organizationId: organizationId,
          isActive: true,
        },
      });

      hasAccess = !!(userOrg || userRole);
    }

    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    // If this is the first location and isMainLocation is true, ensure no other main location exists
    if (body.isMainLocation) {
      await db.location.updateMany({
        where: { organizationId },
        data: { isMainLocation: false },
      });
    }

    // Create location with party model for flexibility (ownership transfers, etc.)
    const result = await db.$transaction(async (tx) => {
      // 1. Create party record for the location
      const party = await tx.party.create({
        data: {
          id: createId(),
          status: "active",
        },
      });

      // 2. Create location linked to party
      const location = await tx.location.create({
        data: {
          id: createId(),
          partyId: party.id,
          organizationId, // Keep for backward compatibility and direct access
          name: body.name,
          locationType: body.locationType,
          address: body.address,
          city: body.city,
          state: body.state,
          zipCode: body.zipCode,
          phone: body.phone || null,
          email: body.email || null,
          isMainLocation: body.isMainLocation || false,
          isActive: true,
        },
      });

      // 3. Create role relationship: location belongs to organization
      await tx.role.create({
        data: {
          id: createId(),
          partyId: party.id,
          roleType: "LOCATION_OF",
          organizationId: organizationId,
          status: "active",
          isActive: true,
        },
      });

      console.log("✅ Created location with party model:", {
        locationId: location.id,
        partyId: party.id,
        name: location.name,
        org: organizationId,
      });

      return location;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error creating location:", error);
    return NextResponse.json({ error: "Failed to create location" }, { status: 500 });
  }
}
