import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { createId } from "@paralleldrive/cuid2";
import { PhysicalType, PhysicalResult, PhysicalStatus } from "@prisma/client";

// Define types for Physical data
export interface PhysicalIssueData {
  type: string;
  medicalExaminer?: string;
  selfCertified?: boolean;
  nationalRegistry?: boolean;
  result?: string;
  status?: string;
  startDate?: string;
  expirationDate?: string;
  outOfServiceDate?: string;
  backInServiceDate?: string;
  partyId: string;
  title: string;
  description?: string;
  priority?: string;
}

// GET /api/physical_issues - List Physical issues with filtering
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const partyId = searchParams.get("partyId");
    const type = searchParams.get("type");
    const status = searchParams.get("status");

    // Build where clause for filtering
    const where: any = {};
    if (partyId) {
      where.issue = { partyId };
    }
    if (type) {
      where.type = type;
    }
    if (status) {
      where.status = status;
    }

    const physicalIssues = await db.physical_issue.findMany({
      where,
      include: {
        issue: true,
      },
      orderBy: {
        expirationDate: "asc",
      },
    });

    return Response.json(physicalIssues);
  } catch (error) {
    console.error("Error fetching physical issues:", error);
    return Response.json({ error: "Failed to fetch physical issues" }, { status: 500 });
  }
}

// POST /api/physical_issues - Create new Physical issue
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: PhysicalIssueData = await request.json();

    // Validate required fields
    if (!body.type || !body.partyId || !body.title) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
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

    // Create the base issue record
    const issue = await db.issue.create({
      data: {
        id: createId(),
        issueType: "physical",
        status: body.status || "open",
        priority: body.priority || "medium",
        partyId: body.partyId,
        title: body.title,
        description: body.description,
        updatedAt: new Date(),
      },
    });

    // Create the physical_issue record
    const physicalIssue = await db.physical_issue.create({
      data: {
        issueId: issue.id,
        type: body.type as PhysicalType,
        medicalExaminer: body.medicalExaminer,
        selfCertified: body.selfCertified ?? false,
        nationalRegistry: body.nationalRegistry ?? false,
        result: body.result ? (body.result as PhysicalResult) : undefined,
        status: body.status ? (body.status as PhysicalStatus) : "Qualified",
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        expirationDate: body.expirationDate ? new Date(body.expirationDate) : undefined,
        outOfServiceDate: body.outOfServiceDate ? new Date(body.outOfServiceDate) : undefined,
        backInServiceDate: body.backInServiceDate ? new Date(body.backInServiceDate) : undefined,
      },
    });

    return Response.json({ ...physicalIssue, issue });
  } catch (error) {
    console.error("Error creating physical issue:", error);
    return Response.json(
      { error: "Failed to create Physical issue", details: error },
      { status: 500 },
    );
  }
}
