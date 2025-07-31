import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { rinsId, violationId } = await req.json()

    if (!rinsId || !violationId) {
      return Response.json({ error: 'RINS ID and violation ID are required' }, { status: 400 })
    }

    // Verify the RINS exists and user has access
    const rins = await db.roadside_inspection_issue.findUnique({
      where: { id: rinsId },
      include: {
        issue: {
          include: {
            party: {
              include: {
                role: true
              }
            }
          }
        }
      }
    })

    if (!rins) {
      return Response.json({ error: 'Roadside inspection not found' }, { status: 404 })
    }

    // Access control - check if user has access to this RINS
    let hasAccess = false
    const party = rins.issue.party

    // Direct ownership
    if (party.userId === userId) {
      hasAccess = true
    }

    // Check organization/location access (simplified for now)
    if (!hasAccess) {
      const userMasterOrg = await db.organization.findFirst({
        where: {
          party: { userId: userId }
        }
      })

      if (userMasterOrg) {
        hasAccess = true // Master users have access to manage violations
      }
    }

    if (!hasAccess) {
      return Response.json({ error: 'Unauthorized access to this roadside inspection' }, { status: 403 })
    }

    // Delete the specific violation by ID
    const deletedViolation = await db.rins_violation.deleteMany({
      where: {
        id: violationId,
        rinsId: rinsId // Additional safety check
      }
    })

    if (deletedViolation.count === 0) {
      return Response.json({ error: 'Violation not found' }, { status: 404 })
    }

    return Response.json({ 
      success: true, 
      message: `Violation deleted successfully`,
      deletedCount: deletedViolation.count
    })

  } catch (error) {
    console.error('Error deleting violation:', error)
    return Response.json({ 
      error: 'Failed to delete violation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 