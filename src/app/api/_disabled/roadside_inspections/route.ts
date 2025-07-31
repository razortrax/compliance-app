import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { createId } from '@paralleldrive/cuid2'
import { RinsLevel, RinsResult, DverSource, EntryMethod, ViolationType, ViolationSeverity } from '@prisma/client'

// Interface for roadside inspection data
interface RoadsideInspectionData {
  // DVER Header Information
  reportNumber?: string
  inspectionDate: string // Will be converted to DateTime
  inspectionTime?: string
  inspectorName: string
  inspectorBadge?: string
  
  // Location Details
  inspectionLocation: string
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
  driverDOB?: string // Will be converted to DateTime
  
  // DVER Processing
  dverReceived?: boolean
  dverSource?: DverSource
  entryMethod?: EntryMethod
  
  // Equipment (1-3 units)
  equipment?: Array<{
    unitNumber: number
    unitType?: string
    make?: string
    model?: string
    year?: number
    plateNumber?: string
    plateState?: string
    vin?: string
    equipmentId?: string
    cvsaSticker?: string
    oosSticker?: string
  }>
  
  // Violations
  violations?: Array<{
    violationCode: string
    section?: string
    unitNumber?: number
    outOfService?: boolean
    outOfServiceDate?: string | null
    backInServiceDate?: string | null
    citationNumber?: string
    severity?: string
    description: string
    inspectorComments?: string
    violationType?: string
    assignedPartyId?: string
  }>
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const partyId = searchParams.get('partyId')
    const organizationId = searchParams.get('organizationId')

    let whereClause: any = {}

    if (partyId) {
      // Filter by specific party (driver or equipment)
      whereClause = {
        issue: {
          partyId: partyId
        }
      }
    } else if (organizationId) {
      // Filter by organization - get all RINS for drivers/equipment in this org
      whereClause = {
        issue: {
          party: {
            role: {
              some: {
                organizationId: organizationId,
                isActive: true
              }
            }
          }
        }
      }
    }

    const roadsideInspections = await db.roadside_inspection_issue.findMany({
      where: whereClause,
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return Response.json(roadsideInspections)
  } catch (error) {
    console.error('Error fetching roadside inspections:', error)
    return Response.json({ error: 'Failed to fetch roadside inspections' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data: RoadsideInspectionData & { partyId: string; title: string } = await request.json()

    // Validate required fields
    if (!data.partyId || !data.inspectionDate || !data.inspectorName || !data.inspectionLocation) {
      return Response.json({ 
        error: 'Missing required fields: partyId, inspectionDate, inspectorName, inspectionLocation' 
      }, { status: 400 })
    }

    // Verify party exists and user has access
    const party = await db.party.findUnique({
      where: { id: data.partyId },
      include: { person: true, equipment: true, organization: true, role: true }
    })

    if (!party) {
      return Response.json({ error: 'Party not found' }, { status: 404 })
    }

    // Create the main issue record
    const issueId = createId()
    const issue = await db.issue.create({
      data: {
        id: issueId,
        issueType: 'roadside_inspection',
        partyId: data.partyId,
        title: data.title || `Roadside Inspection - ${data.inspectionLocation}`,
        description: `Report Number: ${data.reportNumber || 'N/A'}`,
        status: 'open',
        priority: data.overallResult === 'Out_Of_Service' ? 'critical' : 'high',
        updatedAt: new Date()
      }
    })

    // Create the roadside inspection record
    const roadsideInspection = await db.roadside_inspection_issue.create({
      data: {
        id: createId(),
        issueId: issueId,
        reportNumber: data.reportNumber,
        inspectionDate: new Date(data.inspectionDate),
        inspectionTime: data.inspectionTime,
        inspectorName: data.inspectorName,
        inspectorBadge: data.inspectorBadge,
        inspectionLocation: data.inspectionLocation,
        facilityName: data.facilityName,
        facilityAddress: data.facilityAddress,
        facilityCity: data.facilityCity,
        facilityState: data.facilityState,
        facilityZip: data.facilityZip,
        inspectionLevel: data.inspectionLevel || null,
        overallResult: data.overallResult || null,
        driverLicense: data.driverLicense,
        driverLicenseState: data.driverLicenseState,
        driverDOB: data.driverDOB ? new Date(data.driverDOB) : null,
        dverReceived: data.dverReceived || false,
        dverSource: data.dverSource || null,
        entryMethod: data.entryMethod || 'Manual_Entry'
      }
    })

    // Create equipment involvement records
    if (data.equipment && data.equipment.length > 0) {
      // Fetch equipment details for each selected equipment
      const equipmentPromises = data.equipment.map(async (eq) => {
        const equipment = await db.equipment.findUnique({
          where: { id: eq.equipmentId }
        })
        
        return db.rins_equipment_involvement.create({
          data: {
            id: createId(),
            rinsId: roadsideInspection.id,
            unitNumber: eq.unitNumber,
            equipmentId: eq.equipmentId,
            make: equipment?.make || '',
            model: equipment?.model || '',
            year: equipment?.year || null,
            plateNumber: equipment?.plateNumber || '',
            vin: equipment?.vinNumber || ''
          }
        })
      })

      await Promise.all(equipmentPromises)
    }

    // Create violation records
    if (data.violations && data.violations.length > 0) {
      await Promise.all(
        data.violations.map(violation => {
          // Convert frontend severity values to Prisma enum values
          let severityValue: ViolationSeverity | null = null
          if (violation.severity === 'WARNING') severityValue = ViolationSeverity.Warning
          else if (violation.severity === 'CITATION') severityValue = ViolationSeverity.Citation
          else if (violation.severity === 'OUT_OF_SERVICE') severityValue = ViolationSeverity.Out_Of_Service

          // Convert frontend violationType values to Prisma enum values
          let violationTypeValue: ViolationType | null = null
          if (violation.violationType === 'DRIVER') violationTypeValue = ViolationType.Driver_Performance
          else if (violation.violationType === 'EQUIPMENT') violationTypeValue = ViolationType.Equipment
          else if (violation.violationType === 'COMPANY') violationTypeValue = ViolationType.Company

          return db.rins_violation.create({
            data: {
              id: createId(),
              rinsId: roadsideInspection.id,
              violationCode: violation.violationCode,
              section: violation.section,
              unitNumber: violation.unitNumber,
              outOfService: violation.outOfService || false,
              // outOfServiceDate: violation.outOfServiceDate ? new Date(violation.outOfServiceDate) : null,
              // backInServiceDate: violation.backInServiceDate ? new Date(violation.backInServiceDate) : null,
              citationNumber: violation.citationNumber,
              severity: severityValue,
              description: violation.description,
              inspectorComments: violation.inspectorComments,
              violationType: violationTypeValue,
              assignedPartyId: violation.assignedPartyId
            }
          })
        })
      )
    }

    // Fetch the complete record to return
    const completeRecord = await db.roadside_inspection_issue.findUnique({
      where: { id: roadsideInspection.id },
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

    return Response.json(completeRecord, { status: 201 })
  } catch (error) {
    console.error('Error creating roadside inspection:', error)
    return Response.json({ error: 'Failed to create roadside inspection' }, { status: 500 })
  }
} 