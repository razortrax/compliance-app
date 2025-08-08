import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { createId } from "@paralleldrive/cuid2";
import { captureAPIError } from "@/lib/sentry-utils";
import { withApiError } from "@/lib/with-api-error";

export const GET = withApiError("/api/organizations", async (request: NextRequest) => {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // First, find the user's master company (organization they directly own)
  const userMasterOrg = await db.organization.findFirst({
    where: {
      party: {
        userId: userId,
      },
    },
    include: {
      party: true,
    },
  });

  console.log("GET /api/organizations - User:", userId);
  console.log("User Master Org:", userMasterOrg?.name, userMasterOrg?.id);

  // If user has no master org, return empty array
  if (!userMasterOrg) {
    console.log("No master org found for user");
    return NextResponse.json([]);
  }

  // Find all organizations:
  // 1. The master company itself
  // 2. All organizations managed by the master company (through roles)

  // First get all organization IDs managed by the master
  const managedOrgRoles = await db.role.findMany({
    where: {
      roleType: "master",
      partyId: userMasterOrg.partyId,
      isActive: true,
    },
    select: {
      organizationId: true,
    },
  });

  const managedOrgIds = managedOrgRoles
    .map((role) => role.organizationId)
    .filter((id): id is string => id !== null);

  console.log("Managed org IDs:", managedOrgIds);

  // Now get all organizations (master + managed)
  const organizations = await db.organization.findMany({
    where: {
      OR: [
        { id: userMasterOrg.id }, // Include the master org itself
        { id: { in: managedOrgIds } }, // Include all managed orgs
      ],
    },
    include: {
      party: {
        select: {
          id: true,
          userId: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          role: {
            where: {
              roleType: "master",
              isActive: true,
            },
            select: {
              id: true,
              status: true,
              roleType: true,
            },
          },
        },
      },
    },
    orderBy: {
      party: {
        createdAt: "desc",
      },
    },
  });

  console.log("Total organizations found:", organizations.length);
  organizations.forEach((org) => {
    console.log(`- ${org.name} (ID: ${org.id})`);
  });

  return NextResponse.json(organizations);
});

export const POST = withApiError("/api/organizations", async (request: NextRequest) => {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, dotNumber, phone, einNumber } = await request.json();

  if (!name) {
    return NextResponse.json({ error: "Organization name is required" }, { status: 400 });
  }

  // VALIDATE DOT NUMBER FIRST - before creating anything
  if (dotNumber && dotNumber !== "NO_DOT") {
    const existingDotOrg = await db.organization.findFirst({
      where: { dotNumber },
    });

    if (existingDotOrg) {
      return NextResponse.json({ error: "DOT number already exists" }, { status: 409 });
    }
  }

  // Find user's master company
  const userMasterOrg = await db.organization.findFirst({
    where: {
      party: {
        userId: userId,
      },
    },
    include: {
      party: true,
    },
  });

  if (!userMasterOrg) {
    return NextResponse.json({ error: "No master company found for user" }, { status: 400 });
  }

  console.log("Creating child organization for master:", userMasterOrg.name, userMasterOrg.id);

  // Use transaction to ensure atomicity
  const result = await db.$transaction(async (tx) => {
    // Create organization party (not connected to user)
    const orgParty = await tx.party.create({
      data: {
        id: createId(),
        status: "active",
        updatedAt: new Date(),
        // NO userId - this is a managed organization
      },
    });

    // Create organization
    const organization = await tx.organization.create({
      data: {
        id: createId(),
        partyId: orgParty.id,
        name,
        dotNumber: dotNumber === "NO_DOT" ? null : dotNumber,
        phone: phone || null,
        einNumber: einNumber || null,
      },
      include: {
        party: true,
      },
    });

    console.log("Created organization:", {
      id: organization.id,
      name: organization.name,
      partyId: organization.partyId,
    });

    // Create MASTER ROLE linking master party to new organization
    const masterRole = await tx.role.create({
      data: {
        id: createId(),
        partyId: userMasterOrg.partyId, // Master company's party
        roleType: "master",
        organizationId: organization.id, // New organization being managed
        status: "active",
        startDate: new Date(),
        isActive: true,
      },
    });

    console.log("Created master role:", {
      id: masterRole.id,
      roleType: masterRole.roleType,
      masterPartyId: masterRole.partyId,
      managedOrgId: masterRole.organizationId,
      status: masterRole.status,
      isActive: masterRole.isActive,
    });

    return organization;
  });

  return NextResponse.json(result, { status: 201 });
});
