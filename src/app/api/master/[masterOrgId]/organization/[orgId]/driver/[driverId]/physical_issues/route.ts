import { NextRequest, NextResponse } from "next/server";
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

export async function GET(
  request: NextRequest,
  { params }: { params: { masterOrgId: string; orgId: string; driverId: string } },
) {
  try {
    const authResult = await auth();
    const userId = authResult.userId;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { masterOrgId, orgId, driverId } = params;

    // Fetch all the contextual data in one query - Gold Standard pattern
    const [masterOrg, organization, driver, physicalIssues] = await Promise.all([
      // Master organization
      db.organization.findUnique({
        where: { id: masterOrgId },
        select: { id: true, name: true },
      }),

      // Target organization
      db.organization.findUnique({
        where: { id: orgId },
        select: { id: true, name: true },
      }),

      // Driver details
      db.person.findUnique({
        where: { id: driverId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          licenseNumber: true,
          party: {
            select: { id: true },
          },
        },
      }),

      // Physical issues for this driver
      db.physical_issue.findMany({
        where: {
          issue: {
            party: {
              person: {
                id: driverId,
              },
            },
            status: "Active",
          },
        },
        include: {
          issue: {
            include: {
              party: {
                include: {
                  person: {
                    select: {
                      firstName: true,
                      lastName: true,
                    },
                  },
                  organization: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: [
          { issue: { status: "desc" } }, // Active first
          { expirationDate: "asc" }, // Then by expiration date
        ],
      }),
    ]);

    // Validate required data
    if (!masterOrg) {
      return NextResponse.json({ error: "Master organization not found" }, { status: 404 });
    }

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    if (!driver) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    // Return structured data
    return NextResponse.json({
      masterOrg,
      organization,
      driver: {
        id: driver.id,
        firstName: driver.firstName,
        lastName: driver.lastName,
        licenseNumber: driver.licenseNumber,
        party: driver.party, // ✅ ADDED: Include party with id
      },
      physicalIssues,
    });
  } catch (error) {
    console.error("Error fetching physical issues:", error);
    return NextResponse.json({ error: "Failed to fetch physical issues" }, { status: 500 });
  }
}

// POST - Create new Physical issue
export async function POST(
  request: NextRequest,
  { params }: { params: { masterOrgId: string; orgId: string; driverId: string } },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { masterOrgId, orgId, driverId } = params;
    const body: PhysicalIssueData = await request.json();

    // Validate required fields
    if (!body.type || !body.partyId || !body.title) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify the partyId matches the driver from the URL
    const driver = await db.person.findUnique({
      where: { id: driverId },
      select: {
        id: true,
        party: {
          select: { id: true },
        },
      },
    });

    if (!driver || driver.party?.id !== body.partyId) {
      return NextResponse.json({ error: "Driver mismatch" }, { status: 400 });
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
      return NextResponse.json({ error: "Party not found" }, { status: 404 });
    }

    // Create the base issue record
    const issue = await db.issue.create({
      data: {
        id: createId(),
        issueType: "physical",
        status: "Active", // ✅ FIXED: Use 'Active' to match query filter
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

    return NextResponse.json({ ...physicalIssue, issue });
  } catch (error) {
    console.error("Error creating physical issue:", error);
    return NextResponse.json(
      { error: "Failed to create Physical issue", details: error },
      { status: 500 },
    );
  }
}
