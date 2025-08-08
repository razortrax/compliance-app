import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Find the user's party and person record
    const party = await db.party.findFirst({
      where: { userId: userId },
      include: {
        person: true,
        organization: true,
      },
    });

    if (!party) {
      return NextResponse.json(
        {
          error: "User profile not found",
        },
        { status: 404 },
      );
    }

    // For master users, the organization they own is their "master organization"
    // This is the organization they use to manage other organizations
    const masterOrganization = party.organization;

    return NextResponse.json({
      person: party.person,
      organization: party.organization, // Keep for backward compatibility
      masterOrganization: masterOrganization, // Add the master organization for new routing
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
