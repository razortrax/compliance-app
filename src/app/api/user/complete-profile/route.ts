import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { createId } from '@paralleldrive/cuid2'

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { firstName, lastName, role, organizationName } = await request.json()

    // Validate required fields
    if (!firstName || !lastName || !role) {
      return NextResponse.json(
        { error: 'First name, last name, and role are required' },
        { status: 400 }
      )
    }

    // Validate role
    const validRoles = ['master', 'organization', 'location']
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role specified' },
        { status: 400 }
      )
    }

    // Organization/company name is now required for all roles
    if (!organizationName) {
      return NextResponse.json(
        { error: 'Company/Organization name is required' },
        { status: 400 }
      )
    }

    // Check if user already has a profile
    const existingParty = await db.party.findFirst({
      where: { userId },
      include: { person: true }
    })

    if (existingParty && existingParty.person) {
      return NextResponse.json(
        { error: 'Profile already completed' },
        { status: 400 }
      )
    }

    const result = await db.$transaction(async (tx: any) => {
      // Create or use existing user party
      const userParty = existingParty || await tx.party.create({
        data: {
          id: createId(),
          userId,
          status: 'active',
          updatedAt: new Date()
        }
      })

      // Create person record
      const person = await tx.person.create({
        data: {
          id: createId(),
          partyId: userParty.id,
          firstName,
          lastName
        }
      })

      let organization = null

      // Create organization if organizationName is provided
      if (organizationName) {
        const organizationParty = await tx.party.create({
          data: {
            id: createId(),
            userId, // Associate with user for ownership
            status: 'active',
            updatedAt: new Date()
          }
        })

        organization = await tx.organization.create({
          data: {
            id: createId(),
            partyId: organizationParty.id,
            name: organizationName
          }
        })
      }

      // Create role
      const userRole = await tx.role.create({
        data: {
          id: createId(),
          partyId: userParty.id,
          roleType: role,
          organizationId: organization?.id,
          status: 'active',
          isActive: true
        }
      })

      return {
        userParty,
        person,
        organization,
        userRole
      }
    })

    return NextResponse.json({
      message: 'Profile completed successfully',
      data: {
        person: result.person,
        organization: result.organization,
        role: result.userRole
      }
    })

  } catch (error) {
    console.error('Profile completion error:', error)
    return NextResponse.json(
      { error: 'Failed to complete profile' },
      { status: 500 }
    )
  }
} 