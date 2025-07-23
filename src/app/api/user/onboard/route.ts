import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'

export async function POST(request: Request) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { firstName, lastName, roleType, organizationName } = await request.json()

    if (!firstName || !lastName || !roleType) {
      return NextResponse.json({ 
        error: 'First name, last name, and role type are required' 
      }, { status: 400 })
    }

    // Check if user already has a party record
    const existingParty = await db.party.findFirst({
      where: { userId: userId }
    })

    if (existingParty) {
      return NextResponse.json({ 
        error: 'User already has an account setup' 
      }, { status: 409 })
    }

    // Create user's person party record
    const userParty = await db.party.create({
      data: {
        userId: userId,
        status: 'active',
        person: {
          create: {
            firstName,
            lastName,
            email: '' // Will be filled from Clerk if needed
          }
        }
      },
      include: {
        person: true
      }
    })

    let organizationParty = null
    let userRole = null

    if (roleType === 'consultant') {
      // For consultants, create consultant record and role
      const consultantParty = await db.party.create({
        data: {
          userId: userId,
          status: 'active',
          consultant: {
            create: {
              licenseNumber: null,
              yearsExperience: 0,
              hourlyRate: 0,
              bio: '',
              specializations: [],
              isVerified: false
            }
          }
        },
        include: {
          consultant: true
        }
      })

      userRole = await db.role.create({
        data: {
          partyId: consultantParty.id,
          roleType: 'consultant',
          status: 'active',
          isActive: true
        }
      })

    } else {
      // For master/organization managers, create organization
      if (!organizationName) {
        return NextResponse.json({ 
          error: 'Organization name is required for this role type' 
        }, { status: 400 })
      }

      organizationParty = await db.party.create({
        data: {
          userId: userId,
          status: 'active',
          organization: {
            create: {
              name: organizationName,
              email: '',
              phone: ''
            }
          }
        },
        include: {
          organization: true
        }
      })

      // Create role connecting user to organization
      userRole = await db.role.create({
        data: {
          partyId: userParty.id,
          roleType: roleType,
          organizationId: organizationParty.organization!.id,
          status: 'active',
          isActive: true
        }
      })
    }

    return NextResponse.json({
      message: 'Onboarding completed successfully',
      userParty,
      organizationParty,
      userRole
    })

  } catch (error) {
    console.error('Error during onboarding:', error)
    return NextResponse.json({ 
      error: 'Failed to complete onboarding' 
    }, { status: 500 })
  }
} 