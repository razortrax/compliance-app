import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { masterOrgId: string; orgId: string; driverId: string } },
) {
  try {
    const authResult = await auth();
    const userId = authResult.userId;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { masterOrgId, orgId, driverId } = params;

    // Fetch all the contextual data in one query - MVR Gold Standard pattern
    const [masterOrg, organization, driver, licenses] = await Promise.all([
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

      // Driver details
      db.person.findUnique({
        where: { id: driverId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          licenseNumber: true,
          party: {
            select: { id: true },
          },
        },
      }),

      // License issues for this driver
      db.license_issue.findMany({
        where: {
          issue: {
            party: {
              person: {
                id: driverId,
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

    if (!driver) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    // Transform license data to match frontend interface
    const transformedLicenses = licenses.map((license: any) => ({
      id: license.id,
      licenseType: license.licenseType,
      licenseState: license.licenseState,
      licenseNumber: license.licenseNumber,
      certification: license.certification,
      startDate: license.startDate?.toISOString() || null,
      expirationDate: license.expirationDate.toISOString(),
      renewalDate: license.renewalDate?.toISOString() || null,
      endorsements: license.endorsements || [],
      restrictions: license.restrictions || [],
      notes: license.notes,
      issue: license.issue,
    }));

    // Return structured data that matches MVR pattern
    const responseData = {
      masterOrg,
      organization,
      driver,
      licenses: transformedLicenses,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error fetching driver license data:", error);
    return NextResponse.json({ error: "Failed to fetch driver license data" }, { status: 500 });
  }
}
