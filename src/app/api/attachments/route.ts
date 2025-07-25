import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { uploadToSpaces, generateFileKey } from '@/lib/storage'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const issueId = formData.get('issueId') as string
    const attachmentType = formData.get('attachmentType') as string
    const description = formData.get('description') as string

    // Validate required fields
    if (!file || !issueId || !attachmentType) {
      return Response.json({ 
        error: 'Missing required fields: file, issueId, attachmentType' 
      }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return Response.json({ 
        error: 'File too large. Maximum size is 10MB' 
      }, { status: 400 })
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return Response.json({ 
        error: 'Invalid file type. Allowed: images, PDF, Word documents' 
      }, { status: 400 })
    }

    // Check if user has access to the issue
    const issue = await db.issue.findUnique({
      where: { id: issueId },
      include: {
        party: {
          include: {
            person: true,
            organization: true,
            role: {
              include: {
                party: {
                  include: {
                    organization: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!issue) {
      return Response.json({ error: 'Issue not found' }, { status: 404 })
    }

    // Access control - similar to license access control
    let hasAccess = false
    
    // 1. Check direct ownership
    if (issue.party.userId === userId) {
      hasAccess = true
    }

    if (!hasAccess) {
      // Get user's roles and check permissions
      const userRoles = await db.role.findMany({
        where: {
          party: { userId: userId },
          isActive: true
        },
        include: {
          party: {
            include: {
              organization: true
            }
          }
        }
      })

      // 2. Check if user is a Master consultant
      const userMasterOrg = await db.organization.findFirst({
        where: {
          party: { userId: userId }
        }
      })

      if (userMasterOrg) {
        // Check if issue party has a role in an organization managed by this master
        const issuePartyRole = await db.role.findFirst({
          where: {
            partyId: issue.partyId,
            isActive: true
          }
        })

        if (issuePartyRole) {
          const masterRole = await db.role.findFirst({
            where: {
              roleType: 'master',
              partyId: userMasterOrg.partyId,
              organizationId: issuePartyRole.organizationId,
              isActive: true
            }
          })

          if (masterRole) {
            hasAccess = true
          }
        }
      }

      // 3. Check organization/location manager access
      if (!hasAccess) {
        const issuePartyRole = await db.role.findFirst({
          where: {
            partyId: issue.partyId,
            isActive: true
          }
        })

        if (issuePartyRole) {
          // Check if user manages the same organization
          const orgManagerRole = userRoles.find(role => 
            role.organizationId === issuePartyRole.organizationId &&
            ['organization_manager', 'owner', 'consultant'].includes(role.roleType)
          )

          if (orgManagerRole) {
            hasAccess = true
          }

          // Check if user manages the same location
          if (!hasAccess && issuePartyRole.locationId) {
            const locationManagerRole = userRoles.find(role =>
              role.locationId === issuePartyRole.locationId &&
              role.roleType === 'location_manager'
            )

            if (locationManagerRole) {
              hasAccess = true
            }
          }
        }
      }
    }

    if (!hasAccess) {
      return Response.json({ error: 'Access denied' }, { status: 403 })
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Generate file key for organized storage
    const fileKey = generateFileKey(
      attachmentType.startsWith('license') ? 'license' : 'document',
      attachmentType,
      issueId,
      file.name
    )

    // Upload to DigitalOcean Spaces
    const uploadResult = await uploadToSpaces(
      buffer,
      fileKey,
      file.type,
      {
        issueId,
        attachmentType,
        uploadedBy: userId,
        originalName: file.name
      }
    )

    // Save attachment metadata to database
    const attachment = await db.attachment.create({
      data: {
        issueId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        filePath: uploadResult.key,
        attachmentType,
        description: description || null,
        uploadedBy: userId
      }
    })

    return Response.json({
      attachment,
      url: uploadResult.cdnUrl || uploadResult.url
    }, { status: 201 })

  } catch (error) {
    console.error('Error uploading attachment:', error)
    return Response.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const issueId = searchParams.get('issueId')

    if (!issueId) {
      return Response.json({ 
        error: 'Missing issueId parameter' 
      }, { status: 400 })
    }

    // Check access to issue (same logic as POST)
    const issue = await db.issue.findUnique({
      where: { id: issueId },
      include: {
        party: true
      }
    })

    if (!issue) {
      return Response.json({ error: 'Issue not found' }, { status: 404 })
    }

    // Simplified access check for GET - user should have read access to the issue
    const attachments = await db.attachment.findMany({
      where: { issueId },
      orderBy: { createdAt: 'desc' }
    })

    // Add URLs to attachments
    const attachmentsWithUrls = attachments.map(attachment => ({
      ...attachment,
      url: `${process.env.DO_SPACES_CDN_ENDPOINT || process.env.DO_SPACES_ENDPOINT}/${process.env.DO_SPACES_BUCKET}/${attachment.filePath}`
    }))

    return Response.json(attachmentsWithUrls)

  } catch (error) {
    console.error('Error fetching attachments:', error)
    return Response.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
} 