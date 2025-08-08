import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { createId } from "@paralleldrive/cuid2";
import { updateRINSCompletionStatus } from "@/lib/caf-utils";
import { withApiError } from "@/lib/with-api-error";

// POST /api/corrective-action-forms/[id]/sign - Add digital signature
export const POST = withApiError(
  "/api/corrective-action-forms/[id]/sign",
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { signatureType, staffId, digitalSignature, notes } = body;

    // Validate required fields
    if (!signatureType || !staffId || !digitalSignature) {
      return NextResponse.json(
        {
          error: "Missing required fields: signatureType, staffId, digitalSignature",
        },
        { status: 400 },
      );
    }

    // Verify CAF exists
    const caf = await db.corrective_action_form.findUnique({
      where: { id: params.id },
      include: {
        signatures: true,
      },
    });

    if (!caf) {
      return NextResponse.json({ error: "CAF not found" }, { status: 404 });
    }

    // Verify staff member exists and user has permission
    const staff = await db.staff.findUnique({
      where: { id: staffId },
      include: {
        party: {
          include: {
            person: true,
          },
        },
      },
    });

    if (!staff) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    // Verify user can sign on behalf of this staff member
    const masterRole = await db.role.findFirst({
      where: {
        party: { userId },
        roleType: "master",
        isActive: true,
      },
    });

    let canSign = false;

    // Master users can sign as anyone (for testing/admin purposes)
    if (masterRole) {
      canSign = true;
    }
    // Staff can sign for themselves
    else if (staff.party.userId === userId) {
      canSign = true;
    }

    if (!canSign) {
      return NextResponse.json({ error: "Insufficient permissions to sign" }, { status: 403 });
    }

    // Validate signature permissions based on type
    if (signatureType === "COMPLETION" && !staff.canSignCAFs) {
      return NextResponse.json(
        {
          error: "Staff member does not have permission to sign CAFs",
        },
        { status: 403 },
      );
    }

    if (signatureType === "APPROVAL" && !staff.canApproveCAFs && !masterRole) {
      return NextResponse.json(
        {
          error: "Staff member does not have permission to approve CAFs",
        },
        { status: 403 },
      );
    }

    // Check for duplicate signature
    const existingSignature = caf.signatures.find(
      (sig) => sig.staffId === staffId && sig.signatureType === signatureType,
    );

    if (existingSignature) {
      return NextResponse.json(
        {
          error: "This staff member has already provided this type of signature",
        },
        { status: 400 },
      );
    }

    // Validate CAF status for signature type
    if (signatureType === "COMPLETION" && caf.status !== "COMPLETED") {
      return NextResponse.json(
        {
          error: "CAF must be in COMPLETED status to receive completion signature",
        },
        { status: 400 },
      );
    }

    if (signatureType === "APPROVAL" && caf.status !== "COMPLETED") {
      return NextResponse.json(
        {
          error: "CAF must be in COMPLETED status with completion signature to receive approval",
        },
        { status: 400 },
      );
    }

    // For approval signatures, ensure completion signature exists
    if (signatureType === "APPROVAL") {
      const hasCompletionSignature = caf.signatures.some(
        (sig) => sig.signatureType === "COMPLETION",
      );
      if (!hasCompletionSignature) {
        return NextResponse.json(
          {
            error: "CAF must have completion signature before approval signature",
          },
          { status: 400 },
        );
      }
    }

    // Create the signature
    const signature = await db.caf_signature.create({
      data: {
        id: createId(),
        cafId: params.id,
        staffId,
        signatureType,
        digitalSignature,
        ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
        notes,
        signedAt: new Date(),
      },
      include: {
        staff: {
          include: {
            party: {
              include: {
                person: true,
              },
            },
          },
        },
      },
    });

    // Log the activity
    await db.activity_log.create({
      data: {
        id: createId(),
        cafId: params.id,
        activityType: "caf",
        title: "CAF signed",
        content: JSON.stringify({
          signatureType,
          signedBy:
            `${staff.party.person?.firstName ?? ""} ${staff.party.person?.lastName ?? ""}`.trim(),
          signatureId: signature.id,
        }),
        tags: ["caf", "signature"],
        createdBy: userId,
      },
    });

    // Check RINS completion if CAF is linked to an incident
    if (caf.incidentId) {
      try {
        await updateRINSCompletionStatus(caf.incidentId);
      } catch (error) {
        console.error("Error checking RINS completion:", error);
        // Don't fail the signature if RINS check fails
      }
    }

    return NextResponse.json(signature);
  },
);
