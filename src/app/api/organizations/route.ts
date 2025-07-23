import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Add role-based filtering based on user permissions
    // For now, return all organizations (Master manager view)
    const organizations = await db.organization.findMany({
      include: {
        party: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            roles: {
              where: {
                roleType: 'master',
                isActive: true
              },
              select: {
                status: true,
                isActive: true
              }
            }
          }
        }
      },
      orderBy: {
        party: {
          createdAt: 'desc'
        }
      }
    })

    return NextResponse.json(organizations)
  } catch (error) {
    console.error('Error fetching organizations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch organizations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, dotNumber, einNumber, permitNumber, phone, notes } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      )
    }

    // Create organization with party relationship
    const organization = await db.organization.create({
      data: {
        name,
        dotNumber: dotNumber || null,
        phone: phone || null,
        party: {
          create: {
            status: 'active' // Party itself is always active, role determines org status
          }
        }
      },
      include: {
        party: true
      }
    })

    // Get the current user's master party (or create one if needed)
    // For now, we'll assign to ComplianceApp master if user doesn't have a master party
    // TODO: Later we'll create proper user master parties during signup
    
    // Find or create ComplianceApp master (auto-created on first use)
    let complianceAppMaster = await db.organization.findFirst({
      where: { name: 'ComplianceApp' },
      include: { party: true }
    })

    // Create ComplianceApp master if it doesn't exist
    if (!complianceAppMaster) {
      console.log('Creating ComplianceApp master organization...')
      complianceAppMaster = await db.organization.create({
        data: {
          name: 'ComplianceApp',
          dotNumber: 'MASTER001',
          email: 'admin@complianceapp.com',
          phone: '(555) 000-0000',
          party: {
            create: {
              status: 'active'
            }
          }
        },
        include: {
          party: true
        }
      })
    }

    // Determine initial role status based on completion
    const hasActivationRequirements = einNumber && permitNumber
    const initialRoleStatus = hasActivationRequirements ? 'active' : 'pending'

    // Create master-organization relationship in Role table
    await db.role.create({
      data: {
        roleType: 'master',
        partyId: complianceAppMaster.partyId, // ComplianceApp is the master
        organizationId: organization.id,
        status: initialRoleStatus,
        isActive: true
      }
    })

    // TODO: Store EIN and permit numbers (add to schema when needed)
    // TODO: Create role assignment for creator
    // TODO: Check plan limits for master manager

    return NextResponse.json(organization, { status: 201 })
  } catch (error) {
    console.error('Error creating organization:', error)
    
    // Handle unique constraint violations
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'DOT number already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create organization' },
      { status: 500 }
    )
  }
} 