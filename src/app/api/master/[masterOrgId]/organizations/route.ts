import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { masterOrgId: string } }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { masterOrgId } = params

    // 1. Verify user has master access to this specific organization
    const masterAccess = await db.role.findFirst({
      where: {
        party: { userId },
        organizationId: masterOrgId,
        roleType: 'master',
        isActive: true
      },
      include: {
        party: true
      }
    })

    if (!masterAccess) {
      return NextResponse.json({ error: 'Access denied to this master organization' }, { status: 403 })
    }

    // 2. Get the master organization details
    const masterOrg = await db.organization.findUnique({
      where: { id: masterOrgId },
      include: {
        party: true
      }
    })

    if (!masterOrg) {
      return NextResponse.json({ error: 'Master organization not found' }, { status: 404 })
    }

    // 3. Get all organizations managed by this master (including itself)
    const managedOrgRoles = await db.role.findMany({
      where: {
        roleType: 'master',
        partyId: masterAccess.partyId,
        isActive: true
      },
      select: {
        organizationId: true
      }
    })

    const managedOrgIds = managedOrgRoles
      .map(role => role.organizationId)
      .filter((id): id is string => id !== null)

    // 4. Query organizations directly - no user-based filtering needed
    const organizations = await db.organization.findMany({
      where: {
        id: { in: managedOrgIds }
      },
      include: {
        party: {
          select: {
            id: true,
            userId: true,
            status: true,
            createdAt: true,
            updatedAt: true
          }
        }
      },
      orderBy: {
        party: {
          createdAt: 'desc'
        }
      }
    })

    // 5. Add computed stats for each organization
    const organizationsWithStats = await Promise.all(
      organizations.map(async (org) => {
        // Get driver count for this org
        const driverCount = await db.role.count({
          where: {
            organizationId: org.id,
            roleType: 'driver',
            isActive: true
          }
        })

        // Get equipment count (placeholder - implement when equipment system is ready)
        const equipmentCount = 0

        // Get expiring issues count (placeholder - implement when issue aggregation is ready)
        const expiringIssues = 0

        return {
          ...org,
          driversCount: driverCount,
          equipmentCount,
          expiringIssues,
          status: org.id === masterOrgId ? 'master' as const : 'active' as const
        }
      })
    )

    // 6. Separate master company from child organizations
    const masterCompany = organizationsWithStats.find(org => org.id === masterOrgId)
    const childOrganizations = organizationsWithStats.filter(org => org.id !== masterOrgId)

    console.log(`📊 Master ${masterOrgId}: Found ${childOrganizations.length} child organizations`)

    return NextResponse.json({
      masterCompany,
      childOrganizations,
      totalOrganizations: childOrganizations.length,
      totalDrivers: organizationsWithStats.reduce((sum, org) => sum + org.driversCount, 0),
      totalEquipment: organizationsWithStats.reduce((sum, org) => sum + org.equipmentCount, 0),
      totalExpiringIssues: organizationsWithStats.reduce((sum, org) => sum + org.expiringIssues, 0)
    })

  } catch (error) {
    console.error('Error fetching master organizations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 