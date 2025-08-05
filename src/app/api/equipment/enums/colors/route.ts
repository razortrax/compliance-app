import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'

export async function GET(request: NextRequest) {
  try {
    const colors = await db.equipmentColor.findMany({
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

    return NextResponse.json(colors)
  } catch (error) {
    console.error('Error fetching equipment color options:', error)
    return NextResponse.json({ error: 'Failed to fetch color options' }, { status: 500 })
  }
} 