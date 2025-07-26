import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { createId } from '@paralleldrive/cuid2'
import { PhysicalType } from '@prisma/client'

// Define types for Physical data
export interface PhysicalIssueData {
  type?: string
  medicalExaminer?: string
  selfCertified?: boolean
  nationalRegistry?: boolean
  startDate?: string
  expirationDate?: string
  renewalDate?: string
  partyId: string
  title: string
  description?: string
  priority?: string
}

// GET /api/physical_issues - List Physical issues with filtering
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const partyId = searchParams.get('partyId')
    const type = searchParams.get('type')

    // Build where clause for filtering
    const where: any = {}
    if (partyId) {
      where.issue = { partyId }
    }
    if (type) {
      where.type = type
    }

    const physicalIssues = await db.physical_issue.findMany({
      where,
      include: {
        issue: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return Response.json(physicalIssues)
  } catch (error) {
    console.error('Error fetching physical issues:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/physical_issues - Create a new Physical issue
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: PhysicalIssueData = await request.json()

    // Validate required fields
    if (!body.partyId) {
      return Response.json({ error: 'partyId is required' }, { status: 400 })
    }

    // Check if party exists and user has access
    const party = await db.party.findUnique({
      where: { id: body.partyId },
      include: {
        person: true,
        organization: true,
        role: true
      }
    })

    if (!party) {
      return Response.json({ error: 'Party not found' }, { status: 404 })
    }

    // TODO: Implement full access control as in licenses
    // For now, allow basic access (same as MVR)

    // Create the main issue
    const issue = await db.issue.create({
      data: {
        id: createId(),
        updatedAt: new Date(),
        issueType: 'physical',
        status: 'active',
        priority: body.priority || 'medium',
        partyId: body.partyId,
        title: body.title || 'Physical Issue',
        description: body.description || 'Physical examination record',
        dueDate: body.expirationDate ? new Date(body.expirationDate) : null
      }
    })

    // Create the Physical issue
    const physicalIssue = await db.physical_issue.create({
      data: {
        issueId: issue.id,
        type: body.type ? body.type as PhysicalType : undefined,
        medicalExaminer: body.medicalExaminer,
        selfCertified: body.selfCertified ?? false,
        nationalRegistry: body.nationalRegistry ?? false,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        expirationDate: body.expirationDate ? new Date(body.expirationDate) : undefined,
        renewalDate: body.renewalDate ? new Date(body.renewalDate) : undefined,
      },
      include: {
        issue: true
      }
    })

    return Response.json(physicalIssue, { status: 201 })
  } catch (error) {
    console.error('Error creating physical issue:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
} 