import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { createId } from '@paralleldrive/cuid2'
import { captureAPIError } from '@/lib/sentry-utils'

// Define types for annual inspection data
interface AnnualInspectionData {
  inspectorName: string
  inspectionDate: string
  expirationDate: string
  result: 'Pass' | 'Fail'
  status: 'Active' | 'Inactive'
  notes?: string
  partyId: string
  title: string
  description?: string
  priority?: string
}

// GET /api/annual-inspections - List annual inspections with filtering
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const partyId = searchParams.get('partyId')
    const result = searchParams.get('result')
    const status = searchParams.get('status')

    // Build where clause for filtering
    const where: any = {}
    
    if (partyId) {
      where.issue = { partyId }
    }
    
    if (result) {
      where.result = result
    }

    if (status) {
      where.status = status
    }

    // Access control - support Master, Organization, and Location managers
    let accessFilter = {}
    
    // Get user's role to determine access
    const userRole = await db.role.findFirst({
      where: { 
        party: { userId },
        isActive: true 
      }
    })
    
    // Get user's master organization first
    const userMasterOrg = await db.organization.findFirst({
      where: {
        party: { userId: userId }
      }
    })

    if (userMasterOrg) {
      // Master user - can see inspections for all organizations they manage
      const managedOrgs = await db.role.findMany({
        where: {
          roleType: 'master',
          partyId: userMasterOrg.partyId,
          isActive: true
        },
        select: { organizationId: true }
      })

      const managedOrgIds = managedOrgs.map(role => role.organizationId).filter(Boolean)

      if (managedOrgIds.length > 0) {
        accessFilter = {
          issue: {
            party: {
              role: {
                some: {
                  organizationId: { in: managedOrgIds },
                  isActive: true
                }
              }
            }
          }
        }
      }
    } else if (userRole) {
      // Organization or Location user
      if (userRole.organizationId) {
        accessFilter = {
          issue: {
            party: {
              role: {
                some: {
                  organizationId: userRole.organizationId,
                  isActive: true
                }
              }
            }
          }
        }
      }
    } else {
      // Individual user - only their own inspections
      accessFilter = {
        issue: {
          partyId: {
            in: await db.party.findMany({
              where: { userId },
              select: { id: true }
            }).then(parties => parties.map(p => p.id))
          }
        }
      }
    }

    const inspections = await db.annual_inspection_issue.findMany({
      where: {
        ...where,
        ...accessFilter
      },
      include: {
        issue: {
          include: {
            party: {
              include: {
                equipment: true,
                person: true,
                organization: true
              }
            }
          }
        }
      },
      orderBy: {
        expirationDate: 'desc'
      }
    })

    return Response.json({ inspections })
  } catch (error) {
    console.error('Error fetching annual inspections:', error)
    captureAPIError(error instanceof Error ? error : new Error('Unknown error'), {
      endpoint: '/api/annual-inspections',
      method: 'GET',
      userId: (await auth()).userId || 'unknown'
    })
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/annual-inspections - Create new annual inspection
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: AnnualInspectionData = await request.json()
    
    // Validate required fields
    if (!body.inspectorName || !body.inspectionDate || 
        !body.expirationDate || !body.partyId || !body.result) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if user has access to the party (equipment)
    const party = await db.party.findUnique({
      where: { id: body.partyId },
      include: {
        equipment: true,
        role: {
          include: {
            party: {
              include: {
                organization: true
              }
            }
          }
        }
      }
    })

    if (!party) {
      return Response.json({ error: 'Party not found' }, { status: 404 })
    }

    // Access control check - support Master, Organization, and Location managers
    let hasAccess = false
    
    // 1. Check direct ownership first
    if (party.userId === userId) {
      hasAccess = true
    }

    if (!hasAccess) {
      // Get the equipment's role to find their organization
      const equipmentRole = await db.role.findFirst({
        where: {
          partyId: body.partyId,
          isActive: true
        }
      })

      if (equipmentRole) {
        // 2. Check if user is a Master consultant who manages this organization
        const userMasterOrg = await db.organization.findFirst({
          where: {
            party: { userId: userId }
          }
        })

        if (userMasterOrg) {
          // Check if master org manages the equipment's organization
          const masterRole = await db.role.findFirst({
            where: {
              roleType: 'master',
              partyId: userMasterOrg.partyId,
              organizationId: equipmentRole.organizationId,
              isActive: true
            }
          })

          if (masterRole) {
            hasAccess = true
          }
        }

        // 3. Check if user is an Organization manager or consultant in the same organization
        if (!hasAccess) {
          const orgManagerRole = await db.role.findFirst({
            where: {
              party: { userId: userId },
              organizationId: equipmentRole.organizationId,
              roleType: { in: ['organization_manager', 'owner', 'consultant'] },
              isActive: true
            }
          })

          if (orgManagerRole) {
            hasAccess = true
          }
        }

        // 4. Check if user is a Location manager at the same location
        if (!hasAccess && equipmentRole.locationId) {
          const locationManagerRole = await db.role.findFirst({
            where: {
              party: { userId: userId },
              locationId: equipmentRole.locationId,
              roleType: 'location_manager',
              isActive: true
            }
          })

          if (locationManagerRole) {
            hasAccess = true
          }
        }
      }
    }

    if (!hasAccess) {
      return Response.json({ error: 'Access denied' }, { status: 403 })
    }

    // Create annual inspection in transaction
    const result = await db.$transaction(async (tx) => {
      // Create the base issue
      const issue = await tx.issue.create({
        data: {
          id: createId(),
          issueType: 'annual_inspection',
          status: 'open',
          priority: body.priority || 'medium',
          partyId: body.partyId,
          title: body.title,
          description: body.description,
          dueDate: new Date(body.expirationDate),
          updatedAt: new Date()
        }
      })

      // Create the annual inspection issue
      const inspectionIssue = await tx.annual_inspection_issue.create({
        data: {
          issueId: issue.id,
          inspectorName: body.inspectorName,
          inspectionDate: new Date(body.inspectionDate),
          expirationDate: new Date(body.expirationDate),
          result: body.result,
          status: body.status || 'Active',
          notes: body.notes
        },
        include: {
          issue: {
            include: {
              party: {
                include: {
                  equipment: true,
                  organization: true
                }
              }
            }
          }
        }
      })

      return inspectionIssue
    })

    return Response.json(result, { status: 201 })
  } catch (error) {
    console.error('Error creating annual inspection:', error)
    captureAPIError(error instanceof Error ? error : new Error('Unknown error'), {
      endpoint: '/api/annual-inspections',
      method: 'POST',
      userId: (await auth()).userId || 'unknown'
    })
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
} 