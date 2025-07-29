import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'

// GET /api/staff/[id] - Get specific staff member
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const staffId = params.id

    const staff = await db.staff.findUnique({
      where: { id: staffId },
      include: {
        party: {
          include: {
            person: true,
            role: {
              where: { isActive: true },
              include: {
                location: {
                  select: { id: true, name: true }
                }
              }
            }
          }
        },
        supervisor: {
          include: {
            party: {
              include: {
                person: {
                  select: { firstName: true, lastName: true }
                }
              }
            }
          }
        }
      }
    })

    if (!staff) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
    }

    // Verify user has access to this staff member's organization
    const organizationId = staff.party?.role?.[0]?.organizationId
    if (!organizationId) {
      return NextResponse.json({ error: 'Staff member has no organization' }, { status: 400 })
    }

    // Check access similar to other routes
    const userMasterOrg = await db.organization.findFirst({
      where: { party: { userId } }
    })

    let hasAccess = false

    if (userMasterOrg) {
      // Master users can access all staff
      hasAccess = true
    } else {
      // Check if user owns the organization or has role in it
      const organization = await db.organization.findFirst({
        where: {
          id: organizationId,
          party: { userId }
        }
      })

      if (organization) {
        hasAccess = true
      } else {
        const hasRole = await db.role.findFirst({
          where: {
            party: { userId },
            organizationId: organizationId,
            isActive: true
          }
        })
        hasAccess = !!hasRole
      }
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json(staff)
  } catch (error) {
    console.error('Error fetching staff member:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/staff/[id] - Update staff member
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const staffId = params.id
    const body = await req.json()
    const {
      employeeId,
      position,
      department,
      supervisorId,
      canApproveCAFs,
      canSignCAFs
    } = body

    // First get the existing staff member to verify access
    const existingStaff = await db.staff.findUnique({
      where: { id: staffId },
      include: {
        party: {
          include: {
            role: {
              where: { isActive: true },
              select: { organizationId: true }
            }
          }
        }
      }
    })

    if (!existingStaff) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
    }

    const organizationId = existingStaff.party.role[0]?.organizationId
    if (!organizationId) {
      return NextResponse.json({ error: 'Staff member has no organization' }, { status: 400 })
    }

    // Verify user has access
    const userMasterOrg = await db.organization.findFirst({
      where: { party: { userId } }
    })

    let hasAccess = false

    if (userMasterOrg) {
      hasAccess = true
    } else {
      const organization = await db.organization.findFirst({
        where: {
          id: organizationId,
          party: { userId }
        }
      })

      if (organization) {
        hasAccess = true
      } else {
        const hasRole = await db.role.findFirst({
          where: {
            party: { userId },
            organizationId: organizationId,
            isActive: true
          }
        })
        hasAccess = !!hasRole
      }
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Update staff member
    const updatedStaff = await db.staff.update({
      where: { id: staffId },
      data: {
        employeeId: employeeId || null,
        position: position || null,
        department: department || null,
        supervisorId: supervisorId || null,
        canApproveCAFs: canApproveCAFs || false,
        canSignCAFs: canSignCAFs || false,
        updatedAt: new Date()
      },
      include: {
        party: {
          include: {
            person: true,
            role: {
              where: { isActive: true }
            }
          }
        }
      }
    })

    return NextResponse.json(updatedStaff)
  } catch (error) {
    console.error('Error updating staff member:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/staff/[id] - Soft delete staff member
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const staffId = params.id

    // First get the existing staff member to verify access
    const existingStaff = await db.staff.findUnique({
      where: { id: staffId },
      include: {
        party: {
          include: {
            role: {
              where: { isActive: true },
              select: { organizationId: true }
            }
          }
        }
      }
    })

    if (!existingStaff) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
    }

    const organizationId = existingStaff.party.role[0]?.organizationId
    if (!organizationId) {
      return NextResponse.json({ error: 'Staff member has no organization' }, { status: 400 })
    }

    // Verify user has access
    const userMasterOrg = await db.organization.findFirst({
      where: { party: { userId } }
    })

    let hasAccess = false

    if (userMasterOrg) {
      hasAccess = true
    } else {
      const organization = await db.organization.findFirst({
        where: {
          id: organizationId,
          party: { userId }
        }
      })

      if (organization) {
        hasAccess = true
      } else {
        const hasRole = await db.role.findFirst({
          where: {
            party: { userId },
            organizationId: organizationId,
            isActive: true
          }
        })
        hasAccess = !!hasRole
      }
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Soft delete by setting isActive to false
    const deletedStaff = await db.staff.update({
      where: { id: staffId },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ message: 'Staff member deactivated', staff: deletedStaff })
  } catch (error) {
    console.error('Error deleting staff member:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 