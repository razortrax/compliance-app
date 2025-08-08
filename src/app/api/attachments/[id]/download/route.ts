import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { readFile } from "fs/promises";
import { createId } from "@paralleldrive/cuid2";
import { withApiError } from "@/lib/with-api-error";
import { storage } from "@/lib/storage";

// GET /api/attachments/[id]/download - Download attachment file
export const GET = withApiError(
  "/api/attachments/[id]/download",
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const attachment = await db.attachment.findUnique({
      where: { id: params.id },
    });

    if (!attachment) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }

    // Verify user has access
    if (attachment.cafId) {
      const caf = await db.corrective_action_form.findUnique({
        where: { id: attachment.cafId },
        select: { organizationId: true },
      });

      if (caf) {
        const masterRole = await db.role.findFirst({
          where: {
            party: { userId },
            roleType: "master",
            isActive: true,
          },
        });

        if (!masterRole) {
          const userRole = await db.role.findFirst({
            where: {
              party: { userId },
              organizationId: caf.organizationId,
              isActive: true,
            },
          });

          if (!userRole) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
          }
        }
      }
    }

    // Read file via storage helper (Spaces or local fallback)
    let fileBuffer: Buffer;
    try {
      // If filePath is a Spaces URL, we stored with key `attachments/<name>`; attempt to parse key
      let key = attachment.filePath;
      const idx = key.indexOf("/attachments/");
      if (idx !== -1) {
        key = key.substring(idx + 1); // keep attachments/...
      }
      if (key.startsWith("attachments/")) {
        fileBuffer = await storage.download({ key });
      } else {
        // legacy local path
        fileBuffer = await readFile(attachment.filePath);
      }
    } catch (fileError) {
      console.error("Error reading file:", fileError);
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Log the download to activity_log (schema-aligned)
    if (attachment.cafId) {
      await db.activity_log.create({
        data: {
          id: createId(),
          cafId: attachment.cafId,
          activityType: "attachment",
          title: "Attachment downloaded",
          content: JSON.stringify({
            fileName: attachment.fileName,
            fileType: attachment.fileType,
          }),
          tags: ["attachment", "download"],
          createdBy: userId,
        },
      });
    }

    // Return file with appropriate headers
    const response = new NextResponse(fileBuffer);
    response.headers.set("Content-Type", attachment.fileType);
    response.headers.set("Content-Length", attachment.fileSize.toString());
    response.headers.set("Content-Disposition", `attachment; filename="${attachment.fileName}"`);

    // Add cache headers for efficiency
    response.headers.set("Cache-Control", "private, max-age=3600");
    response.headers.set("ETag", `"${attachment.id}"`);

    return response;
  },
);
