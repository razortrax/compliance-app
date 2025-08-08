import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { createId } from "@paralleldrive/cuid2";
import { z } from "zod";

// Consultant registration schema
const consultantRegistrationSchema = z.object({
  licenseNumber: z.string().optional(),
  specializations: z.array(z.string()).default([]),
  yearsExperience: z.number().min(0).optional(),
  hourlyRate: z.number().min(0).optional(),
  bio: z.string().optional(),
});

// Register as consultant
export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedData = consultantRegistrationSchema.parse(body);

    // Check if user is already a consultant
    const existingConsultant = await db.party.findFirst({
      where: {
        role: {
          some: {
            roleType: "consultant",
            isActive: true,
          },
        },
      },
      include: {
        consultant: true,
      },
    });

    if (existingConsultant?.consultant) {
      return NextResponse.json(
        { error: "User is already registered as a consultant" },
        { status: 400 },
      );
    }

    // Create consultant profile in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create party for consultant if not exists
      let consultantParty = await tx.party.findFirst({
        where: {
          role: {
            some: {
              roleType: "consultant",
            },
          },
        },
      });

      if (!consultantParty) {
        consultantParty = await tx.party.create({
          data: {
            id: createId(),
            status: "active",
            updatedAt: new Date(),
          },
        });
      }

      // Create consultant profile
      const consultant = await tx.consultant.create({
        data: {
          id: createId(),
          partyId: consultantParty.id,
          licenseNumber: validatedData.licenseNumber,
          specializations: validatedData.specializations,
          yearsExperience: validatedData.yearsExperience,
          hourlyRate: validatedData.hourlyRate,
          bio: validatedData.bio,
          isActive: true,
          isVerified: false, // Will be verified by admin
        },
      });

      // Create consultant role
      const role = await tx.role.create({
        data: {
          id: createId(),
          partyId: consultantParty.id,
          roleType: "consultant",
          status: "pending", // Pending verification
          isActive: true,
        },
      });

      return { consultant, consultantParty, role };
    });

    return NextResponse.json(
      {
        message: "Consultant registration submitted successfully",
        consultant: result.consultant,
        status: "pending_verification",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error registering consultant:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid data provided",
          details: Array.isArray((error as any).issues) ? (error as any).issues : error.message,
        },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Failed to register consultant" }, { status: 500 });
  }
}

// Get consultant profile
export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const consultant = await db.consultant.findFirst({
      where: {
        party: {
          role: {
            some: {
              roleType: "consultant",
              isActive: true,
            },
          },
        },
      },
      include: {
        party: true,
        consultation: {
          include: {
            organization: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!consultant) {
      return NextResponse.json({ error: "Consultant profile not found" }, { status: 404 });
    }

    return NextResponse.json(consultant);
  } catch (error) {
    console.error("Error fetching consultant profile:", error);
    return NextResponse.json({ error: "Failed to fetch consultant profile" }, { status: 500 });
  }
}
