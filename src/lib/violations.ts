// DOT Violation Codes Database
export interface ViolationCode {
  code: string
  section: string
  description: string
  violationType: 'DRIVER' | 'EQUIPMENT' | 'COMPANY'
  severity: 'WARNING' | 'OUT_OF_SERVICE' | 'CITATION'
}

// Keep a few hardcoded examples for fallback/testing
export const VIOLATION_CODES: ViolationCode[] = [
  // 390.x - General Company/Administrative Violations
  {
    code: '390.3',
    section: '49 CFR 390.3',
    description: 'General applicability - Operating without authority',
    violationType: 'COMPANY',
    severity: 'CITATION'
  },
  {
    code: '390.11',
    section: '49 CFR 390.11',
    description: 'Motor carrier identification report not filed',
    violationType: 'COMPANY',
    severity: 'WARNING'
  },
  {
    code: '390.19',
    section: '49 CFR 390.19',
    description: 'Hazmat safety permits required',
    violationType: 'COMPANY',
    severity: 'CITATION'
  },
  {
    code: '390.21',
    section: '49 CFR 390.21',
    description: 'Marking of CMVs',
    violationType: 'EQUIPMENT',
    severity: 'WARNING'
  },

  // 391.x - Driver Qualification Violations
  {
    code: '391.11',
    section: '49 CFR 391.11',
    description: 'General qualifications of drivers',
    violationType: 'DRIVER',
    severity: 'OUT_OF_SERVICE'
  },
  {
    code: '391.13',
    section: '49 CFR 391.13',
    description: 'Disqualified driver',
    violationType: 'DRIVER',
    severity: 'OUT_OF_SERVICE'
  },
  {
    code: '391.15',
    section: '49 CFR 391.15',
    description: 'Physical qualifications for drivers',
    violationType: 'DRIVER',
    severity: 'OUT_OF_SERVICE'
  },
  {
    code: '391.41',
    section: '49 CFR 391.41',
    description: 'Physical qualification requirements',
    violationType: 'DRIVER',
    severity: 'OUT_OF_SERVICE'
  },
  {
    code: '391.43',
    section: '49 CFR 391.43',
    description: 'Medical examination; certificate of physical examination',
    violationType: 'DRIVER',
    severity: 'OUT_OF_SERVICE'
  },
  {
    code: '391.45',
    section: '49 CFR 391.45',
    description: 'Persons who must have medical examiner\'s certificates',
    violationType: 'DRIVER',
    severity: 'OUT_OF_SERVICE'
  },

  // 392.x - Driver Performance/Behavior Violations  
  {
    code: '392.2',
    section: '49 CFR 392.2',
    description: 'Ill or fatigued operator',
    violationType: 'DRIVER',
    severity: 'OUT_OF_SERVICE'
  },
  {
    code: '392.3',
    section: '49 CFR 392.3',
    description: 'Operating while ill or fatigued',
    violationType: 'DRIVER',
    severity: 'OUT_OF_SERVICE'
  },
  {
    code: '392.4',
    section: '49 CFR 392.4',
    description: 'Drugs and other substances',
    violationType: 'DRIVER',
    severity: 'OUT_OF_SERVICE'
  },
  {
    code: '392.5',
    section: '49 CFR 392.5',
    description: 'Alcohol prohibition',
    violationType: 'DRIVER',
    severity: 'OUT_OF_SERVICE'
  },

  // 393.x - Equipment Violations
  {
    code: '393.5',
    section: '49 CFR 393.5',
    description: 'Brakes - failure to stop within prescribed distance',
    violationType: 'EQUIPMENT',
    severity: 'OUT_OF_SERVICE'
  },
  {
    code: '393.9',
    section: '49 CFR 393.9',
    description: 'Inoperative required lamp',
    violationType: 'EQUIPMENT',
    severity: 'WARNING'
  },
  {
    code: '393.11',
    section: '49 CFR 393.11',
    description: 'No or improper lighting devices',
    violationType: 'EQUIPMENT',
    severity: 'OUT_OF_SERVICE'
  },
  {
    code: '393.25',
    section: '49 CFR 393.25',
    description: 'Tire tread depth less than 2/32 inch',
    violationType: 'EQUIPMENT',
    severity: 'OUT_OF_SERVICE'
  },
  {
    code: '393.45',
    section: '49 CFR 393.45',
    description: 'Brake connections with constrictions',
    violationType: 'EQUIPMENT',
    severity: 'OUT_OF_SERVICE'
  },
  {
    code: '393.53',
    section: '49 CFR 393.53',
    description: 'CMV-towed unit has inoperative brake system',
    violationType: 'EQUIPMENT',
    severity: 'OUT_OF_SERVICE'
  },
  {
    code: '393.75',
    section: '49 CFR 393.75',
    description: 'Tire-other tread depth less than 4/32 inch',
    violationType: 'EQUIPMENT',
    severity: 'OUT_OF_SERVICE'
  },
  {
    code: '393.95',
    section: '49 CFR 393.95',
    description: 'No/improper emergency equipment',
    violationType: 'EQUIPMENT',
    severity: 'WARNING'
  },

  // 395.x - Hours of Service Violations
  {
    code: '395.8',
    section: '49 CFR 395.8',
    description: 'Driver\'s record of duty status',
    violationType: 'DRIVER',
    severity: 'WARNING'
  },
  {
    code: '395.11',
    section: '49 CFR 395.11',
    description: 'No driver record of duty status when one is required',
    violationType: 'DRIVER',
    severity: 'OUT_OF_SERVICE'
  },
  {
    code: '395.13',
    section: '49 CFR 395.13',
    description: 'Driving beyond 8-hour limit without 30-minute break',
    violationType: 'DRIVER',
    severity: 'WARNING'
  },

  // 396.x - Equipment Maintenance Violations
  {
    code: '396.3',
    section: '49 CFR 396.3',
    description: 'Inspection, repair and maintenance',
    violationType: 'EQUIPMENT',
    severity: 'WARNING'
  },
  {
    code: '396.9',
    section: '49 CFR 396.9',
    description: 'Inspection of motor vehicles in operation',
    violationType: 'EQUIPMENT',
    severity: 'WARNING'
  },
  {
    code: '396.11',
    section: '49 CFR 396.11',
    description: 'Driver vehicle inspection report',
    violationType: 'EQUIPMENT',
    severity: 'WARNING'
  },
  {
    code: '396.17',
    section: '49 CFR 396.17',
    description: 'Periodic inspection',
    violationType: 'EQUIPMENT',
    severity: 'WARNING'
  }
]

// Synchronous function for searching hardcoded violations (fallback)
export function searchViolations(query: string): ViolationCode[] {
  if (!query || query.length < 2) return []
  
  const lowerQuery = query.toLowerCase()
  
  return VIOLATION_CODES.filter(violation => 
    violation.code.toLowerCase().includes(lowerQuery) ||
    violation.description.toLowerCase().includes(lowerQuery) ||
    violation.section.toLowerCase().includes(lowerQuery)
  ).slice(0, 25)
}

export function getViolationByCode(code: string): ViolationCode | undefined {
  return VIOLATION_CODES.find(violation => violation.code === code)
} 