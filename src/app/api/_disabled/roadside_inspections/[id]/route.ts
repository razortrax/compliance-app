import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { RinsLevel, RinsResult, DverSource, EntryMethod, ViolationType, ViolationSeverity } from '@prisma/client'
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

interface RoadsideInspectionUpdateData {
  // DVER Header Information
  reportNumber?: string
  inspectionDate?: string
  inspectionTime?: string
  inspectorName?: string
  inspectorBadge?: string
  
  // Location Details
  inspectionLocation?: string
  facilityName?: string
  facilityAddress?: string
  facilityCity?: string
  facilityState?: string
  facilityZip?: string
  
  // Inspection Details
  inspectionLevel?: RinsLevel
  overallResult?: RinsResult
  
  // Driver Information (from DVER)
  driverLicense?: string
  driverLicenseState?: string
  driverDOB?: string
  
  // DVER Processing
  dverReceived?: boolean
  dverSource?: DverSource
  entryMethod?: EntryMethod
  
  // Related data
  equipment?: Array<{
    unitNumber: number
    equipmentId: string
  }>
  violations?: Array<{
    violationCode: string
    description: string
    unitNumber?: number
    outOfService: boolean
    outOfServiceDate?: Date | null
    backInServiceDate?: Date | null
    inspectorComments: string
    severity: 'WARNING' | 'OUT_OF_SERVICE' | 'CITATION'
    violationType: 'DRIVER' | 'EQUIPMENT' | 'COMPANY'
  }>
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log('🔧 GET RINS - Starting request for ID:', params.id)
    
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const roadsideInspection = await db.roadside_inspection_issue.findUnique({
      where: { id: params.id },
      include: {
        issue: {
          include: {
            party: {
              include: {
                person: true,
                equipment: true,
                organization: true,
                role: true
              }
            }
          }
        },
        equipment: true,
        violations: {
          include: {
            violation_code_ref: true
          }
        }
      }
    })

    if (!roadsideInspection) {
      return Response.json({ error: 'Roadside inspection not found' }, { status: 404 })
    }

    // Access control check - simplified for now
    // TODO: Add proper access control logic here

    console.log('🔧 GET RINS - Found inspection with', roadsideInspection.violations.length, 'violations')

