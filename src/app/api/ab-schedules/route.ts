import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { createId } from '@paralleldrive/cuid2'
import { MaintenancePriority, MaintenanceInterval } from '@prisma/client'

// Define types for A&B schedule data
export interface ABScheduleData {
  organizationId?: string
  equipmentCategory: string
  vehicleTypeId?: string
  scheduleType: string
  itemCode: string
  itemDescription: string
  intervalDays?: number
  intervalMiles?: number
  intervalType: MaintenanceInterval
  category: string
  component: string
  taskType: string
  estimatedHours?: number
  estimatedCost?: number
  dotRequired: boolean
  priority: MaintenancePriority
  safetyRelated: boolean
  sortOrder: number
  isActive: boolean
}

// GET /api/ab-schedules - Get A&B maintenance schedules
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const equipmentCategory = searchParams.get('equipmentCategory')
    const scheduleType = searchParams.get('scheduleType')
    const includeDefaults = searchParams.get('includeDefaults') === 'true'

    // Build where clause
    const where: any = {
      isActive: true
    }

    if (organizationId) {
      if (includeDefaults) {
        // Get organization-specific schedules OR default schedules
        where.OR = [
          { organizationId },
          { organizationId: null, isDefault: true }
        ]
      } else {
        // Get only organization-specific schedules
        where.organizationId = organizationId
      }
    } else {
      // Get only default schedules
      where.organizationId = null
      where.isDefault = true
    }

    if (equipmentCategory) {
      where.equipmentCategory = equipmentCategory
    }

    if (scheduleType) {
      where.scheduleType = scheduleType
    }

    const schedules = await db.equipment_ab_schedule.findMany({
      where,
      include: {
        organization: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { equipmentCategory: 'asc' },
        { scheduleType: 'asc' },
        { sortOrder: 'asc' }
      ]
    })

    return Response.json(schedules)
  } catch (error) {
    console.error('Error fetching A&B schedules:', error)
    return Response.json({ error: 'Failed to fetch A&B schedules' }, { status: 500 })
  }
}

// POST /api/ab-schedules - Create custom A&B schedule item for organization
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data: ABScheduleData = await request.json()

    // Validate required fields
    if (!data.organizationId || !data.equipmentCategory || !data.scheduleType || 
        !data.itemCode || !data.itemDescription || !data.intervalType || 
        !data.category || !data.component || !data.taskType) {
      return Response.json({ 
        error: 'Missing required fields: organizationId, equipmentCategory, scheduleType, itemCode, itemDescription, intervalType, category, component, taskType' 
      }, { status: 400 })
    }

    // Verify organization exists and user has access
    const organization = await db.organization.findFirst({
      where: {
        id: data.organizationId,
        party: {
          userId
        }
      }
    })

    if (!organization) {
      return Response.json({ error: 'Organization not found or access denied' }, { status: 403 })
    }

    const schedule = await db.equipment_ab_schedule.create({
      data: {
        id: createId(),
        organizationId: data.organizationId,
        equipmentCategory: data.equipmentCategory,
        vehicleTypeId: data.vehicleTypeId || null,
        scheduleType: data.scheduleType,
        itemCode: data.itemCode,
        itemDescription: data.itemDescription,
        intervalDays: data.intervalDays || null,
        intervalMiles: data.intervalMiles || null,
        intervalType: data.intervalType,
        category: data.category,
        component: data.component,
        taskType: data.taskType,
        estimatedHours: data.estimatedHours || null,
        estimatedCost: data.estimatedCost || null,
        dotRequired: data.dotRequired,
        priority: data.priority,
        safetyRelated: data.safetyRelated,
        sortOrder: data.sortOrder,
        isActive: data.isActive !== false,
        isDefault: false // Custom schedules are never defaults
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return Response.json(schedule, { status: 201 })
  } catch (error) {
    console.error('Error creating A&B schedule:', error)
    return Response.json({ error: 'Failed to create A&B schedule' }, { status: 500 })
  }
} 