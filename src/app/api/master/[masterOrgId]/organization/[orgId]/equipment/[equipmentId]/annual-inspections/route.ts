import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { captureAPIError } from "@/lib/sentry-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: { masterOrgId: string; orgId: string; equipmentId: string } },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { masterOrgId, orgId, equipmentId } = params;

    // Debug logging
    console.log("🔍 Fetching annual inspections for equipment:", {
      masterOrgId,
      orgId,
      equipmentId,
      userId,
    });

    // Get equipment with party info
    const equipment = await db.equipment.findUnique({
      where: { id: equipmentId },
      include: {
        party: true,
      },
    });

    if (!equipment) {
      console.log("❌ Equipment not found:", equipmentId);
      return NextResponse.json({ error: "Equipment not found" }, { status: 404 });
    }

    console.log("✅ Equipment found:", {
      equipmentId: equipment.id,
      partyId: equipment.partyId,
      make: equipment.make,
      model: equipment.model,
    });

    // Get annual inspections for this equipment
    const inspections = await db.annual_inspection_issue.findMany({
      where: {
        issue: {
          partyId: equipment.partyId,
        },
      },
      include: {
        issue: {
          include: {
            party: {
              include: {
                equipment: true,
              },
            },
          },
        },
      },
      orderBy: {
        expirationDate: "desc",
      },
    });

    console.log("📋 Found annual inspections:", {
      count: inspections.length,
      inspectionIds: inspections.map((i: any) => i.id),
    });

    // Get organization data
    const organization = await db.organization.findUnique({
      where: { id: orgId },
      include: {
        party: true,
      },
    });

    if (!organization) {
      console.log("❌ Organization not found:", orgId);
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Get master organization data
    const masterOrg = await db.organization.findUnique({
      where: { id: masterOrgId },
      include: {
        party: true,
      },
    });

    if (!masterOrg) {
      console.log("❌ Master organization not found:", masterOrgId);
      return NextResponse.json({ error: "Master organization not found" }, { status: 404 });
    }

    const responseData = {
      inspections: inspections.map((inspection: any) => ({
        id: inspection.id,
        inspectorName: inspection.inspectorName,
        inspectionDate: inspection.inspectionDate.toISOString(),
        expirationDate: inspection.expirationDate.toISOString(),
        result: inspection.result,
        status: inspection.status,
        notes: inspection.notes,
        issue: {
          id: inspection.issue.id,
          title: inspection.issue.title,
          description: inspection.issue.description,
          status: inspection.issue.status,
          priority: inspection.issue.priority,
        },
      })),
      equipment: {
        id: equipment.id,
        make: equipment.make,
        model: equipment.model,
        year: equipment.year,
      },
      organization: {
        id: organization.id,
        name: organization.name,
      },
      masterOrg: {
        id: masterOrg.id,
        name: masterOrg.name,
      },
    };

    console.log("📤 Returning response data:", {
      inspectionCount: responseData.inspections.length,
      equipmentInfo: `${responseData.equipment.make} ${responseData.equipment.model}`,
      orgName: responseData.organization.name,
    });

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("❌ Error in annual inspections API:", error);
    captureAPIError(error instanceof Error ? error : new Error("Unknown error"), {
      endpoint: `/api/master/${params.masterOrgId}/organization/${params.orgId}/equipment/${params.equipmentId}/annual-inspections`,
      method: "GET",
      userId: (await auth()).userId || "unknown",
      extra: {
        masterOrgId: params.masterOrgId,
        orgId: params.orgId,
        equipmentId: params.equipmentId,
      },
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
