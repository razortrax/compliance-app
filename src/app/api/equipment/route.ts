import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { createId } from '@paralleldrive/cuid2'

// GET /api/equipment - List all equipment for current user's organizations
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's organizations (master or managed)
    const userOrganizations = await db.organization.findMany({
      where: {
        OR: [
          { party: { userId } }, // Master organizations
          { 
            party: { 
              role: { 
                some: { 
                  party: { userId },
                  roleType: 'CONSULTANT_OF',
                  isActive: true 
                } 
              } 
            } 
          } // Organizations user consults for
        ]
      },
      select: { id: true }
    })

    const orgIds = userOrganizations.map(org => org.id)
    
    // Get all equipment assigned to these organizations
    const equipment = await db.equipment.findMany({
      where: {
        party: {
          role: {
            some: {
              organizationId: { in: orgIds },
              isActive: true
            }
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
        },
        location: {
          select: { id: true, name: true }
        }
      },
      orderBy: [
        { make: 'asc' },
        { model: 'asc' },
        { year: 'desc' }
      ]
    })

    return NextResponse.json(equipment)
  } catch (error) {
    console.error('Error fetching equipment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/equipment - Create new equipment
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { 
      vehicleType, 
      make, 
      model, 
      year, 
      vinNumber, 
      plateNumber, 
      registrationExpiry,
      organizationId,
      locationId 
    } = body

    // Validate required fields
    if (!vehicleType || !organizationId) {
      return NextResponse.json({ 
        error: 'Missing required fields: vehicleType, organizationId' 
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

    // Create equipment with party model
    const result = await db.$transaction(async (tx) => {
      // 1. Create party record
      const party = await tx.party.create({
        data: {
          id: createId(),
          status: 'active'
        }
      })

      // 2. Create equipment record
      const equipment = await tx.equipment.create({
        data: {
          id: createId(),
          partyId: party.id,
          vehicleType,
          make: make || null,
          model: model || null,
          year: year ? parseInt(year) : null,
          vinNumber: vinNumber || null,
          plateNumber: plateNumber || null,
          registrationExpiry: registrationExpiry ? new Date(registrationExpiry) : null,
          locationId: locationId || null
        }
      })

      // 3. Create role relationship
      await tx.role.create({
        data: {
          id: createId(),
          partyId: party.id,
          roleType: 'EQUIPMENT_OF',
          organizationId,
          locationId: locationId || null,
          status: 'active',
          isActive: true
        }
      })

      console.log('✅ Created equipment with party model:', {
        equipmentId: equipment.id,
        partyId: party.id,
        vehicle: `${equipment.make} ${equipment.model} ${equipment.year}`,
        type: vehicleType,
        org: organizationId
      })

      return equipment
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error creating equipment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 