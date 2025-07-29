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
      violationType: mapViolationTypeFromDBWithCode(v.violationType, v.code),
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
      return 'COMPANY'
    case 'OTHER':
      // Default OTHER to COMPANY, but this might need refinement based on violation code
      return 'COMPANY'
    default:
      return 'COMPANY'
  }
}

// Enhanced mapping that also considers violation code for better accuracy
function mapViolationTypeFromDBWithCode(dbType: string, violationCode: string): 'DRIVER' | 'EQUIPMENT' | 'COMPANY' {
  // First try the database type
  const baseMapping = mapViolationTypeFromDB(dbType)
  
  // Override based on violation code patterns for better accuracy
  if (violationCode.startsWith('391') || violationCode.startsWith('392')) {
    return 'DRIVER' // Driver qualification and performance violations
  } else if (violationCode.startsWith('393') || violationCode.startsWith('396')) {
    return 'EQUIPMENT' // Equipment and maintenance violations
  } else if (violationCode.startsWith('390')) {
    return 'COMPANY' // Company/operational violations
  }
  
  // Use the base mapping if no code pattern match
  return baseMapping
}

// Helper function to map database/violation type to severity
function mapSeverityFromDB(violationType: string): 'WARNING' | 'OUT_OF_SERVICE' | 'CITATION' {
  // Since the imported data doesn't have severity, we'll use more reasonable defaults
  // Out of Service should be based on specific violations, not all driver violations
  const type = violationType?.toUpperCase()
  
  if (type?.includes('DRIVER')) {
    return 'CITATION' // Most driver violations are citations, not automatic OOS
  } else if (type?.includes('EQUIPMENT') || type?.includes('VEHICLE')) {
    return 'WARNING' // Equipment violations often start as warnings
  } else {
    return 'CITATION' // Company violations are typically citations
  }
} 