import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { createId } from '@paralleldrive/cuid2'
import { ViolationType, ViolationSeverity } from '@prisma/client'

// Interface for accident data
interface AccidentData {
  // Accident Basic Information
  accidentDate: string // Will be converted to DateTime
  accidentTime?: string
  
  // Officer/Agency Information
  officerName: string
  agencyName: string
  reportNumber?: string
  
  // Accident Classifications
  isFatality?: boolean
  isReportable?: boolean
  isInjury?: boolean
  isTow?: boolean
  isCitation?: boolean // True if any violations
  needsReport?: boolean
  needsDrugTest?: boolean
  
  // Additional Details (conditional)
  numberOfFatalities?: number // Required if isFatality
  numberOfVehicles?: number // Number of vehicles involved
  reportableNumber?: string // Required if isReportable
  specimenNumber?: string // Required if needsDrugTest
  
  // Accident Location
  accidentAddress?: string
  accidentCity?: string
  accidentState?: string
  accidentZip?: string
  
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
  }>
  
  // Violations/Citations
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
      // Filter by organization - get all accidents for drivers/equipment in this org
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

    const accidents = await db.accident_issue.findMany({
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
        accidentDate: 'desc'
      }
    })

    return Response.json(accidents)
  } catch (error) {
    console.error('Error fetching accidents:', error)
    return Response.json({ error: 'Failed to fetch accidents' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data: AccidentData & { partyId: string; title: string } = await request.json()

    // Validate required fields
    if (!data.partyId || !data.accidentDate || !data.officerName || !data.agencyName) {
      return Response.json({ 
        error: 'Missing required fields: partyId, accidentDate, officerName, agencyName' 
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
        issueType: 'accident',
        partyId: data.partyId,
        title: data.title || `Accident - ${data.agencyName}`,
        description: `Report Number: ${data.reportNumber || 'N/A'}`,
        status: 'open',
        priority: data.isFatality ? 'critical' : data.isInjury ? 'high' : 'medium',
        updatedAt: new Date()
      }
    })

    // Create the accident record
    const accident = await db.accident_issue.create({
      data: {
        id: createId(),
        issueId: issueId,
        accidentDate: new Date(data.accidentDate),
        accidentTime: data.accidentTime,
        officerName: data.officerName,
        agencyName: data.agencyName,
        reportNumber: data.reportNumber,
        isFatality: data.isFatality || false,
        isReportable: data.isReportable || false,
        isInjury: data.isInjury || false,
        isTow: data.isTow || false,
        isCitation: data.isCitation || false,
        needsReport: data.needsReport || false,
        needsDrugTest: data.needsDrugTest || false,
        numberOfFatalities: data.numberOfFatalities,
        numberOfVehicles: data.numberOfVehicles,
        reportableNumber: data.reportableNumber,
        specimenNumber: data.specimenNumber,
        accidentAddress: data.accidentAddress,
        accidentCity: data.accidentCity,
        accidentState: data.accidentState,
        accidentZip: data.accidentZip
      }
    })

    // Create equipment involvement records
    if (data.equipment && data.equipment.length > 0) {
      // Fetch equipment details for each selected equipment
      const equipmentPromises = data.equipment.map(async (eq) => {
        const equipment = await db.equipment.findUnique({
          where: { id: eq.equipmentId }
        })
        
        return db.accident_equipment_involvement.create({
          data: {
            id: createId(),
            accidentId: accident.id,
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

          return db.accident_violation.create({
            data: {
              id: createId(),
              accidentId: accident.id,
              violationCode: violation.violationCode,
              section: violation.section,
              unitNumber: violation.unitNumber,
              outOfService: violation.outOfService || false,
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
    const completeRecord = await db.accident_issue.findUnique({
      where: { id: accident.id },
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
    console.error('Error creating accident:', error)
    return Response.json({ error: 'Failed to create accident' }, { status: 500 })
  }
} 