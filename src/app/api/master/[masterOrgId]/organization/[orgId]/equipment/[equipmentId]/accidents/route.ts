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

    // Get accidents for this equipment
    const accidents = await db.incident.findMany({
      where: {
        incidentType: 'ACCIDENT',
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

    // Transform accidents data
    const transformedAccidents = accidents.map(accident => {
      const accidentData = accident.accidentData as any
      return {
        id: accident.id,
        reportNumber: accident.reportNumber,
        incidentDate: accident.incidentDate.toISOString(),
        incidentTime: accident.incidentTime,
        officerName: accident.officerName,
        agencyName: accident.agencyName,
        officerBadge: accident.officerBadge,
        locationAddress: accident.locationAddress,
        locationCity: accident.locationCity,
        locationState: accident.locationState,
        locationZip: accident.locationZip,
        isFatality: accidentData?.isFatality || false,
        isReportable: accidentData?.isReportable || false,
        isInjury: accidentData?.isInjury || false,
        isTow: accidentData?.isTow || false,
        isCitation: accidentData?.isCitation || false,
        needsReport: accidentData?.needsReport || false,
        needsDrugTest: accidentData?.needsDrugTest || false,
        numberOfFatalities: accidentData?.numberOfFatalities,
        numberOfVehicles: accidentData?.numberOfVehicles,
        accidentDescription: accidentData?.accidentDescription,
        weatherConditions: accidentData?.weatherConditions,
        roadConditions: accidentData?.roadConditions,
        trafficConditions: accidentData?.trafficConditions,
        issue: {
          id: accident.issue.id,
          title: accident.issue.title,
          description: accident.issue.description,
          status: accident.issue.status,
          priority: accident.issue.priority,
          party: {
            id: accident.issue.party.id,
            equipment: accident.issue.party.equipment ? {
              vehicleTypeId: accident.issue.party.equipment.vehicleTypeId,
              make: accident.issue.party.equipment.make,
              model: accident.issue.party.equipment.model,
              year: accident.issue.party.equipment.year,
              vin: accident.issue.party.equipment.vin,
              plateNumber: accident.issue.party.equipment.plateNumber,
            } : null
          }
        },
        equipment: accident.equipment.map(eq => ({
          id: eq.id,
          unitNumber: eq.unitNumber,
          unitType: eq.unitType,
          make: eq.make,
          model: eq.model,
          year: eq.year,
          plateNumber: eq.plateNumber,
          vin: eq.vin
        })),
        violations: accident.violations.map(violation => ({
          id: violation.id,
          violationCode: violation.violationCode || 'Unknown',
          description: violation.description,
          outOfService: violation.outOfService,
          severity: violation.severity,
          unitNumber: violation.unitNumber,
          violationType: violation.violationType,
          inspectorComments: violation.inspectorComments
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
        vehicleTypeId: equipment.vehicleTypeId,
        make: equipment.make,
        model: equipment.model,
        year: equipment.year,
        vin: equipment.vin,
        plateNumber: equipment.plateNumber,
        party: {
          id: equipment.party.id
        }
      },
      accidents: transformedAccidents
    })

  } catch (error) {
    console.error('Error fetching equipment accidents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch accidents' },
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
        issueType: 'ACCIDENT',
        title: `Accident - ${formData.reportNumber || new Date().toLocaleDateString()}`,
        description: `Accident involving ${equipment.make} ${equipment.model}`,
        status: 'OPEN',
        priority: formData.isFatality ? 'HIGH' : formData.isInjury ? 'MEDIUM' : 'LOW',
        partyId: equipment.partyId,
        updatedAt: new Date()
      }
    })

    // Create incident
    const incident = await db.incident.create({
      data: {
        issueId: issue.id,
        incidentType: 'ACCIDENT',
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
        accidentData: {
          isFatality: formData.isFatality,
          isReportable: formData.isReportable,
          isInjury: formData.isInjury,
          isTow: formData.isTow,
          isCitation: formData.isCitation,
          needsReport: formData.needsReport,
          needsDrugTest: formData.needsDrugTest,
          numberOfFatalities: formData.numberOfFatalities,
          numberOfVehicles: formData.numberOfVehicles,
          accidentDescription: formData.accidentDescription,
          weatherConditions: formData.weatherConditions,
          roadConditions: formData.roadConditions,
          trafficConditions: formData.trafficConditions
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
            description: violation.description,
            outOfService: violation.outOfService,
            severity: violation.severity,
            unitNumber: violation.unitNumber,
            violationType: violation.violationType,
            inspectorComments: violation.inspectorComments,
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
    console.error('Error creating equipment accident:', error)
    return NextResponse.json(
      { error: 'Failed to create accident' },
      { status: 500 }
    )
  }
} 