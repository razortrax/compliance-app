import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { captureAPIError } from '@/lib/sentry-utils'

interface RegistrationUpdateData {
  plateNumber?: string
  state?: string
  startDate?: string
  expirationDate?: string
  renewalDate?: string
  status?: 'Active' | 'Expired'
  notes?: string
  title?: string
  description?: string
  priority?: string
}

// GET /api/registrations/[id] - Get specific registration
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const registrationId = params.id

    const registration = await db.registration_issue.findUnique({
      where: { id: registrationId },
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

    if (!registration) {
      return Response.json({ error: 'Registration not found' }, { status: 404 })
    }

    // Access control - check if user has permission to view this registration
    let hasAccess = false
    
    // Check direct ownership
    if (registration.issue.party.userId === userId) {
      hasAccess = true
    }

    // Check role-based access (Master, Organization, Location managers)
    if (!hasAccess) {
      const equipmentRole = await db.role.findFirst({
        where: {
          partyId: registration.issue.partyId,
          isActive: true
        }
      })

      if (equipmentRole) {
        // Check if user is Master consultant
        const userMasterOrg = await db.organization.findFirst({
          where: { party: { userId } }
        })

        if (userMasterOrg) {
          const masterRole = await db.role.findFirst({
            where: {
              roleType: 'master',
              partyId: userMasterOrg.partyId,
              organizationId: equipmentRole.organizationId,
              isActive: true
            }
          })
          if (masterRole) hasAccess = true
        }

        // Check organization/location access
        if (!hasAccess) {
          const userRole = await db.role.findFirst({
            where: {
              party: { userId },
              OR: [
                { organizationId: equipmentRole.organizationId },
                { locationId: equipmentRole.locationId }
              ],
              isActive: true
            }
          })
          if (userRole) hasAccess = true
        }
      }
    }

    if (!hasAccess) {
      return Response.json({ error: 'Access denied' }, { status: 403 })
    }

    return Response.json(registration)
  } catch (error) {
    console.error('Error fetching registration:', error)
    captureAPIError(error instanceof Error ? error : new Error('Unknown error'), {
      endpoint: `/api/registrations/${params.id}`,
      method: 'GET',
      userId: (await auth()).userId || 'unknown'
    })
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/registrations/[id] - Update registration
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const registrationId = params.id
    const body: RegistrationUpdateData = await request.json()

    // First, get the existing registration to check access
    const existingRegistration = await db.registration_issue.findUnique({
      where: { id: registrationId },
      include: {
        issue: {
          include: {
            party: true
          }
        }
      }
    })

    if (!existingRegistration) {
      return Response.json({ error: 'Registration not found' }, { status: 404 })
    }

    // Access control - same logic as GET
    let hasAccess = false
    
    if (existingRegistration.issue.party.userId === userId) {
      hasAccess = true
    }

    if (!hasAccess) {
      const equipmentRole = await db.role.findFirst({
        where: {
          partyId: existingRegistration.issue.partyId,
          isActive: true
        }
      })

      if (equipmentRole) {
        // Check Master access
        const userMasterOrg = await db.organization.findFirst({
          where: { party: { userId } }
        })

        if (userMasterOrg) {
          const masterRole = await db.role.findFirst({
            where: {
              roleType: 'master',
              partyId: userMasterOrg.partyId,
              organizationId: equipmentRole.organizationId,
              isActive: true
            }
          })
          if (masterRole) hasAccess = true
        }

        // Check organization/location access
        if (!hasAccess) {
          const userRole = await db.role.findFirst({
            where: {
              party: { userId },
              OR: [
                { organizationId: equipmentRole.organizationId },
                { locationId: equipmentRole.locationId }
              ],
              isActive: true
            }
          })
          if (userRole) hasAccess = true
        }
      }
    }

    if (!hasAccess) {
      return Response.json({ error: 'Access denied' }, { status: 403 })
    }

    // Update registration in transaction
    const result = await db.$transaction(async (tx) => {
      // Prepare updates for registration_issue
      const registrationUpdates: any = {}
      if (body.plateNumber !== undefined) registrationUpdates.plateNumber = body.plateNumber
      if (body.state !== undefined) registrationUpdates.state = body.state
      if (body.startDate !== undefined) registrationUpdates.startDate = new Date(body.startDate)
      if (body.expirationDate !== undefined) registrationUpdates.expirationDate = new Date(body.expirationDate)
      if (body.renewalDate !== undefined) registrationUpdates.renewalDate = body.renewalDate ? new Date(body.renewalDate) : null
      if (body.status !== undefined) registrationUpdates.status = body.status
      if (body.notes !== undefined) registrationUpdates.notes = body.notes

      // Update registration_issue
      const updatedRegistration = await tx.registration_issue.update({
        where: { id: registrationId },
        data: {
          ...registrationUpdates,
          updatedAt: new Date()
        }
      })

      // Prepare updates for base issue
      const issueUpdates: any = {}
      if (body.title !== undefined) issueUpdates.title = body.title
      if (body.description !== undefined) issueUpdates.description = body.description
      if (body.priority !== undefined) issueUpdates.priority = body.priority
      if (body.expirationDate !== undefined) issueUpdates.dueDate = new Date(body.expirationDate)

      // Update base issue if there are changes
      if (Object.keys(issueUpdates).length > 0) {
        await tx.issue.update({
          where: { id: existingRegistration.issueId },
          data: {
            ...issueUpdates,
            updatedAt: new Date()
          }
        })
      }

      // Return updated registration with relations
      return await tx.registration_issue.findUnique({
        where: { id: registrationId },
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
    })

    return Response.json(result)
  } catch (error) {
    console.error('Error updating registration:', error)
    captureAPIError(error instanceof Error ? error : new Error('Unknown error'), {
      endpoint: `/api/registrations/${params.id}`,
      method: 'PUT',
      userId: (await auth()).userId || 'unknown',
      extra: { registrationId: params.id }
    })
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
} 