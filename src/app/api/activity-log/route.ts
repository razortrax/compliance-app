import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'

export async function GET(request: NextRequest) {
  try {
    const authResult = await auth()
    const userId = authResult.userId
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    
    // Entity context filters
    const issueId = searchParams.get('issueId')
    const organizationId = searchParams.get('organizationId')
    const personId = searchParams.get('personId')
    const equipmentId = searchParams.get('equipmentId')
    const locationId = searchParams.get('locationId')
    const cafId = searchParams.get('cafId')
    
    // Build where clause based on entity context
    const where: any = {}
    if (issueId) where.issueId = issueId
    if (organizationId) where.organizationId = organizationId
    if (personId) where.personId = personId
    if (equipmentId) where.equipmentId = equipmentId
    if (locationId) where.locationId = locationId
    if (cafId) where.cafId = cafId

    const activities = await db.activity_log.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100 // Limit to prevent performance issues
    })

    return NextResponse.json(activities)

  } catch (error) {
    console.error('Error fetching activity log:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity log' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await auth()
    const userId = authResult.userId
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    
    // Validate required fields
    if (!data.activityType || !data.title || !data.content) {
      return NextResponse.json(
        { error: 'Missing required fields: activityType, title, content' },
        { status: 400 }
      )
    }

    // Validate at least one entity relationship
    const hasEntityRelation = data.issueId || data.organizationId || data.personId || 
                             data.equipmentId || data.locationId || data.cafId
    
    if (!hasEntityRelation) {
      return NextResponse.json(
        { error: 'Activity must be associated with at least one entity' },
        { status: 400 }
      )
    }

    // Handle credential encryption (basic implementation - in production use proper encryption)
    let encryptedPassword = null
    if (data.activityType === 'credential' && data.password) {
      // In production, use proper encryption library
      // For now, we'll just indicate it should be encrypted
      encryptedPassword = `[ENCRYPTED]${data.password}` // Placeholder
    }

    const activityData = {
      activityType: data.activityType,
      title: data.title,
      content: data.content,
      tags: data.tags || [],
      createdBy: userId,
      
      // Entity relationships (optional)
      ...(data.issueId && { issueId: data.issueId }),
      ...(data.organizationId && { organizationId: data.organizationId }),
      ...(data.personId && { personId: data.personId }),
      ...(data.equipmentId && { equipmentId: data.equipmentId }),
      ...(data.locationId && { locationId: data.locationId }),
      ...(data.cafId && { cafId: data.cafId }),
      
      // Activity-specific fields
      ...(data.fileName && { fileName: data.fileName }),
      ...(data.fileType && { fileType: data.fileType }),
      ...(data.fileSize && { fileSize: data.fileSize }),
      ...(data.filePath && { filePath: data.filePath }),
      ...(data.username && { username: data.username }),
      ...(encryptedPassword && { password: encryptedPassword }),
      ...(data.portalUrl && { portalUrl: data.portalUrl }),
      ...(data.dueDate && { dueDate: new Date(data.dueDate) }),
      ...(data.priority && { priority: data.priority }),
      ...(data.isCompleted !== undefined && { isCompleted: data.isCompleted })
    }

    const activity = await db.activity_log.create({
      data: activityData
    })

    return NextResponse.json(activity)

  } catch (error) {
    console.error('Error creating activity:', error)
    return NextResponse.json(
      { error: 'Failed to create activity' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await auth()
    const userId = authResult.userId
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    
    if (!data.id) {
      return NextResponse.json(
        { error: 'Activity ID is required' },
        { status: 400 }
      )
    }

    // Check if user has permission to edit this activity
    const existingActivity = await db.activity_log.findUnique({
      where: { id: data.id }
    })

    if (!existingActivity) {
      return NextResponse.json(
        { error: 'Activity not found' },
        { status: 404 }
      )
    }

    if (existingActivity.createdBy !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized to edit this activity' },
        { status: 403 }
      )
    }

    // Handle credential encryption for updates
    let encryptedPassword = existingActivity.password
    if (data.activityType === 'credential' && data.password && data.password !== existingActivity.password) {
      encryptedPassword = `[ENCRYPTED]${data.password}` // Placeholder
    }

    const updateData = {
      ...(data.title && { title: data.title }),
      ...(data.content && { content: data.content }),
      ...(data.tags && { tags: data.tags }),
      ...(data.username && { username: data.username }),
      ...(encryptedPassword !== existingActivity.password && { password: encryptedPassword }),
      ...(data.portalUrl && { portalUrl: data.portalUrl }),
      ...(data.dueDate && { dueDate: new Date(data.dueDate) }),
      ...(data.priority && { priority: data.priority }),
      ...(data.isCompleted !== undefined && { isCompleted: data.isCompleted })
    }

    const updatedActivity = await db.activity_log.update({
      where: { id: data.id },
      data: updateData
    })

    return NextResponse.json(updatedActivity)

  } catch (error) {
    console.error('Error updating activity:', error)
    return NextResponse.json(
      { error: 'Failed to update activity' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await auth()
    const userId = authResult.userId
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const activityId = searchParams.get('id')
    
    if (!activityId) {
      return NextResponse.json(
        { error: 'Activity ID is required' },
        { status: 400 }
      )
    }

    // Check if user has permission to delete this activity
    const existingActivity = await db.activity_log.findUnique({
      where: { id: activityId }
    })

    if (!existingActivity) {
      return NextResponse.json(
        { error: 'Activity not found' },
        { status: 404 }
      )
    }

    if (existingActivity.createdBy !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this activity' },
        { status: 403 }
      )
    }

    await db.activity_log.delete({
      where: { id: activityId }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting activity:', error)
    return NextResponse.json(
      { error: 'Failed to delete activity' },
      { status: 500 }
    )
  }
} 