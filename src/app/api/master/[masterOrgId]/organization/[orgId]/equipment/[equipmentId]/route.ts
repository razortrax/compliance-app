import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { masterOrgId: string; orgId: string; equipmentId: string } }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { masterOrgId, orgId, equipmentId } = params

    // Get equipment details
    const equipment = await db.equipment.findUnique({
      where: { id: equipmentId },
      include: {
        party: true,
        location: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!equipment) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 })
    }

    // Get organization details
    const organization = await db.organization.findUnique({
      where: { id: orgId },
      select: { id: true, name: true }
    })

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Get master organization details
    const masterOrg = await db.organization.findUnique({
      where: { id: masterOrgId },
      select: { id: true, name: true }
    })

    if (!masterOrg) {
      return NextResponse.json({ error: 'Master organization not found' }, { status: 404 })
    }

    return NextResponse.json({
      masterOrg: {
        id: masterOrg.id,
        name: masterOrg.name
      },
      organization: {
        id: organization.id,
        name: organization.name
      },
      equipment: {
        id: equipment.id,
        vehicleTypeId: equipment.vehicleTypeId,
        make: equipment.make,
        model: equipment.model,
        year: equipment.year,
        vin: equipment.vin,
        plateNumber: equipment.plateNumber,
        registrationExpiry: equipment.registrationExpiry?.toISOString(),
        party: {
          id: equipment.party.id
        },
        organization: {
          id: organization.id,
          name: organization.name
        },
        location: equipment.location ? {
          id: equipment.location.id,
          name: equipment.location.name
        } : null
      }
    })

  } catch (error) {
    console.error('Error fetching equipment details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch equipment details' },
      { status: 500 }
    )
  }
} 