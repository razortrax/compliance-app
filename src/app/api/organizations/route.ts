import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // First, find the user's master company (organization they directly own)
    const userMasterOrg = await db.organization.findFirst({
      where: {
        party: {
          userId: userId
        }
      },
      include: {
        party: true
      }
    })

    console.log('GET /api/organizations - User:', userId)
    console.log('User Master Org:', userMasterOrg?.name, userMasterOrg?.id)

    // If user has no master org, return empty array
    if (!userMasterOrg) {
      console.log('No master org found for user')
      return NextResponse.json([])
    }

    // Find all organizations:
    // 1. The master company itself
    // 2. All organizations managed by the master company (through roles)
    
    // First get all organization IDs managed by the master
    const managedOrgRoles = await db.role.findMany({
      where: {
        roleType: 'master',
        partyId: userMasterOrg.partyId,
        isActive: true
      },
      select: {
        organizationId: true
      }
    })

    const managedOrgIds = managedOrgRoles
      .map(role => role.organizationId)
      .filter((id): id is string => id !== null)

    console.log('Managed org IDs:', managedOrgIds)

    // Now get all organizations (master + managed)
    const organizations = await db.organization.findMany({
      where: {
        OR: [
          { id: userMasterOrg.id }, // Include the master org itself
          { id: { in: managedOrgIds } } // Include all managed orgs
        ]
      },
      include: {
        party: {
          select: {
            id: true,
            userId: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            roles: {
              where: {
                roleType: 'master',
                isActive: true
              },
              select: {
                status: true,
                isActive: true
              }
            }
          }
        }
      },
      orderBy: {
        party: {
          createdAt: 'desc'
        }
      }
    })

    console.log('Total organizations found:', organizations.length)
    organizations.forEach(org => {
      console.log(`- ${org.name} (ID: ${org.id}, Party userId: ${org.party?.userId})`)
    })

    return NextResponse.json(organizations)
  } catch (error) {
    console.error('Failed to fetch organizations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch organizations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, dotNumber, einNumber, permitNumber, phone, notes } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      )
    }

    // Find the current user's master company (organization they directly own)
    const userMasterOrg = await db.organization.findFirst({
      where: {
        party: {
          userId: userId
        }
      },
      include: {
        party: true
      }
    })

    if (!userMasterOrg) {
      return NextResponse.json(
        { error: 'No master company found for user' },
        { status: 400 }
      )
    }

    // Create organization - Note: do NOT connect to current user directly
    // Organizations under a master should not have party.userId set
    const organization = await db.organization.create({
      data: {
        name,
        dotNumber: dotNumber || null,
        phone: phone || null,
        party: {
          create: {
            status: 'active' // Party itself is always active, role determines org status
            // NOT setting userId here - managed organizations don't have direct ownership
          }
        }
      },
      include: {
        party: true
      }
    })

    console.log('Created organization:', {
      id: organization.id,
      name: organization.name,
      partyId: organization.partyId
    })

    // Determine initial role status based on completion
    const hasActivationRequirements = einNumber && permitNumber
    const initialRoleStatus = hasActivationRequirements ? 'active' : 'pending'

    // Create master-organization relationship in Role table
    // This establishes that the user's master company manages this organization
    const role = await db.role.create({
      data: {
        roleType: 'master',
        partyId: userMasterOrg.partyId, // User's master company is the master
        organizationId: organization.id, // The new organization
        status: initialRoleStatus,
        isActive: true
      }
    })

    console.log('Created master role:', {
      id: role.id,
      roleType: role.roleType,
      masterPartyId: role.partyId,
      managedOrgId: role.organizationId,
      status: role.status,
      isActive: role.isActive
    })

    // TODO: Store EIN and permit numbers (add to schema when needed)
    // TODO: Create role assignment for creator
    // TODO: Check plan limits for master manager

    return NextResponse.json(organization, { status: 201 })
  } catch (error) {
    console.error('Error creating organization:', error)
    
    // Handle unique constraint violations
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'DOT number already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create organization' },
      { status: 500 }
    )
  }
} 