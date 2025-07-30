import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { createId } from '@paralleldrive/cuid2'
import { CafPriority, CafCategory, CafStatus } from '@prisma/client'

interface CAFData {
  rinsViolationId?: string
  accidentViolationId?: string
  title: string
  description: string
  priority?: CafPriority
  category: CafCategory
  assignedStaffId: string
  organizationId: string
  dueDate?: string
  requiresApproval?: boolean
}

// Generate CAF number in format CAF-YYYY-NNNN
async function generateCAFNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `CAF-${year}-`
  
  // Get the highest number for this year
  const lastCAF = await db.corrective_action_form.findFirst({
    where: {
      cafNumber: {
        startsWith: prefix
      }
    },
    orderBy: {
      cafNumber: 'desc'
    }
  })
  
  let nextNumber = 1
  if (lastCAF) {
    const lastNumber = parseInt(lastCAF.cafNumber.substring(prefix.length))
    nextNumber = lastNumber + 1
  }
  
  return `${prefix}${nextNumber.toString().padStart(4, '0')}`
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const staffId = searchParams.get('staffId')
    const status = searchParams.get('status')
    const rinsId = searchParams.get('rinsId')
    const accidentId = searchParams.get('accidentId')

    const whereClause: any = {}

    if (organizationId) {
      whereClause.organizationId = organizationId
    }

    if (staffId) {
      whereClause.assignedStaffId = staffId
    }

    if (status) {
      whereClause.status = status as CafStatus
    }

    if (rinsId) {
      whereClause.rins_violation = {
        roadside_inspection: {
          id: rinsId
        }
      }
    }

    if (accidentId) {
      whereClause.accident_violation = {
        accident: {
          id: accidentId
        }
      }
    }

    const cafs = await db.corrective_action_form.findMany({
      where: whereClause,
      include: {
        rins_violation: {
          include: {
            roadside_inspection: {
              include: {
                issue: {
                  include: {
                    party: {
                      include: {
                        person: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        accident_violation: {
          include: {
            accident: {
              include: {
                issue: {
                  include: {
                    party: {
                      include: {
                        person: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        assigned_staff: {
          include: {
            party: {
              include: {
                person: true
              }
            }
          }
        },
        created_by_staff: {
          include: {
            party: {
              include: {
                person: true
              }
            }
          }
        },
        organization: true,
        signatures: {
          include: {
            staff: {
              include: {
                party: {
                  include: {
                    person: true
                  }
                }
              }
            }
          }
        },
        attachments: true
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json(cafs)
  } catch (error) {
    console.error('Error fetching CAFs:', error)
    return NextResponse.json({ error: 'Failed to fetch CAFs' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data: CAFData = await request.json()

    if (!data.title || !data.description || !data.assignedStaffId || !data.organizationId) {
      return NextResponse.json({ 
        error: 'Missing required fields: title, description, assignedStaffId, organizationId' 
      }, { status: 400 })
    }

    // Verify assigned staff exists and has permissions
    const assignedStaff = await db.staff.findUnique({
      where: { id: data.assignedStaffId },
      include: {
        party: {
          include: {
            person: true
          }
        }
      }
    })

    if (!assignedStaff) {
      return NextResponse.json({ error: 'Assigned staff not found' }, { status: 404 })
    }

    // Find the staff record for the user creating the CAF
    const creatorStaff = await db.staff.findFirst({
      where: {
        party: {
          userId: userId
        }
      }
    })

    if (!creatorStaff) {
      return NextResponse.json({ error: 'Creator staff record not found' }, { status: 404 })
    }

    // Generate CAF number
    const cafNumber = await generateCAFNumber()

    // Create CAF
    const caf = await db.corrective_action_form.create({
      data: {
        id: createId(),
        cafNumber,
        rinsViolationId: data.rinsViolationId,
        accidentViolationId: data.accidentViolationId,
        title: data.title,
        description: data.description,
        priority: data.priority || CafPriority.MEDIUM,
        category: data.category,
        assignedStaffId: data.assignedStaffId,
        assignedBy: creatorStaff.id,
        organizationId: data.organizationId,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        requiresApproval: data.requiresApproval !== false, // Default to true
      },
      include: {
        rins_violation: true,
        accident_violation: true,
        assigned_staff: {
          include: {
            party: {
              include: {
                person: true
              }
            }
          }
        },
        created_by_staff: {
          include: {
            party: {
              include: {
                person: true
              }
            }
          }
        },
        organization: true
      }
    })

    return NextResponse.json(caf, { status: 201 })
  } catch (error) {
    console.error('Error creating CAF:', error)
    return NextResponse.json({ error: 'Failed to create CAF' }, { status: 500 })
  }
} 