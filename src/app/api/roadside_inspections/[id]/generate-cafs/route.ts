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
    const { searchParams } = new URL(request.url)
    const recreate = searchParams.get('recreate') === 'true'

    // If recreate is true, delete all existing CAFs first
    if (recreate) {
      console.log(`Recreating CAFs for RINS ${rinsId} - deleting existing CAFs...`)
      await db.corrective_action_form.deleteMany({
        where: {
          rins_violation: {
            rinsId: rinsId
          }
        }
      })
    } else {
      // Check if CAFs already exist (for create mode)
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
    }

    // Generate fresh CAFs
    const result = await generateCAFsFromRINSViolations(rinsId)
    
    return NextResponse.json({
      message: recreate ? 'CAFs recreated successfully' : 'CAFs created successfully',
      generated: result.length,
      cafs: result
    }, { status: 201 })

  } catch (error) {
    console.error('Error generating CAFs:', error)
    return NextResponse.json({ 
      error: 'Failed to generate CAFs',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 