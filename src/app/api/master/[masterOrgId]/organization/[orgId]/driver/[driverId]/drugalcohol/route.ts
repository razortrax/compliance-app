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

    // Fetch all the contextual data in one query - Gold Standard pattern
    const [masterOrg, organization, driver, drugAlcoholTests] = await Promise.all([
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

      // Drug & alcohol issues for this driver
      db.drugalcohol_issue.findMany({
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
          { createdAt: 'desc' }
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

    // Transform drug & alcohol data to match frontend interface
    const transformedTests = drugAlcoholTests.map((test: any) => ({
      id: test.id,
      result: test.result,
      substance: test.substance,
      lab: test.lab,
      accreditedBy: test.accreditedBy,
      reason: test.reason,
      agency: test.agency,
      specimenNumber: test.specimenNumber,
      isDrug: test.isDrug,
      isAlcohol: test.isAlcohol,
      clinic: test.clinic,
      notes: test.notes,
      createdAt: test.createdAt.toISOString(),
      issue: test.issue
    }))

    // Return structured data that matches Gold Standard pattern
    const responseData = {
      masterOrg,
      organization,
      driver,
      drugAlcoholTests: transformedTests
    }

    return NextResponse.json(responseData)

  } catch (error) {
    console.error('Error fetching driver drug & alcohol data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch driver drug & alcohol data' },
      { status: 500 }
    )
  }
} 