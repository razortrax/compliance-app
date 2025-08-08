import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";

function createId() {
  return `training_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

interface TrainingIssueData {
  trainingType: string;
  provider?: string;
  instructor?: string;
  location?: string;
  startDate?: string;
  completionDate: string;
  expirationDate: string;
  certificateNumber?: string;
  hours?: number;
  isRequired?: boolean;
  competencies?: any[];
  notes?: string;
  partyId?: string; // Optional - will be resolved from personId if not provided
  personId?: string; // Accept person ID and resolve to party ID
  title: string;
  description?: string;
  priority?: string;
}

// GET /api/trainings - List training records
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get("driverId");
    const status = searchParams.get("status");

    // Build where clause for filtering
    const where: any = {};

    // If driverId is provided, convert it to partyId filter
    if (driverId) {
      // First get the driver to find their partyId
      const driver = await db.person.findUnique({
        where: { id: driverId },
        select: { partyId: true },
      });

      if (driver) {
        where.issue = { partyId: driver.partyId };
      } else {
        // Driver not found, return empty result
        return Response.json([]);
      }
    }

    // Access control - support Master, Organization, and Location managers (same as licenses)
    let accessFilter = {};

    // Get user's role to determine access
    const userRole = await db.role.findFirst({
      where: {
        party: { userId },
        isActive: true,
      },
    });

    // Get user's master organization first
    const userMasterOrg = await db.organization.findFirst({
      where: {
        party: { userId: userId },
      },
    });

    if (userMasterOrg) {
      // Master user - can see trainings for all organizations they manage
      const managedOrgs = await db.role.findMany({
        where: {
          roleType: "master",
          partyId: userMasterOrg.partyId,
          isActive: true,
        },
        select: { organizationId: true },
      });

      const allManagedOrgIds = [
        userMasterOrg.id,
        ...(managedOrgs.map((r) => r.organizationId).filter(Boolean) as string[]),
      ];

      accessFilter = {
        issue: {
          party: {
            OR: [
              // Personal trainings
              { userId },
              // Trainings for people in organizations they manage
              {
                role: {
                  some: {
                    organizationId: { in: allManagedOrgIds },
                    isActive: true,
                  },
                },
              },
              // Organization trainings for orgs they manage
              {
                organization: {
                  id: { in: allManagedOrgIds },
                },
              },
            ],
          },
        },
      };
    } else if (userRole) {
      // Check if user has organization or location management roles
      const userOrgIds: string[] = [];
      const userLocationIds: string[] = [];

      // Get all organizations where user is a manager or consultant
      const orgRoles = await db.role.findMany({
        where: {
          party: { userId },
          roleType: { in: ["organization_manager", "owner", "consultant"] },
          isActive: true,
        },
        select: { organizationId: true },
      });
      userOrgIds.push(...(orgRoles.map((r) => r.organizationId).filter(Boolean) as string[]));

      // Get all locations where user is a manager
      const locationRoles = await db.role.findMany({
        where: {
          party: { userId },
          roleType: "location_manager",
          isActive: true,
        },
        select: { locationId: true },
      });
      userLocationIds.push(...(locationRoles.map((r) => r.locationId).filter(Boolean) as string[]));

      // Add user's direct organization if they have a role
      if (userRole.organizationId) {
        userOrgIds.push(userRole.organizationId);
      }

      accessFilter = {
        issue: {
          party: {
            OR: [
              // Personal trainings
              { userId },
              // Trainings for people in organizations they manage
              userOrgIds.length > 0 && {
                role: {
                  some: {
                    organizationId: { in: userOrgIds },
                    isActive: true,
                  },
                },
              },
              // Trainings for people at locations they manage
              userLocationIds.length > 0 && {
                role: {
                  some: {
                    locationId: { in: userLocationIds },
                    isActive: true,
                  },
                },
              },
              // Organization trainings for orgs they manage
              userOrgIds.length > 0 && {
                organization: {
                  id: { in: userOrgIds },
                },
              },
            ].filter(Boolean), // Remove any false values
          },
        },
      };
    } else {
      // No role found - only their personal trainings
      accessFilter = {
        issue: {
          party: { userId },
        },
      };
    }

    // Combine filters (exact same pattern as licenses)
    const finalWhere = { ...where, ...accessFilter };

    const trainings = await db.training_issue.findMany({
      where: finalWhere,
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
      orderBy: [{ expirationDate: "asc" }, { createdAt: "desc" }],
    });

    // Add calculated status similar to licenses
    const trainingsWithStatus = trainings.map((training) => {
      const today = new Date();

      // Handle training without expiration date (voluntary training)
      if (!training.expirationDate) {
        return {
          ...training,
          calculatedStatus: "current",
          daysUntilExpiry: null,
        };
      }

      const expirationDate = new Date(training.expirationDate);
      const daysUntilExpiry = Math.ceil(
        (expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );

      let calculatedStatus = "current";
      if (daysUntilExpiry < 0) {
        calculatedStatus = "expired";
      } else if (daysUntilExpiry <= 15) {
        calculatedStatus = "critical";
      } else if (daysUntilExpiry <= 30) {
        calculatedStatus = "warning";
      }

      return {
        ...training,
        calculatedStatus,
        daysUntilExpiry,
      };
    });

    // Filter by status if requested
    let filteredTrainings = trainingsWithStatus;
    if (status) {
      filteredTrainings = trainingsWithStatus.filter(
        (training) => training.calculatedStatus === status,
      );
    }

    return Response.json(filteredTrainings);
  } catch (error) {
    console.error("Error fetching trainings:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/trainings - Create new training
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: TrainingIssueData = await request.json();

    // Validate required fields
    if (!body.trainingType || !body.completionDate || (!body.partyId && !body.personId)) {
      return Response.json(
        {
          error:
            "Missing required fields (need trainingType, completionDate, and either partyId or personId)",
        },
        { status: 400 },
      );
    }

    // Resolve personId to partyId if needed
    let resolvedPartyId = body.partyId;

    if (!resolvedPartyId && body.personId) {
      const person = await db.person.findUnique({
        where: { id: body.personId },
        select: { partyId: true },
      });

      if (!person) {
        return Response.json({ error: "Person not found" }, { status: 404 });
      }

      resolvedPartyId = person.partyId;
    }

    // Check if user has access to the party (same logic as licenses)
    const party = await db.party.findUnique({
      where: { id: resolvedPartyId! },
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
    });

    if (!party) {
      return Response.json({ error: "Party not found" }, { status: 404 });
    }

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
          partyId: resolvedPartyId!,
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

    // Create training in transaction
    const result = await db.$transaction(async (tx) => {
      // Create the base issue
      const issue = await tx.issue.create({
        data: {
          id: createId(),
          issueType: "training",
          status: "active",
          priority: body.priority || "medium",
          partyId: resolvedPartyId!,
          title: body.title,
          description: body.description,
          dueDate: body.expirationDate ? new Date(body.expirationDate) : null,
          updatedAt: new Date(),
        },
      });

      // Create the training issue
      const trainingIssue = await tx.training_issue.create({
        data: {
          issueId: issue.id,
          trainingType: body.trainingType,
          provider: body.provider,
          instructor: body.instructor,
          location: body.location,
          startDate: body.startDate ? new Date(body.startDate) : null,
          completionDate: new Date(body.completionDate),
          expirationDate: body.expirationDate ? new Date(body.expirationDate) : null,
          certificateNumber: body.certificateNumber,
          hours: body.hours,
          isRequired: body.isRequired || false,
          competencies: (body.competencies || []) as any,
          notes: body.notes,
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

      return trainingIssue;
    });

    return Response.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating training:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
