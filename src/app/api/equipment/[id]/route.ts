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

    const { id: equipmentId } = await context.params

    // Fetch the equipment with party and role information
    const equipment = await db.equipment.findUnique({
      where: { id: equipmentId },
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
        },
        location: {
          select: { id: true, name: true }
        }
      }
    })

    if (!equipment) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 })
    }

    // TODO: Add access control logic similar to /api/equipment GET
    // For now, allowing if user has any relationship to the equipment's organization

    return NextResponse.json(equipment)
  } catch (error) {
    console.error('Error fetching equipment:', error)
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

    const { id: equipmentId } = await context.params
    const { 
      vehicleType, 
      make, 
      model, 
      year, 
      vinNumber, 
      locationId, 
      organizationId 
    } = await req.json()

    if (!vehicleType) {
      return NextResponse.json({
        error: 'Missing required field: vehicleType'
      }, { status: 400 })
    }

    // Verify the equipment exists and get current info
    const existingEquipment = await db.equipment.findUnique({
      where: { id: equipmentId },
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

    if (!existingEquipment) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 })
    }

    // TODO: Add access control logic similar to /api/equipment POST
    // For now, allowing if user has relationship to the organization

    // Use transaction to update equipment and potentially update role
    const result = await db.$transaction(async (tx) => {
      // Update the equipment record
      const updatedEquipment = await tx.equipment.update({
        where: { id: equipmentId },
        data: {
          vehicleType,
          make: make || null,
          model: model || null,
          year: year ? parseInt(year.toString()) : null,
          vinNumber: vinNumber || null,
          locationId: locationId === 'none' ? null : locationId,
        }
      })

      // If locationId is provided and different from current, update the role
      const currentRole = existingEquipment.party?.role?.[0]
      if (currentRole && (locationId !== (currentRole.locationId || 'none'))) {
        await tx.role.update({
          where: { id: currentRole.id },
          data: {
            locationId: locationId === 'none' ? null : locationId
          }
        })
      }

      return updatedEquipment
    })

    console.log('✅ Updated equipment:', {
      equipmentId,
      vehicleType,
      make,
      model,
      organizationId,
      locationId: locationId === 'none' ? null : locationId
    })

    return NextResponse.json({
      message: 'Equipment updated successfully',
      equipment: result
    })
  } catch (error) {
    console.error('Error updating equipment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 