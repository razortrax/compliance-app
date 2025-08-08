import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { createId } from "@paralleldrive/cuid2";
import { DrugAlcoholResult, DrugAlcoholReason, DrugAlcoholAgency } from "@prisma/client";

export interface DrugAlcoholIssueData {
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
  partyId: string;
  title: string;
  description?: string;
  priority?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const partyId = searchParams.get("partyId");

    if (!partyId) {
      return Response.json({ error: "partyId parameter is required" }, { status: 400 });
    }

    // Get drugalcohol issues for the party
    const drugAlcoholIssues = await db.drugalcohol_issue.findMany({
      where: {
        issue: {
          partyId: partyId,
        },
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
      orderBy: {
        createdAt: "desc",
      },
    });

    return Response.json(drugAlcoholIssues);
  } catch (error) {
    console.error("Error fetching drug alcohol issues:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: DrugAlcoholIssueData = await request.json();

    if (!body.partyId) {
      return Response.json({ error: "partyId is required" }, { status: 400 });
    }

    // Check if user has access to the party
    const party = await db.party.findUnique({
      where: { id: body.partyId },
      include: {
        person: true,
        organization: true,
        role: true,
      },
    });

    if (!party) {
      return Response.json({ error: "Party not found" }, { status: 404 });
    }

    // TODO: Implement full access control as in licenses
    // For now, allow basic access (same pattern as MVR/Physical)

    // Create the main issue
    const issue = await db.issue.create({
      data: {
        id: createId(),
        updatedAt: new Date(),
        issueType: "drugalcohol",
        status: "active",
        priority: body.priority || "medium",
        partyId: body.partyId,
        title: body.title || "Drug & Alcohol Test",
        description: body.description || "Drug and alcohol testing record",
      },
    });

    // Create the drugalcohol issue
    const drugAlcoholIssue = await db.drugalcohol_issue.create({
      data: {
        issueId: issue.id,
        result: body.result ? (body.result as DrugAlcoholResult) : undefined,
        substance: body.substance,
        lab: body.lab,
        accreditedBy: body.accreditedBy,
        notes: body.notes,
        reason: body.reason ? (body.reason as DrugAlcoholReason) : undefined,
        agency: body.agency ? (body.agency as DrugAlcoholAgency) : undefined,
        specimenNumber: body.specimenNumber,
        isDrug: body.isDrug ?? false,
        isAlcohol: body.isAlcohol ?? false,
        clinic: body.clinic,
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

    return Response.json(drugAlcoholIssue, { status: 201 });
  } catch (error) {
    console.error("Error creating drug alcohol issue:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
