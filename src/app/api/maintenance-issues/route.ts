import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { createId } from "@paralleldrive/cuid2";
import {
  MaintenanceType,
  MaintenanceSourceType,
  MaintenanceStatus,
  MaintenanceResult,
  MaintenancePriority,
  MaintenanceInterval,
} from "@prisma/client";

// Define types for maintenance issue data
export interface MaintenanceIssueData {
  maintenanceType: MaintenanceType;
  sourceType: MaintenanceSourceType;
  sourceId?: string;
  dueDate: string;
  completedDate?: string;
  scheduledDate?: string;
  intervalDays?: number;
  intervalMiles?: number;
  abScheduleItemId?: string;
  abScheduleCode?: string;
  currentMileage?: number;
  mileageAtDue?: number;
  lastServiceDate?: string;
  lastServiceMiles?: number;
  technicianName?: string;
  technicianCert?: string;
  facilityName?: string;
  facilityAddress?: string;
  workDescription: string;
  partsUsed?: object;
  laborHours?: number;
  status?: MaintenanceStatus;
  result?: MaintenanceResult;
  priority?: MaintenancePriority;
  dotCompliant?: boolean;
  warrantyWork?: boolean;
  costEstimate?: number;
  actualCost?: number;
  defectsFound?: object;
  correctiveActions?: object;
  followUpRequired?: boolean;
  followUpDate?: string;
  notes?: string;
  reminderSent?: boolean;
  reminderDate?: string;
  partyId: string;
  title: string;
  description?: string;
}

// GET /api/maintenance-issues - List maintenance issues with filtering
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const partyId = searchParams.get("partyId");
    const equipmentId = searchParams.get("equipmentId");
    const maintenanceType = searchParams.get("maintenanceType");
    const sourceType = searchParams.get("sourceType");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const overdue = searchParams.get("overdue");

    // Build where clause for filtering
    const where: any = {};

    if (partyId) {
      where.issue = { partyId };
    }

    if (equipmentId) {
      where.issue = {
        ...where.issue,
        party: {
          equipment: {
            some: { id: equipmentId },
          },
        },
      };
    }

    if (maintenanceType) {
      where.maintenanceType = maintenanceType;
    }

    if (sourceType) {
      where.sourceType = sourceType;
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (overdue === "true") {
      where.status = { in: ["SCHEDULED", "OVERDUE"] };
      where.dueDate = { lt: new Date() };
    }

    const maintenanceIssues = await db.maintenance_issue.findMany({
      where,
      include: {
        issue: {
          include: {
            party: {
              include: {
                equipment: {
                  select: {
                    id: true,
                    make: true,
                    model: true,
                    year: true,
                    vin: true,
                  },
                },
                person: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
            attachments: {
              select: {
                id: true,
                fileName: true,
                fileType: true,
                createdAt: true,
              },
            },
          },
        },
        abScheduleItem: {
          select: {
            id: true,
            itemCode: true,
            itemDescription: true,
            intervalDays: true,
            intervalMiles: true,
            category: true,
            component: true,
          },
        },
      },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }],
    });

    return Response.json(maintenanceIssues);
  } catch (error) {
    console.error("Error fetching maintenance issues:", error);
    return Response.json({ error: "Failed to fetch maintenance issues" }, { status: 500 });
  }
}

