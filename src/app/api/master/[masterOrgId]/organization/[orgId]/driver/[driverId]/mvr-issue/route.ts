import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";

interface RouteParams {
  masterOrgId: string;
  orgId: string;
  driverId: string;
}

// GET /api/master/[masterOrgId]/organization/[orgId]/driver/[driverId]/mvr-issue
// Single optimized query that returns all context + MVR data
export async function GET(request: NextRequest, { params }: { params: RouteParams }) {
  let userId: string | null = null;
  const { masterOrgId, orgId, driverId } = params;

  try {
    const authResult = await auth();
    userId = authResult.userId;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(
      `🔍 Fetching MVR data for driver ${driverId} in org ${orgId} under master ${masterOrgId}`,
    );

    // Step 1: Check if user is a master (simplified access control)
    const userMasterOrg = await db.organization.findFirst({
      where: { party: { userId } },
      select: { id: true, name: true },
    });

    console.log("🔍 User Master Org:", userMasterOrg?.name || "None");

    // Step 2: Get master organization (for context)
    const masterOrg = await db.organization.findFirst({
      where: { id: masterOrgId },
      select: { id: true, name: true },
    });

    if (!masterOrg) {
      console.log(`❌ Master organization ${masterOrgId} not found`);
      return NextResponse.json({ error: "Master organization not found" }, { status: 404 });
    }

    // Step 3: Get organization with simplified access control
    let organization = null;

    if (userMasterOrg) {
      // Master user can access any organization
      organization = await db.organization.findFirst({
        where: { id: orgId },
        select: {
          id: true,
          name: true,
          dotNumber: true,
        },
      });
      console.log("✅ Master user - organization access:", organization?.name || "NOT FOUND");
    } else {
      // Non-master user - check direct access
      organization = await db.organization.findFirst({
        where: {
          id: orgId,
          OR: [
            // User owns this organization directly
            { party: { userId } },
            // User has a role in this organization
            { party: { role: { some: { party: { userId }, isActive: true } } } },
          ],
        },
        select: {
          id: true,
          name: true,
          dotNumber: true,
        },
      });
      console.log("🔍 Direct access check:", organization?.name || "NOT FOUND");
    }

    if (!organization) {
      console.log(`❌ User ${userId} does not have access to organization ${orgId}`);
      return NextResponse.json({ error: "Access denied to organization" }, { status: 403 });
    }

    // Step 4: Get driver and validate they belong to the organization
    const driver = await db.person.findFirst({
      where: {
        id: driverId,
        party: {
          role: {
            some: {
              organizationId: orgId,
              isActive: true,
            },
          },
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        licenseNumber: true,
        partyId: true,
      },
    });

    if (!driver) {
      console.log(`❌ Driver ${driverId} not found in organization ${orgId}`);
      return NextResponse.json({ error: "Driver not found in this organization" }, { status: 404 });
    }

    // Step 5: Get MVR issues for this driver
    const mvrIssues = await db.mvr_issue.findMany({
      where: {
        issue: {
          partyId: driver.partyId,
        },
      },
      include: {
        issue: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Transform the data for the response
    const responseData = {
      driver: {
        id: driver.id,
        firstName: driver.firstName,
        lastName: driver.lastName,
        licenseNumber: driver.licenseNumber,
        party: {
          id: driver.partyId,
        },
      },
      organization: {
        id: organization.id,
        name: organization.name,
        dotNumber: organization.dotNumber,
      },
      masterOrg: {
        id: masterOrg.id,
        name: masterOrg.name,
      },
      mvrIssues,
    };

    console.log(`✅ Successfully fetched MVR data for ${driver.firstName} ${driver.lastName}`);
    console.log(`📊 Found ${responseData.mvrIssues.length} MVR records`);

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("🔥 Error in MVR API:", error);
    console.error("🔥 Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      params: { masterOrgId, orgId, driverId },
      userId,
    });

    return NextResponse.json(
      {
        error: "Failed to fetch MVR data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
