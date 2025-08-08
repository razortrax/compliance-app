import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { auth } from "@clerk/nextjs/server";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check for legacy data structures that might contain the RSIN
    const debugInfo: any = {
      unified_incidents: 0,
      legacy_data_found: {},
    };

    // Check unified incident table
    const incidents = await db.incident.findMany({
      where: { incidentType: "ROADSIDE_INSPECTION" },
      include: {
        issue: { select: { id: true, partyId: true, title: true } },
      },
    });
    debugInfo.unified_incidents = incidents.length;
    debugInfo.incident_details = incidents;

    // Check if there are any issues with issueType related to roadside inspections
    const roadsideIssues = await db.issue.findMany({
      where: {
        OR: [
          { issueType: { contains: "roadside" } },
          { issueType: { contains: "inspection" } },
          { issueType: { equals: "roadside_inspection" } },
        ],
      },
      include: {
        incident: true,
      },
    });
    debugInfo.legacy_roadside_issues = roadsideIssues.length;
    debugInfo.roadside_issue_details = roadsideIssues;

    // Check for orphaned issues that might be roadside inspections
    const orphanedIssues = await db.issue.findMany({
      where: {
        incident: null,
        issueType: {
          in: ["roadside_inspection", "roadside-inspection", "inspection"],
        },
      },
    });
    debugInfo.orphaned_issues = orphanedIssues.length;
    debugInfo.orphaned_issue_details = orphanedIssues;

    return NextResponse.json(debugInfo);
  } catch (error: unknown) {
    console.error("Error in legacy debug endpoint:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
