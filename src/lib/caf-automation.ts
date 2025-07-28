import { db } from '@/db'
import { createId } from '@paralleldrive/cuid2'
import { CafPriority, CafCategory, ViolationType } from '@prisma/client'

// CAF assignment logic based on violation type
const getCAFCategoryFromViolationType = (violationType: ViolationType | null, violationCode: string): CafCategory => {
  if (!violationType) {
    // Try to determine from violation code
    if (violationCode.startsWith('390')) return CafCategory.COMPANY_OPERATIONS
    if (violationCode.startsWith('391')) return CafCategory.DRIVER_QUALIFICATION
    if (violationCode.startsWith('392')) return CafCategory.DRIVER_PERFORMANCE
    if (violationCode.startsWith('393') || violationCode.startsWith('396')) return CafCategory.EQUIPMENT_MAINTENANCE
    return CafCategory.OTHER
  }

  switch (violationType) {
    case ViolationType.Driver_Performance:
      return CafCategory.DRIVER_PERFORMANCE
    case ViolationType.Equipment:
      return CafCategory.EQUIPMENT_MAINTENANCE
    case ViolationType.Company:
      return CafCategory.COMPANY_OPERATIONS
    default:
      return CafCategory.OTHER
  }
}

// Determine CAF priority based on violation severity and out-of-service status
const getCAFPriority = (outOfService: boolean, violationCode: string): CafPriority => {
  if (outOfService) return CafPriority.CRITICAL
  
  // Critical violations (examples - can be expanded based on your specific rules)
  const criticalCodes = ['392.2', '392.3', '392.4', '392.5', '393.5', '393.9']
  if (criticalCodes.some(code => violationCode.includes(code))) {
    return CafPriority.HIGH
  }
  
  return CafPriority.MEDIUM
}

// Generate CAF title based on violation
const generateCAFTitle = (violationType: ViolationType | null, violationCode: string, description: string): string => {
  const categoryName = violationType === ViolationType.Driver_Performance ? 'Driver Performance' :
                      violationType === ViolationType.Equipment ? 'Equipment Maintenance' :
                      violationType === ViolationType.Company ? 'Company Operations' : 'Safety'
  
  return `${categoryName} - ${violationCode}: ${description.substring(0, 50)}${description.length > 50 ? '...' : ''}`
}

// Generate CAF description with detailed corrective action requirements
const generateCAFDescription = (violation: any): string => {
  let description = `Corrective Action Required for Violation: ${violation.violationCode}\n\n`
  description += `Violation Description: ${violation.description}\n\n`
  
  if (violation.inspectorComments) {
    description += `Inspector Comments: ${violation.inspectorComments}\n\n`
  }
  
  if (violation.outOfService) {
    description += `⚠️ OUT OF SERVICE: This violation resulted in an out-of-service order.\n`
    if (violation.outOfServiceDate) {
      description += `Out of Service Date: ${new Date(violation.outOfServiceDate).toLocaleDateString()}\n`
    }
    description += `Equipment/Driver must be returned to service before resuming operations.\n\n`
  }
  
  // Add specific corrective action guidance based on violation type
  switch (violation.violationType) {
    case ViolationType.Driver_Performance:
      description += `Required Actions:\n`
      description += `1. Immediate driver coaching/retraining on the specific violation\n`
      description += `2. Document training provided and driver acknowledgment\n`
      description += `3. Implement monitoring plan for similar violations\n`
      description += `4. Consider progressive discipline if repeat violation\n`
      break
      
    case ViolationType.Equipment:
      description += `Required Actions:\n`
      description += `1. Inspect and repair/replace defective equipment\n`
      description += `2. Document repairs with receipts and inspection records\n`
      description += `3. Return equipment to service only after verification\n`
      description += `4. Review maintenance schedule to prevent recurrence\n`
      break
      
    case ViolationType.Company:
      description += `Required Actions:\n`
      description += `1. Review and update relevant company policies/procedures\n`
      description += `2. Ensure all affected staff are trained on corrections\n`
      description += `3. Implement systemic controls to prevent recurrence\n`
      description += `4. Document policy changes and training completion\n`
      break
      
    default:
      description += `Required Actions:\n`
      description += `1. Investigate root cause of violation\n`
      description += `2. Implement appropriate corrective measures\n`
      description += `3. Document all actions taken\n`
      description += `4. Monitor for effectiveness\n`
  }
  
  description += `\nDue Date: Must be completed within regulatory timeframes.\n`
  description += `Documentation: All corrective actions must be documented with supporting evidence.`
  
  return description
}

