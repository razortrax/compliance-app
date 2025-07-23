import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { createId } from '@paralleldrive/cuid2'

export async function GET() {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Find organizations that don't have a userId (created before user connection)
    const unclaimedOrganizations = await db.organization.findMany({
      where: {
        party: {
          userId: null
        }
      },
      include: {
        party: {
          select: {
            id: true,
            createdAt: true,
            status: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({
      organizations: unclaimedOrganizations,
      count: unclaimedOrganizations.length
    })

  } catch (error) {
    console.error('Error fetching unclaimed organizations:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch unclaimed organizations' 
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { organizationIds } = await request.json()

    if (!organizationIds || !Array.isArray(organizationIds)) {
      return NextResponse.json({ 
        error: 'Organization IDs array is required' 
      }, { status: 400 })
    }

    // Update the party records for these organizations to be owned by this user
    const updateResult = await db.party.updateMany({
      where: {
        organization: {
          id: {
            in: organizationIds
          }
        },
        userId: null // Only update unclaimed organizations
      },
      data: {
        userId: userId
      }
    })

    // Also create a role for the user in these organizations
    const organizations = await db.organization.findMany({
      where: {
        id: {
          in: organizationIds
        },
        party: {
          userId: userId
        }
      },
      include: {
        party: true
      }
    })

    // Check if user has a person party record, create if needed
    let userPersonParty = await db.party.findFirst({
      where: {
        userId: userId,
        person: {
          isNot: null
        }
      }
    })

    if (!userPersonParty) {
      // Create a basic person record for the user
      userPersonParty = await db.party.create({
        data: {
          id: createId(),
          userId: userId,
          status: 'active',
          updatedAt: new Date(),
          person: {
            create: {
              id: createId(),
              firstName: 'User',
              lastName: 'User',
              email: ''
            }
          }
        }
      })
    }

    // Create master roles for the claimed organizations
    const rolePromises = organizations.map(org => 
      db.role.create({
        data: {
          id: createId(),
          partyId: userPersonParty!.id,
          roleType: 'master',
          organizationId: org.id,
          status: 'active',
          isActive: true
        }
      })
    )

    const roles = await Promise.all(rolePromises)

    return NextResponse.json({
      message: `Successfully claimed ${updateResult.count} organizations`,
      claimedCount: updateResult.count,
      organizations,
      roles
    })

  } catch (error) {
    console.error('Error claiming organizations:', error)
    return NextResponse.json({ 
      error: 'Failed to claim organizations' 
    }, { status: 500 })
  }
} 