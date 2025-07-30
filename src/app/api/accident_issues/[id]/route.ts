import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { ViolationType, ViolationSeverity } from '@prisma/client'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const accident = await db.accident_issue.findUnique({
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

    if (!accident) {
      return Response.json({ error: 'Accident not found' }, { status: 404 })
    }

    return Response.json(accident)
  } catch (error) {
    console.error('Error fetching accident:', error)
    return Response.json({ error: 'Failed to fetch accident' }, { status: 500 })
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

    const data = await request.json()

    // First verify the accident exists
    const existingAccident = await db.accident_issue.findUnique({
      where: { id: params.id },
      include: { issue: true }
    })

    if (!existingAccident) {
      return Response.json({ error: 'Accident not found' }, { status: 404 })
    }

    // Update the main issue record
    await db.issue.update({
      where: { id: existingAccident.issueId },
      data: {
        title: data.title || `Accident - ${data.agencyName}`,
        description: `Report Number: ${data.reportNumber || 'N/A'}`,
        priority: data.isFatality ? 'critical' : data.isInjury ? 'high' : 'medium',
        updatedAt: new Date()
      }
    })

    // Update the accident record
    const updatedAccident = await db.accident_issue.update({
      where: { id: params.id },
      data: {
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

    // Handle equipment updates
    if (data.equipment) {
      // Delete existing equipment involvement
      await db.accident_equipment_involvement.deleteMany({
        where: { accidentId: params.id }
      })

      // Create new equipment involvement records
      if (data.equipment.length > 0) {
        const equipmentPromises = data.equipment.map(async (eq: any) => {
          const equipment = await db.equipment.findUnique({
            where: { id: eq.equipmentId }
          })
          
          return db.accident_equipment_involvement.create({
            data: {
              id: undefined, // Let Prisma generate
              accidentId: params.id,
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
    }

    // Handle violations updates - only update unsaved violations
    if (data.violations) {
      const unsavedViolations = data.violations.filter((v: any) => !v.saved)
      
      if (unsavedViolations.length > 0) {
        await Promise.all(
          unsavedViolations.map((violation: any) => {
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
                accidentId: params.id,
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
    }

    // Fetch the complete updated record
    const completeRecord = await db.accident_issue.findUnique({
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

    return Response.json(completeRecord)
  } catch (error) {
    console.error('Error updating accident:', error)
    return Response.json({ error: 'Failed to update accident' }, { status: 500 })
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

    // First verify the accident exists
    const existingAccident = await db.accident_issue.findUnique({
      where: { id: params.id },
      include: { issue: true }
    })

    if (!existingAccident) {
      return Response.json({ error: 'Accident not found' }, { status: 404 })
    }

    // Delete the main issue record (this will cascade delete the accident due to onDelete: Cascade)
    await db.issue.delete({
      where: { id: existingAccident.issueId }
    })

    return Response.json({ message: 'Accident deleted successfully' })
  } catch (error) {
    console.error('Error deleting accident:', error)
    return Response.json({ error: 'Failed to delete accident' }, { status: 500 })
  }
} 