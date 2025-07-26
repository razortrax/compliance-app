import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'

interface PhysicalUpdateData {
  type?: string
  medicalExaminer?: string
  selfCertified?: boolean
  nationalRegistry?: boolean
  startDate?: string
  expirationDate?: string
  renewalDate?: string
  title?: string
  description?: string
  priority?: string
}

// GET /api/physical_issues/[id] - Get specific Physical issue
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const physical = await db.physical_issue.findUnique({
      where: { id: params.id },
      include: {
        issue: {
          include: {
            party: {
              include: {
                person: true,
                organization: true,
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
            }
          }
        }
      }
    })

    if (!physical) {
      return Response.json({ error: 'Physical issue not found' }, { status: 404 })
    }

    // Comprehensive access control check (copied from licenses API)
    const userParties = await db.party.findMany({
      where: { userId },
      include: { role: true }
    })

    const userPartyIds = userParties.map(p => p.id)
    const userOrgIds = userParties.flatMap(p => p.role.map(r => r.organizationId)).filter(Boolean)
    const userLocationIds = userParties.flatMap(p => p.role.map(r => r.locationId)).filter(Boolean)

    const isMaster = userParties.some(p => p.role.some(r => r.roleType === 'master'))
    const isOrgManager = userParties.some(p => p.role.some(r => 
      r.roleType === 'organization_manager' && userOrgIds.includes(physical.issue.party.organization?.id || '')
    ))
    const isLocationManager = userParties.some(p => p.role.some(r => 
      r.roleType === 'location_manager' && userLocationIds.includes(physical.issue.party.organization?.id || '')
    ))
    const isDirectPartyOwner = userPartyIds.includes(physical.issue.partyId)

    if (!isMaster && !isOrgManager && !isLocationManager && !isDirectPartyOwner) {
      return Response.json({ error: 'Access denied' }, { status: 403 })
    }

    return Response.json(physical)
  } catch (error) {
    console.error('Error fetching physical issue:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/physical_issues/[id] - Update specific Physical issue
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: PhysicalUpdateData = await request.json()

    // Get existing physical with access control check
    const existingPhysical = await db.physical_issue.findUnique({
      where: { id: params.id },
      include: {
        issue: {
          include: {
            party: {
              include: {
                person: true,
                organization: true,
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
            }
          }
        }
      }
    })

    if (!existingPhysical) {
      return Response.json({ error: 'Physical issue not found' }, { status: 404 })
    }

    // Comprehensive access control check (same as GET)
    const userParties = await db.party.findMany({
      where: { userId },
      include: { role: true }
    })

    const userPartyIds = userParties.map(p => p.id)
    const userOrgIds = userParties.flatMap(p => p.role.map(r => r.organizationId)).filter(Boolean)
    const userLocationIds = userParties.flatMap(p => p.role.map(r => r.locationId)).filter(Boolean)

    const isMaster = userParties.some(p => p.role.some(r => r.roleType === 'master'))
    const isOrgManager = userParties.some(p => p.role.some(r => 
      r.roleType === 'organization_manager' && userOrgIds.includes(existingPhysical.issue.party.organization?.id || '')
    ))
    const isLocationManager = userParties.some(p => p.role.some(r => 
      r.roleType === 'location_manager' && userLocationIds.includes(existingPhysical.issue.party.organization?.id || '')
    ))
    const isDirectPartyOwner = userPartyIds.includes(existingPhysical.issue.partyId)

    if (!isMaster && !isOrgManager && !isLocationManager && !isDirectPartyOwner) {
      return Response.json({ error: 'Access denied' }, { status: 403 })
    }

    // Prepare update data for physical_issue
    const physicalUpdateData: any = {}
    if (body.type !== undefined) physicalUpdateData.type = body.type
    if (body.medicalExaminer !== undefined) physicalUpdateData.medicalExaminer = body.medicalExaminer
    if (body.selfCertified !== undefined) physicalUpdateData.selfCertified = body.selfCertified
    if (body.nationalRegistry !== undefined) physicalUpdateData.nationalRegistry = body.nationalRegistry
    if (body.startDate !== undefined) physicalUpdateData.startDate = body.startDate ? new Date(body.startDate) : null
    if (body.expirationDate !== undefined) physicalUpdateData.expirationDate = body.expirationDate ? new Date(body.expirationDate) : null
    if (body.renewalDate !== undefined) physicalUpdateData.renewalDate = body.renewalDate ? new Date(body.renewalDate) : null

    if (Object.keys(physicalUpdateData).length > 0) {
      physicalUpdateData.updatedAt = new Date()
    }

    // Prepare update data for main issue
    const issueUpdateData: any = {}
    if (body.title !== undefined) issueUpdateData.title = body.title
    if (body.description !== undefined) issueUpdateData.description = body.description
    if (body.priority !== undefined) issueUpdateData.priority = body.priority
    if (body.expirationDate !== undefined) issueUpdateData.dueDate = body.expirationDate ? new Date(body.expirationDate) : null

    if (Object.keys(issueUpdateData).length > 0) {
      issueUpdateData.updatedAt = new Date()
    }

    // Update both tables in a transaction
    const result = await db.$transaction(async (tx) => {
      // Update main issue if there are changes
      if (Object.keys(issueUpdateData).length > 0) {
        await tx.issue.update({
          where: { id: existingPhysical.issueId },
          data: issueUpdateData
        })
      }

      // Update physical issue if there are changes
      if (Object.keys(physicalUpdateData).length > 0) {
        const updated = await tx.physical_issue.update({
          where: { id: params.id },
          data: physicalUpdateData,
          include: {
            issue: {
              include: {
                party: {
                  include: {
                    person: true,
                    organization: true
                  }
                }
              }
            }
          }
        })
        return updated
      } else {
        // Return current data if no physical changes
        return existingPhysical
      }
    })

    return Response.json(result)
  } catch (error) {
    console.error('Error updating physical issue:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/physical_issues/[id] - Soft delete Physical issue
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get existing physical with access control check (same pattern as above)
    const existingPhysical = await db.physical_issue.findUnique({
      where: { id: params.id },
      include: {
        issue: {
          include: {
            party: {
              include: {
                person: true,
                organization: true,
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
            }
          }
        }
      }
    })

    if (!existingPhysical) {
      return Response.json({ error: 'Physical issue not found' }, { status: 404 })
    }

    // Access control check (same as above)
    const userParties = await db.party.findMany({
      where: { userId },
      include: { role: true }
    })

    const userPartyIds = userParties.map(p => p.id)
    const userOrgIds = userParties.flatMap(p => p.role.map(r => r.organizationId)).filter(Boolean)
    const userLocationIds = userParties.flatMap(p => p.role.map(r => r.locationId)).filter(Boolean)

    const isMaster = userParties.some(p => p.role.some(r => r.roleType === 'master'))
    const isOrgManager = userParties.some(p => p.role.some(r => 
      r.roleType === 'organization_manager' && userOrgIds.includes(existingPhysical.issue.party.organization?.id || '')
    ))
    const isLocationManager = userParties.some(p => p.role.some(r => 
      r.roleType === 'location_manager' && userLocationIds.includes(existingPhysical.issue.party.organization?.id || '')
    ))
    const isDirectPartyOwner = userPartyIds.includes(existingPhysical.issue.partyId)

    if (!isMaster && !isOrgManager && !isLocationManager && !isDirectPartyOwner) {
      return Response.json({ error: 'Access denied' }, { status: 403 })
    }

    // Soft delete by updating status
    await db.issue.update({
      where: { id: existingPhysical.issueId },
      data: {
        status: 'deleted',
        resolvedAt: new Date(),
        updatedAt: new Date()
      }
    })

    return Response.json({ message: 'Physical issue deleted successfully' })
  } catch (error) {
    console.error('Error deleting physical issue:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
} 