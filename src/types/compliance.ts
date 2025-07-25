// Compliance checking types for linking license endorsements to training requirements

export interface ComplianceRule {
  id: string
  name: string
  description: string
  triggerType: 'license_endorsement' | 'certification' | 'role'
  triggerValue: string // e.g., 'H' for hazmat endorsement
  requirementType: 'training' | 'medical' | 'testing'
  requirementDetails: {
    trainingType?: string
    frequency: 'annual' | 'biannual' | 'triennial' | 'one_time'
    gracePeriod?: number // days after expiration before non-compliant
    renewalWindow?: number // days before expiration to show renewal alerts
  }
}

export interface ComplianceCheck {
  driverId: string
  ruleId: string
  ruleName: string
  status: 'compliant' | 'expiring_soon' | 'expired' | 'missing'
  trigger: {
    type: string
    source: string // license ID, role ID, etc.
    details: any
  }
  requirement: {
    type: string
    lastCompleted?: Date
    expirationDate?: Date
    daysUntilExpiration?: number
  }
  actionRequired?: string
}

export interface DriverComplianceStatus {
  driverId: string
  overallStatus: 'compliant' | 'warnings' | 'critical'
  checks: ComplianceCheck[]
  summary: {
    compliant: number
    warnings: number
    critical: number
    missing: number
  }
} 