// Find appropriate staff to assign CAF based on violation type and organization structure
const findAssignedStaff = async (organizationId: string, violationType: ViolationType | null): Promise<string | null> => {
  const staffCriteria: any = {
    party: {
      role: {
        some: {
          organizationId: organizationId,
          isActive: true
        }
      }
    },
    isActive: true
  }

  // Try to find staff based on position/department that matches violation type
  if (violationType === ViolationType.Driver_Performance || violationType === ViolationType.Driver_Qualification) {
    // Look for safety manager, operations manager, or driver supervisor
    const safetyStaff = await db.staff.findFirst({
      where: {
        ...staffCriteria,
        OR: [
          { position: { contains: 'safety', mode: 'insensitive' } },
          { position: { contains: 'operations', mode: 'insensitive' } },
          { department: { contains: 'safety', mode: 'insensitive' } },
          { department: { contains: 'operations', mode: 'insensitive' } }
        ]
      }
    })
    if (safetyStaff) return safetyStaff.id
  }

  if (violationType === ViolationType.Equipment) {
    // Look for maintenance manager or fleet manager
    const maintenanceStaff = await db.staff.findFirst({
      where: {
        ...staffCriteria,
        OR: [
          { position: { contains: 'maintenance', mode: 'insensitive' } },
          { position: { contains: 'fleet', mode: 'insensitive' } },
          { department: { contains: 'maintenance', mode: 'insensitive' } },
          { department: { contains: 'fleet', mode: 'insensitive' } }
        ]
      }
    })
    if (maintenanceStaff) return maintenanceStaff.id
  }

  if (violationType === ViolationType.Company) {
    // Look for compliance officer, general manager, or operations manager
    const complianceStaff = await db.staff.findFirst({
      where: {
        ...staffCriteria,
        OR: [
          { position: { contains: 'compliance', mode: 'insensitive' } },
          { position: { contains: 'manager', mode: 'insensitive' } },
          { position: { contains: 'director', mode: 'insensitive' } },
          { department: { contains: 'compliance', mode: 'insensitive' } }
        ]
      }
    })
    if (complianceStaff) return complianceStaff.id
  }

  // Fallback: find any staff member who can approve CAFs (managers/supervisors)
  const approverStaff = await db.staff.findFirst({
    where: {
      ...staffCriteria,
      canApproveCAFs: true
    }
  })
  if (approverStaff) return approverStaff.id

  // Last resort: find any active staff member
  const anyStaff = await db.staff.findFirst({
    where: staffCriteria
  })
  
  return anyStaff?.id || null
}

// Generate CAF number in format CAF-YYYY-NNNN
const generateCAFNumber = async (): Promise<string> => {
  const year = new Date().getFullYear()
  const prefix = `CAF-${year}-`
  
  const lastCAF = await db.corrective_action_form.findFirst({
    where: {
      cafNumber: {
        startsWith: prefix
      }
    },
    orderBy: {
      cafNumber: 'desc'
    }
  })
  
  let nextNumber = 1
  if (lastCAF) {
    const lastNumber = parseInt(lastCAF.cafNumber.substring(prefix.length))
    nextNumber = lastNumber + 1
  }
  
  return `${prefix}${nextNumber.toString().padStart(4, '0')}`
}

