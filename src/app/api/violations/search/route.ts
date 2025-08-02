import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db'

export async function GET(request: NextRequest) {
  try {
    const authResult = await auth()
    const userId = authResult.userId
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.length < 2) {
      return NextResponse.json([])
    }

    // Search violations in database by code or description
    const searchQuery = query.toLowerCase()
    const matchingViolations = await db.violation_code.findMany({
      where: {
        OR: [
          {
            code: {
              contains: searchQuery,
              mode: 'insensitive'
            }
          },
          {
            description: {
              contains: searchQuery,
              mode: 'insensitive'  
            }
          },
          {
            violationType: {
              contains: searchQuery,
              mode: 'insensitive'
            }
          }
        ]
      },
      select: {
        code: true,
        description: true,
        violationType: true
      },
      take: 10, // Limit to 10 results
      orderBy: [
        { code: 'asc' }
      ]
    })

    // Transform to match the expected format
    const transformedViolations = matchingViolations.map(violation => ({
      code: violation.code,
      description: violation.description,
      type: violation.violationType, // Map back to the expected field name
      // Map severity based on type for backward compatibility
      severity: violation.violationType === 'Equipment' ? 'OUT_OF_SERVICE' : 'WARNING'
    }))

    return NextResponse.json(transformedViolations)

  } catch (error) {
    console.error('Error searching violations:', error)
    return NextResponse.json(
      { error: 'Failed to search violations' },
      { status: 500 }
    )
  }
} 