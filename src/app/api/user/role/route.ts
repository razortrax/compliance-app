import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // First check if user is a consultant
    const consultantRole = await db.role.findFirst({
      where: {
        party: {
          userId: userId, // Filter by current user
          consultant: {
            isNot: null,
          },
        },
        roleType: "consultant",
        isActive: true,
      },
      include: {
        party: {
          include: {
            consultant: true,
          },
        },
      },
    });

    if (consultantRole) {
      return NextResponse.json({
        role: {
          roleType: "consultant",
          organizationId: null,
        },
      });
    }

    // Check for other roles (master, organization, location) for this user
    const userRole = await db.role.findFirst({
      where: {
        party: {
          userId: userId, // Filter by current user
        },
        isActive: true,
        roleType: {
          in: ["master", "organization", "location", "admin", "manager"],
        },
      },
      orderBy: {
        startDate: "desc",
      },
    });

    if (userRole) {
      // Map role types to management levels
      let managementLevel = userRole.roleType;
      if (userRole.roleType === "admin" || userRole.roleType === "manager") {
        // Determine if they're organization or location level based on context
        if (userRole.organizationId) {
          managementLevel = "organization";
        } else {
          managementLevel = "master";
        }
      }

      return NextResponse.json({
        role: {
          roleType: managementLevel,
          organizationId: userRole.organizationId,
        },
      });
    }

    // No role found for this user - they need to complete their profile
    // Check if they have a party record
    const userParty = await db.party.findFirst({
      where: { userId: userId },
    });

    if (!userParty) {
      // User has no party record yet - they need to complete their profile
      return NextResponse.json({
        role: {
          roleType: "new_user",
          organizationId: null,
        },
      });
    }

    // Default to organization level for existing users without roles
    return NextResponse.json({
      role: {
        roleType: "organization",
        organizationId: null,
      },
    });
  } catch (error) {
    console.error("Error fetching user role:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch user role",
      },
      { status: 500 },
    );
  }
}
