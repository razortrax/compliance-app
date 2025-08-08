import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { captureAPIError } from '@/lib/sentry-utils'
import { withApiError } from '@/lib/with-api-error'

export const GET = withApiError('/api/equipment/enums/status', async (request: NextRequest) => {
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
})