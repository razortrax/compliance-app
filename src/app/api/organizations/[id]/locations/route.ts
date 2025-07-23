import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { createId } from '@paralleldrive/cuid2'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: organizationId } = await context.params

    // Check if user has access to this organization
    // First check if user owns the organization
    let organization = await db.organization.findFirst({
      where: {
        id: organizationId,
        party: { userId }
      }
    })

    // If not owner, check if user has an active role in this organization
    if (!organization) {
      const hasRole = await db.role.findFirst({
        where: {
          party: { userId },
          organizationId: organizationId,
          isActive: true
        }
      })

      if (!hasRole) {
        return NextResponse.json({ error: 'Organization not found or access denied' }, { status: 404 })
      }

      // User has role, fetch the organization
      organization = await db.organization.findUnique({
        where: { id: organizationId }
      })

      if (!organization) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
      }
    }

    // Get locations for this organization
    const locations = await db.location.findMany({
      where: { organizationId },
      include: {
        _count: {
          select: {
            equipment: true,
            role: true
          }
        }
      },
      orderBy: [
        { isMainLocation: 'desc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json(locations)
  } catch (error) {
    console.error('Error fetching locations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: organizationId } = await context.params
    const body = await request.json()

    // Verify user has access to this organization
    const organization = await db.organization.findFirst({
      where: {
        id: organizationId,
        party: { userId }  // Only master users can create locations
      }
    })

    if (!organization) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // If this is the first location and isMainLocation is true, ensure no other main location exists
    if (body.isMainLocation) {
      await db.location.updateMany({
        where: { organizationId },
        data: { isMainLocation: false }
      })
    }

    // Create the location
    const location = await db.location.create({
      data: {
        id: createId(),
        organizationId,
        name: body.name,
        locationType: body.locationType,
        address: body.address,
        city: body.city,
        state: body.state,
        zipCode: body.zipCode,
        phone: body.phone || null,
        email: body.email || null,
        isMainLocation: body.isMainLocation || false,
        isActive: true
      }
    })

    return NextResponse.json(location)
  } catch (error) {
    console.error('Error creating location:', error)
    return NextResponse.json(
      { error: 'Failed to create location' },
      { status: 500 }
    )
  }
} 