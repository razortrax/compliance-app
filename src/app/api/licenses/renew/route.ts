import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";

interface LicenseRenewalData {
  previousLicenseId: string; // Required: which license we're renewing
  startDate?: string; // New start date (defaults to old expiration)
  expirationDate: string; // Required: new expiration date
  renewalDate?: string; // Renewal/processing date (defaults to today)
  notes?: string; // Optional: updated notes
  title?: string; // Optional: updated title
  description?: string; // Optional: updated description
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: LicenseRenewalData = await request.json();

    // Validate required fields
    if (!body.previousLicenseId || !body.expirationDate) {
      return Response.json({ error: "Missing required fields for renewal" }, { status: 400 });
    }

    // Check if user has access to the party (get from existing license)
    const existingLicense = await db.license_issue.findUnique({
      where: { id: body.previousLicenseId },
      include: {
        issue: {
          include: {
            party: {
              include: {
                person: true,
                organization: true,
                role: {
                  include: {
                    party: {
                      include: {
                        organization: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!existingLicense) {
      return Response.json({ error: "License to renew not found" }, { status: 404 });
    }

    const party = existingLicense.issue.party;

    // Access control check - support Master, Organization, and Location managers
    let hasAccess = false;

    // 1. Check direct ownership first
    if (party.userId === userId) {
      hasAccess = true;
    }

    if (!hasAccess) {
      // Get the driver's role to find their organization and location
      const driverRole = await db.role.findFirst({
        where: {
          partyId: party.id,
          isActive: true,
        },
      });

      if (driverRole) {
        // 2. Check if user is a Master consultant who manages this organization
        const userMasterOrg = await db.organization.findFirst({
          where: {
            party: { userId: userId },
          },
        });

        if (userMasterOrg) {
          // Check if master org manages the driver's organization
          const masterRole = await db.role.findFirst({
            where: {
              roleType: "master",
              partyId: userMasterOrg.partyId,
              organizationId: driverRole.organizationId,
              isActive: true,
            },
          });

          if (masterRole) {
            hasAccess = true;
          }
        }

        // 3. Check if user is an Organization manager or consultant in the same organization
        if (!hasAccess) {
          const orgManagerRole = await db.role.findFirst({
            where: {
              party: { userId: userId },
              organizationId: driverRole.organizationId,
              roleType: { in: ["organization_manager", "owner", "consultant"] },
              isActive: true,
            },
          });

          if (orgManagerRole) {
            hasAccess = true;
          }
        }

        // 4. Check if user is a Location manager at the same location
        if (!hasAccess && driverRole.locationId) {
          const locationManagerRole = await db.role.findFirst({
            where: {
              party: { userId: userId },
              locationId: driverRole.locationId,
              roleType: "location_manager",
              isActive: true,
            },
          });

          if (locationManagerRole) {
            hasAccess = true;
          }
        }
      }
    }

    if (!hasAccess) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }

    // Perform renewal in a transaction
    const result = await db.$transaction(async (tx) => {
      // 1. Fetch the existing license to get all current data
      const existingLicense = await tx.license_issue.findUnique({
        where: { id: body.previousLicenseId },
        include: {
          issue: {
            include: {
              party: {
                include: {
                  person: true,
                  organization: true,
                },
              },
            },
          },
        },
      });

      if (!existingLicense) {
        throw new Error("Previous license not found");
      }

      // 2. Mark the old license as renewed/inactive
      await tx.issue.update({
        where: { id: existingLicense.issueId },
        data: {
          status: "RENEWED",
          resolvedAt: new Date(),
        },
      });

      // 3. Create new issue (duplicating most data from the old one)
      const newIssue = await tx.issue.create({
        data: {
          id: `issue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          updatedAt: new Date(),
          issueType: existingLicense.issue.issueType, // Duplicate from old
          status: "active", // New status
          priority: existingLicense.issue.priority, // Duplicate from old
          partyId: existingLicense.issue.partyId, // Same party
          title:
            body.title ||
            `${existingLicense.licenseType} - ${existingLicense.licenseNumber} (Renewed)`,
          description: body.description || existingLicense.issue.description,
          dueDate: new Date(body.expirationDate), // New expiration date
        },
      });

      // 4. Create the new license issue (duplicating all data, updating only dates)
      const newLicenseIssue = await tx.license_issue.create({
        data: {
          issueId: newIssue.id,
          // Duplicate all existing license data
          licenseType: existingLicense.licenseType,
          licenseState: existingLicense.licenseState,
          licenseNumber: existingLicense.licenseNumber,
          certification: existingLicense.certification,
          endorsements: existingLicense.endorsements as any, // Keep existing endorsements
          restrictions: existingLicense.restrictions as any, // Keep existing restrictions
          notes: body.notes || existingLicense.notes, // Allow notes update
          // Update only the dates
          startDate: body.startDate ? new Date(body.startDate) : null,
          expirationDate: new Date(body.expirationDate),
          renewalDate: body.renewalDate ? new Date(body.renewalDate) : new Date(), // Default to today
        },
        include: {
          issue: {
            include: {
              party: {
                include: {
                  person: true,
                  organization: true,
                },
              },
            },
          },
        },
      });

      return newLicenseIssue;
    });

    return Response.json(result, { status: 201 });
  } catch (error) {
    console.error("Error renewing license:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
