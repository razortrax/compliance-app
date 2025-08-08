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

    // Fetch all the contextual data and compliance overview
    const [masterOrg, organization, driver, licenses, mvrs, training] = await Promise.all([
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
          phone: true,
          email: true,
        },
      }),

      // License issues for compliance summary
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
        select: {
          id: true,
          expirationDate: true,
        },
      }),

      // MVR issues for compliance summary
      db.mvr_issue.findMany({
        where: {
          issue: {
            party: {
              person: {
                id: driverId,
              },
            },
          },
        },
        select: {
          id: true,
          expirationDate: true,
        },
      }),

      // Training issues for compliance summary
      db.training_issue.findMany({
        where: {
          issue: {
            party: {
              person: {
                id: driverId,
              },
            },
          },
        },
        select: {
          id: true,
          isRequired: true,
          expirationDate: true,
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

    // Calculate compliance statistics
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysFromNow = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);

    const calculateComplianceStats = (items: Array<{ expirationDate: Date }>) => {
      const total = items.length;
      let current = 0;
      let expiring = 0;
      let expired = 0;

      items.forEach((item) => {
        const expDate = new Date(item.expirationDate);
        if (expDate < today) {
          expired++;
        } else if (expDate <= thirtyDaysFromNow) {
          expiring++;
        } else {
          current++;
        }
      });

      return { total, current, expiring, expired };
    };

    // Filter out null expiration dates before calculating stats
    const licenseStats = calculateComplianceStats(
      licenses.filter((l) => l.expirationDate) as Array<{ expirationDate: Date }>,
    );
    const mvrStats = calculateComplianceStats(
      mvrs.filter((m) => m.expirationDate) as Array<{ expirationDate: Date }>,
    );

    // Training has additional required count
    const trainingStats = calculateComplianceStats(
      training.filter((t) => t.expirationDate) as Array<{ expirationDate: Date }>,
    );
    const requiredTraining = training.filter((t) => t.isRequired).length;

    // Physicals (placeholder data since we don't have this implemented yet)
    const physicalStats = { total: 0, current: 0, expiring: 0, expired: 0 };

    // Return structured data
    const responseData = {
      masterOrg,
      organization,
      driver,
      compliance: {
        licenses: licenseStats,
        mvrs: mvrStats,
        training: {
          ...trainingStats,
          required: requiredTraining,
        },
        physicals: physicalStats,
      },
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error fetching driver overview data:", error);
    return NextResponse.json({ error: "Failed to fetch driver overview data" }, { status: 500 });
  }
}
