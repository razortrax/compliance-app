import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { createId } from "@paralleldrive/cuid2";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { firstName = "User", lastName = "User", role, organizationName } = await request.json();

    // Validate required fields - only role is required for auth flow
    if (!role) {
      return NextResponse.json({ error: "Role is required" }, { status: 400 });
    }

    // Validate role
    const validRoles = ["master", "organization", "location"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role specified" }, { status: 400 });
    }

    // Organization/company name is now required for all roles
    if (!organizationName) {
      return NextResponse.json({ error: "Company/Organization name is required" }, { status: 400 });
    }

    // Fetch user's party (if any) and existing person
    const existingParty = await db.party.findFirst({
      where: { userId },
      include: { person: true },
    });
    // Check if user has a master organization via role
    const existingMasterRole = existingParty
      ? await db.role.findFirst({
          where: { partyId: existingParty.id, roleType: "master", isActive: true },
        })
      : null;

    console.log("🔍 Profile completion check:", {
      hasPerson: !!existingParty?.person,
      hasMasterRole: !!existingMasterRole,
      hasOrganization: !!existingMasterRole?.organizationId,
      allowCompletion: true,
    });

    const result = await db.$transaction(async (tx) => {
      // 1) Ensure user party exists
      const userParty =
        existingParty ||
        (await tx.party.create({
          data: { id: createId(), userId, status: "active", updatedAt: new Date() },
        }));

      // 2) Ensure person exists (update names if present)
      let person = existingParty?.person || null;
      if (!person) {
        person = await tx.person.create({
          data: { id: createId(), partyId: userParty.id, firstName, lastName },
        });
      } else {
        person = await tx.person.update({
          where: { id: person.id },
          data: { firstName, lastName },
        });
      }

      // 3) Resolve or create the primary organization
      let organizationIdToUse: string | null = null;
      if (role === "master") {
        if (existingMasterRole?.organizationId) {
          organizationIdToUse = existingMasterRole.organizationId;
        } else {
          // Try legacy owned org
          const ownedOrg = await tx.organization.findFirst({ where: { party: { userId } } });
          if (ownedOrg) {
            organizationIdToUse = ownedOrg.id;
          } else {
            // Create new owned org
            const organizationParty = await tx.party.create({
              data: { id: createId(), userId, status: "active", updatedAt: new Date() },
            });
            const org = await tx.organization.create({
              data: { id: createId(), partyId: organizationParty.id, name: organizationName },
            });
            organizationIdToUse = org.id;
          }
        }
      } else {
        // For organization/location roles, ensure there is a master org to attach
        const masterOwned = await tx.organization.findFirst({ where: { party: { userId } } });
        if (masterOwned) {
          organizationIdToUse = masterOwned.id;
        } else {
          const organizationParty = await tx.party.create({
            data: { id: createId(), userId, status: "active", updatedAt: new Date() },
          });
          const org = await tx.organization.create({
            data: { id: createId(), partyId: organizationParty.id, name: organizationName },
          });
          organizationIdToUse = org.id;
        }
      }

      // 4) Ensure role exists (idempotent)
      const existingSameRole = await tx.role.findFirst({
        where: { partyId: userParty.id, roleType: role, organizationId: organizationIdToUse },
      });
      const userRole =
        existingSameRole ||
        (await tx.role.create({
          data: {
            id: createId(),
            partyId: userParty.id,
            roleType: role,
            organizationId: organizationIdToUse,
            status: "active",
            isActive: true,
          },
        }));

      return { userParty, person, organizationId: organizationIdToUse, userRole };
    });

    return NextResponse.json({
      message: "Profile completed successfully",
      data: {
        person: result.person,
        organizationId: result.organizationId,
        role: result.userRole,
      },
    });
  } catch (error) {
    console.error("Profile completion error:", error);
    if (process.env.NODE_ENV !== "production") {
      return NextResponse.json(
        {
          error: "Failed to complete profile",
          details: {
            name: (error as any)?.name,
            message: (error as any)?.message,
            code: (error as any)?.code,
            meta: (error as any)?.meta,
          },
        },
        { status: 500 },
      );
    }
    return NextResponse.json({ error: "Failed to complete profile" }, { status: 500 });
  }
}
