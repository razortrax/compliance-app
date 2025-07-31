import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { ViolationType, ViolationSeverity } from '@prisma/client'
import { createId } from '@paralleldrive/cuid2'

// Helper function to map frontend violation types to Prisma enum values
function mapViolationTypeToPrisma(frontendType: string): ViolationType {
  switch (frontendType?.toUpperCase()) {
    case 'EQUIPMENT':
    case 'VEHICLE':
      return ViolationType.Equipment
    case 'DRIVER':
    case 'DRIVER_QUALIFICATION':
      return ViolationType.Driver_Qualification  
    case 'DRIVER_PERFORMANCE':
      return ViolationType.Driver_Performance
    case 'COMPANY':
    case 'OTHER':
    default:
      return ViolationType.Company
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { rinsId, violation } = await req.json()

    if (!rinsId) {
      return Response.json({ error: 'RINS ID is required' }, { status: 400 })
    }

    if (!violation || !violation.violationCode || !violation.inspectorComments?.trim()) {
      return Response.json({ error: 'Violation code and inspector comments are required' }, { status: 400 })
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

    // Create the new violation
    const newViolation = await db.rins_violation.create({
      data: {
        id: createId(),
        rinsId: rinsId,
        violationCode: violation.violationCode,
        description: violation.description,
        unitNumber: violation.unitNumber,
        outOfService: violation.outOfService || false,
        outOfServiceDate: violation.outOfServiceDate ? new Date(violation.outOfServiceDate) : null,
        backInServiceDate: violation.backInServiceDate ? new Date(violation.backInServiceDate) : null,
        inspectorComments: violation.inspectorComments,
        violationType: mapViolationTypeToPrisma(violation.violationType),
        severity: violation.severity === 'OUT_OF_SERVICE' ? 'Out_Of_Service' as ViolationSeverity : 
                 violation.severity === 'CITATION' ? 'Citation' as ViolationSeverity : 
                 'Warning' as ViolationSeverity
      }
    })

    return Response.json({ 
      success: true, 
      violation: newViolation,
      message: 'Violation saved successfully' 
    })

  } catch (error) {
    console.error('Error saving violation:', error)
    return Response.json({ 
      error: 'Failed to save violation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 