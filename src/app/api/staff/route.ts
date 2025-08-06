import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { createId } from '@paralleldrive/cuid2'

interface StaffData {
  partyId?: string
  organizationId: string
  locationId?: string
  newPerson?: any
  employeeId?: string
  position?: string
  department?: string
  supervisorId?: string
  hireDate?: Date
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
    const locationId = searchParams.get('locationId')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    // Build where clause for staff filtering
    const whereClause = {
      party: {
        role: {
          some: {
            organizationId: organizationId,
            ...(locationId && { locationId }), // Add locationId filter if provided
            isActive: true
          }
        }
      },
      isActive: true
    }

    // Get all staff for the organization (and optionally location)
    const staff = await db.staff.findMany({
      where: whereClause,
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

    if (!data.organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    let partyId = data.partyId

    // If creating a new person, create person and party first
    if (!partyId && data.newPerson) {
      const newPersonData = data.newPerson
      
      // Create person and party
      const person = await db.person.create({
        data: {
          id: createId(),
          firstName: newPersonData.firstName,
          lastName: newPersonData.lastName,
          email: newPersonData.email,
          phone: newPersonData.phone,
          address: newPersonData.address,
          city: newPersonData.city,
          state: newPersonData.state,
          zipCode: newPersonData.zipCode,
        }
      })

      const party = await db.party.create({
        data: {
          id: createId(),
          personId: person.id,
        }
      })

      partyId = party.id
    }

    if (!partyId) {
      return NextResponse.json({ error: 'Party ID or new person data is required' }, { status: 400 })
    }

    // Verify the party exists
    const party = await db.party.findUnique({
      where: { id: partyId },
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
      where: { partyId }
    })

    if (existingStaff) {
      return NextResponse.json({ error: 'Staff record already exists for this party' }, { status: 400 })
    }

    // Use a transaction to create both staff record and role
    const result = await db.$transaction(async (tx) => {
      // Create staff record
      const staff = await tx.staff.create({
        data: {
          id: createId(),
          partyId,
          employeeId: data.employeeId,
          position: data.position,
          department: data.department,
          supervisorId: data.supervisorId,
          canApproveCAFs: data.canApproveCAFs || false,
          canSignCAFs: data.canSignCAFs || false,
        }
      })

      // Create role linking staff to organization (and optionally location)
      await tx.role.create({
        data: {
          id: createId(),
          partyId,
          organizationId: data.organizationId,
          locationId: data.locationId, // Can be null for organization-level staff
          roleType: 'staff',
          startDate: data.hireDate || new Date(),
          isActive: true,
        }
      })

      return staff
    })

    // Fetch the complete staff record with includes
    const staff = await db.staff.findUnique({
      where: { id: result.id },
      include: {
        party: {
          include: {
            person: true,
            role: {
              where: { isActive: true }
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
        }
      }
    })

    return NextResponse.json(staff, { status: 201 })
  } catch (error) {
    console.error('Error creating staff:', error)
    return NextResponse.json({ error: 'Failed to create staff' }, { status: 500 })
  }
} 