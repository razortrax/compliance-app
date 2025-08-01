import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { PhysicalType, PhysicalResult, PhysicalStatus } from '@prisma/client'

interface PhysicalUpdateData {
  type?: string
  medicalExaminer?: string
  selfCertified?: boolean
  nationalRegistry?: boolean
  result?: string
  status?: string
  startDate?: string
  expirationDate?: string
  outOfServiceDate?: string
  backInServiceDate?: string
  title?: string
  description?: string
  priority?: string
}

// GET /api/physical_issues/[id] - Get specific Physical issue
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const physical = await db.physical_issue.findUnique({
      where: { id: params.id },
      include: {
        issue: {
          include: {
            party: {
              include: {
                person: true,
                organization: true,
              }
            }
          }
        }
      }
    })

    if (!physical) {
      return Response.json({ error: 'Physical issue not found' }, { status: 404 })
    }

    return Response.json(physical)
  } catch (error) {
    console.error('Error fetching physical issue:', error)
    return Response.json({ error: 'Failed to fetch physical issue' }, { status: 500 })
  }
}

// PUT /api/physical_issues/[id] - Update specific Physical issue
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: PhysicalUpdateData = await request.json()

    // Check if physical exists and user has access
    const existingPhysical = await db.physical_issue.findUnique({
      where: { id: params.id },
      include: { issue: true }
    })

    if (!existingPhysical) {
      return Response.json({ error: 'Physical issue not found' }, { status: 404 })
    }

    // Update the issue record if needed
    if (body.title || body.description || body.priority) {
      await db.issue.update({
        where: { id: existingPhysical.issueId },
        data: {
          title: body.title,
          description: body.description,
          priority: body.priority,
          updatedAt: new Date()
        }
      })
    }

    // Update the physical_issue record
    const updatedPhysical = await db.physical_issue.update({
      where: { id: params.id },
      data: {
        type: body.type as PhysicalType,
        medicalExaminer: body.medicalExaminer,
        selfCertified: body.selfCertified,
        nationalRegistry: body.nationalRegistry,
        result: body.result ? body.result as PhysicalResult : undefined,
        status: body.status ? body.status as PhysicalStatus : undefined,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        expirationDate: body.expirationDate ? new Date(body.expirationDate) : undefined,
        outOfServiceDate: body.outOfServiceDate ? new Date(body.outOfServiceDate) : undefined,
        backInServiceDate: body.backInServiceDate ? new Date(body.backInServiceDate) : undefined,
        updatedAt: new Date()
      },
      include: {
        issue: true
      }
    })

    return Response.json(updatedPhysical)
  } catch (error) {
    console.error('Error updating physical issue:', error)
    return Response.json({ error: 'Failed to update physical issue', details: error }, { status: 500 })
  }
}

// DELETE /api/physical_issues/[id] - Delete specific Physical issue
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if physical exists
    const existingPhysical = await db.physical_issue.findUnique({
      where: { id: params.id },
      include: { issue: true }
    })

    if (!existingPhysical) {
      return Response.json({ error: 'Physical issue not found' }, { status: 404 })
    }

    // Delete physical_issue first (due to foreign key)
    await db.physical_issue.delete({
      where: { id: params.id }
    })

    // Delete the base issue
    await db.issue.delete({
      where: { id: existingPhysical.issueId }
    })

    return Response.json({ message: 'Physical issue deleted successfully' })
  } catch (error) {
    console.error('Error deleting physical issue:', error)
    return Response.json({ error: 'Failed to delete physical issue' }, { status: 500 })
  }
} 