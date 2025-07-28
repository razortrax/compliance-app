import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { createId } from '@paralleldrive/cuid2'

interface StaffData {
  partyId: string
  employeeId?: string
  position?: string
  department?: string
  supervisorId?: string
  canApproveCAFs?: boolean
  canSignCAFs?: boolean
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    // Get all staff for the organization
    const staff = await db.staff.findMany({
      where: {
        party: {
          role: {
            some: {
              organizationId: organizationId,
              isActive: true
            }
          }
        },
        isActive: true
      },
      include: {
        party: {
          include: {
            person: true,
            role: {
              where: {
                organizationId: organizationId,
                isActive: true
              }
            }
          }
        },
        supervisor: {
          include: {
            party: {
              include: {
                person: true
              }
            }
          }
        },
        subordinates: {
          include: {
            party: {
              include: {
                person: true
              }
            }
          }
        }
      },
      orderBy: [
        { department: 'asc' },
        { position: 'asc' }
      ]
    })

    return NextResponse.json(staff)
  } catch (error) {
    console.error('Error fetching staff:', error)
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data: StaffData = await request.json()

    if (!data.partyId) {
      return NextResponse.json({ error: 'Party ID is required' }, { status: 400 })
    }

    // Verify the party exists and user has access
    const party = await db.party.findUnique({
      where: { id: data.partyId },
      include: {
        person: true,
        role: {
          where: { isActive: true }
        }
      }
    })

    if (!party) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404 })
    }

    // Check if staff record already exists
    const existingStaff = await db.staff.findUnique({
      where: { partyId: data.partyId }
    })

    if (existingStaff) {
      return NextResponse.json({ error: 'Staff record already exists for this party' }, { status: 400 })
    }

    // Create staff record
    const staff = await db.staff.create({
      data: {
        id: createId(),
        partyId: data.partyId,
        employeeId: data.employeeId,
        position: data.position,
        department: data.department,
        supervisorId: data.supervisorId,
        canApproveCAFs: data.canApproveCAFs || false,
        canSignCAFs: data.canSignCAFs || false,
      },
      include: {
        party: {
          include: {
            person: true,
            role: true
          }
        },
        supervisor: {
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

    return NextResponse.json(staff, { status: 201 })
  } catch (error) {
    console.error('Error creating staff:', error)
    return NextResponse.json({ error: 'Failed to create staff' }, { status: 500 })
  }
} 