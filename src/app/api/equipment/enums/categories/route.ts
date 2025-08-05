import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'

export async function GET(request: NextRequest) {
  try {
    const categories = await db.equipmentCategory.findMany({
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

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching equipment category options:', error)
    return NextResponse.json({ error: 'Failed to fetch category options' }, { status: 500 })
  }
} 