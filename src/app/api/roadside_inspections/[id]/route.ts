import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { RinsLevel, RinsResult, DverSource, EntryMethod, ViolationType, ViolationSeverity } from '@prisma/client'
import { createId } from '@paralleldrive/cuid2'

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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
        violations: true
      }
    })

    if (!roadsideInspection) {
      return Response.json({ error: 'Roadside inspection not found' }, { status: 404 })
    }

    // Access control check - support Master, Organization, and Location managers
    let hasAccess = false
    const party = roadsideInspection.issue.party

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

    return Response.json(roadsideInspection)
  } catch (error) {
    console.error('Error fetching roadside inspection:', error)
    return Response.json({ error: 'Failed to fetch roadside inspection' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
      // Delete existing violations
      await db.rins_violation.deleteMany({
        where: { rinsId: params.id }
      })

      // Create new violations
      if (data.violations.length > 0) {
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
            violationType: violation.violationType as ViolationType,
            severity: violation.severity === 'OUT_OF_SERVICE' ? 'Critical' as ViolationSeverity : 
                     violation.severity === 'CITATION' ? 'Major' as ViolationSeverity : 
                     'Warning' as ViolationSeverity
          }))
        })
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
  } catch (error) {
    console.error('Error updating roadside inspection:', error)
    return Response.json({ error: 'Failed to update roadside inspection' }, { status: 500 })
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