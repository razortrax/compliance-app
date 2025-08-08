import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { auth } from "@clerk/nextjs/server";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const incidentType = url.searchParams.get("type");

    // Get all incidents with detailed info
    const incidents = await db.incident.findMany({
      where: incidentType ? { incidentType: incidentType as any } : {},
      include: {
        issue: {
          select: {
            id: true,
            partyId: true,
            title: true,
            status: true,
            issueType: true,
            createdAt: true,
          },
        },
        equipment: {
          select: {
            id: true,
            unitNumber: true,
            equipmentId: true,
            make: true,
            model: true,
          },
        },
        violations: {
          select: {
            id: true,
            violationCode: true,
            description: true,
            outOfService: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Also get party info to understand the relationships
    const partyIds = incidents.map((i) => i.issue.partyId).filter(Boolean);
    const parties = await db.party.findMany({
      where: { id: { in: partyIds } },
      include: {
        organization: { select: { id: true, name: true } },
        person: { select: { id: true, firstName: true, lastName: true } },
        equipment: { select: { id: true, make: true, model: true } },
      },
    });

    const debugInfo = {
      totalIncidents: incidents.length,
      incidents: incidents.map((incident) => ({
        id: incident.id,
        incidentType: incident.incidentType,
        incidentDate: incident.incidentDate,
        officerName: incident.officerName,
        issue: incident.issue,
        equipmentCount: incident.equipment.length,
        violationsCount: incident.violations.length,
      })),
      parties: parties.map((party) => ({
        id: party.id,
        userId: party.userId,
        organization: party.organization?.name,
        person: party.person ? `${party.person.firstName} ${party.person.lastName}` : null,
        equipment: party.equipment ? `${party.equipment.make} ${party.equipment.model}` : null,
      })),
    };

    return NextResponse.json(debugInfo);
  } catch (error: unknown) {
    console.error("Error in debug endpoint:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
