import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
// import { uploadToSpaces, generateFileKey } from '@/lib/storage'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-ms-wmv'
]

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contentType = request.headers.get('content-type')
    
    // Handle JSON requests for notes
    if (contentType?.includes('application/json')) {
      const body = await request.json()
      const { issueId, attachmentType, title, description, noteContent } = body

      if (!issueId || !attachmentType || !noteContent) {
        return Response.json({ 
          error: 'Missing required fields: issueId, attachmentType, noteContent' 
        }, { status: 400 })
      }

      // Check access to issue (simplified for notes)
      const issue = await db.issue.findUnique({
        where: { id: issueId },
        include: { party: true }
      })

      if (!issue) {
        return Response.json({ error: 'Issue not found' }, { status: 404 })
      }

      // Create note attachment
      const attachment = await db.attachment.create({
        data: {
          issueId,
          fileName: `${title || 'Note'}.txt`,
          fileType: 'text/plain',
          fileSize: Buffer.byteLength(noteContent, 'utf8'),
          filePath: '', // No file path for notes
          attachmentType,
          description: description || null,
          noteContent,
          uploadedBy: userId
        }
      })

      return Response.json({ attachment }, { status: 201 })
    }

    // Handle multipart form data for file uploads
    // TODO: Re-enable once DigitalOcean Spaces is configured
    return Response.json({ 
      error: 'File uploads are temporarily disabled while DigitalOcean Spaces is being configured' 
    }, { status: 503 })

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

    // Add URLs to attachments (for file uploads when Spaces is configured)
    const attachmentsWithUrls = attachments.map(attachment => ({
      ...attachment,
      url: attachment.filePath ? 
        `${process.env.DO_SPACES_CDN_ENDPOINT || process.env.DO_SPACES_ENDPOINT}/${process.env.DO_SPACES_BUCKET}/${attachment.filePath}` :
        null // No URL for notes
    }))

    return Response.json(attachmentsWithUrls)

  } catch (error) {
    console.error('Error fetching attachments:', error)
    return Response.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
} 