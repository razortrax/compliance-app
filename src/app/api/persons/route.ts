import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { createId } from "@paralleldrive/cuid2";
import type { Prisma } from "@prisma/client";

// GET /api/persons - List all persons for current user's organizations
export async function GET(req: NextRequest) {
  // Declare variables at function scope for error handling
  let userId: string | null = null;
  let organizationId: string | null = null;
  let roleType: string | null = null;

  try {
    const authResult = await auth();
    userId = authResult.userId;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    organizationId = searchParams.get("organizationId");
    roleType = searchParams.get("roleType"); // New filter for role type

    console.log(
      `👤 User ${userId} requesting persons for org: ${organizationId}, roleType: ${roleType}`,
    );

    // Simplified access control using a single query
    let allOrgIds: string[] = [];

    if (organizationId) {
      // Check if user is a master (can access any organization)
      const userMasterOrg = await db.organization.findFirst({
        where: { party: { userId } },
        select: { id: true },
      });

      if (userMasterOrg) {
        // Master user can access any organization
        allOrgIds.push(organizationId);
        console.log(`✅ Master user - access granted to organization ${organizationId}`);
      } else {
        // Check if user has direct access to this specific organization
        const accessCheck = await db.organization.findFirst({
          where: {
            id: organizationId,
            OR: [
              // User owns this organization directly
              { party: { userId } },
              // User has a role in this organization
              { party: { role: { some: { party: { userId }, isActive: true } } } },
            ],
          },
          select: { id: true },
        });

        if (!accessCheck) {
          console.log(`❌ Access denied to organization ${organizationId} for user ${userId}`);
          return NextResponse.json({ error: "Access denied to organization" }, { status: 403 });
        }

        allOrgIds.push(organizationId);
        console.log(`✅ Access granted to organization ${organizationId}`);
      }
    } else {
      // Get all accessible organizations efficiently
      const userOrgs = await db.organization.findMany({
        where: {
          OR: [
            // Organizations user owns
            { party: { userId } },
            // Organizations where user has roles
            { party: { role: { some: { party: { userId }, isActive: true } } } },
          ],
        },
        select: { id: true },
      });

      allOrgIds = userOrgs.map((org) => org.id);
      console.log(`✅ User has access to ${allOrgIds.length} organizations`);

      // If user is a master, they can access all organizations
      const isMaster = await db.organization.findFirst({
        where: { party: { userId } },
        select: { id: true },
      });

      if (isMaster) {
        const allOrgs = await db.organization.findMany({ select: { id: true } });
        allOrgIds = allOrgs.map((org) => org.id);
        console.log(`✅ Master user - access to all ${allOrgIds.length} organizations`);
      }
    }

    // Remove duplicates
    const orgIds = Array.from(new Set(allOrgIds));

    // Build where clause for role filtering
    const roleWhere: any = {
      organizationId: { in: orgIds },
      isActive: true,
    };

    // Add roleType filter if specified
    if (roleType) {
      roleWhere.roleType = roleType;
    }

    console.log(`🔍 Querying persons with roleWhere:`, roleWhere);
    console.log(`🔍 Organizations in scope:`, orgIds.length, "orgs");

    // Get all persons assigned to these organizations
    const persons = await db.person.findMany({
      where: {
        party: {
          role: {
            some: roleWhere,
          },
        },
      },
      include: {
        party: {
          include: {
            role: {
              where: { isActive: true },
              include: {
                location: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });

    console.log(`✅ Found ${persons.length} persons`);
    return NextResponse.json(persons);
  } catch (error) {
    console.error("🔥 Error in persons API:", error);
    console.error("🔥 Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      organizationId,
      roleType,
      userId,
    });
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// POST /api/persons - Create new person
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      firstName,
      lastName,
      dateOfBirth,
      licenseNumber,
      phone,
      email,
      address,
      city,
      state,
      zipCode,
      roleType, // 'DRIVER', 'STAFF', etc.
      organizationId,
      locationId,
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !roleType || !organizationId) {
      return NextResponse.json(
        {
          error: "Missing required fields: firstName, lastName, roleType, organizationId",
        },
        { status: 400 },
      );
    }

    // Verify user has access to this organization
    // First check if user has a master organization
    const userMasterOrg = await db.organization.findFirst({
      where: {
        party: {
          userId: userId,
        },
      },
    });

    let hasAccess = false;
    let organization = null;

    // Check if this is the user's master organization
    if (userMasterOrg && userMasterOrg.id === organizationId) {
      hasAccess = true;
      organization = userMasterOrg;
    } else if (userMasterOrg) {
      // Check if the user's master org manages this organization
      const masterRole = await db.role.findFirst({
        where: {
          roleType: "master",
          partyId: userMasterOrg.partyId,
          organizationId: organizationId,
          isActive: true,
        },
      });

      if (masterRole) {
        hasAccess = true;
        organization = await db.organization.findUnique({
          where: { id: organizationId },
        });
      }
    }

    // If not master access, check for direct access
    if (!hasAccess) {
      // Check if user owns the organization
      organization = await db.organization.findFirst({
        where: {
          id: organizationId,
          party: { userId },
        },
      });

      if (organization) {
        hasAccess = true;
      } else {
        // Check if user has an active role in this organization
        const hasRole = await db.role.findFirst({
          where: {
            party: { userId },
            organizationId: organizationId,
            isActive: true,
          },
        });

        if (hasRole) {
          hasAccess = true;
          organization = await db.organization.findUnique({
            where: { id: organizationId },
          });
        }
      }
    }

    if (!hasAccess || !organization) {
      return NextResponse.json(
        { error: "Organization not found or access denied" },
        { status: 404 },
      );
    }

    // Create person with party model
    const result = await db.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Create party record
      const party = await tx.party.create({
        data: {
          id: createId(),
          status: "active",
        },
      });

      // 2. Create person record
      const person = await tx.person.create({
        data: {
          id: createId(),
          partyId: party.id,
          firstName,
          lastName,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          licenseNumber: licenseNumber || null,
          phone: phone || null,
          email: email || null,
          address: address || null,
          city: city || null,
          state: state || null,
          zipCode: zipCode || null,
        },
      });

      // 3. Create role relationship
      await tx.role.create({
        data: {
          id: createId(),
          partyId: party.id,
          roleType,
          organizationId,
          locationId: locationId || null,
          status: "active",
          isActive: true,
        },
      });

      return person;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating person:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
