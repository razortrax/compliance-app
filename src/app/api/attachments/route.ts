import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { createId } from '@paralleldrive/cuid2'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

// GET /api/attachments - List attachments for a CAF or entity
export async function GET(req: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const cafId = searchParams.get('cafId')
    const entityId = searchParams.get('entityId')
    const entityType = searchParams.get('entityType')

    if (!cafId && !entityId) {
      return NextResponse.json({ error: 'cafId or entityId required' }, { status: 400 })
    }

    let whereClause: any = {}

    if (cafId) {
      whereClause.cafId = cafId
      
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
    } else {
      whereClause.entityId = entityId
      whereClause.entityType = entityType
    }

    const attachments = await db.attachment.findMany({
      where: whereClause,
      include: {
        uploadedBy: {
          include: {
            party: {
              include: {
                person: true
              }
            }
          }
        }
      },
      orderBy: { uploadedAt: 'desc' }
    })

    return NextResponse.json(attachments)

  } catch (error) {
    console.error('Error fetching attachments:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// POST /api/attachments - Upload new attachment
export async function POST(req: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse multipart form data
    const formData = await req.formData()
    const file = formData.get('file') as File
    const cafId = formData.get('cafId') as string
    const entityId = formData.get('entityId') as string
    const entityType = formData.get('entityType') as string
    const attachmentType = formData.get('attachmentType') as string || 'DOCUMENTATION'
    const description = formData.get('description') as string
    const noteContent = formData.get('noteContent') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!cafId && !entityId) {
      return NextResponse.json({ error: 'cafId or entityId required' }, { status: 400 })
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
    const userStaff = await db.staff.findFirst({
      where: { party: { userId } }
    })

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
        cafId: cafId || null,
        entityId: entityId || null,
        entityType: entityType || null,
        uploadedById: userStaff?.id || null,
        uploadedAt: new Date()
      },
      include: {
        uploadedBy: {
          include: {
            party: {
              include: {
                person: true
              }
            }
          }
        }
      }
    })

    // Log the upload activity
    if (cafId) {
      await db.activity_log.create({
        data: {
          id: createId(),
          action: 'ATTACHMENT_UPLOADED',
          entityType: 'corrective_action_form',
          entityId: cafId,
          details: {
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            attachmentType,
            uploadedBy: userStaff ? `${userStaff.party?.person?.firstName} ${userStaff.party?.person?.lastName}` : 'Unknown User'
          },
          userId,
          cafId
        }
      })
    }

    return NextResponse.json(attachment)

  } catch (error) {
    console.error('Error uploading attachment:', error)
    return NextResponse.json({ 
      error: 'Upload failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 