// POST /api/maintenance-issues - Create new maintenance issue
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data: MaintenanceIssueData = await request.json();

    // Validate required fields
    if (
      !data.partyId ||
      !data.maintenanceType ||
      !data.sourceType ||
      !data.dueDate ||
      !data.workDescription
    ) {
      return Response.json(
        {
          error:
            "Missing required fields: partyId, maintenanceType, sourceType, dueDate, workDescription",
        },
        { status: 400 },
      );
    }

    const result = await db.$transaction(async (tx) => {
      // Create the base issue first
      const issue = await tx.issue.create({
        data: {
          id: createId(),
          issueType: "maintenance",
          title: data.title,
          description:
            data.description || `${data.maintenanceType} maintenance: ${data.workDescription}`,
          status: "open",
          priority: data.priority?.toLowerCase() || "routine",
          partyId: data.partyId,
          dueDate: new Date(data.dueDate),
          updatedAt: new Date(),
        },
      });

      // Create the maintenance issue
      const maintenanceIssue = await tx.maintenance_issue.create({
        data: {
          id: createId(),
          issueId: issue.id,
          maintenanceType: data.maintenanceType,
          sourceType: data.sourceType,
          sourceId: data.sourceId || null,
          dueDate: new Date(data.dueDate),
          completedDate: data.completedDate ? new Date(data.completedDate) : null,
          scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : null,
          intervalDays: data.intervalDays || null,
          intervalMiles: data.intervalMiles || null,
          abScheduleItemId: data.abScheduleItemId || null,
          abScheduleCode: data.abScheduleCode || null,
          currentMileage: data.currentMileage || null,
          mileageAtDue: data.mileageAtDue || null,
          lastServiceDate: data.lastServiceDate ? new Date(data.lastServiceDate) : null,
          lastServiceMiles: data.lastServiceMiles || null,
          technicianName: data.technicianName || null,
          technicianCert: data.technicianCert || null,
          facilityName: data.facilityName || null,
          facilityAddress: data.facilityAddress || null,
          workDescription: data.workDescription,
          partsUsed: data.partsUsed as any,
          laborHours: data.laborHours || null,
          status: data.status || "SCHEDULED",
          result: data.result || null,
          priority: data.priority || "ROUTINE",
          dotCompliant: data.dotCompliant !== false,
          warrantyWork: data.warrantyWork || false,
          costEstimate: data.costEstimate || null,
          actualCost: data.actualCost || null,
          defectsFound: data.defectsFound as any,
          correctiveActions: data.correctiveActions as any,
          followUpRequired: data.followUpRequired || false,
          followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
          notes: data.notes || null,
          reminderSent: data.reminderSent || false,
          reminderDate: data.reminderDate ? new Date(data.reminderDate) : null,
        },
      });

      return { issue, maintenanceIssue };
    });

    return Response.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating maintenance issue:", error);
    return Response.json({ error: "Failed to create maintenance issue" }, { status: 500 });
  }
}

// PUT /api/maintenance-issues - Update maintenance issue
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data: MaintenanceIssueData & { id: string } = await request.json();

    // Validate required fields
    if (!data.id) {
      return Response.json({ error: "Missing required field: id" }, { status: 400 });
    }

    const result = await db.$transaction(async (tx) => {
      // Update the base issue
      const issue = await tx.issue.update({
        where: { id: data.id },
        data: {
          title: data.title,
          description:
            data.description || `${data.maintenanceType} maintenance: ${data.workDescription}`,
          priority: data.priority?.toLowerCase() || "routine",
          dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
          updatedAt: new Date(),
        },
      });

      // Update the maintenance issue
      const maintenanceIssue = await tx.maintenance_issue.update({
        where: { issueId: data.id },
        data: {
          maintenanceType: data.maintenanceType,
          sourceType: data.sourceType,
          sourceId: data.sourceId || null,
          dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
          completedDate: data.completedDate ? new Date(data.completedDate) : null,
          scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : null,
          intervalDays: data.intervalDays || null,
          intervalMiles: data.intervalMiles || null,
          abScheduleItemId: data.abScheduleItemId || null,
          abScheduleCode: data.abScheduleCode || null,
          currentMileage: data.currentMileage || null,
          mileageAtDue: data.mileageAtDue || null,
          lastServiceDate: data.lastServiceDate ? new Date(data.lastServiceDate) : null,
          lastServiceMiles: data.lastServiceMiles || null,
          technicianName: data.technicianName || null,
          technicianCert: data.technicianCert || null,
          facilityName: data.facilityName || null,
          facilityAddress: data.facilityAddress || null,
          workDescription: data.workDescription,
          partsUsed: data.partsUsed as any,
          laborHours: data.laborHours || null,
          status: data.status || "SCHEDULED",
          result: data.result || null,
          priority: data.priority || "ROUTINE",
          dotCompliant: data.dotCompliant !== false,
          warrantyWork: data.warrantyWork || false,
          costEstimate: data.costEstimate || null,
          actualCost: data.actualCost || null,
          defectsFound: data.defectsFound as any,
          correctiveActions: data.correctiveActions as any,
          followUpRequired: data.followUpRequired || false,
          followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
          notes: data.notes || null,
          reminderSent: data.reminderSent || false,
          reminderDate: data.reminderDate ? new Date(data.reminderDate) : null,
        },
      });

      return { issue, maintenanceIssue };
    });

    return Response.json(result);
  } catch (error) {
    console.error("Error updating maintenance issue:", error);
    return Response.json({ error: "Failed to update maintenance issue" }, { status: 500 });
  }
}

// DELETE /api/maintenance-issues - Delete maintenance issue
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return Response.json({ error: "Missing required parameter: id" }, { status: 400 });
    }

    await db.$transaction(async (tx) => {
      // Delete the maintenance issue first
      await tx.maintenance_issue.delete({
        where: { issueId: id },
      });

      // Then delete the base issue
      await tx.issue.delete({
        where: { id },
      });
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting maintenance issue:", error);
    return Response.json({ error: "Failed to delete maintenance issue" }, { status: 500 });
  }
}
