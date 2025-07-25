import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { createId } from '@paralleldrive/cuid2'

// Define types for license data
interface Endorsement {
  code: string
  name: string
  expirationDate?: string | null
  renewalRequired?: boolean
  certificationNumber?: string
}

interface Restriction {
  code: string
  description: string
}

interface LicenseIssueData {
  licenseType: string
  licenseState: string
  licenseNumber: string
  certification: string
  expirationDate: string
  renewalDate?: string
  endorsements: Endorsement[]
  restrictions: Restriction[]
  notes?: string
  partyId: string
  title: string
  description?: string
  priority?: string
  startDate?: string
}

// GET /api/licenses - List licenses with filtering
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const partyId = searchParams.get('partyId')
    const licenseType = searchParams.get('licenseType')
    const status = searchParams.get('status')

    // Build where clause for filtering
    const where: any = {}
    
    if (partyId) {
      where.issue = { partyId }
    }
    
    if (licenseType) {
      where.licenseType = licenseType
    }

    // Access control - support Master, Organization, and Location managers (same as POST endpoint)
    let accessFilter = {}
    
    // Get user's role to determine access
    const userRole = await db.role.findFirst({
      where: { 
        party: { userId },
        isActive: true 
      }
    })
    
    // Get user's master organization first
    const userMasterOrg = await db.organization.findFirst({
      where: {
        party: { userId: userId }
      }
    })

    if (userMasterOrg) {
      // Master user - can see licenses for all organizations they manage
      const managedOrgs = await db.role.findMany({
        where: {
          roleType: 'master',
          partyId: userMasterOrg.partyId,
          isActive: true
        },
        select: { organizationId: true }
      })
      
      const allManagedOrgIds = [
        userMasterOrg.id,
        ...managedOrgs.map(r => r.organizationId).filter(Boolean) as string[]
      ]

      accessFilter = {
        issue: {
          party: {
            OR: [
              // Personal licenses
              { userId },
              // Licenses for people in organizations they manage
              {
                role: {
                  some: {
                    organizationId: { in: allManagedOrgIds },
                    isActive: true
                  }
                }
              },
              // Organization licenses for orgs they manage
              {
                organization: {
                  id: { in: allManagedOrgIds }
                }
              }
            ]
          }
        }
      }
    } else if (userRole) {
      // Check if user has organization or location management roles
      const userOrgIds: string[] = []
      const userLocationIds: string[] = []

      // Get all organizations where user is a manager or consultant
      const orgRoles = await db.role.findMany({
        where: {
          party: { userId },
          roleType: { in: ['organization_manager', 'owner', 'consultant'] },
          isActive: true
        },
        select: { organizationId: true }
      })
      userOrgIds.push(...orgRoles.map(r => r.organizationId).filter(Boolean) as string[])

      // Get all locations where user is a manager
      const locationRoles = await db.role.findMany({
        where: {
          party: { userId },
          roleType: 'location_manager',
          isActive: true
        },
        select: { locationId: true }
      })
      userLocationIds.push(...locationRoles.map(r => r.locationId).filter(Boolean) as string[])

      // Add user's direct organization if they have a role
      if (userRole.organizationId) {
        userOrgIds.push(userRole.organizationId)
      }

      accessFilter = {
        issue: {
          party: {
            OR: [
              // Personal licenses
              { userId },
              // Licenses for people in organizations they manage
              userOrgIds.length > 0 && {
                role: {
                  some: {
                    organizationId: { in: userOrgIds },
                    isActive: true
                  }
                }
              },
              // Licenses for people at locations they manage
              userLocationIds.length > 0 && {
                role: {
                  some: {
                    locationId: { in: userLocationIds },
                    isActive: true
                  }
                }
              },
              // Organization licenses for orgs they manage
              userOrgIds.length > 0 && {
                organization: {
                  id: { in: userOrgIds }
                }
              }
            ].filter(Boolean) // Remove any false values
          }
        }
      }
    } else {
      // No role found - only their personal licenses
      accessFilter = {
        issue: {
          party: { userId }
        }
      }
    }

    // Combine filters
    const finalWhere = { ...where, ...accessFilter }

    const licenses = await db.license_issue.findMany({
      where: finalWhere,
      include: {
        issue: {
          include: {
            party: {
              include: {
                person: true,
                organization: true,
                role: {
                  include: {
                    party: {
                      include: {
                        organization: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: [
        { expirationDate: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    // Add calculated status to each license
    const licensesWithStatus = licenses.map(license => {
      const today = new Date()
      const expirationDate = new Date(license.expirationDate)
      const daysUntilExpiry = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      
      let calculatedStatus = 'current'
      if (daysUntilExpiry < 0) {
        calculatedStatus = 'expired'
      } else if (daysUntilExpiry <= 15) {
        calculatedStatus = 'critical'
      } else if (daysUntilExpiry <= 30) {
        calculatedStatus = 'warning'
      }

      return {
        ...license,
        calculatedStatus,
        daysUntilExpiry
      }
    })

    // Filter by status if requested
    let filteredLicenses = licensesWithStatus
    if (status) {
      filteredLicenses = licensesWithStatus.filter(license => license.calculatedStatus === status)
    }

    return Response.json(filteredLicenses)
  } catch (error) {
    console.error('Error fetching licenses:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/licenses - Create new license
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: LicenseIssueData = await request.json()
    
    // Validate required fields
    if (!body.licenseType || !body.licenseState || !body.licenseNumber || 
        !body.certification || !body.expirationDate || !body.partyId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if user has access to the party
    const party = await db.party.findUnique({
      where: { id: body.partyId },
      include: {
        person: true,
        organization: true,
        role: {
          include: {
            party: {
              include: {
                organization: true
              }
            }
          }
        }
      }
    })

    if (!party) {
      return Response.json({ error: 'Party not found' }, { status: 404 })
    }

    // Access control check - support Master, Organization, and Location managers
    let hasAccess = false
    
    // 1. Check direct ownership first
    if (party.userId === userId) {
      hasAccess = true
      console.log('✅ Access granted: User owns party directly')
    }

    if (!hasAccess) {
      // Get the driver's role to find their organization and location
      const driverRole = await db.role.findFirst({
        where: {
          partyId: body.partyId,
          isActive: true
        }
      })

      if (driverRole) {
        console.log('🚗 Driver works at org:', driverRole.organizationId, 'location:', driverRole.locationId || 'No specific location')

        // 2. Check if user is a Master consultant who manages this organization
        const userMasterOrg = await db.organization.findFirst({
          where: {
            party: { userId: userId }
          }
        })

        if (userMasterOrg) {
          console.log('👤 User master org:', userMasterOrg.name)
          
          // Check if master org manages the driver's organization
          const masterRole = await db.role.findFirst({
            where: {
              roleType: 'master',
              partyId: userMasterOrg.partyId,
              organizationId: driverRole.organizationId,
              isActive: true
            }
          })

          if (masterRole) {
            hasAccess = true
            console.log('✅ Access granted: Master manages driver\'s organization')
          }
        }

        // 3. Check if user is an Organization manager or consultant in the same organization
        if (!hasAccess) {
          const orgManagerRole = await db.role.findFirst({
            where: {
              party: { userId: userId },
              organizationId: driverRole.organizationId,
              roleType: { in: ['organization_manager', 'owner', 'consultant'] },
              isActive: true
            }
          })

          if (orgManagerRole) {
            hasAccess = true
            console.log('✅ Access granted: Organization manager/consultant in same organization')
          }
        }

        // 4. Check if user is a Location manager at the same location
        if (!hasAccess && driverRole.locationId) {
          const locationManagerRole = await db.role.findFirst({
            where: {
              party: { userId: userId },
              locationId: driverRole.locationId,
              roleType: 'location_manager',
              isActive: true
            }
          })

          if (locationManagerRole) {
            hasAccess = true
            console.log('✅ Access granted: Location manager at same location')
          }
        }
      }
    }

    if (!hasAccess) {
      console.log('Access denied for user:', userId, 'party:', body.partyId)
      console.log('Party details:', { userId: party.userId, hasRoles: party.role?.length > 0 })
      return Response.json({ error: 'Access denied' }, { status: 403 })
    }

    console.log('Access granted for user:', userId, 'party:', body.partyId)

    // Create license in transaction
    const result = await db.$transaction(async (tx) => {
      // Create the base issue
      const issue = await tx.issue.create({
        data: {
          id: createId(),
          issueType: 'license',
          status: 'open',
          priority: body.priority || 'medium',
          partyId: body.partyId,
          title: body.title,
          description: body.description,
          dueDate: new Date(body.expirationDate),
          updatedAt: new Date()
        }
      })

      // Create the license issue
      const licenseIssue = await tx.license_issue.create({
        data: {
          issueId: issue.id,
          licenseType: body.licenseType,
          licenseState: body.licenseState,
          licenseNumber: body.licenseNumber,
          certification: body.certification,
          startDate: body.startDate ? new Date(body.startDate) : null,
          expirationDate: new Date(body.expirationDate),
          renewalDate: body.renewalDate ? new Date(body.renewalDate) : null,
          endorsements: (body.endorsements || []) as any,
          restrictions: (body.restrictions || []) as any,
          notes: body.notes
        },
        include: {
          issue: {
            include: {
              party: {
                include: {
                  person: true,
                  organization: true
                }
              }
            }
          }
        }
      })

      return licenseIssue
    })

    return Response.json(result, { status: 201 })
  } catch (error) {
    console.error('Error creating license:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
} 