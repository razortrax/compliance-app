import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'

interface MvrUpdateData {
  state?: string
  violationsCount?: number
  cleanRecord?: boolean
  notes?: string
  type?: string
  result?: string
  result_dach?: string
  result_status?: string
  reviewedBy?: any
  certification?: string
  status?: string
  startDate?: string
  expirationDate?: string
  renewalDate?: string
  title?: string
  description?: string
  priority?: string
}

// GET /api/mvr_issues/[id] - Get specific MVR issue
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const mvr = await db.mvr_issue.findUnique({
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

    if (!mvr) {
      return Response.json({ error: 'MVR issue not found' }, { status: 404 })
    }

    // Access control check - support Master, Organization, and Location managers
    let hasAccess = false
    const party = mvr.issue.party
    
    // 1. Check direct ownership first
    if (party.userId === userId) {
      hasAccess = true
    }

    if (!hasAccess) {
      // Get the driver's role to find their organization and location
      const driverRole = await db.role.findFirst({
        where: {
          partyId: party.id,
          isActive: true
        }
      })

      if (driverRole) {
        // 2. Check if user is a Master consultant who manages this organization
        const userMasterOrg = await db.organization.findFirst({
          where: {
            party: { userId: userId }
          }
        })

        if (userMasterOrg) {
          // Check if master org manages the driver's organization
          const masterRole = await db.role.findFirst({
            where: {
              roleType: 'master',
              partyId: userMasterOrg.partyId,
              organizationId: driverRole.organizationId,
              isActive: true
            }
          })

          if (masterRole) {
            hasAccess = true
          }
        }

        // 3. Check if user manages the same organization
        if (!hasAccess) {
          const userOrgRole = await db.role.findFirst({
            where: {
              party: { userId: userId },
              organizationId: driverRole.organizationId,
              isActive: true
            }
          })

          if (userOrgRole) {
            hasAccess = true
          }
        }

        // 4. Check if user manages the same location
        if (!hasAccess && driverRole.locationId) {
          const userLocationRole = await db.role.findFirst({
            where: {
              party: { userId: userId },
              locationId: driverRole.locationId,
              isActive: true
            }
          })

          if (userLocationRole) {
            hasAccess = true
          }
        }
      }
    }

    if (!hasAccess) {
      return Response.json({ error: 'Access denied' }, { status: 403 })
    }

    return Response.json(mvr)
  } catch (error) {
    return Response.json({ error: 'Failed to fetch MVR issue', details: error }, { status: 500 })
  }
}

