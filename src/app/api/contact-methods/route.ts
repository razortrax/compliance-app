import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { withApiError } from "@/lib/with-api-error";

type ContactMethodType = "PHONE" | "EMAIL" | "SOCIAL" | "WEBSITE";
type ContactScope = "WORK" | "PERSONAL";

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function normalizePhone(raw: string): string {
  const cleaned = raw.replace(/[^0-9+]/g, "");
  // If already starts with + and length reasonable, keep
  if (cleaned.startsWith("+") && cleaned.length >= 8 && cleaned.length <= 16) return cleaned;
  const digits = cleaned.replace(/[^0-9]/g, "");
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`; // default to US
  return digits || raw.trim();
}

function normalizeValue(type: ContactMethodType, value: string): string {
  switch (type) {
    case "EMAIL":
      return normalizeEmail(value);
    case "PHONE":
      return normalizePhone(value);
    default:
      return value.trim();
  }
}

export const GET = withApiError("/api/contact-methods", async (request: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get("organizationId") || undefined;
  const personId = searchParams.get("personId") || undefined;
  const roleId = searchParams.get("roleId") || undefined;
  const type = (searchParams.get("type") as ContactMethodType | null) || undefined;
  const scope = (searchParams.get("scope") as ContactScope | null) || undefined;

  const where: any = {};
  if (organizationId) where.organizationId = organizationId;
  if (personId) where.personId = personId;
  if (roleId) where.roleId = roleId;
  if (type) where.type = type;
  if (scope) where.scope = scope;

  const methods = await db.contact_method.findMany({
    where,
    orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
    take: 200,
  });

  return NextResponse.json(methods);
});

export const POST = withApiError("/api/contact-methods", async (request: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as {
    organizationId?: string;
    personId?: string;
    roleId?: string;
    type: ContactMethodType;
    scope?: ContactScope;
    label?: string;
    value: string;
    isPrimary?: boolean;
    isVerified?: boolean;
    notes?: string;
  };

  if (!body?.type || !body?.value) {
    return NextResponse.json({ error: "type and value are required" }, { status: 400 });
  }

  if (!body.organizationId && !body.personId && !body.roleId) {
    return NextResponse.json({ error: "Must specify an owner (organizationId, personId, or roleId)" }, { status: 400 });
  }

  const normalizedValue = normalizeValue(body.type, body.value);

  const created = await db.contact_method.create({
    data: {
      organizationId: body.organizationId || null,
      personId: body.personId || null,
      roleId: body.roleId || null,
      type: body.type,
      scope: body.scope || "WORK",
      label: body.label?.trim() || null,
      value: normalizedValue,
      isPrimary: Boolean(body.isPrimary),
      isVerified: Boolean(body.isVerified),
      notes: body.notes?.trim() || null,
    },
  });

  return NextResponse.json(created, { status: 201 });
});

export const PUT = withApiError("/api/contact-methods", async (request: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as {
    id: string;
    type?: ContactMethodType;
    scope?: ContactScope;
    label?: string;
    value?: string;
    isPrimary?: boolean;
    isVerified?: boolean;
    notes?: string;
  };

  if (!body?.id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const data: any = {};
  if (body.type) data.type = body.type;
  if (body.scope) data.scope = body.scope;
  if (typeof body.isPrimary === "boolean") data.isPrimary = body.isPrimary;
  if (typeof body.isVerified === "boolean") data.isVerified = body.isVerified;
  if (body.label !== undefined) data.label = body.label?.trim() || null;
  if (body.notes !== undefined) data.notes = body.notes?.trim() || null;
  if (body.value !== undefined) {
    const t = (body.type as ContactMethodType) || undefined;
    data.value = t ? normalizeValue(t, body.value) : body.value.trim();
  }

  const updated = await db.contact_method.update({ where: { id: body.id }, data });
  return NextResponse.json(updated);
});

export const DELETE = withApiError("/api/contact-methods", async (request: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  await db.contact_method.delete({ where: { id } });
  return NextResponse.json({ success: true });
});


