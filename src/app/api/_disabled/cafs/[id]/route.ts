import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cafId = params.id

    const caf = await db.corrective_action_form.findUnique({
      where: { id: cafId },
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
        rins_violation: {
          include: {
            roadside_inspection: {
              include: {
                issue: {
                  include: {
                    party: {
                      include: {
                        person: true,
                        equipment: true,
                        role: true
                      }
                    }
                  }
                }
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
        },
        attachments: true
      }
    })

    if (!caf) {
      return NextResponse.json({ error: 'CAF not found' }, { status: 404 })
    }

    return NextResponse.json(caf)
  } catch (error) {
    console.error('Error fetching CAF:', error)
    return NextResponse.json({ error: 'Failed to fetch CAF' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cafId = params.id
    const body = await request.json()

    const {
      assignedStaffId,
      correctiveActions,
      violationCorrectiveActions,
      notes,
      dueDate,
      status
    } = body

    // If we have individual violation corrective actions, store them as JSON
    const finalCorrectiveActions = violationCorrectiveActions 
      ? JSON.stringify(violationCorrectiveActions)
      : correctiveActions

    // Update the CAF
    const updatedCAF = await db.corrective_action_form.update({
      where: { id: cafId },
      data: {
        assignedStaffId: assignedStaffId || undefined,
        correctiveActions: finalCorrectiveActions || undefined,
        notes: notes || undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        status: status || undefined,
        updatedAt: new Date()
      },
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
        rins_violation: true,
        organization: true
      }
    })

    return NextResponse.json(updatedCAF)
  } catch (error) {
    console.error('Error updating CAF:', error)
    return NextResponse.json({ error: 'Failed to update CAF' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cafId = params.id

    // Soft delete by setting a deleted flag or hard delete
    await db.corrective_action_form.delete({
      where: { id: cafId }
    })

    return NextResponse.json({ message: 'CAF deleted successfully' })
  } catch (error) {
    console.error('Error deleting CAF:', error)
    return NextResponse.json({ error: 'Failed to delete CAF' }, { status: 500 })
  }
} 