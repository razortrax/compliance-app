import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { masterOrgId: string; orgId: string; equipmentId: string } },
) {
  try {
    const authResult = await auth();
    const userId = authResult.userId;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { masterOrgId, orgId, equipmentId } = params;

    // Fetch all the contextual data in one query - Registration Gold Standard pattern
    const [masterOrg, organization, equipment, registrations] = await Promise.all([
      // Master organization
      db.organization.findUnique({
        where: { id: masterOrgId },
        select: { id: true, name: true },
      }),

      // Target organization
      db.organization.findUnique({
        where: { id: orgId },
        select: { id: true, name: true },
      }),

      // Equipment details
      db.equipment.findUnique({
        where: { id: equipmentId },
        select: {
          id: true,
          make: true,
          model: true,
          year: true,
          party: {
            select: { id: true },
          },
        },
      }),

      // Registration issues for this equipment
      db.registration_issue.findMany({
        where: {
          issue: {
            party: {
              equipment: {
                id: equipmentId,
              },
            },
          },
        },
        include: {
          issue: {
            select: {
              id: true,
              title: true,
              description: true,
              status: true,
              priority: true,
            },
          },
        },
        orderBy: {
          expirationDate: "desc",
        },
      }),
    ]);

    if (!masterOrg) {
      return NextResponse.json({ error: "Master organization not found" }, { status: 404 });
    }

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    if (!equipment) {
      return NextResponse.json({ error: "Equipment not found" }, { status: 404 });
    }

    // Transform registration data to match frontend interface
    const transformedRegistrations = registrations.map((registration: any) => ({
      id: registration.id,
      plateNumber: registration.plateNumber,
      state: registration.state,
      startDate: registration.startDate?.toISOString() || null,
      expirationDate: registration.expirationDate.toISOString(),
      renewalDate: registration.renewalDate?.toISOString() || null,
      status: registration.status,
      notes: registration.notes,
      issue: registration.issue,
    }));

    // Return structured data that matches Gold Standard pattern
    const responseData = {
      masterOrg,
      organization,
      equipment,
      registrations: transformedRegistrations,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error fetching equipment registration data:", error);
    return NextResponse.json(
      { error: "Failed to fetch equipment registration data" },
      { status: 500 },
    );
  }
}
