// DVER Auto-Population System
// Integrates with the unified incident architecture

interface DVERDocument {
  // Header Information
  reportNumber?: string
  inspectionDate: string
  inspectionTime?: string
  inspectorName: string
  inspectorBadge?: string
  agencyName?: string
  
  // Location Information
  inspectionLocation: string
  facilityName?: string
  facilityAddress?: string
  facilityCity?: string
  facilityState?: string
  facilityZip?: string
  
  // Inspection Details
  inspectionLevel: 'Level_I' | 'Level_II' | 'Level_III' | 'Level_IV' | 'Level_V' | 'Level_VI'
  overallResult: 'Pass' | 'Warning' | 'OOS'
  
  // Driver Information
  driverName?: string
  driverLicense?: string
  driverLicenseState?: string
  driverDOB?: string
  
  // Equipment Information
  equipment: DVEREquipment[]
  
  // Violations
  violations: DVERViolation[]
}

interface DVEREquipment {
  unitNumber: number
  unitType?: string // TT (Tractor Truck), TLR (Trailer), etc.
  make?: string
  model?: string
  year?: number
  plateNumber?: string
  plateState?: string
  vin?: string
  cvsaSticker?: string
  oosSticker?: string
}

interface DVERViolation {
  violationCode: string
  section: string
  unitNumber?: number // Which unit has the violation (or null for driver)
  outOfService: boolean
  description: string
  inspectorComments?: string
  severity: 'WARNING' | 'CITATION' | 'CRIMINAL' | 'OUT_OF_SERVICE'
}

// OCR Service Configuration
interface OCRConfig {
  provider: 'AWS_TEXTRACT' | 'GOOGLE_VISION' | 'AZURE_FORM_RECOGNIZER'
  confidence_threshold: number
  preprocessing: {
    deskew: boolean
    noise_reduction: boolean
    contrast_enhancement: boolean
  }
}

// DVER Field Mappings - Standard DVER form positions
const DVER_FIELD_MAPPINGS = {
  // Top Section - Inspection Header
  report_number: { section: 'header', keywords: ['Report', 'Number', 'USP'] },
  inspection_date: { section: 'header', keywords: ['Date', 'Inspection'] },
  inspection_time: { section: 'header', keywords: ['Time'] },
  inspector_name: { section: 'header', keywords: ['Inspector', 'Name', 'Officer'] },
  inspector_badge: { section: 'header', keywords: ['Badge', 'ID'] },
  
  // Facility Information
  facility_name: { section: 'facility', keywords: ['Facility', 'Company'] },
  facility_address: { section: 'facility', keywords: ['Address', 'Street'] },
  
  // Driver Information
  driver_name: { section: 'driver', keywords: ['Driver', 'Name'] },
  driver_license: { section: 'driver', keywords: ['License', 'CDL'] },
  driver_state: { section: 'driver', keywords: ['State', 'Issued'] },
  
  // Equipment Sections (repeating)
  unit_sections: {
    keywords: ['Unit', 'Vehicle', 'Equipment'],
    fields: {
      unit_type: ['Type', 'TT', 'TLR', 'Truck', 'Trailer'],
      make: ['Make', 'Manufacturer'],
      model: ['Model'],
      year: ['Year'],
      plate: ['Plate', 'License'],
      vin: ['VIN', 'Serial']
    }
  },
  
  // Violations Section
  violations: {
    keywords: ['Violation', 'Code', 'CFR'],
    patterns: {
      code: /\b\d{3}\.\d+[A-Z]*(?:\(\d+\))?\b/, // 392.2A(1) pattern
      oos: ['OOS', 'Out of Service', 'X'],
      severity: ['Warning', 'Citation', 'Criminal']
    }
  }
}

class DVERProcessor {
  private ocrConfig: OCRConfig
  
  constructor(config: OCRConfig) {
    this.ocrConfig = config
  }
  
  async processDVER(file: File): Promise<DVERDocument> {
    // Step 1: Extract raw text using OCR
    const rawText = await this.extractText(file)
    
    // Step 2: Parse structured data from text
    const parsedData = await this.parseStructuredData(rawText)
    
    // Step 3: Validate and clean data
    const validatedData = await this.validateData(parsedData)
    
    // Step 4: Return structured DVER document
    return validatedData
  }
  
