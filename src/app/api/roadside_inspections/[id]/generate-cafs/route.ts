import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { generateCAFsFromRINSViolations } from '@/lib/caf-automation'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rinsId = params.id

    // Verify the RINS exists and user has access
    const rins = await db.roadside_inspection_issue.findUnique({
      where: { id: rinsId },
      include: {
        issue: {
          include: {
            party: {
              include: {
                role: {
                  where: { isActive: true }
                }
              }
            }
          }
        },
        violations: true
      }
    })

    if (!rins) {
      return NextResponse.json({ error: 'Roadside inspection not found' }, { status: 404 })
    }

    // Get the organization ID from the RINS
    const organizationId = rins.issue.party.role.find((role: any) => role.isActive)?.organizationId
    if (!organizationId) {
      return NextResponse.json({ error: 'Could not determine organization' }, { status: 400 })
    }

    // Check if user has access to this organization
    const userMasterOrg = await db.organization.findFirst({
      where: { party: { userId } }
    })

    let hasAccess = false
    if (userMasterOrg) {
      hasAccess = true // Master users can generate CAFs for any org
    } else {
      // Check if user owns this organization or has an active role
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
      return NextResponse.json({ error: 'Access denied to this organization' }, { status: 403 })
    }

    // Find a staff member to assign as the creator (preferably current user if they're staff, or any manager)
    let creatorStaff = await db.staff.findFirst({
      where: {
        party: {
          userId: userId,
          role: {
            some: {
              organizationId: organizationId,
              isActive: true
            }
          }
        },
        isActive: true
      }
    })

    // If current user is not staff, find a manager or supervisor to assign as creator
    if (!creatorStaff) {
      creatorStaff = await db.staff.findFirst({
        where: {
          party: {
            role: {
              some: {
                organizationId: organizationId,
                isActive: true
              }
            }
          },
          isActive: true,
          OR: [
            { position: { contains: 'manager', mode: 'insensitive' } },
            { position: { contains: 'supervisor', mode: 'insensitive' } },
            { canApproveCAFs: true }
          ]
        }
      })
    }

    if (!creatorStaff) {
      return NextResponse.json({ 
        error: 'No staff members found in this organization to assign as CAF creator. Please add staff members first in the Organization > Staff tab.' 
      }, { status: 400 })
    }

    // Check if CAFs already exist for this RINS
    const existingCAFs = await db.corrective_action_form.findMany({
      where: {
        rins_violation: {
          rinsId: rinsId
        }
      }
    })

    if (existingCAFs.length > 0) {
      return NextResponse.json({ 
        message: `${existingCAFs.length} CAF(s) already exist for this RINS`,
        existingCAFs: existingCAFs.length
      }, { status: 200 })
    }

    // Generate CAFs from violations
    const generatedCAFs = await generateCAFsFromRINSViolations(rinsId, creatorStaff.id)

    if (generatedCAFs.length === 0) {
      return NextResponse.json({ 
        message: 'No CAFs generated. All violations may already have associated CAFs or no violations exist.',
        generatedCAFs: 0
      }, { status: 200 })
    }

    return NextResponse.json({
      message: `Successfully generated ${generatedCAFs.length} CAF(s)`,
      generatedCAFs: generatedCAFs.length,
      cafs: generatedCAFs.map(caf => ({
        id: caf.id,
        cafNumber: caf.cafNumber,
        title: caf.title,
        priority: caf.priority,
        assignedTo: caf.assigned_staff?.party?.person ? 
          `${caf.assigned_staff.party.person.firstName} ${caf.assigned_staff.party.person.lastName}` : 
          'Unknown'
      }))
    }, { status: 201 })

  } catch (error) {
    console.error('Error generating CAFs for RINS:', error)
    return NextResponse.json({ 
      error: 'Failed to generate CAFs', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 