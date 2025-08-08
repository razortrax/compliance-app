import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { createId } from "@paralleldrive/cuid2";
import {
  MvrType,
  MvrResult,
  MvrResultDach,
  MvrResultStatus,
  MvrCertification,
  MvrStatus,
} from "@prisma/client";

interface MvrRenewalData {
  previousMvrId: string; // Required: which MVR we're renewing
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

    const body: MvrRenewalData = await request.json();

    // Validate required fields
    if (!body.previousMvrId || !body.expirationDate) {
      return Response.json({ error: "Missing required fields for renewal" }, { status: 400 });
    }

    // Check if user has access to the party (get from existing MVR)
    const existingMvr = await db.mvr_issue.findUnique({
      where: { id: body.previousMvrId },
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

    if (!existingMvr) {
      return Response.json({ error: "MVR to renew not found" }, { status: 404 });
    }

    const party = existingMvr.issue.party;

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
      // 1. Fetch the existing MVR to get all current data
      const existingMvr = await tx.mvr_issue.findUnique({
        where: { id: body.previousMvrId },
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

      if (!existingMvr) {
        throw new Error("Previous MVR not found");
      }

      // 2. Mark the old MVR as renewed/inactive
      await tx.issue.update({
        where: { id: existingMvr.issueId },
        data: {
          status: "RENEWED",
          resolvedAt: new Date(),
        },
      });

      // 3. Create new issue (minimal data, no duplication like license)
      const newIssue = await tx.issue.create({
        data: {
          id: createId(),
          updatedAt: new Date(),
          issueType: "mvr",
          status: "active",
          priority: "medium", // Default priority for new MVR
          partyId: existingMvr.issue.partyId,
          title: body.title || `MVR - ${existingMvr.state} (Renewed)`,
          description: body.description || `Renewed MVR record for ${existingMvr.state}`,
          dueDate: new Date(body.expirationDate),
        },
      });

      // 4. Create the new MVR issue (minimal data, no duplication)
      const newMvrIssue = await tx.mvr_issue.create({
        data: {
          issueId: newIssue.id,
          // Only copy essential fields, don't duplicate changeable data
          state: existingMvr.state, // Keep the same state
          violationsCount: 0, // Reset violations count
          cleanRecord: true, // Assume clean until updated
          notes: body.notes || null, // Allow notes update or clear
          // Set dates
          startDate: body.startDate
            ? new Date(body.startDate)
            : existingMvr.expirationDate || new Date(),
          expirationDate: new Date(body.expirationDate),
          renewalDate: body.renewalDate ? new Date(body.renewalDate) : new Date(), // Default to today
          // Leave other fields null/default for new review
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

      return newMvrIssue;
    });

    return Response.json(result, { status: 201 });
  } catch (error) {
    console.error("Error renewing MVR:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
