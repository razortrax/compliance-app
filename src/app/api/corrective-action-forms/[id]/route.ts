import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { updateRINSCompletionStatus } from '@/lib/caf-utils'

// GET /api/corrective-action-forms/[id] - Fetch CAF details
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const caf = await db.corrective_action_form.findUnique({
      where: { id: params.id },
      include: {
        assigned_staff: {
          include: {
            party: {
              include: {
                person: true
              }
            }
          }
        },
        created_by_staff: {
          include: {
            party: {
              include: {
                person: true
              }
            }
          }
        },
        approved_by_staff: {
          include: {
            party: {
              include: {
                person: true
              }
            }
          }
        },
        organization: true,
        signatures: {
          include: {
            staff: {
              include: {
                party: {
                  include: {
                    person: true
                  }
                }
              }
            }
          },
          orderBy: { signedAt: 'asc' }
        },
        maintenance_issues: true,
        attachments: true
      }
    })

    if (!caf) {
      return NextResponse.json({ error: 'CAF not found' }, { status: 404 })
    }

    // Verify user has access to this CAF
    // Check if user is master, organization staff, or assigned staff
    const masterRole = await db.role.findFirst({
      where: {
        party: { userId },
        roleType: 'master',
        isActive: true
      }
    })

    if (!masterRole) {
      const userRole = await db.role.findFirst({
        where: {
          party: { userId },
          organizationId: caf.organizationId,
          isActive: true
        }
      })

      if (!userRole) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    return NextResponse.json(caf)

  } catch (error) {
    console.error('Error fetching CAF:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// PUT /api/corrective-action-forms/[id] - Update CAF status
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { status, completionNotes, completedAt, approvedAt, approvedBy } = body

    // Verify CAF exists and get current state
    const existingCAF = await db.corrective_action_form.findUnique({
      where: { id: params.id },
      include: {
        assigned_staff: {
          include: {
            party: {
              include: {
                person: true
              }
            }
          }
        }
      }
    })

    if (!existingCAF) {
      return NextResponse.json({ error: 'CAF not found' }, { status: 404 })
    }

    // Verify user permissions for this action
    const masterRole = await db.role.findFirst({
      where: {
        party: { userId },
        roleType: 'master',
        isActive: true
      }
    })

    const userStaff = await db.staff.findFirst({
      where: {
        party: { userId }
      }
    })

    let canUpdate = false

    // Master users can always update
    if (masterRole) {
      canUpdate = true
    }
    // Assigned staff can update their own CAF
    else if (userStaff && existingCAF.assignedStaffId === userStaff.id) {
      canUpdate = true
    }
    // Staff with approval permissions can approve
    else if (userStaff && userStaff.canApproveCAFs && status === 'APPROVED') {
      canUpdate = true
    }

    if (!canUpdate) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      'ASSIGNED': ['IN_PROGRESS'],
      'IN_PROGRESS': ['COMPLETED', 'ASSIGNED'],
      'COMPLETED': ['APPROVED', 'REJECTED', 'IN_PROGRESS'],
      'APPROVED': [], // Final state
      'REJECTED': ['IN_PROGRESS'],
      'CANCELLED': []
    }

    if (status && !validTransitions[existingCAF.status]?.includes(status)) {
      return NextResponse.json({ 
        error: `Invalid status transition from ${existingCAF.status} to ${status}` 
      }, { status: 400 })
    }

    // Prepare update data
    const updateData: any = {}
    
    if (status) updateData.status = status
    if (completionNotes !== undefined) updateData.completionNotes = completionNotes
    if (completedAt) updateData.completedAt = new Date(completedAt)
    if (approvedAt) updateData.approvedAt = new Date(approvedAt)
    if (approvedBy) updateData.approvedBy = approvedBy

    // Update the CAF
    const updatedCAF = await db.corrective_action_form.update({
      where: { id: params.id },
      data: updateData,
      include: {
        assigned_staff: {
          include: {
            party: {
              include: {
                person: true
              }
            }
          }
        },
        created_by_staff: {
          include: {
            party: {
              include: {
                person: true
              }
            }
          }
        },
        approved_by_staff: {
          include: {
            party: {
              include: {
                person: true
              }
            }
          }
        },
        organization: true,
        signatures: {
          include: {
            staff: {
              include: {
                party: {
                  include: {
                    person: true
                  }
                }
              }
            }
          }
        }
      }
    })

    // Log the activity
    await db.activity_log.create({
      data: {
        id: require('@paralleldrive/cuid2').createId(),
        action: 'CAF_STATUS_UPDATED',
        entityType: 'corrective_action_form',
        entityId: params.id,
        details: {
          previousStatus: existingCAF.status,
          newStatus: status,
          updatedBy: userStaff ? `${userStaff.party?.person?.firstName} ${userStaff.party?.person?.lastName}` : 'Master User',
          completionNotes: completionNotes
        },
        userId,
        cafId: params.id
      }
    })

    // Check RINS completion if this CAF was approved and is linked to an incident
    if (status === 'APPROVED' && existingCAF.incidentId) {
      try {
        await updateRINSCompletionStatus(existingCAF.incidentId)
      } catch (error) {
        console.error('Error checking RINS completion:', error)
        // Don't fail the CAF update if RINS check fails
      }
    }

    return NextResponse.json(updatedCAF)

  } catch (error) {
    console.error('Error updating CAF:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
} 