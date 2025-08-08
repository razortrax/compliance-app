import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { masterOrgId: string; orgId: string } },
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgId } = params;

    // Simplified authorization - just verify organization exists
    const organization = await db.organization.findUnique({
      where: { id: orgId },
    });

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Get all active drivers for this organization (simplified query)
    const driverRoles = await db.role.findMany({
      where: {
        organizationId: orgId,
        roleType: "driver",
        isActive: true,
      },
      include: {
        party: {
          include: {
            person: true,
          },
        },
      },
    });

    // 5. Transform driver data with compliance summary
    const driversWithCompliance = await Promise.all(
      driverRoles.map(async (role) => {
        const driver = role.party?.person;
        if (!driver) return null;

        // Get compliance issues counts for this driver
        const [licenseCount, mvrCount, trainingCount, physicalCount] = await Promise.all([
          db.license_issue.count({
            where: {
              issue: {
                party: {
                  person: {
                    id: driver.id,
                  },
                },
                status: "open",
              },
            },
          }),
          db.mvr_issue.count({
            where: {
              issue: {
                party: {
                  person: {
                    id: driver.id,
                  },
                },
                status: "open",
              },
              status: "Active",
            },
          }),
          db.training_issue.count({
            where: {
              issue: {
                party: {
                  person: {
                    id: driver.id,
                  },
                },
                status: "open",
              },
            },
          }),
          db.physical_issue.count({
            where: {
              issue: {
                party: {
                  person: {
                    id: driver.id,
                  },
                },
                status: "open",
              },
            },
          }),
        ]);

        // Get expiring issues count (expires within 30 days)
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        const [expiringLicenses, expiringMvrs, expiringTraining, expiringPhysicals] =
          await Promise.all([
            db.license_issue.count({
              where: {
                issue: {
                  party: {
                    person: {
                      id: driver.id,
                    },
                  },
                  status: "open",
                },
                expirationDate: {
                  lte: thirtyDaysFromNow,
                  gte: new Date(),
                },
              },
            }),
            db.mvr_issue.count({
              where: {
                issue: {
                  party: {
                    person: {
                      id: driver.id,
                    },
                  },
                  status: "open",
                },
                status: "Active",
                expirationDate: {
                  lte: thirtyDaysFromNow,
                  gte: new Date(),
                },
              },
            }),
            db.training_issue.count({
              where: {
                issue: {
                  party: {
                    person: {
                      id: driver.id,
                    },
                  },
                  status: "open",
                },
                expirationDate: {
                  lte: thirtyDaysFromNow,
                  gte: new Date(),
                },
              },
            }),
            db.physical_issue.count({
              where: {
                issue: {
                  party: {
                    person: {
                      id: driver.id,
                    },
                  },
                  status: "open",
                },
                expirationDate: {
                  lte: thirtyDaysFromNow,
                  gte: new Date(),
                },
              },
            }),
          ]);

        const totalExpiringIssues =
          expiringLicenses + expiringMvrs + expiringTraining + expiringPhysicals;
        const totalActiveIssues = licenseCount + mvrCount + trainingCount + physicalCount;

        return {
          id: driver.id,
          firstName: driver.firstName,
          lastName: driver.lastName,
          email: driver.email,
          phone: driver.phone,
          licenseNumber: driver.licenseNumber,
          dateOfBirth: driver.dateOfBirth,
          address: driver.address,
          city: driver.city,
          state: driver.state,
          zipCode: driver.zipCode,
          roleStartDate: role.startDate,
          roleStatus: role.status,
          compliance: {
            totalActiveIssues,
            expiringIssues: totalExpiringIssues,
            licenseCount,
            mvrCount,
            trainingCount,
            physicalCount,
            status: totalExpiringIssues > 0 ? "warning" : "compliant",
          },
        };
      }),
    );

    // Filter out null drivers (in case of data inconsistencies)
    const validDrivers = driversWithCompliance.filter(
      (d): d is NonNullable<typeof d> => d !== null,
    );

    // 6. Calculate summary statistics
    const totalDrivers = validDrivers.length;
    const driversWithIssues = validDrivers.filter((d) => d.compliance.expiringIssues > 0).length;
    const complianceRate =
      totalDrivers > 0 ? ((totalDrivers - driversWithIssues) / totalDrivers) * 100 : 100;

    console.log(
      `📊 Org ${orgId}: Found ${totalDrivers} drivers, ${driversWithIssues} with expiring issues`,
    );

    return NextResponse.json({
      organization: {
        id: organization.id,
        name: organization.name,
        dotNumber: organization.dotNumber,
      },
      drivers: validDrivers,
      summary: {
        totalDrivers,
        driversWithIssues,
        complianceRate: Math.round(complianceRate),
        totalActiveIssues: validDrivers.reduce((sum, d) => sum + d.compliance.totalActiveIssues, 0),
        totalExpiringIssues: validDrivers.reduce((sum, d) => sum + d.compliance.expiringIssues, 0),
      },
    });
  } catch (error) {
    console.error("Error fetching organization drivers:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
