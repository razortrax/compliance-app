import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { z } from 'zod'

const consultantRegistrationSchema = z.object({
  licenseNumber: z.string().optional(),
  yearsExperience: z.string().transform(val => parseInt(val, 10)),
  hourlyRate: z.string().transform(val => parseFloat(val)),
  bio: z.string().min(50, 'Bio must be at least 50 characters'),
  specializations: z.array(z.string()).min(1, 'At least one specialization required')
})

export async function POST(request: Request) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validatedData = consultantRegistrationSchema.parse(body)

    // Check if user is already a consultant
    const existingConsultant = await db.party.findFirst({
      where: {
        roles: {
          some: {
            roleType: 'consultant',
            isActive: true
          }
        }
      },
      include: {
        consultant: true
      }
    })

    if (existingConsultant?.consultant) {
      return NextResponse.json({ error: 'User is already registered as a consultant' }, { status: 400 })
    }

    // Create consultant profile in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create party for consultant if not exists
      let consultantParty = await tx.party.findFirst({
        where: {
          roles: {
            some: {
              roleType: 'consultant'
            }
          }
        }
      })

      if (!consultantParty) {
        consultantParty = await tx.party.create({
          data: {
            status: 'active'
          }
        })
      }

      // Create consultant profile
      const consultant = await tx.consultant.create({
        data: {
          partyId: consultantParty.id,
          licenseNumber: validatedData.licenseNumber || null,
          yearsExperience: validatedData.yearsExperience,
          hourlyRate: validatedData.hourlyRate,
          bio: validatedData.bio,
          specializations: validatedData.specializations,
          isActive: true,
          isVerified: false // Will be verified by admin later
        }
      })

      // Create consultant role
      await tx.role.create({
        data: {
          partyId: consultantParty.id,
          roleType: 'consultant',
          status: 'active',
          isActive: true
        }
      })

      return consultant
    })

    return NextResponse.json({
      message: 'Consultant registration successful',
      consultant: {
        id: result.id,
        specializations: result.specializations,
        isVerified: result.isVerified
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Consultant registration error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: error.issues 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      error: 'Registration failed' 
    }, { status: 500 })
  }
}

// Get consultant profile
export async function GET() {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const consultant = await db.consultant.findFirst({
      where: {
        party: {
          roles: {
            some: {
              roleType: 'consultant',
              isActive: true
            }
          }
        }
      },
      include: {
        party: true,
        consultations: {
          include: {
            clientOrg: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!consultant) {
      return NextResponse.json({ error: 'Consultant profile not found' }, { status: 404 })
    }

    return NextResponse.json({
      consultant: {
        id: consultant.id,
        licenseNumber: consultant.licenseNumber,
        yearsExperience: consultant.yearsExperience,
        hourlyRate: consultant.hourlyRate,
        bio: consultant.bio,
        specializations: consultant.specializations,
        isActive: consultant.isActive,
        isVerified: consultant.isVerified,
        consultations: consultant.consultations
      }
    })

  } catch (error) {
    console.error('Error fetching consultant profile:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
} 