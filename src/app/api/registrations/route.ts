import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { createId } from "@paralleldrive/cuid2";
import { withApiError } from "@/lib/with-api-error";

// Define types for registration data
interface RegistrationIssueData {
  plateNumber: string;
  state: string;
  startDate: string;
  expirationDate: string;
  renewalDate?: string;
  status: "Active" | "Expired";
  notes?: string;
  partyId: string;
  title: string;
  description?: string;
  priority?: string;
}

// GET /api/registrations - List registrations with filtering
export const GET = withApiError("/api/registrations", async (request: NextRequest) => {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const partyId = searchParams.get("partyId");
  const state = searchParams.get("state");
  const status = searchParams.get("status");

  // Build where clause for filtering
  const where: any = {};

  if (partyId) {
    where.issue = { partyId };
  }

  if (state) {
    where.state = state;
  }

  if (status) {
    where.status = status;
  }

  // Access control - support Master, Organization, and Location managers
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
    // Master user - can see registrations for all organizations they manage
    const managedOrgs = await db.role.findMany({
      where: {
        roleType: "master",
        partyId: userMasterOrg.partyId,
        isActive: true,
      },
      select: { organizationId: true },
    });

    const managedOrgIds = managedOrgs.map((role) => role.organizationId).filter(Boolean);

    if (managedOrgIds.length > 0) {
      accessFilter = {
        issue: {
          party: {
            role: {
              some: {
                organizationId: { in: managedOrgIds },
                isActive: true,
              },
            },
          },
        },
      };
    }
  } else if (userRole) {
    // Organization or Location user
    if (userRole.organizationId) {
      accessFilter = {
        issue: {
          party: {
            role: {
              some: {
                organizationId: userRole.organizationId,
                isActive: true,
              },
            },
          },
        },
      };
    }
  } else {
    // Individual user - only their own registrations
    accessFilter = {
      issue: {
        partyId: {
          in: await db.party
            .findMany({
              where: { userId },
              select: { id: true },
            })
            .then((parties) => parties.map((p) => p.id)),
        },
      },
    };
  }

  const registrations = await db.registration_issue.findMany({
    where: {
      ...where,
      ...accessFilter,
    },
    include: {
      issue: {
        include: {
          party: {
            include: {
              equipment: true,
              person: true,
              organization: true,
            },
          },
        },
      },
    },
    orderBy: {
      expirationDate: "desc",
    },
  });

  return NextResponse.json({ registrations });
});

// POST /api/registrations - Create new registration
export const POST = withApiError("/api/registrations", async (request: NextRequest) => {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: RegistrationIssueData = await request.json();

  // Validate required fields
  if (
    !body.plateNumber ||
    !body.state ||
    !body.startDate ||
    !body.expirationDate ||
    !body.partyId
  ) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Check if user has access to the party (equipment)
  const party = await db.party.findUnique({
    where: { id: body.partyId },
    include: {
      equipment: true,
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
    return NextResponse.json({ error: "Party not found" }, { status: 404 });
  }

  // Access control check - support Master, Organization, and Location managers
  let hasAccess = false;

  // 1. Check direct ownership first
  if (party.userId === userId) {
    hasAccess = true;
  }

  if (!hasAccess) {
    // Get the equipment's role to find their organization
    const equipmentRole = await db.role.findFirst({
      where: {
        partyId: body.partyId,
        isActive: true,
      },
    });

    if (equipmentRole) {
      // 2. Check if user is a Master consultant who manages this organization
      const userMasterOrg = await db.organization.findFirst({
        where: {
          party: { userId: userId },
        },
      });

      if (userMasterOrg) {
        // Check if master org manages the equipment's organization
        const masterRole = await db.role.findFirst({
          where: {
            roleType: "master",
            partyId: userMasterOrg.partyId,
            organizationId: equipmentRole.organizationId,
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
            organizationId: equipmentRole.organizationId,
            roleType: { in: ["organization_manager", "owner", "consultant"] },
            isActive: true,
          },
        });

        if (orgManagerRole) {
          hasAccess = true;
        }
      }

      // 4. Check if user is a Location manager at the same location
      if (!hasAccess && equipmentRole.locationId) {
        const locationManagerRole = await db.role.findFirst({
          where: {
            party: { userId: userId },
            locationId: equipmentRole.locationId,
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
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // Create registration in transaction
  const result = await db.$transaction(async (tx) => {
    // Create the base issue
    const issue = await tx.issue.create({
      data: {
        id: createId(),
        issueType: "registration",
        status: "open",
        priority: body.priority || "medium",
        partyId: body.partyId,
        title: body.title,
        description: body.description,
        dueDate: new Date(body.expirationDate),
        updatedAt: new Date(),
      },
    });

    // Create the registration issue
    const registrationIssue = await tx.registration_issue.create({
      data: {
        issueId: issue.id,
        plateNumber: body.plateNumber,
        state: body.state,
        startDate: new Date(body.startDate),
        expirationDate: new Date(body.expirationDate),
        renewalDate: body.renewalDate ? new Date(body.renewalDate) : null,
        status: body.status || "Active",
        notes: body.notes,
      },
      include: {
        issue: {
          include: {
            party: {
              include: {
                equipment: true,
                organization: true,
              },
            },
          },
        },
      },
    });

    return registrationIssue;
  });

  return NextResponse.json(result, { status: 201 });
});
