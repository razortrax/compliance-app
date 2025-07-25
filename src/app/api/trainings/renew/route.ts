import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'

interface TrainingRenewalData {
  previousTrainingId: string // Required: which training we're renewing
  startDate?: string         // Optional: new start date
  completionDate?: string    // New completion date
  expirationDate: string     // Required: new expiration date  
  certificateNumber?: string // Optional: new certificate number
  hours?: number            // Optional: training hours
  notes?: string           // Optional: updated notes
  title?: string           // Optional: updated title
  description?: string     // Optional: updated description
}

// POST /api/trainings/renew - Renew training
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: TrainingRenewalData = await request.json()
    
    // Validate required fields
    if (!body.previousTrainingId || !body.expirationDate) {
      return Response.json({ error: 'Missing required fields for renewal' }, { status: 400 })
    }

    // Check if user has access to the party (get from existing training)
    const existingTraining = await db.training_issue.findUnique({
      where: { id: body.previousTrainingId },
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

    if (!existingTraining) {
      return Response.json({ error: 'Training to renew not found' }, { status: 404 })
    }

    const party = existingTraining.issue.party

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
          partyId: party.id,
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
      // 1. Fetch the existing training to get all current data
      const existingTraining = await tx.training_issue.findUnique({
        where: { id: body.previousTrainingId },
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

      if (!existingTraining) {
        throw new Error('Previous training not found')
      }

      // 2. Mark the old training as renewed/inactive
      await tx.issue.update({
        where: { id: existingTraining.issueId },
        data: {
          status: 'RENEWED',
          resolvedAt: new Date()
        }
      })

      // 3. Create new issue (duplicating most data from the old one)
      const newIssue = await tx.issue.create({
        data: {
          id: `issue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          updatedAt: new Date(),
          issueType: existingTraining.issue.issueType, // Duplicate from old
          status: 'active', // New status
          priority: existingTraining.issue.priority, // Duplicate from old
          partyId: existingTraining.issue.partyId, // Same party
          title: body.title || `${existingTraining.trainingType} (Renewed)`,
          description: body.description || existingTraining.issue.description,
          dueDate: new Date(body.expirationDate) // New expiration date
        }
      })

      // 4. Create the new training issue (duplicating all data, updating only specific fields)
      const newTrainingIssue = await tx.training_issue.create({
        data: {
          issueId: newIssue.id,
          // Duplicate all existing training data
          trainingType: existingTraining.trainingType,
          provider: existingTraining.provider,
          instructor: existingTraining.instructor,
          location: existingTraining.location,
          startDate: body.startDate ? new Date(body.startDate) : existingTraining.startDate, // Use new or keep existing
          isRequired: existingTraining.isRequired,
          competencies: existingTraining.competencies as any, // Keep existing competencies
          notes: body.notes || existingTraining.notes, // Allow notes update
          // Update specific fields for renewal
          completionDate: body.completionDate ? new Date(body.completionDate) : new Date(), // Default to today
          expirationDate: new Date(body.expirationDate),
          certificateNumber: body.certificateNumber || existingTraining.certificateNumber,
          hours: body.hours || existingTraining.hours
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

      return newTrainingIssue
    })

    return Response.json(result, { status: 201 })
  } catch (error) {
    console.error('Error renewing training:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
} 