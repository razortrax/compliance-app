import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { createId } from '@paralleldrive/cuid2'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { withApiError } from '@/lib/with-api-error'

// GET /api/attachments - List attachments for a CAF or entity
export const GET = withApiError('/api/attachments', async (req: NextRequest) => {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const cafId = searchParams.get('cafId')

    if (!cafId) {
      return NextResponse.json({ error: 'cafId required' }, { status: 400 })
    }

    // Verify user has access to this CAF
    const caf = await db.corrective_action_form.findUnique({
      where: { id: cafId },
      select: { organizationId: true }
    })

    if (!caf) {
      return NextResponse.json({ error: 'CAF not found' }, { status: 404 })
    }

    // Check access permissions
    const masterRole = await db.role.findFirst({
      where: {
        party: { userId },
        roleType: 'master',
        isActive: true
      }
    })

    if (!masterRole) {
      const userRole = await db.role.findFirst({
        where: {
          party: { userId },
          organizationId: caf.organizationId,
          isActive: true
        }
      })

      if (!userRole) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    const attachments = await db.attachment.findMany({
      where: { cafId },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(attachments)
})

// POST /api/attachments - Upload new attachment
export const POST = withApiError('/api/attachments', async (req: NextRequest) => {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse multipart form data
    const formData = await req.formData()
    const file = formData.get('file') as File
    const cafId = formData.get('cafId') as string
    const attachmentType = formData.get('attachmentType') as string || 'DOCUMENTATION'
    const description = formData.get('description') as string
    const noteContent = formData.get('noteContent') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!cafId) {
      return NextResponse.json({ error: 'cafId required' }, { status: 400 })
    }

    // Validate file
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 })
    }

    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Unsupported file type. Please upload PDF, images, Word documents, or text files.' 
      }, { status: 400 })
    }

    // Get user's staff record for uploaded by
    // No staff relation required; store uploader as userId string

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads')
    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch (error) {
      // Directory might already exist
    }

    // Generate unique filename
    const fileExtension = path.extname(file.name)
    const baseFileName = path.basename(file.name, fileExtension)
    const uniqueFileName = `${baseFileName}_${createId()}${fileExtension}`
    const filePath = path.join(uploadsDir, uniqueFileName)

    // Save file to disk
    const buffer = await file.arrayBuffer()
    await writeFile(filePath, Buffer.from(buffer))

    // Create attachment record
    const attachment = await db.attachment.create({
      data: {
        id: createId(),
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        filePath: filePath,
        attachmentType,
        description: description || null,
        noteContent: noteContent || null,
        cafId: cafId,
        uploadedBy: userId,
        createdAt: new Date()
      }
    })

    // Log the upload activity
    await db.activity_log.create({
      data: {
        id: createId(),
        cafId,
        activityType: 'attachment',
        title: 'Attachment uploaded',
        content: JSON.stringify({ fileName: file.name, fileType: file.type, fileSize: file.size, attachmentType }),
        tags: ['attachment', 'upload'],
        createdBy: userId,
      }
    })

    return NextResponse.json(attachment)
})