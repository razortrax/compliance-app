import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { DrugAlcoholResult, DrugAlcoholReason, DrugAlcoholAgency } from "@prisma/client";

interface DrugAlcoholIssueUpdateData {
  result?: string;
  substance?: string;
  lab?: string;
  accreditedBy?: string;
  notes?: string;
  reason?: string;
  agency?: string;
  specimenNumber?: string;
  isDrug?: boolean;
  isAlcohol?: boolean;
  clinic?: any;
  title?: string;
  description?: string;
  priority?: string;
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const drugAlcoholIssue = await db.drugalcohol_issue.findUnique({
      where: { id: params.id },
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

    if (!drugAlcoholIssue) {
      return Response.json({ error: "Drug alcohol issue not found" }, { status: 404 });
    }

    // Access control check - support Master, Organization, and Location managers
    let hasAccess = false;
    const party = drugAlcoholIssue.issue.party;

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

        // 3. Check if user manages the same organization
        if (!hasAccess) {
          const userOrgRole = await db.role.findFirst({
            where: {
              party: { userId: userId },
              organizationId: driverRole.organizationId,
              isActive: true,
            },
          });

          if (userOrgRole) {
            hasAccess = true;
          }
        }

        // 4. Check if user manages the same location
        if (!hasAccess && driverRole.locationId) {
          const userLocationRole = await db.role.findFirst({
            where: {
              party: { userId: userId },
              locationId: driverRole.locationId,
              isActive: true,
            },
          });

          if (userLocationRole) {
            hasAccess = true;
          }
        }
      }
    }

    if (!hasAccess) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }

    return Response.json(drugAlcoholIssue);
  } catch (error) {
    console.error("Error fetching drug alcohol issue:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: DrugAlcoholIssueUpdateData = await request.json();

    // Get existing drugalcohol issue
    const existingDrugAlcoholIssue = await db.drugalcohol_issue.findUnique({
      where: { id: params.id },
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

    if (!existingDrugAlcoholIssue) {
      return Response.json({ error: "Drug alcohol issue not found" }, { status: 404 });
    }

    // Access control check - support Master, Organization, and Location managers
    let hasAccess = false;
    const party = existingDrugAlcoholIssue.issue.party;

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

        // 3. Check if user manages the same organization
        if (!hasAccess) {
          const userOrgRole = await db.role.findFirst({
            where: {
              party: { userId: userId },
              organizationId: driverRole.organizationId,
              isActive: true,
            },
          });

          if (userOrgRole) {
            hasAccess = true;
          }
        }

        // 4. Check if user manages the same location
        if (!hasAccess && driverRole.locationId) {
          const userLocationRole = await db.role.findFirst({
            where: {
              party: { userId: userId },
              locationId: driverRole.locationId,
              isActive: true,
            },
          });

          if (userLocationRole) {
            hasAccess = true;
          }
        }
      }
    }

    if (!hasAccess) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }

    // Update the main issue if needed
    if (body.title || body.description || body.priority) {
      await db.issue.update({
        where: { id: existingDrugAlcoholIssue.issueId },
        data: {
          ...(body.title && { title: body.title }),
          ...(body.description && { description: body.description }),
          ...(body.priority && { priority: body.priority }),
          updatedAt: new Date(),
        },
      });
    }

    // Update the drugalcohol issue
    const updatedDrugAlcoholIssue = await db.drugalcohol_issue.update({
      where: { id: params.id },
      data: {
        ...(body.result !== undefined && { result: body.result as DrugAlcoholResult }),
        ...(body.substance !== undefined && { substance: body.substance }),
        ...(body.lab !== undefined && { lab: body.lab }),
        ...(body.accreditedBy !== undefined && { accreditedBy: body.accreditedBy }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.reason !== undefined && { reason: body.reason as DrugAlcoholReason }),
        ...(body.agency !== undefined && { agency: body.agency as DrugAlcoholAgency }),
        ...(body.specimenNumber !== undefined && { specimenNumber: body.specimenNumber }),
        ...(body.isDrug !== undefined && { isDrug: body.isDrug }),
        ...(body.isAlcohol !== undefined && { isAlcohol: body.isAlcohol }),
        ...(body.clinic !== undefined && { clinic: body.clinic }),
        updatedAt: new Date(),
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

    return Response.json(updatedDrugAlcoholIssue);
  } catch (error) {
    console.error("Error updating drug alcohol issue:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get existing drugalcohol issue
    const existingDrugAlcoholIssue = await db.drugalcohol_issue.findUnique({
      where: { id: params.id },
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

    if (!existingDrugAlcoholIssue) {
      return Response.json({ error: "Drug alcohol issue not found" }, { status: 404 });
    }

    // Access control check - support Master, Organization, and Location managers
    let hasAccess = false;
    const party = existingDrugAlcoholIssue.issue.party;

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

        // 3. Check if user manages the same organization
        if (!hasAccess) {
          const userOrgRole = await db.role.findFirst({
            where: {
              party: { userId: userId },
              organizationId: driverRole.organizationId,
              isActive: true,
            },
          });

          if (userOrgRole) {
            hasAccess = true;
          }
        }

        // 4. Check if user manages the same location
        if (!hasAccess && driverRole.locationId) {
          const userLocationRole = await db.role.findFirst({
            where: {
              party: { userId: userId },
              locationId: driverRole.locationId,
              isActive: true,
            },
          });

          if (userLocationRole) {
            hasAccess = true;
          }
        }
      }
    }

    if (!hasAccess) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }

    // Soft delete by updating status to 'deleted'
    await db.issue.update({
      where: { id: existingDrugAlcoholIssue.issueId },
      data: {
        status: "deleted",
        updatedAt: new Date(),
      },
    });

    return Response.json({ message: "Drug alcohol issue deleted successfully" });
  } catch (error) {
    console.error("Error deleting drug alcohol issue:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
