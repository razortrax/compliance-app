import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { createId } from '@paralleldrive/cuid2'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string; locationId: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params

    // First check if user has a master organization
    const userMasterOrg = await db.organization.findFirst({
      where: {
        party: {
          userId: userId
        }
      }
    })

    let hasAccess = false

    // Check if this is the user's master organization
    if (userMasterOrg && userMasterOrg.id === params.id) {
      hasAccess = true
    } else if (userMasterOrg) {
      // Check if the user's master org manages this organization
      const masterRole = await db.role.findFirst({
        where: {
          roleType: 'master',
          partyId: userMasterOrg.partyId,
          organizationId: params.id,
          isActive: true
        }
      })
      
      if (masterRole) {
        hasAccess = true
      }
    }

    // If not master access, check for direct access
    if (!hasAccess) {
      const directAccess = await db.organization.findFirst({
        where: {
          id: params.id,
          OR: [
            {
              party: {
                userId: userId
              }
            },
            {
              party: {
                role: {
                  some: {
                    party: {
                      userId: userId
                    },
                    isActive: true
                  }
                }
              }
            }
          ]
        }
      })
      
      hasAccess = !!directAccess
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Fetch the location with counts
    console.log('Fetching location:', params.locationId, 'for org:', params.id)
    const location = await db.location.findFirst({
      where: {
        id: params.locationId,
        organizationId: params.id
      },
      include: {
        _count: {
          select: {
            equipment: true,
            role: true
          }
        }
      }
    })

    if (!location) {
      console.log('Location not found with ID:', params.locationId, 'and orgId:', params.id)
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    return NextResponse.json(location)
  } catch (error) {
    console.error('Error fetching location:', error)
    return NextResponse.json(
      { error: 'Failed to fetch location' },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string; locationId: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params

    // Use the same authorization logic as GET
    const userMasterOrg = await db.organization.findFirst({
      where: {
        party: {
          userId: userId
        }
      }
    })

    let hasAccess = false

    // Check if this is the user's master organization
    if (userMasterOrg && userMasterOrg.id === params.id) {
      hasAccess = true
    } else if (userMasterOrg) {
      // Check if the user's master org manages this organization
      const masterRole = await db.role.findFirst({
        where: {
          roleType: 'master',
          partyId: userMasterOrg.partyId,
          organizationId: params.id,
          isActive: true
        }
      })
      
      if (masterRole) {
        hasAccess = true
      }
    }

    // If not master access, check for direct ownership or role
    if (!hasAccess) {
      const userOrg = await db.organization.findFirst({
        where: {
          id: params.id,
          party: {
            userId: userId
          }
        }
      })

      const userRole = await db.role.findFirst({
        where: {
          party: {
            userId: userId
          },
          organizationId: params.id,
          isActive: true
        }
      })

      hasAccess = !!(userOrg || userRole)
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const data = await req.json()
    
    const location = await db.location.update({
      where: {
        id: params.locationId,
        organizationId: params.id
      },
      data: {
        ...data,
        updatedAt: new Date()
      }
    })

    return NextResponse.json(location)
  } catch (error) {
    console.error('Error updating location:', error)
    return NextResponse.json(
      { error: 'Failed to update location' },
      { status: 500 }
    )
  }
} 