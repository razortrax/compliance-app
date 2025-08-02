import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'

interface TrainingUpdateData {
  trainingType?: string
  provider?: string
  instructor?: string
  location?: string
  startDate?: string
  completionDate?: string
  expirationDate?: string
  certificateNumber?: string
  hours?: number
  isRequired?: boolean
  competencies?: any[]
  notes?: string
  title?: string
  description?: string
  priority?: string
  status?: string
}

// GET /api/trainings/[id] - Get specific training
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const training = await db.training_issue.findUnique({
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

    if (!training) {
      return Response.json({ error: 'Training not found' }, { status: 404 })
    }

    // Access control check (similar to licenses)
    const party = training.issue.party
    
    let hasAccess = false
    
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

        // 3. Check if user is an Organization manager or consultant in the same organization
        if (!hasAccess) {
          const orgManagerRole = await db.role.findFirst({
            where: {
              party: { userId: userId },
              organizationId: driverRole.organizationId,
              roleType: { in: ['organization_manager', 'owner', 'consultant'] },
              isActive: true
            }
          })

          if (orgManagerRole) {
            hasAccess = true
          }
        }

        // 4. Check if user is a Location manager at the same location
        if (!hasAccess && driverRole.locationId) {
          const locationManagerRole = await db.role.findFirst({
            where: {
              party: { userId: userId },
              locationId: driverRole.locationId,
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

    // Add calculated status
    const today = new Date()
    const expirationDate = training.expirationDate ? new Date(training.expirationDate) : null
    const daysUntilExpiry = expirationDate ? Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null
    
    let calculatedStatus = 'current'
    if (daysUntilExpiry !== null) {
      if (daysUntilExpiry < 0) {
        calculatedStatus = 'expired'
      } else if (daysUntilExpiry <= 15) {
        calculatedStatus = 'critical'
      } else if (daysUntilExpiry <= 30) {
        calculatedStatus = 'warning'
      }
    }

    return Response.json({
      ...training,
      calculatedStatus,
      daysUntilExpiry
    })
  } catch (error) {
    console.error('Error fetching training:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/trainings/[id] - Update training
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: TrainingUpdateData = await request.json()

    // First get the existing training to check access
    const existingTraining = await db.training_issue.findUnique({
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

    if (!existingTraining) {
      return Response.json({ error: 'Training not found' }, { status: 404 })
    }

    // Access control check - support Master, Organization, and Location managers
    let hasAccess = false
    const party = existingTraining.issue.party
    
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

        // 3. Check if user is an Organization manager or consultant in the same organization
        if (!hasAccess) {
          const orgManagerRole = await db.role.findFirst({
            where: {
              party: { userId: userId },
              organizationId: driverRole.organizationId,
              roleType: { in: ['organization_manager', 'owner', 'consultant'] },
              isActive: true
            }
          })

          if (orgManagerRole) {
            hasAccess = true
          }
        }

        // 4. Check if user is a Location manager at the same location
        if (!hasAccess && driverRole.locationId) {
          const locationManagerRole = await db.role.findFirst({
            where: {
              party: { userId: userId },
              locationId: driverRole.locationId,
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

    // Update training in transaction
    const result = await db.$transaction(async (tx) => {
      // Update base issue if needed
      const issueUpdateData: any = {}
      if (body.title !== undefined) issueUpdateData.title = body.title
      if (body.description !== undefined) issueUpdateData.description = body.description
      if (body.priority !== undefined) issueUpdateData.priority = body.priority
      if (body.status !== undefined) issueUpdateData.status = body.status
      if (body.expirationDate !== undefined) issueUpdateData.dueDate = new Date(body.expirationDate)
      
      if (Object.keys(issueUpdateData).length > 0) {
        issueUpdateData.updatedAt = new Date()
        await tx.issue.update({
          where: { id: existingTraining.issueId },
          data: issueUpdateData
        })
      }

      // Update training issue
      const trainingUpdateData: any = {}
      if (body.trainingType !== undefined) trainingUpdateData.trainingType = body.trainingType
      if (body.provider !== undefined) trainingUpdateData.provider = body.provider
      if (body.instructor !== undefined) trainingUpdateData.instructor = body.instructor
      if (body.location !== undefined) trainingUpdateData.location = body.location
      if (body.startDate !== undefined) trainingUpdateData.startDate = body.startDate ? new Date(body.startDate) : null
      if (body.completionDate !== undefined) trainingUpdateData.completionDate = new Date(body.completionDate)
      if (body.expirationDate !== undefined) trainingUpdateData.expirationDate = new Date(body.expirationDate)
      if (body.certificateNumber !== undefined) trainingUpdateData.certificateNumber = body.certificateNumber
      if (body.hours !== undefined) trainingUpdateData.hours = body.hours
      if (body.isRequired !== undefined) trainingUpdateData.isRequired = body.isRequired
      if (body.competencies !== undefined) trainingUpdateData.competencies = body.competencies as any
      if (body.notes !== undefined) trainingUpdateData.notes = body.notes
      
      if (Object.keys(trainingUpdateData).length > 0) {
        trainingUpdateData.updatedAt = new Date()
      }

      const updatedTraining = await tx.training_issue.update({
        where: { id: params.id },
        data: trainingUpdateData,
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

      return updatedTraining
    })

    return Response.json(result)
  } catch (error) {
    console.error('Error updating training:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/trainings/[id] - Soft delete training (mark as resolved/inactive)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // First get the existing training to check access
    const existingTraining = await db.training_issue.findUnique({
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

    if (!existingTraining) {
      return Response.json({ error: 'Training not found' }, { status: 404 })
    }

    // Access control check (same as PUT)
    let hasAccess = false
    const party = existingTraining.issue.party
    
    if (party.userId === userId) {
      hasAccess = true
    }

    if (!hasAccess) {
      const driverRole = await db.role.findFirst({
        where: {
          partyId: party.id,
          isActive: true
        }
      })

      if (driverRole) {
        const userMasterOrg = await db.organization.findFirst({
          where: {
            party: { userId: userId }
          }
        })

        if (userMasterOrg) {
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

        if (!hasAccess) {
          const orgManagerRole = await db.role.findFirst({
            where: {
              party: { userId: userId },
              organizationId: driverRole.organizationId,
              roleType: { in: ['organization_manager', 'owner', 'consultant'] },
              isActive: true
            }
          })

          if (orgManagerRole) {
            hasAccess = true
          }
        }

        if (!hasAccess && driverRole.locationId) {
          const locationManagerRole = await db.role.findFirst({
            where: {
              party: { userId: userId },
              locationId: driverRole.locationId,
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

    // Soft delete by updating status
    const result = await db.issue.update({
      where: { id: existingTraining.issueId },
      data: {
        status: 'resolved',
        resolvedAt: new Date(),
        updatedAt: new Date()
      }
    })

    return Response.json({ message: 'Training deleted successfully' })
  } catch (error) {
    console.error('Error deleting training:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
} 