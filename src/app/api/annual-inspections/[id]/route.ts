import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { captureAPIError } from "@/lib/sentry-utils";

interface AnnualInspectionUpdateData {
  inspectorName?: string;
  inspectionDate?: string;
  expirationDate?: string;
  result?: "Pass" | "Fail";
  status?: "Active" | "Inactive";
  notes?: string;
  title?: string;
  description?: string;
  priority?: string;
}

// GET /api/annual-inspections/[id] - Get specific annual inspection
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const inspectionId = params.id;

    const inspection = await db.annual_inspection_issue.findUnique({
      where: { id: inspectionId },
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

    if (!inspection) {
      return Response.json({ error: "Annual inspection not found" }, { status: 404 });
    }

    // Access control - check if user has permission to view this inspection
    let hasAccess = false;

    // Check direct ownership
    if (inspection.issue.party.userId === userId) {
      hasAccess = true;
    }

    // Check role-based access (Master, Organization, Location managers)
    if (!hasAccess) {
      const equipmentRole = await db.role.findFirst({
        where: {
          partyId: inspection.issue.partyId,
          isActive: true,
        },
      });

      if (equipmentRole) {
        // Check if user is Master consultant
        const userMasterOrg = await db.organization.findFirst({
          where: { party: { userId } },
        });

        if (userMasterOrg) {
          const masterRole = await db.role.findFirst({
            where: {
              roleType: "master",
              partyId: userMasterOrg.partyId,
              organizationId: equipmentRole.organizationId,
              isActive: true,
            },
          });
          if (masterRole) hasAccess = true;
        }

        // Check organization/location access
        if (!hasAccess) {
          const userRole = await db.role.findFirst({
            where: {
              party: { userId },
              OR: [
                { organizationId: equipmentRole.organizationId },
                { locationId: equipmentRole.locationId },
              ],
              isActive: true,
            },
          });
          if (userRole) hasAccess = true;
        }
      }
    }

    if (!hasAccess) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }

    return Response.json(inspection);
  } catch (error) {
    console.error("Error fetching annual inspection:", error);
    captureAPIError(error instanceof Error ? error : new Error("Unknown error"), {
      endpoint: `/api/annual-inspections/${params.id}`,
      method: "GET",
      userId: (await auth()).userId || "unknown",
    });
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/annual-inspections/[id] - Update annual inspection
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const inspectionId = params.id;
    const body: AnnualInspectionUpdateData = await request.json();

    // First, get the existing inspection to check access
    const existingInspection = await db.annual_inspection_issue.findUnique({
      where: { id: inspectionId },
      include: {
        issue: {
          include: {
            party: true,
          },
        },
      },
    });

    if (!existingInspection) {
      return Response.json({ error: "Annual inspection not found" }, { status: 404 });
    }

    // Access control - same logic as GET
    let hasAccess = false;

    if (existingInspection.issue.party.userId === userId) {
      hasAccess = true;
    }

    if (!hasAccess) {
      const equipmentRole = await db.role.findFirst({
        where: {
          partyId: existingInspection.issue.partyId,
          isActive: true,
        },
      });

      if (equipmentRole) {
        // Check Master access
        const userMasterOrg = await db.organization.findFirst({
          where: { party: { userId } },
        });

        if (userMasterOrg) {
          const masterRole = await db.role.findFirst({
            where: {
              roleType: "master",
              partyId: userMasterOrg.partyId,
              organizationId: equipmentRole.organizationId,
              isActive: true,
            },
          });
          if (masterRole) hasAccess = true;
        }

        // Check organization/location access
        if (!hasAccess) {
          const userRole = await db.role.findFirst({
            where: {
              party: { userId },
              OR: [
                { organizationId: equipmentRole.organizationId },
                { locationId: equipmentRole.locationId },
              ],
              isActive: true,
            },
          });
          if (userRole) hasAccess = true;
        }
      }
    }

    if (!hasAccess) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }

    // Update annual inspection in transaction
    const result = await db.$transaction(async (tx) => {
      // Prepare updates for annual_inspection_issue
      const inspectionUpdates: any = {};
      if (body.inspectorName !== undefined) inspectionUpdates.inspectorName = body.inspectorName;
      if (body.inspectionDate !== undefined)
        inspectionUpdates.inspectionDate = new Date(body.inspectionDate);
      if (body.expirationDate !== undefined)
        inspectionUpdates.expirationDate = new Date(body.expirationDate);
      if (body.result !== undefined) inspectionUpdates.result = body.result;
      if (body.status !== undefined) inspectionUpdates.status = body.status;
      if (body.notes !== undefined) inspectionUpdates.notes = body.notes;

      // Update annual_inspection_issue
      const updatedInspection = await tx.annual_inspection_issue.update({
        where: { id: inspectionId },
        data: {
          ...inspectionUpdates,
          updatedAt: new Date(),
        },
      });

      // Prepare updates for base issue
      const issueUpdates: any = {};
      if (body.title !== undefined) issueUpdates.title = body.title;
      if (body.description !== undefined) issueUpdates.description = body.description;
      if (body.priority !== undefined) issueUpdates.priority = body.priority;
      if (body.expirationDate !== undefined) issueUpdates.dueDate = new Date(body.expirationDate);

      // Update base issue if there are changes
      if (Object.keys(issueUpdates).length > 0) {
        await tx.issue.update({
          where: { id: existingInspection.issueId },
          data: {
            ...issueUpdates,
            updatedAt: new Date(),
          },
        });
      }

      // Return updated inspection with relations
      return await tx.annual_inspection_issue.findUnique({
        where: { id: inspectionId },
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
    });

    return Response.json(result);
  } catch (error) {
    console.error("Error updating annual inspection:", error);
    captureAPIError(error instanceof Error ? error : new Error("Unknown error"), {
      endpoint: `/api/annual-inspections/${params.id}`,
      method: "PUT",
      userId: (await auth()).userId || "unknown",
      extra: { inspectionId: params.id },
    });
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