    return Response.json(roadsideInspection)

  } catch (error) {
    console.error('🔧 GET RINS - Error:', error)
    return Response.json({ 
      error: 'Failed to fetch roadside inspection',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔧 PUT RINS - Starting request for ID:', params.id)
    
    const { userId } = await auth()
    console.log('🔧 PUT RINS - User ID from auth:', userId)
    
    if (!userId) {
      console.log('🔧 PUT RINS - No user ID, returning 401')
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔧 PUT RINS - User authenticated, proceeding...')

    // First check if the roadside inspection exists and user has access
    const existingRoadsideInspection = await db.roadside_inspection_issue.findUnique({
      where: { id: params.id },
      include: {
        issue: {
          include: {
            party: {
              include: {
                person: true,
                equipment: true,
                organization: true,
                role: true
              }
            }
          }
        }
      }
    })

    if (!existingRoadsideInspection) {
      return Response.json({ error: 'Roadside inspection not found' }, { status: 404 })
    }

    // Same access control logic as GET
    let hasAccess = false
    const party = existingRoadsideInspection.issue.party

    // 1. Check direct ownership first
    if (party.userId === userId) {
      hasAccess = true
    }

    if (!hasAccess) {
      // Get the driver's role to find their organization and location
      const driverRole = await db.role.findFirst({
        where: {
          partyId: party.id,
          isActive: true
        }
      })

      if (driverRole) {
        // 2. Check if user is a Master consultant who manages this organization
        const userMasterOrg = await db.organization.findFirst({
          where: {
            party: { userId: userId }
          }
        })

        if (userMasterOrg) {
          // Check if master org manages the driver's organization
          const masterRole = await db.role.findFirst({
            where: {
              roleType: 'master',
              partyId: userMasterOrg.partyId,
              organizationId: driverRole.organizationId,
              isActive: true
            }
          })

          if (masterRole) {
            hasAccess = true
          }
        }

        // 3. Check if user manages the same organization
        if (!hasAccess) {
          const userOrgRole = await db.role.findFirst({
            where: {
              party: { userId: userId },
              organizationId: driverRole.organizationId,
              isActive: true
            }
          })

          if (userOrgRole) {
            hasAccess = true
          }
        }

        // 4. Check if user manages the same location
        if (!hasAccess && driverRole.locationId) {
          const userLocationRole = await db.role.findFirst({
            where: {
              party: { userId: userId },
              locationId: driverRole.locationId,
              isActive: true
            }
          })

          if (userLocationRole) {
            hasAccess = true
          }
        }
      }
    }

    if (!hasAccess) {
      return Response.json({ error: 'Access denied' }, { status: 403 })
    }

    const data: RoadsideInspectionUpdateData = await request.json()

    // Prepare update data
    const updateData: any = {}
    
    if (data.reportNumber !== undefined) updateData.reportNumber = data.reportNumber
    if (data.inspectionDate) updateData.inspectionDate = new Date(data.inspectionDate)
    if (data.inspectionTime !== undefined) updateData.inspectionTime = data.inspectionTime
    if (data.inspectorName !== undefined) updateData.inspectorName = data.inspectorName
    if (data.inspectorBadge !== undefined) updateData.inspectorBadge = data.inspectorBadge
    if (data.inspectionLocation !== undefined) updateData.inspectionLocation = data.inspectionLocation
    if (data.facilityName !== undefined) updateData.facilityName = data.facilityName
    if (data.facilityAddress !== undefined) updateData.facilityAddress = data.facilityAddress
    if (data.facilityCity !== undefined) updateData.facilityCity = data.facilityCity
    if (data.facilityState !== undefined) updateData.facilityState = data.facilityState
    if (data.facilityZip !== undefined) updateData.facilityZip = data.facilityZip
    if (data.inspectionLevel !== undefined) updateData.inspectionLevel = data.inspectionLevel || null
    if (data.overallResult !== undefined) updateData.overallResult = data.overallResult || null
    if (data.driverLicense !== undefined) updateData.driverLicense = data.driverLicense
    if (data.driverLicenseState !== undefined) updateData.driverLicenseState = data.driverLicenseState
    if (data.driverDOB) updateData.driverDOB = new Date(data.driverDOB)
    if (data.dverReceived !== undefined) updateData.dverReceived = data.dverReceived
    if (data.dverSource !== undefined) updateData.dverSource = data.dverSource || null
    if (data.entryMethod !== undefined) updateData.entryMethod = data.entryMethod || null

    // Update the roadside inspection
    const updatedRoadsideInspection = await db.roadside_inspection_issue.update({
      where: { id: params.id },
      data: updateData,
      include: {
        issue: {
          include: {
            party: {
              include: {
                person: true,
                equipment: true,
                organization: true
              }
            }
          }
        },
        equipment: true,
        violations: true
      }
    })

    // Handle equipment updates
    if (data.equipment !== undefined) {
      // Delete existing equipment associations
      await db.rins_equipment_involvement.deleteMany({
        where: { rinsId: params.id }
      })

      // Create new equipment associations
      if (data.equipment.length > 0) {
        // Fetch equipment details for each selected equipment
        const equipmentPromises = data.equipment.map(async (eq) => {
          const equipment = await db.equipment.findUnique({
            where: { id: eq.equipmentId }
          })
          
          return {
            id: createId(),
            rinsId: params.id,
            equipmentId: eq.equipmentId,
            unitNumber: eq.unitNumber,
            make: equipment?.make || '',
            model: equipment?.model || '',
            year: equipment?.year || null,
            plateNumber: equipment?.plateNumber || '',
            vin: equipment?.vinNumber || ''
          }
        })

        const equipmentInvolvements = await Promise.all(equipmentPromises)
        
        await db.rins_equipment_involvement.createMany({
          data: equipmentInvolvements
        })
      }
    }

    // Handle violations updates
    if (data.violations !== undefined) {
      console.log('🔧 PUT RINS - Processing violations, count:', data.violations.length)
      
      // Only delete and recreate if we're doing a bulk update with violations
      // For individual saves, we want to preserve existing violations
      if (data.violations.length > 0) {
        console.log('🔧 PUT RINS - Adding new violations without deleting existing ones')
        
        // Add new violations (don't delete existing ones)
        await db.rins_violation.createMany({
          data: data.violations.map(violation => ({
            id: createId(),
            rinsId: params.id,
            violationCode: violation.violationCode,
            description: violation.description,
            unitNumber: violation.unitNumber,
            outOfService: violation.outOfService,
            outOfServiceDate: violation.outOfServiceDate,
            backInServiceDate: violation.backInServiceDate,
            inspectorComments: violation.inspectorComments,
            violationType: mapViolationTypeToPrisma(violation.violationType),
            severity: violation.severity === 'OUT_OF_SERVICE' ? 'Out_Of_Service' as ViolationSeverity : 
                     violation.severity === 'CITATION' ? 'Citation' as ViolationSeverity : 
                     'Warning' as ViolationSeverity
          }))
        })
      } else {
        console.log('🔧 PUT RINS - Empty violations array, preserving existing violations')
        // Don't delete existing violations when array is empty - preserve individually saved ones
      }
    }

    // Fetch the final updated roadside inspection with all related data
    const finalUpdatedInspection = await db.roadside_inspection_issue.findUnique({
      where: { id: params.id },
      include: {
        issue: {
          include: {
            party: {
              include: {
                person: true,
                equipment: true,
                organization: true
              }
            }
          }
        },
        equipment: true,
        violations: true
      }
    })

    return Response.json(finalUpdatedInspection)
  } catch (error: any) {
    console.error('🔧 PUT RINS - Error updating roadside inspection:', error)
    console.error('🔧 PUT RINS - Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    })
    return Response.json({ 
      error: 'Failed to update roadside inspection',
      details: error?.message || 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if the roadside inspection exists and user has access
    const existingRoadsideInspection = await db.roadside_inspection_issue.findUnique({
      where: { id: params.id },
      include: {
        issue: {
          include: {
            party: {
              include: {
                person: true,
                equipment: true,
                organization: true,
                role: true
              }
            }
          }
        }
      }
    })

    if (!existingRoadsideInspection) {
      return Response.json({ error: 'Roadside inspection not found' }, { status: 404 })
    }

    // Same access control logic as GET and PUT
    let hasAccess = false
    const party = existingRoadsideInspection.issue.party

    // 1. Check direct ownership first
    if (party.userId === userId) {
      hasAccess = true
    }

    if (!hasAccess) {
      // Get the driver's role to find their organization and location
      const driverRole = await db.role.findFirst({
        where: {
          partyId: party.id,
          isActive: true
        }
      })

      if (driverRole) {
        // 2. Check if user is a Master consultant who manages this organization
        const userMasterOrg = await db.organization.findFirst({
          where: {
            party: { userId: userId }
          }
        })

        if (userMasterOrg) {
          // Check if master org manages the driver's organization
          const masterRole = await db.role.findFirst({
            where: {
              roleType: 'master',
              partyId: userMasterOrg.partyId,
              organizationId: driverRole.organizationId,
              isActive: true
            }
          })

          if (masterRole) {
            hasAccess = true
          }
        }

        // 3. Check if user manages the same organization
        if (!hasAccess) {
          const userOrgRole = await db.role.findFirst({
            where: {
              party: { userId: userId },
              organizationId: driverRole.organizationId,
              isActive: true
            }
          })

          if (userOrgRole) {
            hasAccess = true
          }
        }

        // 4. Check if user manages the same location
        if (!hasAccess && driverRole.locationId) {
          const userLocationRole = await db.role.findFirst({
            where: {
              party: { userId: userId },
              locationId: driverRole.locationId,
              isActive: true
            }
          })

          if (userLocationRole) {
            hasAccess = true
          }
        }
      }
    }

    if (!hasAccess) {
      return Response.json({ error: 'Access denied' }, { status: 403 })
    }

    // Soft delete by updating the issue status
    await db.issue.update({
      where: { id: existingRoadsideInspection.issueId },
      data: { status: 'deleted' }
    })

    return Response.json({ message: 'Roadside inspection deleted successfully' })
  } catch (error) {
    console.error('Error deleting roadside inspection:', error)
    return Response.json({ error: 'Failed to delete roadside inspection' }, { status: 500 })
  }
} 