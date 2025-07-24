import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: personId } = await context.params
    const { roleId, endDate, reason } = await req.json()

    if (!roleId || !endDate) {
      return NextResponse.json({ 
        error: 'Missing required fields: roleId, endDate' 
      }, { status: 400 })
    }

    // Verify the role exists and belongs to the person
    const role = await db.role.findFirst({
      where: {
        id: roleId,
        partyId: {
          in: await db.person.findMany({
            where: { id: personId },
            select: { partyId: true }
          }).then(persons => persons.map(p => p.partyId))
        },
        isActive: true
      },
      include: {
        party: {
          include: {
            person: true
          }
        }
      }
    })

    if (!role) {
      return NextResponse.json({ 
        error: 'Role not found or already inactive' 
      }, { status: 404 })
    }

    // Verify user has access to the organization
    // First check if user has a master organization
    const userMasterOrg = await db.organization.findFirst({
      where: {
        party: { userId: userId }
      }
    })

    let hasAccess = false

    // Check if user owns the organization directly
    if (role.organizationId) {
      const organization = await db.organization.findFirst({
        where: {
          id: role.organizationId,
          party: { userId }
        }
      })
      
      if (organization || userMasterOrg) {
        hasAccess = true
      }
    }

    if (!hasAccess) {
      return NextResponse.json({ 
        error: 'Access denied to this organization' 
      }, { status: 403 })
    }

    // Deactivate the role
    await db.role.update({
      where: { id: roleId },
      data: {
        isActive: false,
        endDate: new Date(endDate),
        status: reason || 'deactivated'
      }
    })

    const personName = role.party?.person ? 
      `${role.party.person.firstName} ${role.party.person.lastName}` : 
      'Unknown'

    console.log('✅ Deactivated person role:', {
      personId,
      personName,
      roleId,
      roleType: role.roleType,
      organizationId: role.organizationId,
      endDate,
      reason
    })

    return NextResponse.json({ 
      message: 'Person deactivated successfully',
      personName,
      endDate 
    })
  } catch (error) {
    console.error('Error deactivating person:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 