import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; locationId: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has access to this organization (same logic as other endpoints)
    let organization = await db.organization.findFirst({
      where: {
        id: params.id,
        party: { userId }
      }
    })

    // If not owner, check if user has an active role in this organization
    if (!organization) {
      const hasRole = await db.role.findFirst({
        where: {
          party: { userId },
          organizationId: params.id,
          isActive: true
        }
      })

      if (!hasRole) {
        return NextResponse.json({ error: 'Organization not found or access denied' }, { status: 404 })
      }

      // User has role, fetch the organization
      organization = await db.organization.findUnique({
        where: { id: params.id }
      })

      if (!organization) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
      }
    }

    // Fetch the location with counts
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
  { params }: { params: { id: string; locationId: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has access to this organization (same authorization logic)
    let organization = await db.organization.findFirst({
      where: {
        id: params.id,
        party: { userId }
      }
    })

    if (!organization) {
      const hasRole = await db.role.findFirst({
        where: {
          party: { userId },
          organizationId: params.id,
          isActive: true
        }
      })

      if (!hasRole) {
        return NextResponse.json({ error: 'Organization not found or access denied' }, { status: 403 })
      }

      organization = await db.organization.findUnique({
        where: { id: params.id }
      })

      if (!organization) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
      }
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