// Main function to auto-generate CAFs from RINS violations
export const generateCAFsFromRINSViolations = async (rinsId: string, createdByStaffId: string): Promise<any[]> => {
  try {
    // Get all violations from the RINS that don't already have CAFs
    const violations = await db.rins_violation.findMany({
      where: {
        rinsId: rinsId,
        corrective_action_forms: {
          none: {} // Only violations without existing CAFs
        }
      },
      include: {
        roadside_inspection: {
          include: {
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
        }
      }
    })

    if (violations.length === 0) {
      return []
    }

    // Get organization ID from the first violation (they should all be the same RINS)
    const organizationId = violations[0].roadside_inspection.issue.party.role[0]?.organizationId
    if (!organizationId) {
      throw new Error('Could not determine organization ID from RINS violations')
    }

    const createdCAFs = []

    // Generate CAF for each violation
    for (const violation of violations) {
      const assignedStaffId = await findAssignedStaff(organizationId, violation.violationType)
      
      if (!assignedStaffId) {
        console.warn(`Could not find appropriate staff to assign CAF for violation ${violation.id}`)
        continue
      }

      const cafNumber = await generateCAFNumber()
      const title = generateCAFTitle(violation.violationType, violation.violationCode, violation.description)
      const description = generateCAFDescription(violation)
      const priority = getCAFPriority(violation.outOfService, violation.violationCode)
      const category = getCAFCategoryFromViolationType(violation.violationType, violation.violationCode)
      
      // Calculate due date (30 days for most violations, 15 days for critical/OOS)
      const daysToComplete = priority === CafPriority.CRITICAL ? 15 : 30
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + daysToComplete)

      const caf = await db.corrective_action_form.create({
        data: {
          id: createId(),
          cafNumber,
          rinsViolationId: violation.id,
          title,
          description,
          priority,
          category,
          assignedStaffId,
          assignedBy: createdByStaffId,
          organizationId,
          dueDate,
          requiresApproval: true
        },
        include: {
          assigned_staff: {
            include: {
              party: {
                include: {
                  person: true
                }
              }
            }
          },
          rins_violation: true
        }
      })

      createdCAFs.push(caf)
    }

    return createdCAFs
  } catch (error) {
    console.error('Error generating CAFs from RINS violations:', error)
    throw error
  }
}

// Helper function to generate a single CAF from a violation (for manual creation)
export const generateCAFFromViolation = async (
  violationId: string, 
  createdByStaffId: string,
  customAssignedStaffId?: string
): Promise<any> => {
  const violation = await db.rins_violation.findUnique({
    where: { id: violationId },
    include: {
      roadside_inspection: {
        include: {
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
      }
    }
  })

  if (!violation) {
    throw new Error('Violation not found')
  }

  const organizationId = violation.roadside_inspection.issue.party.role[0]?.organizationId
  if (!organizationId) {
    throw new Error('Could not determine organization ID from violation')
  }

  const assignedStaffId = customAssignedStaffId || await findAssignedStaff(organizationId, violation.violationType)
  
  if (!assignedStaffId) {
    throw new Error('Could not find appropriate staff to assign CAF')
  }

  const cafNumber = await generateCAFNumber()
  const title = generateCAFTitle(violation.violationType, violation.violationCode, violation.description)
  const description = generateCAFDescription(violation)
  const priority = getCAFPriority(violation.outOfService, violation.violationCode)
  const category = getCAFCategoryFromViolationType(violation.violationType, violation.violationCode)
  
  const daysToComplete = priority === CafPriority.CRITICAL ? 15 : 30
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + daysToComplete)

  return await db.corrective_action_form.create({
    data: {
      id: createId(),
      cafNumber,
      rinsViolationId: violation.id,
      title,
      description,
      priority,
      category,
      assignedStaffId,
      assignedBy: createdByStaffId,
      organizationId,
      dueDate,
      requiresApproval: true
    },
    include: {
      assigned_staff: {
        include: {
          party: {
            include: {
              person: true
            }
          }
        }
      },
      rins_violation: true
    }
  })
} 