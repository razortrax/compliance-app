import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { createId } from '@paralleldrive/cuid2'
import { unlink, readFile } from 'fs/promises'

// GET /api/attachments/[id] - Get attachment details
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const attachment = await db.attachment.findUnique({
      where: { id: params.id },
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

    if (!attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
    }

    // Verify user has access
    if (attachment.cafId) {
      const caf = await db.corrective_action_form.findUnique({
        where: { id: attachment.cafId },
        select: { organizationId: true }
      })

      if (caf) {
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
      }
    }

    return NextResponse.json(attachment)

  } catch (error) {
    console.error('Error fetching attachment:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// DELETE /api/attachments/[id] - Delete attachment
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const attachment = await db.attachment.findUnique({
      where: { id: params.id }
    })

    if (!attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
    }

    // Verify user has access and permission to delete
    if (attachment.cafId) {
      const caf = await db.corrective_action_form.findUnique({
        where: { id: attachment.cafId },
        select: { organizationId: true, status: true }
      })

      if (caf) {
        // Don't allow deletion of attachments on approved CAFs
        if (caf.status === 'APPROVED') {
          return NextResponse.json({ 
            error: 'Cannot delete attachments from approved CAFs' 
          }, { status: 403 })
        }

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
      }
    }

    // Delete file from disk
    try {
      await unlink(attachment.filePath)
    } catch (fileError) {
      console.warn('Could not delete file from disk:', fileError)
      // Continue with database deletion even if file deletion fails
    }

    // Delete from database
    await db.attachment.delete({
      where: { id: params.id }
    })

    // Log the deletion
    if (attachment.cafId) {
      await db.activity_log.create({
        data: {
          id: createId(),
          action: 'ATTACHMENT_DELETED',
          entityType: 'corrective_action_form',
          entityId: attachment.cafId,
          details: {
            fileName: attachment.fileName,
            fileType: attachment.fileType,
            deletedBy: userId
          },
          userId,
          cafId: attachment.cafId
        }
      })
    }

    return NextResponse.json({ message: 'Attachment deleted successfully' })

  } catch (error) {
    console.error('Error deleting attachment:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
} 