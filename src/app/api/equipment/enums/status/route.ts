import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { captureAPIError } from '@/lib/sentry-utils'

export async function GET(request: NextRequest) {
  try {
    // Get system defaults and org-specific options
    // For now, just return system defaults (organizationId: null)
    const statuses = await db.equipmentStatus.findMany({
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

    return NextResponse.json(statuses)
  } catch (error) {
    console.error('Error fetching equipment status options:', error)
    captureAPIError(error instanceof Error ? error : new Error('Unknown error'), {
      endpoint: '/api/equipment/enums/status',
      method: 'GET',
    })
    return NextResponse.json({ error: 'Failed to fetch status options' }, { status: 500 })
  }
} 