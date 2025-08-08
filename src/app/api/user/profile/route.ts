import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1) Fetch the user's party (person record lives here)
    const userParty = await db.party.findFirst({
      where: { userId },
      include: { person: true },
    });

    if (!userParty) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    // 2) Resolve the user's primary organization ("master" org) robustly
    // Prefer role linkage; fallback to org owned via party.userId (legacy)
    let masterOrganization: any = null;

    const userMasterRole = await db.role.findFirst({
      where: { partyId: userParty.id, isActive: true, organizationId: { not: null } },
      orderBy: { startDate: "desc" },
      select: { organizationId: true },
    });

    if (userMasterRole?.organizationId) {
      masterOrganization = await db.organization.findUnique({ where: { id: userMasterRole.organizationId } });
    } else {
      // Legacy: organization whose party is owned by this user
      masterOrganization = await db.organization.findFirst({
        where: { party: { userId } },
      });
    }

    return NextResponse.json({
      person: userParty.person,
      masterOrganization,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch user profile",
      },
      { status: 500 },
    );
  }
}