  private async extractText(file: File): Promise<string> {
    switch (this.ocrConfig.provider) {
      case 'AWS_TEXTRACT':
        return await this.extractWithTextract(file)
      case 'GOOGLE_VISION':
        return await this.extractWithVision(file)
      case 'AZURE_FORM_RECOGNIZER':
        return await this.extractWithFormRecognizer(file)
      default:
        throw new Error('Unsupported OCR provider')
    }
  }
  
  private async extractWithTextract(file: File): Promise<string> {
    // AWS Textract implementation
    // Handles table detection and form field extraction
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await fetch('/api/ocr/textract', {
      method: 'POST',
      body: formData
    })
    
    const result = await response.json()
    return result.extractedText
  }
  
  private async extractWithVision(file: File): Promise<string> {
    // Google Vision API implementation
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await fetch('/api/ocr/vision', {
      method: 'POST',
      body: formData
    })
    
    const result = await response.json()
    return result.extractedText
  }
  
  private async extractWithFormRecognizer(file: File): Promise<string> {
    // Azure Form Recognizer implementation
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await fetch('/api/ocr/form-recognizer', {
      method: 'POST',
      body: formData
    })
    
    const result = await response.json()
    return result.extractedText
  }
  
  private async parseStructuredData(rawText: string): Promise<Partial<DVERDocument>> {
    const dver: Partial<DVERDocument> = {}
    
    // Parse header information
    dver.reportNumber = this.extractField(rawText, DVER_FIELD_MAPPINGS.report_number)
    dver.inspectionDate = this.extractDate(rawText)
    dver.inspectionTime = this.extractTime(rawText)
    dver.inspectorName = this.extractField(rawText, DVER_FIELD_MAPPINGS.inspector_name)
    
    // Parse facility information
    dver.facilityName = this.extractField(rawText, DVER_FIELD_MAPPINGS.facility_name)
    dver.facilityAddress = this.extractField(rawText, DVER_FIELD_MAPPINGS.facility_address)
    
    // Parse equipment information
    dver.equipment = this.extractEquipment(rawText)
    
    // Parse violations
    dver.violations = this.extractViolations(rawText)
    
    return dver
  }
  
  private extractEquipment(text: string): DVEREquipment[] {
    const equipment: DVEREquipment[] = []
    
    // Look for equipment sections (usually Unit 1, Unit 2, etc.)
    const unitPattern = /Unit\s+(\d+)[\s\S]*?(?=Unit\s+\d+|Violations|$)/gi
    const matches = Array.from(text.matchAll(unitPattern))
    
    for (const match of matches) {
      const unitText = match[0]
      const unitNumber = parseInt(match[1])
      
      equipment.push({
        unitNumber,
        unitType: this.extractFromSection(unitText, ['TT', 'TLR', 'Truck', 'Trailer']) || undefined,
        make: this.extractFromSection(unitText, ['Make:']),
        model: this.extractFromSection(unitText, ['Model:']),
        year: parseInt(this.extractFromSection(unitText, ['Year:']) || '0') || undefined,
        plateNumber: this.extractFromSection(unitText, ['Plate:', 'License:']),
        plateState: this.extractFromSection(unitText, ['State:']),
        vin: this.extractFromSection(unitText, ['VIN:', 'Serial:'])
      })
    }
    
    return equipment
  }
  
  private extractViolations(text: string): DVERViolation[] {
    const violations: DVERViolation[] = []
    
    // Look for violation codes (392.2A, 396.3A1, etc.)
    const violationPattern = /(\d{3}\.\d+[A-Z]*(?:\(\d+\))?)\s*([^0-9\n]*?)(?=\d{3}\.\d+|$)/gi
    const matches = Array.from(text.matchAll(violationPattern))
    
    for (const match of matches) {
      const code = match[1]
      const description = match[2].trim()
      
      // Check if violation is marked as Out of Service
      const isOOS = /\b(OOS|Out of Service|X)\b/i.test(description)
      
      // Determine severity
      let severity: DVERViolation['severity'] = 'WARNING'
      if (isOOS) severity = 'OUT_OF_SERVICE'
      else if (/citation/i.test(description)) severity = 'CITATION'
      else if (/criminal/i.test(description)) severity = 'CRIMINAL'
      
      violations.push({
        violationCode: code,
        section: `49 CFR ${code}`,
        outOfService: isOOS,
        description: description.replace(/\b(OOS|Out of Service|X)\b/gi, '').trim(),
        severity
      })
    }
    
    return violations
  }
  
