import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { withApiError } from "@/lib/with-api-error";

type ContactScope = "WORK" | "PERSONAL";
type AddressType = "PHYSICAL" | "MAILING" | "BILLING";

export const GET = withApiError("/api/contact-addresses", async (request: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get("organizationId") || undefined;
  const personId = searchParams.get("personId") || undefined;
  const roleId = searchParams.get("roleId") || undefined;
  const scope = (searchParams.get("scope") as ContactScope | null) || undefined;
  const addressType = (searchParams.get("addressType") as AddressType | null) || undefined;

  const where: any = {};
  if (organizationId) where.organizationId = organizationId;
  if (personId) where.personId = personId;
  if (roleId) where.roleId = roleId;
  if (scope) where.scope = scope;
  if (addressType) where.addressType = addressType;

  const rows = await db.contact_address.findMany({
    where,
    orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
    take: 200,
  });

  return NextResponse.json(rows);
});

export const POST = withApiError("/api/contact-addresses", async (request: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as {
    organizationId?: string;
    personId?: string;
    roleId?: string;
    scope?: ContactScope;
    addressType?: AddressType;
    label?: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country?: string;
    isPrimary?: boolean;
    notes?: string;
  };

  if (!body?.line1 || !body?.city || !body?.state || !body?.postalCode) {
    return NextResponse.json({ error: "Missing required address fields" }, { status: 400 });
  }

  if (!body.organizationId && !body.personId && !body.roleId) {
    return NextResponse.json({ error: "Must specify an owner (organizationId, personId, or roleId)" }, { status: 400 });
  }

  const created = await db.contact_address.create({
    data: {
      organizationId: body.organizationId || null,
      personId: body.personId || null,
      roleId: body.roleId || null,
      scope: body.scope || "WORK",
      addressType: body.addressType || "PHYSICAL",
      label: body.label?.trim() || null,
      line1: body.line1.trim(),
      line2: body.line2?.trim() || null,
      city: body.city.trim(),
      state: body.state.trim(),
      postalCode: body.postalCode.trim(),
      country: (body.country || "US").trim(),
      isPrimary: Boolean(body.isPrimary),
      notes: body.notes?.trim() || null,
    },
  });

  return NextResponse.json(created, { status: 201 });
});

export const PUT = withApiError("/api/contact-addresses", async (request: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as {
    id: string;
    scope?: ContactScope;
    addressType?: AddressType;
    label?: string;
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    isPrimary?: boolean;
    notes?: string;
  };

  if (!body?.id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const data: any = {};
  if (body.scope) data.scope = body.scope;
  if (body.addressType) data.addressType = body.addressType;
  if (typeof body.isPrimary === "boolean") data.isPrimary = body.isPrimary;
  if (body.label !== undefined) data.label = body.label?.trim() || null;
  if (body.notes !== undefined) data.notes = body.notes?.trim() || null;
  if (body.line1 !== undefined) data.line1 = body.line1.trim();
  if (body.line2 !== undefined) data.line2 = body.line2?.trim() || null;
  if (body.city !== undefined) data.city = body.city.trim();
  if (body.state !== undefined) data.state = body.state.trim();
  if (body.postalCode !== undefined) data.postalCode = body.postalCode.trim();
  if (body.country !== undefined) data.country = body.country.trim();

  const updated = await db.contact_address.update({ where: { id: body.id }, data });
  return NextResponse.json(updated);
});

export const DELETE = withApiError("/api/contact-addresses", async (request: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  await db.contact_address.delete({ where: { id } });
  return NextResponse.json({ success: true });
});


