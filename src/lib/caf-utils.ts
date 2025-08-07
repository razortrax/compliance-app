// CAF Generation and Management Utilities

export interface ViolationGroup {
  type: 'Driver' | 'Equipment' | 'Company'
  violations: any[]
  title: string
  icon: string
  color: string
  description: string
}

export interface CAFGenerationRequest {
  incidentId: string
  violationType: 'Driver' | 'Equipment' | 'Company'
  violationCodes: string[]
  organizationId: string
  assignedStaffId?: string
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  dueDate?: Date
}

/**
 * Groups violations by type for CAF generation
 */
export function groupViolationsByType(violations: any[]): ViolationGroup[] {
  const groups: ViolationGroup[] = []
  
  // Driver violations (both qualification and performance)
  const driverViolations = violations.filter(v => 
    v.violationType === 'Driver_Qualification' || v.violationType === 'Driver_Performance'
  )
  if (driverViolations.length > 0) {
    groups.push({
      type: 'Driver',
      violations: driverViolations,
      title: 'Driver Violations',
      icon: 'Users',
      color: 'blue',
      description: `${driverViolations.length} driver-related violation${driverViolations.length > 1 ? 's' : ''} requiring corrective action`
    })
  }

  // Equipment violations 
  const equipmentViolations = violations.filter(v => v.violationType === 'Equipment')
  if (equipmentViolations.length > 0) {
    groups.push({
      type: 'Equipment',
      violations: equipmentViolations,
      title: 'Equipment Violations',
      icon: 'Truck',
      color: 'orange',
      description: `${equipmentViolations.length} equipment-related violation${equipmentViolations.length > 1 ? 's' : ''} requiring maintenance or repair`
    })
  }

  // Company violations
  const companyViolations = violations.filter(v => v.violationType === 'Company')
  if (companyViolations.length > 0) {
    groups.push({
      type: 'Company',
      violations: companyViolations,
      title: 'Company Operations',
      icon: 'Building2',
      color: 'purple',
      description: `${companyViolations.length} company operations violation${companyViolations.length > 1 ? 's' : ''} requiring policy or process changes`
    })
  }

  return groups
}

/**
 * Determines CAF priority based on violation severity and codes
 */
export function calculateCAFPriority(violations: any[]): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  // Critical if any OOS violations
  if (violations.some(v => v.outOfService)) {
    return 'CRITICAL'
  }

  // High priority for specific serious violations
  const highPriorityCodes = ['392.2', '392.4', '393.47', '396.3', '391.11']
  if (violations.some(v => highPriorityCodes.some(code => v.violationCode.startsWith(code)))) {
    return 'HIGH'
  }

  // Medium for multiple violations
  if (violations.length > 2) {
    return 'MEDIUM'
  }

  return 'LOW'
}

/**
 * Generates due date based on violation priority
 */
export function calculateCAFDueDate(priority: string): Date {
  const now = new Date()
  switch (priority) {
    case 'CRITICAL':
      now.setDate(now.getDate() + 1) // 1 day
      break
    case 'HIGH':
      now.setDate(now.getDate() + 3) // 3 days
      break
    case 'MEDIUM':
      now.setDate(now.getDate() + 7) // 1 week
      break
    default:
      now.setDate(now.getDate() + 14) // 2 weeks
  }
  return now
}

/**
 * Finds appropriate staff for CAF assignment based on violation type
 */
export async function findAssignableStaff(
  organizationId: string, 
  violationType: 'Driver' | 'Equipment' | 'Company'
): Promise<any[]> {
  const response = await fetch(`/api/staff?organizationId=${organizationId}&cafAssignment=${violationType}`)
  if (!response.ok) {
    throw new Error('Failed to fetch assignable staff')
  }
  return await response.json()
}

/**
 * Generates CAF title based on violation group
 */
export function generateCAFTitle(violationType: 'Driver' | 'Equipment' | 'Company', violations: any[]): string {
  const codes = violations.map(v => v.violationCode).join(', ')
  switch (violationType) {
    case 'Driver':
      return `Driver Corrective Action - ${codes}`
    case 'Equipment':
      return `Equipment Maintenance - ${codes}`
    case 'Company':
      return `Company Operations - ${codes}`
    default:
      return `Corrective Action - ${codes}`
  }
}

/**
 * Generates CAF description with violation details
 */
export function generateCAFDescription(violations: any[]): string {
  const descriptions = violations.map(v => `${v.violationCode}: ${v.description}`).join('\n\n')
  return `Corrective action required for the following violations:\n\n${descriptions}`
}

/**
 * Creates CAF via API
 */
export async function createCAF(request: CAFGenerationRequest): Promise<any> {
  const priority = calculateCAFPriority(request.violationCodes.map(code => ({ violationCode: code })))
  const dueDate = request.dueDate || calculateCAFDueDate(priority)
  
  const response = await fetch('/api/corrective-action-forms', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ...request,
      priority,
      dueDate: dueDate.toISOString(),
      title: generateCAFTitle(request.violationType, request.violationCodes.map(code => ({ violationCode: code }))),
      description: generateCAFDescription(request.violationCodes.map(code => ({ violationCode: code })))
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to create CAF')
  }

  return await response.json()
} 

// Check user type and permissions for CAF operations
export async function getUserCAFPermissions(userId: string) {
  try {
    const response = await fetch('/api/user/caf-permissions')
    if (!response.ok) {
      throw new Error('Failed to fetch user permissions')
    }
    
    const permissions = await response.json()
    return permissions
  } catch (error) {
    console.error('Error fetching user CAF permissions:', error)
    return {
      canCreateCAFs: false,
      userType: 'none',
      canAssignCrossOrg: false
    }
  }
} 

// Check if RINS is complete based on CAF status
export async function checkRINSCompletion(incidentId: string) {
  try {
    const response = await fetch(`/api/corrective-action-forms?incidentId=${incidentId}`)
    if (!response.ok) return false

    const cafs = await response.json()
    
    // RINS is complete when ALL CAFs are:
    // 1. APPROVED status
    // 2. Have completion signatures 
    // 3. Have approval signatures (if required)
    
    if (cafs.length === 0) return false

    const allComplete = cafs.every((caf: any) => {
      // Must be approved
      if (caf.status !== 'APPROVED') return false
      
      // Must have completion signature
      const hasCompletionSignature = caf.signatures?.some((sig: any) => 
        sig.signatureType === 'COMPLETION'
      )
      
      // For approval, either have approval signature OR be auto-approved by master
      const hasApprovalOrAutoApproved = 
        caf.signatures?.some((sig: any) => sig.signatureType === 'APPROVAL') ||
        caf.approvedAt // Auto-approved by master user
      
      return hasCompletionSignature && hasApprovalOrAutoApproved
    })

    return allComplete
  } catch (error) {
    console.error('Error checking RINS completion:', error)
    return false
  }
}

// Update RINS completion status
export async function updateRINSCompletionStatus(incidentId: string) {
  try {
    const isComplete = await checkRINSCompletion(incidentId)
    
    const response = await fetch(`/api/incidents/${incidentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: isComplete ? 'RESOLVED' : 'PENDING',
        completedAt: isComplete ? new Date().toISOString() : null
      })
    })

    if (!response.ok) {
      console.error('Failed to update RINS status')
      return false
    }

    return isComplete
  } catch (error) {
    console.error('Error updating RINS completion status:', error)
    return false
  }
} 