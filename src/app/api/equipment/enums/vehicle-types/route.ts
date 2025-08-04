import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/db'

export async function GET(request: NextRequest) {
  try {
    const vehicleTypes = await prisma.equipmentVehicleType.findMany({
      where: {
        isActive: true,
        organizationId: null // System defaults
      },
      orderBy: [
        { isDefault: 'desc' },
        { label: 'asc' }
      ],
      select: {
        id: true,
        code: true,
        label: true,
        isDefault: true
      }
    })

    return NextResponse.json(vehicleTypes)
  } catch (error) {
    console.error('Error fetching equipment vehicle type options:', error)
    return NextResponse.json({ error: 'Failed to fetch vehicle type options' }, { status: 500 })
  }
} 