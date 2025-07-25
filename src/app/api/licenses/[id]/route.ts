import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'

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

interface LicenseUpdateData {
  licenseType?: string
  licenseState?: string
  licenseNumber?: string
  certification?: string
  expirationDate?: string
  renewalDate?: string
  endorsements?: Endorsement[]
  restrictions?: Restriction[]
  notes?: string
  title?: string
  description?: string
  priority?: string
  status?: string
}

// GET /api/licenses/[id] - Get specific license
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const license = await db.license_issue.findUnique({
      where: { id: params.id },
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
      }
    })

    if (!license) {
      return Response.json({ error: 'License not found' }, { status: 404 })
    }

    // Access control check
    const party = license.issue.party
    const hasAccess = party.userId === userId || 
                     party.organization?.partyId === userId ||
                     party.role.some(role => 
                       role.organizationId && 
                       role.party?.organization?.partyId === userId
                     )

    if (!hasAccess) {
      return Response.json({ error: 'Access denied' }, { status: 403 })
    }

    // Add calculated status
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

    return Response.json({
      ...license,
      calculatedStatus,
      daysUntilExpiry
    })
  } catch (error) {
    console.error('Error fetching license:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/licenses/[id] - Update license
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: LicenseUpdateData = await request.json()

    // First get the existing license to check access
    const existingLicense = await db.license_issue.findUnique({
      where: { id: params.id },
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
      }
    })

    if (!existingLicense) {
      return Response.json({ error: 'License not found' }, { status: 404 })
    }

    // Access control check
    const party = existingLicense.issue.party
    const hasAccess = party.userId === userId || 
                     party.organization?.partyId === userId ||
                     party.role.some(role => 
                       role.organizationId && 
                       role.party?.organization?.partyId === userId
                     )

    if (!hasAccess) {
      return Response.json({ error: 'Access denied' }, { status: 403 })
    }

    // Update license in transaction
    const result = await db.$transaction(async (tx) => {
      // Update base issue if needed
      const issueUpdateData: any = {}
      if (body.title !== undefined) issueUpdateData.title = body.title
      if (body.description !== undefined) issueUpdateData.description = body.description
      if (body.priority !== undefined) issueUpdateData.priority = body.priority
      if (body.status !== undefined) issueUpdateData.status = body.status
      if (body.expirationDate !== undefined) issueUpdateData.dueDate = new Date(body.expirationDate)
      
      if (Object.keys(issueUpdateData).length > 0) {
        issueUpdateData.updatedAt = new Date()
        await tx.issue.update({
          where: { id: existingLicense.issueId },
          data: issueUpdateData
        })
      }

      // Update license issue
      const licenseUpdateData: any = {}
      if (body.licenseType !== undefined) licenseUpdateData.licenseType = body.licenseType
      if (body.licenseState !== undefined) licenseUpdateData.licenseState = body.licenseState
      if (body.licenseNumber !== undefined) licenseUpdateData.licenseNumber = body.licenseNumber
      if (body.certification !== undefined) licenseUpdateData.certification = body.certification
      if (body.expirationDate !== undefined) licenseUpdateData.expirationDate = new Date(body.expirationDate)
      if (body.renewalDate !== undefined) licenseUpdateData.renewalDate = body.renewalDate ? new Date(body.renewalDate) : null
      if (body.endorsements !== undefined) licenseUpdateData.endorsements = body.endorsements as any
      if (body.restrictions !== undefined) licenseUpdateData.restrictions = body.restrictions as any
      if (body.notes !== undefined) licenseUpdateData.notes = body.notes
      
      if (Object.keys(licenseUpdateData).length > 0) {
        licenseUpdateData.updatedAt = new Date()
      }

      const updatedLicense = await tx.license_issue.update({
        where: { id: params.id },
        data: licenseUpdateData,
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

      return updatedLicense
    })

    return Response.json(result)
  } catch (error) {
    console.error('Error updating license:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/licenses/[id] - Soft delete license (mark as resolved/inactive)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // First get the existing license to check access
    const existingLicense = await db.license_issue.findUnique({
      where: { id: params.id },
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
      }
    })

    if (!existingLicense) {
      return Response.json({ error: 'License not found' }, { status: 404 })
    }

    // Access control check
    const party = existingLicense.issue.party
    const hasAccess = party.userId === userId || 
                     party.organization?.partyId === userId ||
                     party.role.some(role => 
                       role.organizationId && 
                       role.party?.organization?.partyId === userId
                     )

    if (!hasAccess) {
      return Response.json({ error: 'Access denied' }, { status: 403 })
    }

    // Soft delete by updating status
    await db.issue.update({
      where: { id: existingLicense.issueId },
      data: {
        status: 'resolved',
        resolvedAt: new Date(),
        updatedAt: new Date()
      }
    })

    return Response.json({ message: 'License deactivated successfully' })
  } catch (error) {
    console.error('Error deleting license:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
} 