  private extractField(text: string, mapping: any): string | undefined {
    for (const keyword of mapping.keywords) {
      const pattern = new RegExp(`${keyword}:?\\s*([^\\n]*?)(?=\\n|$)`, 'i')
      const match = text.match(pattern)
      if (match) return match[1].trim()
    }
    return undefined
  }
  
  private extractDate(text: string): string {
    // Look for date patterns: MM/DD/YYYY, MM-DD-YYYY, etc.
    const datePattern = /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})\b/
    const match = text.match(datePattern)
    if (match) {
      const date = new Date(match[1])
      return date.toISOString().split('T')[0]
    }
    return new Date().toISOString().split('T')[0]
  }
  
  private extractTime(text: string): string | undefined {
    // Look for time patterns: HH:MM, HH:MM AM/PM
    const timePattern = /\b(\d{1,2}:\d{2}(?:\s*[AP]M)?)\b/i
    const match = text.match(timePattern)
    return match ? match[1] : undefined
  }
  
  private extractFromSection(text: string, keywords: string[]): string | undefined {
    for (const keyword of keywords) {
      const pattern = new RegExp(`${keyword}\\s*:?\\s*([^\\n\\s]+)`, 'i')
      const match = text.match(pattern)
      if (match) return match[1].trim()
    }
    return undefined
  }
  
  private async validateData(data: Partial<DVERDocument>): Promise<DVERDocument> {
    // Apply business rules and validation
    const validated = data as DVERDocument
    
    // Ensure required fields
    if (!validated.inspectionDate) {
      validated.inspectionDate = new Date().toISOString().split('T')[0]
    }
    
    if (!validated.inspectorName) {
      validated.inspectorName = 'Unknown Inspector'
    }
    
    if (!validated.inspectionLocation) {
      validated.inspectionLocation = 'Unknown Location'
    }
    
    // Default values
    validated.inspectionLevel = validated.inspectionLevel || 'Level_I'
    validated.overallResult = validated.overallResult || 'Pass'
    validated.equipment = validated.equipment || []
    validated.violations = validated.violations || []
    
    return validated
  }
}

// Integration with Unified Incident System
export async function createIncidentFromDVER(
  dver: DVERDocument, 
  partyId: string
): Promise<any> {
  // Convert DVER to unified incident format
  const incidentData = {
    incidentType: 'ROADSIDE_INSPECTION' as const,
    incidentDate: dver.inspectionDate,
    incidentTime: dver.inspectionTime,
    officerName: dver.inspectorName,
    agencyName: dver.agencyName,
    officerBadge: dver.inspectorBadge,
    reportNumber: dver.reportNumber,
    locationAddress: dver.facilityAddress,
    locationCity: dver.facilityCity,
    locationState: dver.facilityState,
    locationZip: dver.facilityZip,
    
    // Store RSIN-specific data in roadsideData JSON field
    roadsideData: {
      inspectionLevel: dver.inspectionLevel,
      overallResult: dver.overallResult,
      facilityName: dver.facilityName,
      facilityAddress: dver.facilityAddress,
      facilityCity: dver.facilityCity,
      facilityState: dver.facilityState,
      facilityZip: dver.facilityZip,
      driverLicense: dver.driverLicense,
      driverLicenseState: dver.driverLicenseState,
      driverDOB: dver.driverDOB,
      dverReceived: true,
      dverSource: 'OCR_Upload',
      entryMethod: 'OCR_Upload'
    },
    
    // Convert equipment
    equipment: dver.equipment.map(eq => ({
      unitNumber: eq.unitNumber,
      unitType: eq.unitType,
      make: eq.make,
      model: eq.model,
      year: eq.year,
      plateNumber: eq.plateNumber,
      plateState: eq.plateState,
      vin: eq.vin,
      cvsaSticker: eq.cvsaSticker,
      oosSticker: eq.oosSticker
    })),
    
    // Convert violations
    violations: dver.violations.map(v => ({
      violationCode: v.violationCode,
      section: v.section,
      unitNumber: v.unitNumber,
      outOfService: v.outOfService,
      description: v.description,
      inspectorComments: v.inspectorComments,
      severity: v.severity
    })),
    
    partyId,
    title: `RSIN - ${dver.inspectionLocation}`,
    description: `Roadside inspection on ${dver.inspectionDate}`
  }
  
  // Submit to unified incidents API
  const response = await fetch('/api/incidents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(incidentData)
  })
  
  return response.json()
}

export { DVERProcessor, type DVERDocument } 