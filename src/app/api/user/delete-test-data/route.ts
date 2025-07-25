import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Allow both DELETE and GET for easy testing
export async function DELETE() {
  return handleDeleteTestData()
}

export async function GET() {
  return handleDeleteTestData()
}

async function handleDeleteTestData() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log(`🗑️ Deleting all test data for user: ${userId}`)

    // Find all parties for this user
    const userParties = await prisma.party.findMany({
      where: { userId: userId },
      include: {
        organization: true,
        person: true,
        equipment: true,
        role: true,
        issue: {
          include: {
            license_issue: true,
            accident_issue: true,
            inspection_issue: true
          }
        }
      }
    })

    if (userParties.length === 0) {
      return NextResponse.json({ 
        message: 'No test data found for this user',
        deletedCounts: {}
      })
    }

    console.log(`📊 Found ${userParties.length} parties to delete`)

    // Delete in the correct order to avoid foreign key constraints
    const deletedCounts = {
      licenseIssues: 0,
      accidentIssues: 0,
      inspectionIssues: 0,
      issues: 0,
      roles: 0,
      organizations: 0,
      people: 0,
      equipment: 0,
      parties: 0
    }

    // Delete issue-related data first
    for (const party of userParties) {
      for (const issue of party.issue) {
        // Delete issue-specific data
        if (issue.license_issue) {
          await prisma.license_issue.delete({ where: { id: issue.license_issue.id } })
          deletedCounts.licenseIssues++
        }
        if (issue.accident_issue) {
          await prisma.accident_issue.delete({ where: { id: issue.accident_issue.id } })
          deletedCounts.accidentIssues++
        }
        if (issue.inspection_issue) {
          await prisma.inspection_issue.delete({ where: { id: issue.inspection_issue.id } })
          deletedCounts.inspectionIssues++
        }
        
        // Delete the issue
        await prisma.issue.delete({ where: { id: issue.id } })
        deletedCounts.issues++
      }

      // Delete roles
      for (const role of party.role) {
        await prisma.role.delete({ where: { id: role.id } })
        deletedCounts.roles++
      }

      // Delete organization if exists
      if (party.organization) {
        await prisma.organization.delete({ where: { id: party.organization.id } })
        deletedCounts.organizations++
      }

      // Delete person if exists
      if (party.person) {
        await prisma.person.delete({ where: { id: party.person.id } })
        deletedCounts.people++
      }

      // Delete equipment if exists
      if (party.equipment) {
        await prisma.equipment.delete({ where: { id: party.equipment.id } })
        deletedCounts.equipment++
      }

      // Finally delete the party
      await prisma.party.delete({ where: { id: party.id } })
      deletedCounts.parties++
    }

    console.log('✅ Successfully deleted all test data:', deletedCounts)

    return NextResponse.json({
      message: `Successfully deleted all test data for user ${userId}`,
      deletedCounts,
      userId
    })

  } catch (error) {
    console.error('❌ Error deleting test data:', error)
    return NextResponse.json(
      { error: 'Failed to delete test data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
} 