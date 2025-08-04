import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { createId } from '@paralleldrive/cuid2'

export async function GET(
  request: NextRequest,
  { params }: { params: { masterOrgId: string; orgId: string; equipmentId: string } }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { masterOrgId, orgId, equipmentId } = params

    // Get equipment details
    const equipment = await db.equipment.findUnique({
      where: { id: equipmentId },
      include: {
        party: true
      }
    })

    if (!equipment) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 })
    }

    // Get organization details
    const organization = await db.organization.findUnique({
      where: { id: orgId },
      select: { id: true, name: true }
    })

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Get master organization details
    const masterOrg = await db.organization.findUnique({
      where: { id: masterOrgId },
      select: { id: true, name: true }
    })

    if (!masterOrg) {
      return NextResponse.json({ error: 'Master organization not found' }, { status: 404 })
    }

    // Get roadside inspections for this equipment
    console.log('🔍 Equipment RSIN Debug - Looking for equipmentId:', equipmentId)
    
    // First, check if there are ANY roadside inspections at all
    const allRSINs = await db.incident.findMany({
      where: {
        incidentType: 'ROADSIDE_INSPECTION'
      },
      include: {
        equipment: true,
        issue: { select: { partyId: true } }
      }
    })
    console.log('🔍 Equipment RSIN Debug - Total RSINs in system:', allRSINs.length)
    console.log('🔍 Equipment RSIN Debug - RSIN equipment links:', allRSINs.map(r => ({
      incidentId: r.id,
      partyId: r.issue.partyId,
      equipmentInvolvement: r.equipment.map(e => ({ equipmentId: e.equipmentId, unitNumber: e.unitNumber }))
    })))
    
    // Check if there are any equipment involvement records for this equipment
    const equipmentInvolvements = await db.incident_equipment_involvement.findMany({
      where: { equipmentId: equipmentId },
      include: {
        incident: { select: { id: true, incidentType: true, incidentDate: true } }
      }
    })
    console.log('🔍 Equipment RSIN Debug - Equipment involvements for this equipment:', equipmentInvolvements)
    
    const roadsideInspections = await db.incident.findMany({
      where: {
        incidentType: 'ROADSIDE_INSPECTION',
        equipment: {
          some: {
            equipmentId: equipmentId
          }
        }
      },
      include: {
        issue: {
          include: {
            party: {
              include: {
                equipment: true
              }
            }
          }
        },
        equipment: true,
        violations: true
      },
      orderBy: {
        incidentDate: 'desc'
      }
    })

    // Transform roadside inspections data
    const transformedRoadsideInspections = roadsideInspections.map(inspection => {
      const roadsideData = inspection.roadsideData as any
      return {
        id: inspection.id,
        reportNumber: inspection.reportNumber,
        incidentDate: inspection.incidentDate.toISOString(),
        incidentTime: inspection.incidentTime,
        officerName: inspection.officerName,
        agencyName: inspection.agencyName,
        officerBadge: inspection.officerBadge,
        locationAddress: inspection.locationAddress,
        locationCity: inspection.locationCity,
        locationState: inspection.locationState,
        locationZip: inspection.locationZip,
        inspectionLevel: roadsideData?.inspectionLevel,
        overallResult: roadsideData?.overallResult,
        dvirReceived: roadsideData?.dvirReceived || false,
        dvirSource: roadsideData?.dvirSource,
        entryMethod: roadsideData?.entryMethod,
        issue: {
          id: inspection.issue.id,
          title: inspection.issue.title,
          description: inspection.issue.description,
          status: inspection.issue.status,
          priority: inspection.issue.priority,
          party: {
            id: inspection.issue.party.id,
            equipment: inspection.issue.party.equipment ? {
              vehicleType: inspection.issue.party.equipment.vehicleType,
              make: inspection.issue.party.equipment.make,
              model: inspection.issue.party.equipment.model,
              year: inspection.issue.party.equipment.year,
              vinNumber: inspection.issue.party.equipment.vinNumber,
              plateNumber: inspection.issue.party.equipment.plateNumber,
            } : null
          }
        },
        equipment: inspection.equipment.map(eq => ({
          id: eq.id,
          unitNumber: eq.unitNumber,
          unitType: eq.unitType,
          make: eq.make,
          model: eq.model,
          year: eq.year,
          plateNumber: eq.plateNumber,
          plateState: eq.plateState,
          vin: eq.vin,
          cvsaSticker: eq.cvsaSticker,
          oosSticker: eq.oosSticker
        })),
        violations: inspection.violations.map(violation => ({
          id: violation.id,
          violationCode: violation.violationCode || 'Unknown',
          section: violation.section,
          unitNumber: violation.unitNumber,
          outOfService: violation.outOfService,
          outOfServiceDate: violation.outOfServiceDate?.toISOString(),
          backInServiceDate: violation.backInServiceDate?.toISOString(),
          citationNumber: violation.citationNumber,
          severity: violation.severity,
          description: violation.description,
          inspectorComments: violation.inspectorComments,
          violationType: violation.violationType,
          assignedPartyId: violation.assignedPartyId
        }))
      }
    })

    return NextResponse.json({
      masterOrg: {
        id: masterOrg.id,
        name: masterOrg.name
      },
      organization: {
        id: organization.id,
        name: organization.name
      },
      equipment: {
        id: equipment.id,
        vehicleType: equipment.vehicleType,
        make: equipment.make,
        model: equipment.model,
        year: equipment.year,
        vinNumber: equipment.vinNumber,
        plateNumber: equipment.plateNumber,
        party: {
          id: equipment.party.id
        }
      },
      roadsideInspections: transformedRoadsideInspections
    })

  } catch (error) {
    console.error('Error fetching equipment roadside inspections:', error)
    return NextResponse.json(
      { error: 'Failed to fetch roadside inspections' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { masterOrgId: string; orgId: string; equipmentId: string } }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { masterOrgId, orgId, equipmentId } = params
    const formData = await request.json()

    // Get equipment details
    const equipment = await db.equipment.findUnique({
      where: { id: equipmentId },
      include: {
        party: true
      }
    })

    if (!equipment) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 })
    }

    // Create issue first
    const issue = await db.issue.create({
      data: {
        id: createId(),
        issueType: 'ROADSIDE_INSPECTION',
        title: `Roadside Inspection - ${formData.reportNumber || new Date().toLocaleDateString()}`,
        description: `Roadside inspection for ${equipment.make} ${equipment.model}`,
        status: 'OPEN',
        priority: 'MEDIUM',
        partyId: equipment.partyId,
        updatedAt: new Date()
      }
    })

    // Create incident
    const incident = await db.incident.create({
      data: {
        issueId: issue.id,
        incidentType: 'ROADSIDE_INSPECTION',
        incidentDate: new Date(formData.incidentDate),
        incidentTime: formData.incidentTime,
        officerName: formData.officerName,
        agencyName: formData.agencyName,
        officerBadge: formData.officerBadge,
        reportNumber: formData.reportNumber,
        locationAddress: formData.locationAddress,
        locationCity: formData.locationCity,
        locationState: formData.locationState,
        locationZip: formData.locationZip,
        roadsideData: {
          inspectionLevel: formData.inspectionLevel,
          overallResult: formData.overallResult,
          dvirReceived: formData.dvirReceived,
          dvirSource: formData.dvirSource,
          entryMethod: formData.entryMethod
        }
      }
    })

    // Create equipment involvement records
    if (formData.selectedEquipmentIds?.length > 0) {
      for (let i = 0; i < formData.selectedEquipmentIds.length; i++) {
        const equipId = formData.selectedEquipmentIds[i]
        await db.incident_equipment_involvement.create({
          data: {
            incidentId: incident.id,
            equipmentId: equipId,
            unitNumber: i + 1
          }
        })
      }
    }

    // Create violation records
    if (formData.violations?.length > 0) {
      for (const violation of formData.violations) {
        await db.incident_violation.create({
          data: {
            incidentId: incident.id,
            violationCode: violation.violationCode,
            section: violation.section,
            unitNumber: violation.unitNumber,
            outOfService: violation.outOfService,
            outOfServiceDate: violation.outOfServiceDate ? new Date(violation.outOfServiceDate) : null,
            backInServiceDate: violation.backInServiceDate ? new Date(violation.backInServiceDate) : null,
            citationNumber: violation.citationNumber,
            severity: violation.severity,
            description: violation.description,
            inspectorComments: violation.inspectorComments,
            violationType: violation.violationType,
            assignedPartyId: violation.assignedPartyId
          }
        })
      }
    }

    // Fetch the created incident with all related data
    const createdIncident = await db.incident.findUnique({
      where: { id: incident.id },
      include: {
        issue: {
          include: {
            party: {
              include: {
                equipment: true
              }
            }
          }
        },
        equipment: true,
        violations: true
      }
    })

    return NextResponse.json(createdIncident, { status: 201 })

  } catch (error) {
    console.error('Error creating equipment roadside inspection:', error)
    return NextResponse.json(
      { error: 'Failed to create roadside inspection' },
      { status: 500 }
    )
  }
} 