import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { createId } from "@paralleldrive/cuid2";
import {
  MvrType,
  MvrResult,
  MvrResultDach,
  MvrResultStatus,
  MvrCertification,
  MvrStatus,
} from "@prisma/client";

// Define types for MVR data
export interface MvrIssueData {
  state: string;
  violationsCount?: number;
  cleanRecord?: boolean;
  notes?: string;
  type?: string;
  result?: string;
  result_dach?: string;
  result_status?: string;
  reviewedBy?: any;
  certification?: string;
  status?: string;
  startDate?: string;
  expirationDate?: string;
  renewalDate?: string;
  partyId: string;
  title: string;
  description?: string;
  priority?: string;
}

// GET /api/mvr_issues - List MVR issues with filtering
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

    // Access control - support Master, Organization, and Location managers
    // (Reuse logic from licenses)
    // TODO: Implement full access control as in licenses

    const mvrIssues = await db.mvr_issue.findMany({
      where,
      include: {
        issue: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return Response.json(mvrIssues);
  } catch (error) {
    return Response.json({ error: "Failed to fetch MVR issues", details: error }, { status: 500 });
  }
}

// POST /api/mvr_issues - Create a new MVR issue
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: MvrIssueData = await request.json();
    if (!body.state || !body.partyId || !body.title) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if user has access to the party (reuse logic from licenses)
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

    // Create the base issue record
    const issue = await db.issue.create({
      data: {
        id: createId(),
        issueType: "mvr",
        status: body.status || "open",
        priority: body.priority || "medium",
        partyId: body.partyId,
        title: body.title,
        description: body.description,
        updatedAt: new Date(),
      },
    });

    // Create the mvr_issue record
    const mvrIssue = await db.mvr_issue.create({
      data: {
        issueId: issue.id,
        state: body.state,
        violationsCount: body.violationsCount ?? 0,
        cleanRecord: body.cleanRecord ?? true,
        notes: body.notes,
        type: body.type ? (body.type as MvrType) : undefined,
        result: body.result ? (body.result as MvrResult) : undefined,
        result_dach: body.result_dach ? (body.result_dach as MvrResultDach) : undefined,
        result_status: body.result_status ? (body.result_status as MvrResultStatus) : undefined,
        reviewedBy: body.reviewedBy,
        certification: body.certification ? (body.certification as MvrCertification) : undefined,
        status: body.status ? (body.status as MvrStatus) : undefined,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        expirationDate: body.expirationDate ? new Date(body.expirationDate) : undefined,
        renewalDate: body.renewalDate ? new Date(body.renewalDate) : undefined,
      },
    });

    return Response.json({ ...mvrIssue, issue });
  } catch (error) {
    return Response.json({ error: "Failed to create MVR issue", details: error }, { status: 500 });
  }
}
