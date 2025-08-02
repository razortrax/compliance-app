import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { createId } from '@paralleldrive/cuid2'
import { ViolationType, ViolationSeverity } from '@prisma/client'

interface IncidentData {
  // Basic incident information
  incidentType: 'ACCIDENT' | 'ROADSIDE_INSPECTION'
  incidentDate: string
  incidentTime?: string
  officerName: string
  agencyName?: string
  officerBadge?: string
  reportNumber?: string
  locationAddress?: string
  locationCity?: string
  locationState?: string
  locationZip?: string
  
  // Type-specific data
  accidentData?: any
  roadsideData?: any
  
  // Equipment involvement
  equipment?: Array<{
    unitNumber: number
    equipmentId?: string
    unitType?: string
    make?: string
    model?: string
    year?: number
    plateNumber?: string
    plateState?: string
    vin?: string
    cvsaSticker?: string
    oosSticker?: string
  }>
  
  // Violations
  violations?: Array<{
    violationCode: string
    section?: string
    unitNumber?: number
    outOfService?: boolean
    citationNumber?: string
    severity?: 'WARNING' | 'CITATION' | 'CRIMINAL'
    description: string
    inspectorComments?: string
    violationType?: 'DRIVER' | 'EQUIPMENT' | 'COMPANY'
  }>
  
  // Standard issue fields
  title?: string
  description?: string
  dueDate?: string
  partyId: string
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const partyId = url.searchParams.get('partyId')
    const incidentType = url.searchParams.get('incidentType') as 'ACCIDENT' | 'ROADSIDE_INSPECTION' | null
    
    if (!partyId) {
      return Response.json({ error: 'partyId is required' }, { status: 400 })
    }

    // Build where clause
    const whereClause: any = {
      issue: {
        partyId: partyId
      }
    }

    // Filter by incident type if specified
    if (incidentType) {
      whereClause.incidentType = incidentType
    }

    const incidents = await db.incident.findMany({
      where: whereClause,
      include: {
        issue: true,
        equipment: {
          include: {
            equipment: true
          }
        },
        violations: {
          include: {
            violation_code_ref: true,
            corrective_action_forms: {
              include: {
                assigned_staff: {
                  include: {
                    party: {
                      include: {
                        person: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return Response.json(incidents)
  } catch (error) {
    console.error('Error fetching incidents:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: IncidentData = await request.json()
    
    // Validate required fields
    if (!body.incidentDate || !body.officerName || !body.partyId || !body.incidentType) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if party exists and user has access
    const party = await db.party.findUnique({
      where: { id: body.partyId },
      include: { 
        organization: true
      }
    })

    if (!party) {
      return Response.json({ error: 'Party not found' }, { status: 404 })
    }

    // Access control check
    if (party.userId !== userId) {
      // Check if user has role access to this party's organization
      const hasAccess = await db.role.findFirst({
        where: {
          party: { userId },
          organizationId: party.organization?.id,
          isActive: true
        }
      })

      if (!hasAccess) {
        return Response.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    // Use transaction for incident with related data
    const result = await db.$transaction(async (tx) => {
      // Create the main issue
      const issue = await tx.issue.create({
        data: {
          id: createId(),
          updatedAt: new Date(),
          issueType: body.incidentType.toLowerCase(),
          status: 'active',
          priority: 'medium',
          partyId: body.partyId,
          title: body.title || `${body.incidentType} Incident`,
          description: body.description || `${body.incidentType} incident record`,
          dueDate: body.dueDate ? new Date(body.dueDate) : null
        }
      })

      // Create the incident
      const incident = await tx.incident.create({
        data: {
          issueId: issue.id,
          incidentType: body.incidentType,
          incidentDate: new Date(body.incidentDate),
          incidentTime: body.incidentTime,
          officerName: body.officerName,
          agencyName: body.agencyName,
          officerBadge: body.officerBadge,
          reportNumber: body.reportNumber,
          locationAddress: body.locationAddress,
          locationCity: body.locationCity,
          locationState: body.locationState,
          locationZip: body.locationZip,
          accidentData: body.accidentData,
          roadsideData: body.roadsideData
        }
      })

      // Create equipment involvement
      if (body.equipment && body.equipment.length > 0) {
        await tx.incident_equipment_involvement.createMany({
          data: body.equipment.map(eq => ({
            incidentId: incident.id,
            unitNumber: eq.unitNumber,
            equipmentId: eq.equipmentId,
            unitType: eq.unitType,
            make: eq.make,
            model: eq.model,
            year: eq.year,
            plateNumber: eq.plateNumber,
            plateState: eq.plateState,
            vin: eq.vin,
            cvsaSticker: eq.cvsaSticker,
            oosSticker: eq.oosSticker
          }))
        })
      }

      // Create violations
      if (body.violations && body.violations.length > 0) {
        for (const violation of body.violations) {
          // Map severity values to Prisma enum
          let mappedSeverity: ViolationSeverity | null = null
          if (violation.severity) {
            switch (violation.severity.toUpperCase()) {
              case 'WARNING':
                mappedSeverity = ViolationSeverity.Warning
                break
              case 'CITATION':
                mappedSeverity = ViolationSeverity.Citation
                break
              case 'OUT_OF_SERVICE':
              case 'OOS':
                mappedSeverity = ViolationSeverity.Out_Of_Service
                break
              default:
                console.warn(`Unknown severity: ${violation.severity}`)
                mappedSeverity = null
            }
          }

          // Map violation type values to Prisma enum
          let mappedViolationType: ViolationType | null = null
          if (violation.violationType) {
            switch (violation.violationType.toUpperCase()) {
              case 'DRIVER':
              case 'DRIVER_QUALIFICATION':
                mappedViolationType = ViolationType.Driver_Qualification
                break
              case 'DRIVER_PERFORMANCE':
                mappedViolationType = ViolationType.Driver_Performance
                break
              case 'EQUIPMENT':
                mappedViolationType = ViolationType.Equipment
                break
              case 'COMPANY':
              case 'OTHER':
                mappedViolationType = ViolationType.Company
                break
              default:
                console.warn(`Unknown violation type: ${violation.violationType}`)
                mappedViolationType = ViolationType.Company
            }
          }

          await tx.incident_violation.create({
            data: {
              incidentId: incident.id,
              violationCode: violation.violationCode,
              section: violation.section || null,
              unitNumber: violation.unitNumber || null,
              outOfService: violation.outOfService || false,
              citationNumber: violation.citationNumber || null,
              severity: mappedSeverity,
              description: violation.description,
              inspectorComments: violation.inspectorComments || null,
              violationType: mappedViolationType
            }
          })
        }
      }

      return incident
    })

    // Return with full data
    const fullIncident = await db.incident.findUnique({
      where: { id: result.id },
      include: {
        issue: true,
        equipment: { include: { equipment: true } },
        violations: { 
          include: { 
            violation_code_ref: true,
            corrective_action_forms: true
          } 
        }
      }
    })

    return Response.json(fullIncident, { status: 201 })
  } catch (error) {
    console.error('Error creating incident:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
} 