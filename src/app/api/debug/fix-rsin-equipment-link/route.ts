import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { auth } from '@clerk/nextjs/server'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { incidentId, equipmentId } = await request.json()

    // Check if the incident exists
    const incident = await db.incident.findUnique({
      where: { id: incidentId },
      include: { equipment: true }
    })

    if (!incident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 })
    }

    // Check if equipment exists
    const equipment = await db.equipment.findUnique({
      where: { id: equipmentId }
    })

    if (!equipment) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 })
    }

    // Check if link already exists
    const existingLink = await db.incident_equipment_involvement.findFirst({
      where: {
        incidentId: incidentId,
        equipmentId: equipmentId
      }
    })

    if (existingLink) {
      return NextResponse.json({ message: 'Link already exists', link: existingLink })
    }

    // Create the equipment involvement link
    const newLink = await db.incident_equipment_involvement.create({
      data: {
        incidentId: incidentId,
        equipmentId: equipmentId,
        unitNumber: incident.equipment.length + 1 // Next unit number
      }
    })

    return NextResponse.json({ 
      message: 'Successfully linked RSIN to equipment',
      link: newLink
    })

  } catch (error: unknown) {
    console.error('Error linking RSIN to equipment:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 