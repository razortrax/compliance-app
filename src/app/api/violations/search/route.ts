import { NextRequest } from 'next/server'
import { db } from '@/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    
    if (!query || query.length < 2) {
      return Response.json([])
    }
    
    // Search the database for violations
    const violations = await db.violation_code.findMany({
      where: {
        OR: [
          { code: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { cfrSection: { contains: query, mode: 'insensitive' } }
        ]
      },
      take: 25, // Limit results for performance
      orderBy: [
        { code: 'asc' }  // Order by violation code
      ]
    })

    // Map database results to frontend interface
    const results = violations.map(v => ({
      code: v.code,
      section: v.cfrSection || `49 CFR ${v.code}`,
      description: v.description,
      violationType: mapViolationTypeFromDB(v.violationType),
      severity: mapSeverityFromDB(v.violationType)
    }))

    return Response.json(results)
  } catch (error) {
    console.error('Violation search API error:', error)
    return Response.json({ error: 'Search failed' }, { status: 500 })
  }
}

// Helper function to map database violation type to our enum
function mapViolationTypeFromDB(dbType: string): 'DRIVER' | 'EQUIPMENT' | 'COMPANY' {
  switch (dbType?.toUpperCase()) {
    case 'DRIVER':
      return 'DRIVER'
    case 'EQUIPMENT':
    case 'VEHICLE':
      return 'EQUIPMENT'
    case 'COMPANY':
    case 'OTHER':
    default:
      return 'COMPANY'
  }
}

// Helper function to map database/violation type to severity
function mapSeverityFromDB(violationType: string): 'WARNING' | 'OUT_OF_SERVICE' | 'CITATION' {
  // Since the imported data doesn't have severity, we'll infer based on violation type and code patterns
  const type = violationType?.toUpperCase()
  
  if (type?.includes('DRIVER')) {
    return 'OUT_OF_SERVICE' // Most driver violations are OOS
  } else if (type?.includes('EQUIPMENT') || type?.includes('VEHICLE')) {
    return 'WARNING' // Most equipment violations start as warnings
  } else {
    return 'CITATION' // Company violations are typically citations
  }
} 