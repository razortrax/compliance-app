import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { withApiError } from "@/lib/with-api-error";
import { createId } from "@paralleldrive/cuid2";

// Partner categories we recognize in role.roleType
const PARTNER_CATEGORIES = [
  "annual_inspection_shop",
  "repair_facility",
  "lab",
  "collection_site",
  "mro",
  "tpa",
  "training_provider",
  "background_check_provider",
  "insurance_carrier",
  "telematics_provider",
  "towing_service",
  "agency",
];

export const GET = withApiError("/api/partners", async (request: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get("organizationId");
  if (!organizationId) {
    return NextResponse.json({ error: "organizationId is required" }, { status: 400 });
  }

  const q = searchParams.get("q")?.trim();
  const categories = (searchParams.get("category") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const includeInactive = searchParams.get("includeInactive") === "true";

  const where: any = {
    organizationId,
    roleType: { in: categories.length > 0 ? categories : PARTNER_CATEGORIES },
    ...(includeInactive ? {} : { isActive: true }),
    party: {
      OR: [
        // Vendor organizations
        { organization: { isNot: null } },
        // Individual partner contacts
        { person: { isNot: null } },
      ],
    },
  };

  const roles = await db.role.findMany({
    where,
    include: {
      party: {
        include: {
          organization: true,
          person: true,
        },
      },
    },
    orderBy: { startDate: "desc" },
    take: 250,
  });

  const results = roles
    .map((r) => {
      const org = r.party.organization;
      const person = r.party.person;
      const displayName = org?.name || (person ? `${person.firstName} ${person.lastName}` : "");
      return {
        id: org?.id || person?.id || r.partyId,
        partyId: r.partyId,
        type: org ? "organization" : person ? "person" : "unknown",
        name: displayName,
        category: r.roleType,
        isActive: r.isActive,
        startedAt: r.startDate,
      };
    })
    .filter((x) => !!x.name && (!q || x.name.toLowerCase().includes(q.toLowerCase())));

  return NextResponse.json(results);
});

export const POST = withApiError("/api/partners", async (request: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { organizationId, name, category } = body || {};
  if (!organizationId || !name || !category) {
    return NextResponse.json(
      { error: "organizationId, name, and category are required" },
      { status: 400 },
    );
  }
  if (!PARTNER_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "Invalid partner category" }, { status: 400 });
  }

  // Create a vendor organization and link it to the client organization via role
  const party = await db.party.create({
    data: {
      id: createId(),
      status: "active",
    },
  });

  const vendorOrg = await db.organization.create({
    data: {
      id: createId(),
      partyId: party.id,
      name,
    },
  });

  await db.role.create({
    data: {
      id: createId(),
      partyId: party.id,
      roleType: category,
      organizationId, // client org that this partner serves
      isActive: true,
    },
  });

  return NextResponse.json({ id: vendorOrg.id, partyId: party.id, name: vendorOrg.name, category });
});


