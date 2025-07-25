import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'

interface LicenseRenewalData {
  licenseType: string
  licenseState: string
  licenseNumber: string
  certification: string
  startDate?: string
  expirationDate: string
  renewalDate?: string
  endorsements?: any[]
  restrictions?: any[]
  notes?: string
  partyId: string
  title?: string
  description?: string
  priority?: string
  previousLicenseId: string
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: LicenseRenewalData = await request.json()
    
    // Validate required fields
    if (!body.licenseType || !body.licenseState || !body.licenseNumber || 
        !body.certification || !body.expirationDate || !body.partyId || !body.previousLicenseId) {
      return Response.json({ error: 'Missing required fields for renewal' }, { status: 400 })
    }

    // Check access control (same as regular license creation)
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
        // 2. Check if user is a Master consultant who manages this organization
        const userMasterOrg = await db.organization.findFirst({
          where: {
            party: { userId: userId }
          }
        })

        if (userMasterOrg) {
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
          }
        }
      }
    }

    if (!hasAccess) {
      return Response.json({ error: 'Access denied' }, { status: 403 })
    }

    // Perform renewal in a transaction
    const result = await db.$transaction(async (tx) => {
      // 1. Mark the old license as renewed/inactive by setting an end date
      await tx.issue.update({
        where: { id: body.previousLicenseId },
        data: {
          status: 'RENEWED',
          resolvedAt: new Date()
        }
      })

      // 2. Create new issue for the renewed license
      const newIssue = await tx.issue.create({
        data: {
          id: `issue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          updatedAt: new Date(),
          issueType: 'LICENSE',
          status: 'ACTIVE',
          priority: body.priority || 'medium',
          partyId: body.partyId,
          title: body.title || `${body.licenseType} - ${body.licenseNumber} (Renewed)`,
          description: body.description || `Renewed license from previous expiration`
        }
      })

      // 3. Create the new license issue
      const newLicenseIssue = await tx.license_issue.create({
        data: {
          issueId: newIssue.id,
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

      return newLicenseIssue
    })

    return Response.json(result, { status: 201 })
  } catch (error) {
    console.error('Error renewing license:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
} 