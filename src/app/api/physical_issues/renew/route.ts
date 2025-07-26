import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { createId } from '@paralleldrive/cuid2'
import { PhysicalType } from '@prisma/client'

interface PhysicalRenewalData {
  previousPhysicalId: string
  startDate?: string
  expirationDate: string
  renewalDate?: string
  notes?: string
  title?: string
  description?: string
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: PhysicalRenewalData = await request.json()
    
    if (!body.previousPhysicalId || !body.expirationDate) {
      return Response.json({ error: 'Missing required fields for renewal' }, { status: 400 })
    }

    // Get the existing physical to renew
    const existingPhysical = await db.physical_issue.findUnique({
      where: { id: body.previousPhysicalId },
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

    if (!existingPhysical) {
      return Response.json({ error: 'Physical to renew not found' }, { status: 404 })
    }

    // Comprehensive access control check (same as other routes)
    const userParties = await db.party.findMany({
      where: { userId },
      include: { role: true }
    })

    const userPartyIds = userParties.map(p => p.id)
    const userOrgIds = userParties.flatMap(p => p.role.map(r => r.organizationId)).filter(Boolean)
    const userLocationIds = userParties.flatMap(p => p.role.map(r => r.locationId)).filter(Boolean)

    const isMaster = userParties.some(p => p.role.some(r => r.roleType === 'master'))
    const isOrgManager = userParties.some(p => p.role.some(r => 
      r.roleType === 'organization_manager' && userOrgIds.includes(existingPhysical.issue.party.organization?.id || '')
    ))
    const isLocationManager = userParties.some(p => p.role.some(r => 
      r.roleType === 'location_manager' && userLocationIds.includes(existingPhysical.issue.party.organization?.id || '')
    ))
    const isDirectPartyOwner = userPartyIds.includes(existingPhysical.issue.partyId)

    if (!isMaster && !isOrgManager && !isLocationManager && !isDirectPartyOwner) {
      return Response.json({ error: 'Access denied' }, { status: 403 })
    }

    // Create the renewal in a transaction
    const result = await db.$transaction(async (tx) => {
      // 1. Mark the old physical as renewed/inactive
      await tx.issue.update({
        where: { id: existingPhysical.issueId },
        data: {
          status: 'RENEWED',
          resolvedAt: new Date()
        }
      })

      // 2. Create new issue (minimal data, no duplication like license)
      const newIssue = await tx.issue.create({
        data: {
          id: createId(),
          updatedAt: new Date(),
          issueType: 'physical',
          status: 'active',
          priority: 'medium', // Default priority for new physical
          partyId: existingPhysical.issue.partyId,
          title: body.title || `Physical - ${existingPhysical.type || 'Examination'} (Renewed)`,
          description: body.description || `Renewed physical examination record`,
          dueDate: new Date(body.expirationDate)
        }
      })

      // 3. Create the new physical issue (minimal data, no duplication)
      const newPhysicalIssue = await tx.physical_issue.create({
        data: {
          issueId: newIssue.id,
          type: existingPhysical.type, // Keep the same type
          medicalExaminer: null, // Reset - will be updated when new exam is done
          selfCertified: false, // Reset to default
          nationalRegistry: false, // Reset to default
          startDate: body.startDate ? new Date(body.startDate) : (existingPhysical.expirationDate || new Date()),
          expirationDate: new Date(body.expirationDate),
          renewalDate: body.renewalDate ? new Date(body.renewalDate) : new Date()
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

      return newPhysicalIssue
    })

    return Response.json(result, { status: 201 })
  } catch (error) {
    console.error('Error renewing physical:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
} 