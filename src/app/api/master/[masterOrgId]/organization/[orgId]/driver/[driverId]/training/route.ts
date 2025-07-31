import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { masterOrgId: string; orgId: string; driverId: string } }
) {
  try {
    const authResult = await auth()
    const userId = authResult.userId
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { masterOrgId, orgId, driverId } = params

    // Fetch all the contextual data in one query - MVR Gold Standard pattern
    const [masterOrg, organization, driver, trainings] = await Promise.all([
      // Master organization
      db.organization.findUnique({
        where: { id: masterOrgId },
        select: { id: true, name: true }
      }),

      // Target organization  
      db.organization.findUnique({
        where: { id: orgId },
        select: { id: true, name: true }
      }),

      // Driver details
      db.person.findUnique({
        where: { id: driverId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          licenseNumber: true,
          party: {
            select: { id: true }
          }
        }
      }),

      // Training issues for this driver
      db.training_issue.findMany({
        where: {
          issue: {
            party: {
              person: {
                id: driverId
              }
            }
          }
        },
        include: {
          issue: {
            select: {
              id: true,
              title: true,
              description: true,
              status: true,
              priority: true
            }
          }
        },
        orderBy: [
          { isRequired: 'desc' }, // Required training first
          { expirationDate: 'desc' }
        ]
      })
    ])

    if (!masterOrg) {
      return NextResponse.json({ error: 'Master organization not found' }, { status: 404 })
    }

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 })
    }

    // Transform training data to match frontend interface
    const transformedTrainings = trainings.map((training: any) => ({
      id: training.id,
      trainingType: training.trainingType,
      provider: training.provider,
      instructor: training.instructor,
      location: training.location,
      startDate: training.startDate?.toISOString() || null,
      completionDate: training.completionDate.toISOString(),
      expirationDate: training.expirationDate.toISOString(),
      certificateNumber: training.certificateNumber,
      hours: training.hours,
      isRequired: training.isRequired,
      competencies: training.competencies,
      notes: training.notes,
      issue: training.issue
    }))

    // Return structured data that matches MVR pattern
    const responseData = {
      masterOrg,
      organization,
      driver,
      trainings: transformedTrainings
    }

    return NextResponse.json(responseData)

  } catch (error) {
    console.error('Error fetching driver training data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch driver training data' },
      { status: 500 }
    )
  }
} 