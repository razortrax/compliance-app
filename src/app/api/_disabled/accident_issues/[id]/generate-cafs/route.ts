import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'
import { generateCAFsFromAccidentViolations } from '@/lib/caf-automation'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const accidentId = params.id
    const { searchParams } = new URL(request.url)
    const recreate = searchParams.get('recreate') === 'true'

    console.log('🔧 GENERATE CAFs - Starting for accident:', accidentId)
    console.log('🔧 GENERATE CAFs - Recreate mode:', recreate)

    // Verify the accident exists and fetch violations
    const accident = await db.accident_issue.findUnique({
      where: { id: accidentId },
      include: {
        violations: true,
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
        }
      }
    })

    if (!accident) {
      return NextResponse.json({ error: 'Accident not found' }, { status: 404 })
    }

    if (!accident.violations || accident.violations.length === 0) {
      return NextResponse.json({ error: 'No violations found for this accident' }, { status: 400 })
    }

    console.log('🔧 GENERATE CAFs - Found violations:', accident.violations.length)

    // If recreate mode, delete existing CAFs first
    if (recreate) {
      console.log('🔧 GENERATE CAFs - Deleting existing CAFs for accident:', accidentId)
      await db.corrective_action_form.deleteMany({
        where: {
          accidentViolationId: {
            in: accident.violations.map(v => v.id)
          }
        }
      })
    }

    // Generate fresh CAFs
    const result = await generateCAFsFromAccidentViolations(accidentId, accident.issue.party.role[0]?.organizationId || undefined)
    
    return NextResponse.json({
      message: recreate ? 'CAFs recreated successfully' : 'CAFs created successfully',
      generated: result.generated || 0,
      cafs: result.cafs || []
    })
  } catch (error) {
    console.error('Error generating CAFs for accident:', error)
    return NextResponse.json(
      { error: 'Failed to generate CAFs' },
      { status: 500 }
    )
  }
} 