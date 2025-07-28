import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { createId } from '@paralleldrive/cuid2'
import type { Prisma } from '@prisma/client'

// GET /api/persons - List all persons for current user's organizations
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(req.url)
    const organizationId = searchParams.get('organizationId')
    const roleType = searchParams.get('roleType') // New filter for role type

    // Get ALL organizations that the user has access to
    const allOrgIds: string[] = []

    // If specific organizationId requested, use that; otherwise get all accessible orgs
    if (organizationId) {
      // Verify user has access to this specific organization
      const userMasterOrg = await db.organization.findFirst({
        where: { party: { userId } }
      })

      let hasAccess = false

      if (userMasterOrg) {
        hasAccess = true // Master users can access any org
      } else {
        // Check if user owns this organization or has a role in it
        const organization = await db.organization.findFirst({
          where: {
            id: organizationId,
            party: { userId }
          }
        })

        if (organization) {
          hasAccess = true
        } else {
          const hasRole = await db.role.findFirst({
            where: {
              party: { userId },
              organizationId: organizationId,
              isActive: true
            }
          })
          hasAccess = !!hasRole
        }
      }

      if (!hasAccess) {
        return NextResponse.json({ error: 'Access denied to organization' }, { status: 403 })
      }

      allOrgIds.push(organizationId)
    } else {
      // Original logic for getting all accessible organizations
      // 1. Organizations the user directly owns/created
      const ownedOrgs = await db.organization.findMany({
        where: { party: { userId } },
        select: { id: true }
      })
      allOrgIds.push(...ownedOrgs.map((org: { id: string }) => org.id))

      // 2. Organizations the user manages through consultant roles
      const consultantOrgs = await db.organization.findMany({
        where: {
          party: { 
            role: { 
              some: { 
                party: { userId },
                roleType: 'CONSULTANT_OF',
                isActive: true 
              } 
            } 
          }
        },
        select: { id: true }
      })
      allOrgIds.push(...consultantOrgs.map((org: { id: string }) => org.id))

      // 3. Get ALL organizations in the system (since master users can manage any org)
      const userMasterOrg = await db.organization.findFirst({
        where: { party: { userId } }
      })

      if (userMasterOrg) {
        const allOrgs = await db.organization.findMany({
          select: { id: true }
        })
        allOrgIds.push(...allOrgs.map((org: { id: string }) => org.id))
      }
    }

    // Remove duplicates
    const orgIds = Array.from(new Set(allOrgIds))

    // Build where clause for role filtering
    const roleWhere: any = {
      organizationId: { in: orgIds },
      isActive: true
    }

    // Add roleType filter if specified
    if (roleType) {
      roleWhere.roleType = roleType
    }

    // Get all persons assigned to these organizations
    const persons = await db.person.findMany({
      where: {
        party: {
          role: {
            some: roleWhere
          }
        }
      },
      include: {
        party: {
          include: {
            role: {
              where: { isActive: true },
              include: {
                location: {
                  select: { id: true, name: true }
                }
              }
            }
          }
        }
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' }
      ]
    })

    return NextResponse.json(persons)
  } catch (error) {
    console.error('Error fetching persons:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/persons - Create new person
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { 
      firstName, 
      lastName, 
      dateOfBirth, 
      licenseNumber, 
      phone, 
      email, 
      address, 
      city, 
      state, 
      zipCode,
      roleType, // 'DRIVER', 'STAFF', etc.
      organizationId,
      locationId 
    } = body

    // Validate required fields
    if (!firstName || !lastName || !roleType || !organizationId) {
      return NextResponse.json({ 
        error: 'Missing required fields: firstName, lastName, roleType, organizationId' 
      }, { status: 400 })
    }

    // Verify user has access to this organization
    // First check if user has a master organization
    const userMasterOrg = await db.organization.findFirst({
      where: {
        party: {
          userId: userId
        }
      }
    })

    let hasAccess = false
    let organization = null

    // Check if this is the user's master organization
    if (userMasterOrg && userMasterOrg.id === organizationId) {
      hasAccess = true
      organization = userMasterOrg
    } else if (userMasterOrg) {
      // Check if the user's master org manages this organization
      const masterRole = await db.role.findFirst({
        where: {
          roleType: 'master',
          partyId: userMasterOrg.partyId,
          organizationId: organizationId,
          isActive: true
        }
      })
      
      if (masterRole) {
        hasAccess = true
        organization = await db.organization.findUnique({
          where: { id: organizationId }
        })
      }
    }

    // If not master access, check for direct access
    if (!hasAccess) {
      // Check if user owns the organization
      organization = await db.organization.findFirst({
        where: {
          id: organizationId,
          party: { userId }
        }
      })

      if (organization) {
        hasAccess = true
      } else {
        // Check if user has an active role in this organization
        const hasRole = await db.role.findFirst({
          where: {
            party: { userId },
            organizationId: organizationId,
            isActive: true
          }
        })

        if (hasRole) {
          hasAccess = true
          organization = await db.organization.findUnique({
            where: { id: organizationId }
          })
        }
      }
    }

    if (!hasAccess || !organization) {
      return NextResponse.json({ error: 'Organization not found or access denied' }, { status: 404 })
    }

    // Create person with party model
    const result = await db.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Create party record
      const party = await tx.party.create({
        data: {
          id: createId(),
          status: 'active'
        }
      })

      // 2. Create person record
      const person = await tx.person.create({
        data: {
          id: createId(),
          partyId: party.id,
          firstName,
          lastName,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          licenseNumber: licenseNumber || null,
          phone: phone || null,
          email: email || null,
          address: address || null,
          city: city || null,
          state: state || null,
          zipCode: zipCode || null
        }
      })

      // 3. Create role relationship
      await tx.role.create({
        data: {
          id: createId(),
          partyId: party.id,
          roleType,
          organizationId,
          locationId: locationId || null,
          status: 'active',
          isActive: true
        }
      })

      return person
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error creating person:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 