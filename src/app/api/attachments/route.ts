import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { createId } from "@paralleldrive/cuid2";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { withApiError } from "@/lib/with-api-error";

// GET /api/attachments - List attachments for a CAF or entity
export const GET = withApiError("/api/attachments", async (req: NextRequest) => {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const cafId = searchParams.get("cafId");
  const issueId = searchParams.get("issueId");

  if (!cafId && !issueId) {
    return NextResponse.json({ error: "cafId or issueId required" }, { status: 400 });
  }

  // Org access check helper
  const ensureOrgAccess = async (orgId: string) => {
    const masterRole = await db.role.findFirst({
      where: { party: { userId }, roleType: "master", isActive: true },
    });
    if (masterRole) return true;
    const userRole = await db.role.findFirst({
      where: { party: { userId }, organizationId: orgId, isActive: true },
    });
    return !!userRole;
  };

  if (cafId) {
    const caf = await db.corrective_action_form.findUnique({
      where: { id: cafId },
      select: { organizationId: true },
    });
    if (!caf) {
      return NextResponse.json({ error: "CAF not found" }, { status: 404 });
    }
    const allowed = await ensureOrgAccess(caf.organizationId);
    if (!allowed) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    const attachments = await db.attachment.findMany({
      where: { cafId },
      orderBy: { createdAt: "desc" },
    });
    // Add a convenience url field for clients
    const withUrl = attachments.map((a) => ({ ...a, url: `/api/attachments/${a.id}/download` }));
    return NextResponse.json(withUrl);
  }

  if (issueId) {
    // Verify user has access via issue -> party -> organization
    const issue = await db.issue.findUnique({
      where: { id: issueId },
      include: { party: { include: { organization: true } } },
    });
    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }
    const orgId = issue.party.organization?.id;
    if (orgId) {
      const allowed = await ensureOrgAccess(orgId);
      if (!allowed) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }
    const attachments = await db.attachment.findMany({
      where: { issueId },
      orderBy: { createdAt: "desc" },
    });
    const withUrl = attachments.map((a) => ({ ...a, url: `/api/attachments/${a.id}/download` }));
    return NextResponse.json(withUrl);
  }

  return NextResponse.json({ error: "Unsupported query" }, { status: 400 });
});

// POST /api/attachments - Upload new attachment
export const POST = withApiError("/api/attachments", async (req: NextRequest) => {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") || "";

  // JSON flow (notes/urls/metadata-only attachments)
  if (contentType.includes("application/json")) {
    const body = await req.json();
    const {
      issueId,
      cafId,
      attachmentType = "note",
      title,
      description,
      noteContent,
      url,
    } = body as {
      issueId?: string;
      cafId?: string;
      attachmentType?: string;
      title?: string;
      description?: string;
      noteContent?: string;
      url?: string;
    };

    if (!issueId && !cafId) {
      return NextResponse.json({ error: "issueId or cafId required" }, { status: 400 });
    }

    // Create a lightweight attachment row even for notes/urls so UI remains unified
    const id = createId();
    const data: any = {
      id,
      attachmentType,
      fileName: title || attachmentType,
      description: description || null,
      noteContent: noteContent || null,
      uploadedBy: userId,
      createdAt: new Date(),
      ...(issueId && { issueId }),
      ...(cafId && { cafId }),
    };

    // For URL entries, store in filePath with a pseudo fileType
    if (url) {
      data.filePath = url;
      data.fileType = "text/url";
      data.fileSize = 0;
    }

    const attachment = await db.attachment.create({ data });

    // Activity log entry
    await db.activity_log.create({
      data: {
        id: createId(),
        activityType: attachmentType === "note" ? "note" : "attachment",
        title: title || `Added ${attachmentType}`,
        content: noteContent || url || description || attachmentType,
        tags: ["addon"],
        createdBy: userId,
        ...(issueId && { issueId }),
        ...(cafId && { cafId }),
      },
    });

    return NextResponse.json({ ...attachment, url: url || `/api/attachments/${id}/download` });
  }

  // Multipart upload flow (files)
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const cafId = (formData.get("cafId") as string) || undefined;
  const issueId = (formData.get("issueId") as string) || undefined;
  const attachmentType = (formData.get("attachmentType") as string) || "DOCUMENTATION";
  const description = (formData.get("description") as string) || "";
  const noteContent = (formData.get("noteContent") as string) || "";

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!cafId && !issueId) {
    return NextResponse.json({ error: "issueId or cafId required" }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File size exceeds 10MB limit" }, { status: 400 });
  }

  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: "Unsupported file type. Please upload PDF, images, Word documents, or text files." },
      { status: 400 },
    );
  }

  const uploadsDir = path.join(process.cwd(), "uploads");
  try {
    await mkdir(uploadsDir, { recursive: true });
  } catch {}

  const fileExtension = path.extname(file.name);
  const baseFileName = path.basename(file.name, fileExtension);
  const uniqueFileName = `${baseFileName}_${createId()}${fileExtension}`;
  const filePath = path.join(uploadsDir, uniqueFileName);
  const buffer = await file.arrayBuffer();
  await writeFile(filePath, Buffer.from(buffer));

  const id = createId();
  const attachment = await db.attachment.create({
    data: {
      id,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      filePath,
      attachmentType,
      description: description || null,
      noteContent: noteContent || null,
      uploadedBy: userId,
      createdAt: new Date(),
      ...(cafId && { cafId }),
      ...(issueId && { issueId }),
    },
  });

  await db.activity_log.create({
    data: {
      id: createId(),
      activityType: "attachment",
      title: "Attachment uploaded",
      content: JSON.stringify({ fileName: file.name, fileType: file.type, fileSize: file.size, attachmentType }),
      tags: ["attachment", "upload"],
      createdBy: userId,
      ...(cafId && { cafId }),
      ...(issueId && { issueId }),
    },
  });

  return NextResponse.json({ ...attachment, url: `/api/attachments/${id}/download` });
});
