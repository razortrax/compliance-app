import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import {
  MaintenanceType,
  MaintenanceSourceType,
  MaintenanceStatus,
  MaintenanceResult,
  MaintenancePriority,
} from "@prisma/client";

interface MaintenanceIssueUpdateData {
  maintenanceType?: MaintenanceType;
  sourceType?: MaintenanceSourceType;
  sourceId?: string;
  dueDate?: string;
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
  workDescription?: string;
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
  title?: string;
  description?: string;
}

// GET /api/maintenance-issues/[id] - Get specific maintenance issue
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const maintenanceIssue = await db.maintenance_issue.findUnique({
      where: { id: params.id },
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
                    vehicleTypeId: true,
                    categoryId: true,
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
              orderBy: { createdAt: "desc" },
            },
            activity_logs: {
              orderBy: { createdAt: "desc" },
              take: 10,
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
            intervalType: true,
            category: true,
            component: true,
            taskType: true,
            estimatedHours: true,
            estimatedCost: true,
            dotRequired: true,
            priority: true,
            safetyRelated: true,
          },
        },
      },
    });

    if (!maintenanceIssue) {
      return Response.json({ error: "Maintenance issue not found" }, { status: 404 });
    }

    return Response.json(maintenanceIssue);
  } catch (error) {
    console.error("Error fetching maintenance issue:", error);
    return Response.json({ error: "Failed to fetch maintenance issue" }, { status: 500 });
  }
}

// PUT /api/maintenance-issues/[id] - Update maintenance issue
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data: MaintenanceIssueUpdateData = await request.json();

    const result = await db.$transaction(async (tx) => {
      // Update the base issue if title/description changed
      const issueUpdateData: any = {};
      if (data.title !== undefined) issueUpdateData.title = data.title;
      if (data.description !== undefined) issueUpdateData.description = data.description;

      // Update status based on maintenance status
      if (data.status) {
        if (data.status === "COMPLETED") {
          issueUpdateData.status = "closed";
          issueUpdateData.resolvedAt = new Date();
        } else if (data.status === "CANCELLED") {
          issueUpdateData.status = "cancelled";
        } else {
          issueUpdateData.status = "open";
        }
      }

      if (Object.keys(issueUpdateData).length > 0) {
        issueUpdateData.updatedAt = new Date();

        await tx.issue.update({
          where: {
            id: (
              await tx.maintenance_issue.findUnique({
                where: { id: params.id },
                select: { issueId: true },
              })
            )?.issueId,
          },
          data: issueUpdateData,
        });
      }

      // Update the maintenance issue
      const updateData: any = {};

      // Only update fields that are provided
      if (data.maintenanceType !== undefined) updateData.maintenanceType = data.maintenanceType;
      if (data.sourceType !== undefined) updateData.sourceType = data.sourceType;
      if (data.sourceId !== undefined) updateData.sourceId = data.sourceId;
      if (data.dueDate !== undefined) updateData.dueDate = new Date(data.dueDate);
      if (data.completedDate !== undefined)
        updateData.completedDate = data.completedDate ? new Date(data.completedDate) : null;
      if (data.scheduledDate !== undefined)
        updateData.scheduledDate = data.scheduledDate ? new Date(data.scheduledDate) : null;
      if (data.intervalDays !== undefined) updateData.intervalDays = data.intervalDays;
      if (data.intervalMiles !== undefined) updateData.intervalMiles = data.intervalMiles;
      if (data.abScheduleItemId !== undefined) updateData.abScheduleItemId = data.abScheduleItemId;
      if (data.abScheduleCode !== undefined) updateData.abScheduleCode = data.abScheduleCode;
      if (data.currentMileage !== undefined) updateData.currentMileage = data.currentMileage;
      if (data.mileageAtDue !== undefined) updateData.mileageAtDue = data.mileageAtDue;
      if (data.lastServiceDate !== undefined)
        updateData.lastServiceDate = data.lastServiceDate ? new Date(data.lastServiceDate) : null;
      if (data.lastServiceMiles !== undefined) updateData.lastServiceMiles = data.lastServiceMiles;
      if (data.technicianName !== undefined) updateData.technicianName = data.technicianName;
      if (data.technicianCert !== undefined) updateData.technicianCert = data.technicianCert;
      if (data.facilityName !== undefined) updateData.facilityName = data.facilityName;
      if (data.facilityAddress !== undefined) updateData.facilityAddress = data.facilityAddress;
      if (data.workDescription !== undefined) updateData.workDescription = data.workDescription;
      if (data.partsUsed !== undefined) updateData.partsUsed = data.partsUsed as any;
      if (data.laborHours !== undefined) updateData.laborHours = data.laborHours;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.result !== undefined) updateData.result = data.result;
      if (data.priority !== undefined) updateData.priority = data.priority;
      if (data.dotCompliant !== undefined) updateData.dotCompliant = data.dotCompliant;
      if (data.warrantyWork !== undefined) updateData.warrantyWork = data.warrantyWork;
      if (data.costEstimate !== undefined) updateData.costEstimate = data.costEstimate;
      if (data.actualCost !== undefined) updateData.actualCost = data.actualCost;
      if (data.defectsFound !== undefined) updateData.defectsFound = data.defectsFound as any;
      if (data.correctiveActions !== undefined)
        updateData.correctiveActions = data.correctiveActions as any;
      if (data.followUpRequired !== undefined) updateData.followUpRequired = data.followUpRequired;
      if (data.followUpDate !== undefined)
        updateData.followUpDate = data.followUpDate ? new Date(data.followUpDate) : null;
      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.reminderSent !== undefined) updateData.reminderSent = data.reminderSent;
      if (data.reminderDate !== undefined)
        updateData.reminderDate = data.reminderDate ? new Date(data.reminderDate) : null;

      updateData.updatedAt = new Date();

      const maintenanceIssue = await tx.maintenance_issue.update({
        where: { id: params.id },
        data: updateData,
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
                },
              },
            },
          },
        },
      });

      return maintenanceIssue;
    });

    return Response.json(result);
  } catch (error) {
    console.error("Error updating maintenance issue:", error);
    return Response.json({ error: "Failed to update maintenance issue" }, { status: 500 });
  }
}

// DELETE /api/maintenance-issues/[id] - Delete maintenance issue
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await db.$transaction(async (tx) => {
      // Get the maintenance issue to find the related issue
      const maintenanceIssue = await tx.maintenance_issue.findUnique({
        where: { id: params.id },
        select: { issueId: true },
      });

      if (!maintenanceIssue) {
        throw new Error("Maintenance issue not found");
      }

      // Delete maintenance issue (will cascade due to foreign key relationship)
      await tx.maintenance_issue.delete({
        where: { id: params.id },
      });

      // Delete the base issue (will cascade to attachments and activity logs)
      await tx.issue.delete({
        where: { id: maintenanceIssue.issueId },
      });
    });

    return Response.json({ message: "Maintenance issue deleted successfully" });
  } catch (error) {
    console.error("Error deleting maintenance issue:", error);
    return Response.json({ error: "Failed to delete maintenance issue" }, { status: 500 });
  }
}
