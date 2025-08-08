import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { auth } from "@clerk/nextjs/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { masterOrgId: string; orgId: string } },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { masterOrgId, orgId } = params;

    // Fetch master organization
    const masterOrg = await db.organization.findUnique({
      where: { id: masterOrgId },
      select: { id: true, name: true },
    });

    if (!masterOrg) {
      return NextResponse.json({ error: "Master organization not found" }, { status: 404 });
    }

    // Fetch organization
    const organization = await db.organization.findUnique({
      where: { id: orgId },
      select: { id: true, name: true },
    });

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    console.log("🔍 RSIN Debug - Filtering for orgId:", orgId);

    // Get all parties associated with this organization (drivers, equipment, etc.)
    const orgParties = await db.party.findMany({
      where: {
        OR: [
          // Organization itself
          { id: orgId },
          // Drivers in this organization
          {
            person: {
              party: {
                role: {
                  some: {
                    organizationId: orgId,
                    isActive: true,
                  },
                },
              },
            },
          },
          // Equipment in this organization
          {
            equipment: {
              party: {
                role: {
                  some: {
                    organizationId: orgId,
                    isActive: true,
                  },
                },
              },
            },
          },
        ],
      },
      select: { id: true },
    });

    const partyIds = orgParties.map((p) => p.id);
    console.log("🔍 RSIN Debug - Party IDs in this org:", partyIds);

    const incidents = await db.incident.findMany({
      where: {
        incidentType: "ROADSIDE_INSPECTION",
        issue: {
          partyId: { in: partyIds },
        },
      },
      include: {
        equipment: {
          select: {
            id: true,
            unitNumber: true,
            make: true,
            model: true,
            plateNumber: true,
            unitType: true,
          },
        },
        violations: {
          select: {
            id: true,
            violationCode: true,
            description: true,
            outOfService: true,
            severity: true,
            unitNumber: true,
          },
        },
        issue: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            createdAt: true,
            partyId: true,
          },
        },
      },
      orderBy: {
        incidentDate: "desc",
      },
    });

    return NextResponse.json({
      masterOrg,
      organization,
      incidents,
    });
  } catch (error) {
    console.error("Error fetching roadside inspections:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
