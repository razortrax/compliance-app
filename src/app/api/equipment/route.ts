import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { createId } from '@paralleldrive/cuid2'

// GET /api/equipment - List equipment for specific organization or all user's organizations
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if a specific organizationId is requested
    const { searchParams } = new URL(req.url)
    const requestedOrgId = searchParams.get('organizationId')

    let orgIds: string[] = []

    if (requestedOrgId) {
      // If specific organizationId is requested, verify user has access and use only that org
      const hasAccess = await db.role.findFirst({
        where: {
          party: { userId },
          organizationId: requestedOrgId,
          isActive: true
        }
      })

      if (!hasAccess) {
        return NextResponse.json({ error: 'Access denied to this organization' }, { status: 403 })
      }

      orgIds = [requestedOrgId]
    } else {
      // No specific org requested - get ALL organizations that the user has access to
      const allOrgIds: string[] = []

      // 1. Organizations the user directly owns/created
      const ownedOrgs = await db.organization.findMany({
        where: { party: { userId } },
        select: { id: true }
      })
      allOrgIds.push(...ownedOrgs.map(org => org.id))

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
      allOrgIds.push(...consultantOrgs.map(org => org.id))

      // 3. Get ALL organizations in the system (since master users can manage any org)
      // Find user's master organization first
      const userMasterOrg = await db.organization.findFirst({
        where: { party: { userId } }
      })

      if (userMasterOrg) {
        // If user has a master org, they can access ALL organizations
        const allOrgs = await db.organization.findMany({
          select: { id: true }
        })
        allOrgIds.push(...allOrgs.map(org => org.id))
      }

      // Remove duplicates
      orgIds = Array.from(new Set(allOrgIds))
    }
    
    // Get equipment assigned to the determined organizations
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
      vehicleTypeId,  // Fixed: use vehicleTypeId instead of vehicleType
      make, 
      model, 
      year, 
      vin, 
      organizationId,
      locationId,
      // Add other fields from the form
      statusId,
      categoryId,
      ownershipTypeId,
      eqpWeightGross,
      eqpWeightGrossRating,
      eqpWeightGrossTagged,
      fuelTypeId,
      engineModel,
      engineDisplacement,
      driveType,
      countCylinders,
      dateOfManufacture,
      countAxles,
      colorId,
      tireSize,
      startMileage,
      startDate,
      retireMileage,
      retireDate
    } = body

    // Validate required fields
    if (!categoryId || !organizationId) {  // Fixed: require categoryId instead of vehicleTypeId
      return NextResponse.json({ 
        error: 'Missing required fields: categoryId, organizationId' 
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
      let party
      let equipment
      
      // 1. Check if equipment with this VIN already exists
      if (vin) {
        equipment = await tx.equipment.findUnique({
          where: { vin: vin },
          include: { party: true }
        })
      }

      if (equipment) {
        // Equipment exists - reuse the existing party and equipment
        party = equipment.party
        console.log('🔄 Found existing equipment with VIN:', vin, 'Party ID:', party.id)
        
        // Check if there's already an active role for this organization
        const existingRole = await tx.role.findFirst({
          where: {
            partyId: party.id,
            organizationId,
            roleType: 'equipment',
            isActive: true
          }
        })
        
        if (existingRole) {
          console.log('⚠️ Equipment already assigned to this organization')
          throw new Error('Equipment is already assigned to this organization')
        }
        
        // Deactivate previous roles if equipment is changing organizations
        await tx.role.updateMany({
          where: {
            partyId: party.id,
            roleType: 'equipment',
            isActive: true
          },
          data: {
            isActive: false,
            endDate: new Date()
          }
        })
        
      } else {
        // New equipment - create party and equipment
        party = await tx.party.create({
          data: {
            id: createId(),
            status: 'active'
          }
        })

        equipment = await tx.equipment.create({
          data: {
            id: createId(),
            partyId: party.id,
            vehicleTypeId,  // Fixed: use vehicleTypeId field name
            make: make || null,
            model: model || null,
            year: year ? parseInt(year) : null,
            vin: vin || null,
            locationId: locationId || null,
            // Add all other fields from the form
            statusId: statusId || null,
            categoryId: categoryId || null,
            ownershipTypeId: ownershipTypeId || null,
            eqpWeightGross: eqpWeightGross ? parseInt(eqpWeightGross) : null,
            eqpWeightGrossRating: eqpWeightGrossRating ? parseInt(eqpWeightGrossRating) : null,
            eqpWeightGrossTagged: eqpWeightGrossTagged ? parseInt(eqpWeightGrossTagged) : null,
            fuelTypeId: fuelTypeId || null,
            engineModel: engineModel || null,
            engineDisplacement: engineDisplacement || null,
            driveType: driveType || null,
            countCylinders: countCylinders ? parseInt(countCylinders) : null,
            dateOfManufacture: dateOfManufacture ? new Date(dateOfManufacture) : null,
            countAxles: countAxles ? parseInt(countAxles) : null,
            colorId: colorId || null,
            tireSize: tireSize || null,
            startMileage: startMileage ? parseInt(startMileage) : null,
            startDate: startDate ? new Date(startDate) : null,
            retireMileage: retireMileage ? parseInt(retireMileage) : null,
            retireDate: retireDate ? new Date(retireDate) : null
          }
        })
        
        console.log('✅ Created new equipment with VIN:', vin)
      }

      // 3. Create new role relationship
      await tx.role.create({
        data: {
          id: createId(),
          partyId: party.id,
          roleType: 'equipment',
          organizationId,
          locationId: locationId || null,
          status: 'active',
          isActive: true
        }
      })

      console.log('✅ Created equipment role for organization:', {
        equipmentId: equipment.id,
        partyId: party.id,
        vehicle: `${equipment.make} ${equipment.model} ${equipment.year}`,
        type: vehicleTypeId, // Use vehicleTypeId here
        org: organizationId,
        existing: !!vin && equipment.id !== party.id // Simple check if reused
      })

      return equipment
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error creating equipment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 