// PUT /api/mvr_issues/[id] - Update MVR issue
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: MvrUpdateData = await request.json()
    
    // First get the existing MVR to check access
    const existingMvr = await db.mvr_issue.findUnique({
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

    if (!existingMvr) {
      return Response.json({ error: 'MVR issue not found' }, { status: 404 })
    }

    // Access control check - support Master, Organization, and Location managers
    let hasAccess = false
    const party = existingMvr.issue.party
    
    // 1. Check direct ownership first
    if (party.userId === userId) {
      hasAccess = true
    }

    if (!hasAccess) {
      // Get the driver's role to find their organization and location
      const driverRole = await db.role.findFirst({
        where: {
          partyId: party.id,
          isActive: true
        }
      })

      if (driverRole) {
        // 2. Check if user is a Master consultant who manages this organization
        const userMasterOrg = await db.organization.findFirst({
          where: {
            party: { userId: userId }
          }
        })

        if (userMasterOrg) {
          // Check if master org manages the driver's organization
          const masterRole = await db.role.findFirst({
            where: {
              roleType: 'master',
              partyId: userMasterOrg.partyId,
              organizationId: driverRole.organizationId,
              isActive: true
            }
          })

          if (masterRole) {
            hasAccess = true
          }
        }

        // 3. Check if user manages the same organization
        if (!hasAccess) {
          const userOrgRole = await db.role.findFirst({
            where: {
              party: { userId: userId },
              organizationId: driverRole.organizationId,
              isActive: true
            }
          })

          if (userOrgRole) {
            hasAccess = true
          }
        }

        // 4. Check if user manages the same location
        if (!hasAccess && driverRole.locationId) {
          const userLocationRole = await db.role.findFirst({
            where: {
              party: { userId: userId },
              locationId: driverRole.locationId,
              isActive: true
            }
          })

          if (userLocationRole) {
            hasAccess = true
          }
        }
      }
    }

    if (!hasAccess) {
      return Response.json({ error: 'Access denied' }, { status: 403 })
    }

    // Update in transaction
    const result = await db.$transaction(async (tx) => {
      // Update base issue if needed
      const issueUpdateData: any = {}
      if (body.title !== undefined) issueUpdateData.title = body.title
      if (body.description !== undefined) issueUpdateData.description = body.description
      if (body.priority !== undefined) issueUpdateData.priority = body.priority
      if (body.status !== undefined) issueUpdateData.status = body.status
      
      if (Object.keys(issueUpdateData).length > 0) {
        issueUpdateData.updatedAt = new Date()
        await tx.issue.update({
          where: { id: existingMvr.issueId },
          data: issueUpdateData
        })
      }

      // Update mvr_issue
      const mvrUpdateData: any = {}
      if (body.state !== undefined) mvrUpdateData.state = body.state
      if (body.violationsCount !== undefined) mvrUpdateData.violationsCount = body.violationsCount
      if (body.cleanRecord !== undefined) mvrUpdateData.cleanRecord = body.cleanRecord
      if (body.notes !== undefined) mvrUpdateData.notes = body.notes
      if (body.type !== undefined) mvrUpdateData.type = body.type
      if (body.result !== undefined) mvrUpdateData.result = body.result
      if (body.result_dach !== undefined) mvrUpdateData.result_dach = body.result_dach
      if (body.result_status !== undefined) mvrUpdateData.result_status = body.result_status
      if (body.reviewedBy !== undefined) mvrUpdateData.reviewedBy = body.reviewedBy
      if (body.certification !== undefined) mvrUpdateData.certification = body.certification
      if (body.status !== undefined) mvrUpdateData.status = body.status
      if (body.startDate !== undefined) mvrUpdateData.startDate = body.startDate ? new Date(body.startDate) : null
      if (body.expirationDate !== undefined) mvrUpdateData.expirationDate = body.expirationDate ? new Date(body.expirationDate) : null
      if (body.renewalDate !== undefined) mvrUpdateData.renewalDate = body.renewalDate ? new Date(body.renewalDate) : null
      
      if (Object.keys(mvrUpdateData).length > 0) {
        mvrUpdateData.updatedAt = new Date()
      }

      const updatedMvr = await tx.mvr_issue.update({
        where: { id: params.id },
        data: mvrUpdateData,
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

      return updatedMvr
    })

    return Response.json(result)
  } catch (error) {
    return Response.json({ error: 'Failed to update MVR issue', details: error }, { status: 500 })
  }
}

// DELETE /api/mvr_issues/[id] - Soft delete (mark as resolved)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existingMvr = await db.mvr_issue.findUnique({
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

    if (!existingMvr) {
      return Response.json({ error: 'MVR issue not found' }, { status: 404 })
    }

    // Access control check - support Master, Organization, and Location managers
    let hasAccess = false
    const party = existingMvr.issue.party
    
    // 1. Check direct ownership first
    if (party.userId === userId) {
      hasAccess = true
    }

    if (!hasAccess) {
      // Get the driver's role to find their organization and location
      const driverRole = await db.role.findFirst({
        where: {
          partyId: party.id,
          isActive: true
        }
      })

      if (driverRole) {
        // 2. Check if user is a Master consultant who manages this organization
        const userMasterOrg = await db.organization.findFirst({
          where: {
            party: { userId: userId }
          }
        })

        if (userMasterOrg) {
          // Check if master org manages the driver's organization
          const masterRole = await db.role.findFirst({
            where: {
              roleType: 'master',
              partyId: userMasterOrg.partyId,
              organizationId: driverRole.organizationId,
              isActive: true
            }
          })

          if (masterRole) {
            hasAccess = true
          }
        }

        // 3. Check if user manages the same organization
        if (!hasAccess) {
          const userOrgRole = await db.role.findFirst({
            where: {
              party: { userId: userId },
              organizationId: driverRole.organizationId,
              isActive: true
            }
          })

          if (userOrgRole) {
            hasAccess = true
          }
        }

        // 4. Check if user manages the same location
        if (!hasAccess && driverRole.locationId) {
          const userLocationRole = await db.role.findFirst({
            where: {
              party: { userId: userId },
              locationId: driverRole.locationId,
              isActive: true
            }
          })

          if (userLocationRole) {
            hasAccess = true
          }
        }
      }
    }

    if (!hasAccess) {
      return Response.json({ error: 'Access denied' }, { status: 403 })
    }

    // Soft delete by updating status
    await db.issue.update({
      where: { id: existingMvr.issueId },
      data: {
        status: 'resolved',
        resolvedAt: new Date(),
        updatedAt: new Date()
      }
    })

    return Response.json({ message: 'MVR issue deactivated successfully' })
  } catch (error) {
    return Response.json({ error: 'Failed to delete MVR issue', details: error }, { status: 500 })
  }
} 