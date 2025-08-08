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

    // Check if user is a Master user
    const masterRole = await db.role.findFirst({
      where: {
        party: { userId },
        roleType: 'master',
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
    
    if (masterRole) {
      return NextResponse.json({
        canCreateCAFs: true,
        userType: 'master',
        canAssignCrossOrg: true,
        name: `${masterRole.party.person?.firstName} ${masterRole.party.person?.lastName}`.trim(),
        organizations: [], // TODO: Get managed organizations
        context: {
          role: masterRole
        }
      })
    }
    
    // Check if user is Organization staff with CAF permissions
    const staffRecord = await db.staff.findFirst({
      where: {
        party: { userId },
        canApproveCAFs: true
      },
      include: {
        party: {
          include: {
            person: true,
            role: {
              where: {
                roleType: 'staff',
                isActive: true
              },
              include: {}
            }
          }
        }
      }
    })
    
    if (staffRecord) {
      const orgId = staffRecord.party.role[0]?.organizationId || null
      let organization: { id: string; name: string } | null = null
      if (orgId) {
        const org = await db.organization.findUnique({ where: { id: orgId }, select: { id: true, name: true } })
        organization = org ?? null
      }

      return NextResponse.json({
        canCreateCAFs: true,
        userType: 'organization',
        canAssignCrossOrg: false,
        name: `${staffRecord.party.person?.firstName} ${staffRecord.party.person?.lastName}`.trim(),
        organization: organization ? {
          id: organization.id,
          name: organization.name
        } : null,
        context: {
          staff: staffRecord
        }
      })
    }
    
    // User has no CAF permissions
    return NextResponse.json({
      canCreateCAFs: false,
      userType: 'none',
      canAssignCrossOrg: false,
      name: null,
      organization: null,
      context: null
    })

  } catch (error) {
    console.error('Error fetching user CAF permissions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user permissions' },
      { status: 500 }
    )
  }
} 