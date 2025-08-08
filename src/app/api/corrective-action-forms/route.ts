import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { createId } from "@paralleldrive/cuid2";

// Generate unique CAF number
async function generateCAFNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await db.corrective_action_form.count({
    where: {
      cafNumber: {
        startsWith: `CAF-${year}-`,
      },
    },
  });

  return `CAF-${year}-${String(count + 1).padStart(4, "0")}`;
}

// Map violation types to CAF categories
function getCAFCategory(violationType: string): string {
  switch (violationType) {
    case "Driver":
      return "DRIVER_PERFORMANCE";
    case "Equipment":
      return "EQUIPMENT_MAINTENANCE";
    case "Company":
      return "COMPANY_OPERATIONS";
    default:
      return "OTHER";
  }
}

// Map incoming violation type to database enum value
function mapViolationTypeToEnum(violationType: string): string {
  switch (violationType) {
    case "Driver":
      return "Driver_Performance"; // Default driver violations to performance
    case "Equipment":
      return "Equipment";
    case "Company":
      return "Company";
    default:
      return "Company";
  }
}

// Create CAF
export async function POST(request: NextRequest) {
  try {
    const authResult = await auth();
    const userId = authResult.userId;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      incidentId,
      violationType,
      violationCodes,
      organizationId,
      assignedStaffId,
      title,
      description,
      priority = "MEDIUM",
      dueDate,
    } = body;

    // Validate required fields
    if (!incidentId || !violationType || !violationCodes || !organizationId) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: incidentId, violationType, violationCodes, organizationId",
        },
        { status: 400 },
      );
    }

    // Check user permissions - handle both Master and Organization users
    let currentUserContext = null;
    let canCreateCAFs = false;

    // First, check if user is a Master user
    const masterRole = await db.role.findFirst({
      where: {
        party: { userId },
        roleType: "master",
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

    if (masterRole) {
      // Master user - has broad permissions
      canCreateCAFs = true;
      currentUserContext = {
        type: "master",
        role: masterRole,
        name: `${masterRole.party.person?.firstName} ${masterRole.party.person?.lastName}`.trim(),
        canAssignCrossOrg: true,
      };
    } else {
      // Check if user is Organization staff with CAF permissions
      const staffRecord = await db.staff.findFirst({
        where: {
          party: { userId },
          canApproveCAFs: true,
        },
        include: {
          party: {
            include: {
              person: true,
            },
          },
        },
      });

      if (staffRecord) {
        canCreateCAFs = true;
        currentUserContext = {
          type: "organization",
          staff: staffRecord,
          name: `${staffRecord.party.person?.firstName} ${staffRecord.party.person?.lastName}`.trim(),
          canAssignCrossOrg: false,
        };
      }
    }

    if (!canCreateCAFs || !currentUserContext) {
      return NextResponse.json(
        {
          error:
            "User does not have CAF creation permissions. Must be either a Master user or Organization staff with CAF approval rights.",
        },
        { status: 403 },
      );
    }

    // Find assignable staff if not provided
    let staffToAssign = assignedStaffId;
    if (!staffToAssign) {
      if (currentUserContext.type === "master") {
        // Master user: Find appropriate staff in the target organization
        const orgStaff = await db.staff.findFirst({
          where: {
            party: {
              role: {
                some: {
                  organizationId,
                  isActive: true,
                },
              },
            },
            canApproveCAFs: true,
          },
        });

        if (orgStaff) {
          staffToAssign = orgStaff.id;
        } else {
          // No staff found in organization - we'll need to assign manually later
          staffToAssign = null;
        }
      } else {
        // Organization user: assign to themselves
        staffToAssign = currentUserContext.staff?.id || null;
      }
    }

    // Generate CAF
    const cafNumber = await generateCAFNumber();

    const caf = await db.corrective_action_form.create({
      data: {
        id: createId(),
        cafNumber,
        incidentId,
        violationType: mapViolationTypeToEnum(violationType) as any, // Cast to ViolationType enum
        violationCodes,
        violationSummary: `${violationType} violations: ${violationCodes.join(", ")}`,
        title,
        description,
        category: getCAFCategory(violationType) as any, // Cast to CafCategory enum
        priority,
        assignedStaffId: staffToAssign, // Can be null for Master users if no org staff found
        assignedBy: currentUserContext.staff?.id || null, // Null for Master users, or use staff ID if available
        organizationId,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: {
        assigned_staff: {
          include: {
            party: {
              include: {
                person: true,
              },
            },
          },
        },
        created_by_staff: {
          include: {
            party: {
              include: {
                person: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(caf);
  } catch (error) {
    console.error("Error creating CAF:", error);
    return NextResponse.json({ error: "Failed to create CAF" }, { status: 500 });
  }
}

// Get CAFs for an organization
export async function GET(request: NextRequest) {
  try {
    const authResult = await auth();
    const userId = authResult.userId;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");
    const incidentId = searchParams.get("incidentId");
    const status = searchParams.get("status");

    let whereClause: any = {};

    if (organizationId) {
      whereClause.organizationId = organizationId;
    }

    if (incidentId) {
      whereClause.incidentId = incidentId;
    }

    if (status) {
      whereClause.status = status;
    }

    // Only show active CAFs (latest versions)
    whereClause.isActive = true;

    const cafs = await db.corrective_action_form.findMany({
      where: whereClause,
      include: {
        assigned_staff: {
          include: {
            party: {
              include: {
                person: true,
              },
            },
          },
        },
        created_by_staff: {
          include: {
            party: {
              include: {
                person: true,
              },
            },
          },
        },
        organization: true, // Include organization data
        maintenance_issues: true,
        signatures: true,
        attachments: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(cafs);
  } catch (error) {
    console.error("Error fetching CAFs:", error);
    return NextResponse.json({ error: "Failed to fetch CAFs" }, { status: 500 });
  }
}
