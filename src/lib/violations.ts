// DOT Violation Codes Database
export interface ViolationCode {
  code: string
  section: string
  description: string
  violationType: 'DRIVER' | 'EQUIPMENT' | 'COMPANY'
  severity: 'WARNING' | 'OUT_OF_SERVICE' | 'CITATION'
}

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
  {
    code: '392.7',
    section: '49 CFR 392.7',
    description: 'Equipment, inspection and use',
    violationType: 'EQUIPMENT',
    severity: 'WARNING'
  },
  {
    code: '392.8',
    section: '49 CFR 392.8',
    description: 'Emergency equipment',
    violationType: 'EQUIPMENT',
    severity: 'WARNING'
  },
  {
    code: '392.9',
    section: '49 CFR 392.9',
    description: 'Inspection of cargo, cargo securement devices and systems',
    violationType: 'EQUIPMENT',
    severity: 'WARNING'
  },
  {
    code: '392.14',
    section: '49 CFR 392.14',
    description: 'Hazardous conditions; extreme caution',
    violationType: 'DRIVER',
    severity: 'WARNING'
  },
  {
    code: '392.16',
    section: '49 CFR 392.16',
    description: 'Use of seat belts',
    violationType: 'DRIVER',
    severity: 'WARNING'
  },
  {
    code: '392.22',
    section: '49 CFR 392.22',
    description: 'Emergency signals; stopped commercial motor vehicles',
    violationType: 'EQUIPMENT',
    severity: 'WARNING'
  },

  // 393.x/396.x - Equipment/Vehicle Violations
  {
    code: '393.11',
    section: '49 CFR 393.11',
    description: 'No or defective lighting devices',
    violationType: 'EQUIPMENT',
    severity: 'OUT_OF_SERVICE'
  },
  {
    code: '393.13',
    section: '49 CFR 393.13',
    description: 'Retroreflective tape',
    violationType: 'EQUIPMENT',
    severity: 'WARNING'
  },
  {
    code: '393.19',
    section: '49 CFR 393.19',
    description: 'Hazard warning signal flashers',
    violationType: 'EQUIPMENT',
    severity: 'WARNING'
  },
  {
    code: '393.25',
    section: '49 CFR 393.25',
    description: 'Requirements for lamps, reflective devices and electrical equipment',
    violationType: 'EQUIPMENT',
    severity: 'WARNING'
  },
  {
    code: '393.40',
    section: '49 CFR 393.40',
    description: 'Required brake systems',
    violationType: 'EQUIPMENT',
    severity: 'OUT_OF_SERVICE'
  },
  {
    code: '393.43',
    section: '49 CFR 393.43',
    description: 'Breakaway and emergency braking',
    violationType: 'EQUIPMENT',
    severity: 'OUT_OF_SERVICE'
  },
  {
    code: '393.45',
    section: '49 CFR 393.45',
    description: 'Brake tubing and hose adequacy',
    violationType: 'EQUIPMENT',
    severity: 'OUT_OF_SERVICE'
  },
  {
    code: '393.47',
    section: '49 CFR 393.47',
    description: 'Brake lining/pad thickness',
    violationType: 'EQUIPMENT',
    severity: 'OUT_OF_SERVICE'
  },
  {
    code: '393.53',
    section: '49 CFR 393.53',
    description: 'Automatic brake adjusters',
    violationType: 'EQUIPMENT',
    severity: 'OUT_OF_SERVICE'
  },
  {
    code: '393.60',
    section: '49 CFR 393.60',
    description: 'Glazing in specified openings',
    violationType: 'EQUIPMENT',
    severity: 'WARNING'
  },
  {
    code: '393.75',
    section: '49 CFR 393.75',
    description: 'Tires',
    violationType: 'EQUIPMENT',
    severity: 'OUT_OF_SERVICE'
  },
  {
    code: '393.95',
    section: '49 CFR 393.95',
    description: 'Emergency equipment on all power units',
    violationType: 'EQUIPMENT',
    severity: 'WARNING'
  },

  // 396.x - Inspection, Repair, and Maintenance
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
    violationType: 'COMPANY',
    severity: 'WARNING'
  },
  {
    code: '396.13',
    section: '49 CFR 396.13',
    description: 'Driver inspection',
    violationType: 'DRIVER',
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

export function searchViolations(query: string): ViolationCode[] {
  if (!query || query.length < 2) return []
  
  const lowerQuery = query.toLowerCase()
  
  return VIOLATION_CODES.filter(violation => 
    violation.code.toLowerCase().includes(lowerQuery) ||
    violation.description.toLowerCase().includes(lowerQuery) ||
    violation.section.toLowerCase().includes(lowerQuery)
  ).slice(0, 10) // Limit to 10 results for performance
}

export function getViolationByCode(code: string): ViolationCode | undefined {
  return VIOLATION_CODES.find(violation => violation.code === code)
} 