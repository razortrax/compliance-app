import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { captureAPIError } from '@/lib/sentry-utils'

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
    const [masterOrg, organization, driver, roadsideInspections] = await Promise.all([
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

      // Roadside inspections for this driver using the new incident system
      db.incident.findMany({
        where: {
          incidentType: 'ROADSIDE_INSPECTION',
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
              priority: true,
              party: {
                select: {
                  id: true,
                  person: {
                    select: {
                      firstName: true,
                      lastName: true
                    }
                  }
                }
              }
            }
          },
          equipment: {
            select: {
              id: true,
              unitNumber: true,
              unitType: true,
              make: true,
              model: true,
              year: true,
              plateNumber: true,
              plateState: true,
              vin: true,
              cvsaSticker: true,
              oosSticker: true
            }
          },
          violations: {
            select: {
              id: true,
              violationCode: true,
              section: true,
              unitNumber: true,
              outOfService: true,
              outOfServiceDate: true,
              backInServiceDate: true,
              citationNumber: true,
              severity: true,
              description: true,
              inspectorComments: true,
              violationType: true,
              assignedPartyId: true
            },
            orderBy: [
              { outOfService: 'desc' },
              { violationCode: 'asc' }
            ]
          }
        },
        orderBy: [
          { incidentDate: 'desc' }
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

    // Transform roadside inspection data to match frontend interface
    const transformedInspections = roadsideInspections.map((incident: any) => ({
      id: incident.id,
      reportNumber: incident.reportNumber,
      incidentDate: incident.incidentDate.toISOString(),
      incidentTime: incident.incidentTime,
      officerName: incident.officerName,
      agencyName: incident.agencyName,
      officerBadge: incident.officerBadge,
      locationAddress: incident.locationAddress,
      locationCity: incident.locationCity,
      locationState: incident.locationState,
      locationZip: incident.locationZip,
      // Extract roadside-specific data from JSON
      inspectionLevel: incident.roadsideData?.inspectionLevel,
      overallResult: incident.roadsideData?.overallResult,
      dvirReceived: incident.roadsideData?.dvirReceived || false,
      dvirSource: incident.roadsideData?.dvirSource,
      entryMethod: incident.roadsideData?.entryMethod || 'Manual_Entry',
      // Include relationships
      issue: incident.issue,
      equipment: incident.equipment,
      violations: incident.violations
    }))

    // Return structured data that matches Gold Standard pattern
    const responseData = {
      masterOrg,
      organization,
      driver,
      roadsideInspections: transformedInspections
    }

    return NextResponse.json(responseData)

  } catch (error) {
    console.error('Error fetching driver roadside inspection data:', error)
    captureAPIError(error instanceof Error ? error : new Error('Unknown error'), {
      endpoint: '/api/master/[masterOrgId]/organization/[orgId]/driver/[driverId]/roadside-inspections',
      method: 'GET',
      extra: { masterOrgId, orgId, driverId }
    })
    return NextResponse.json(
      { error: 'Failed to fetch driver roadside inspection data' },
      { status: 500 }
    )
  }
} 