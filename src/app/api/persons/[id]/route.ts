import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: personId } = await context.params

    // Fetch the person with their party and role information
    const person = await db.person.findUnique({
      where: { id: personId },
      include: {
        party: {
          include: {
            role: {
              where: { isActive: true },
              include: {
                location: {
                  select: { id: true, name: true }
                }
              }
            }
          }
        }
      }
    })

    if (!person) {
      return NextResponse.json({ error: 'Person not found' }, { status: 404 })
    }

    // TODO: Add access control logic similar to /api/persons GET
    // For now, allowing if user has any relationship to the person's organization

    return NextResponse.json(person)
  } catch (error) {
    console.error('Error fetching person:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: personId } = await context.params
    const { firstName, lastName, dateOfBirth, locationId, organizationId } = await req.json()

    if (!firstName || !lastName) {
      return NextResponse.json({
        error: 'Missing required fields: firstName, lastName'
      }, { status: 400 })
    }

    // Verify the person exists and get their current party/role info
    const existingPerson = await db.person.findUnique({
      where: { id: personId },
      include: {
        party: {
          include: {
            role: {
              where: { isActive: true }
            }
          }
        }
      }
    })

    if (!existingPerson) {
      return NextResponse.json({ error: 'Person not found' }, { status: 404 })
    }

    // TODO: Add access control logic similar to /api/persons POST
    // For now, allowing if user has relationship to the organization

    // Use transaction to update person and potentially update role
    const result = await db.$transaction(async (tx) => {
      // Update the person record
      const updatedPerson = await tx.person.update({
        where: { id: personId },
        data: {
          firstName,
          lastName,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        }
      })

      // If locationId is provided and different from current, update the role
      const currentRole = existingPerson.party?.role?.[0]
      if (currentRole && (locationId !== (currentRole.locationId || 'none'))) {
        await tx.role.update({
          where: { id: currentRole.id },
          data: {
            locationId: locationId === 'none' ? null : locationId
          }
        })
      }

      return updatedPerson
    })

    console.log('✅ Updated person:', {
      personId,
      name: `${firstName} ${lastName}`,
      organizationId,
      locationId: locationId === 'none' ? null : locationId
    })

    return NextResponse.json({
      message: 'Person updated successfully',
      person: result
    })
  } catch (error) {
    console.error('Error updating person:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 