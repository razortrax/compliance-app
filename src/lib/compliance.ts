// Compliance checking logic for driver requirements

import { ComplianceRule, ComplianceCheck, DriverComplianceStatus } from "@/types/compliance";

// Predefined compliance rules
export const COMPLIANCE_RULES: ComplianceRule[] = [
  {
    id: "hazmat_annual_training",
    name: "HazMat Annual Training",
    description: "Drivers with HazMat endorsement must complete annual training",
    triggerType: "license_endorsement",
    triggerValue: "H", // HazMat endorsement code
    requirementType: "training",
    requirementDetails: {
      trainingType: "HazMat Annual",
      frequency: "annual",
      gracePeriod: 30, // 30 days after expiration
      renewalWindow: 60, // Show renewal alerts 60 days before expiration
    },
  },
  {
    id: "passenger_training",
    name: "Passenger Vehicle Training",
    description: "Drivers with Passenger endorsement should have passenger safety training",
    triggerType: "license_endorsement",
    triggerValue: "P", // Passenger endorsement code
    requirementType: "training",
    requirementDetails: {
      trainingType: "Passenger Safety",
      frequency: "biannual",
      gracePeriod: 60,
      renewalWindow: 90,
    },
  },
  {
    id: "school_bus_training",
    name: "School Bus Training",
    description: "Drivers with School Bus endorsement must have current training",
    triggerType: "license_endorsement",
    triggerValue: "S", // School Bus endorsement code
    requirementType: "training",
    requirementDetails: {
      trainingType: "School Bus Safety",
      frequency: "annual",
      gracePeriod: 0, // No grace period for school bus
      renewalWindow: 90,
    },
  },
];

export async function checkDriverCompliance(
  driverId: string,
  licenses: any[],
  trainings: any[],
): Promise<DriverComplianceStatus> {
  const checks: ComplianceCheck[] = [];

  // Get active licenses for this driver
  const activeLicenses = licenses.filter(
    (license) =>
      license.issue?.status === "active" && new Date(license.expirationDate) > new Date(),
  );

  // Check each compliance rule
  for (const rule of COMPLIANCE_RULES) {
    if (rule.triggerType === "license_endorsement") {
      // Check if driver has licenses with this endorsement
      const licensesWithEndorsement = activeLicenses.filter((license) => {
        const endorsements = Array.isArray(license.endorsements) ? license.endorsements : [];
        return endorsements.some((endorsement: any) => endorsement.code === rule.triggerValue);
      });

      if (licensesWithEndorsement.length > 0) {
        // Driver has the endorsement, check if they have required training
        const requiredTrainingType = rule.requirementDetails.trainingType;
        const relevantTrainings = trainings.filter(
          (training) =>
            training.trainingType === requiredTrainingType && training.issue?.status === "active",
        );

        let complianceCheck: ComplianceCheck;

        if (relevantTrainings.length === 0) {
          // No training found
          complianceCheck = {
            driverId,
            ruleId: rule.id,
            ruleName: rule.name,
            status: "missing",
            trigger: {
              type: "license_endorsement",
              source: licensesWithEndorsement[0].id,
              details: { endorsementCode: rule.triggerValue },
            },
            requirement: {
              type: requiredTrainingType || "training",
            },
            actionRequired: `Complete ${requiredTrainingType} training`,
          };
        } else {
          // Find most recent training
          const latestTraining = relevantTrainings.sort(
            (a, b) => new Date(b.completionDate).getTime() - new Date(a.completionDate).getTime(),
          )[0];

          const expirationDate = new Date(latestTraining.expirationDate);
          const today = new Date();
          const daysUntilExpiration = Math.ceil(
            (expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
          );

          let status: ComplianceCheck["status"];
          let actionRequired: string | undefined;

          if (daysUntilExpiration < 0) {
            // Training is expired (expiration date < today)
            const daysExpired = Math.abs(daysUntilExpiration);
            const gracePeriod = rule.requirementDetails.gracePeriod || 0;

            if (daysExpired > gracePeriod) {
              // Expired beyond grace period - critical
              status = "expired";
              actionRequired = `URGENT: Renew ${requiredTrainingType} training (expired ${daysExpired} days ago, beyond ${gracePeriod}-day grace period)`;
            } else {
              // Expired but within grace period - still concerning
              status = "expiring_soon";
              actionRequired = `Renew ${requiredTrainingType} training (expired ${daysExpired} days ago, grace period ends in ${gracePeriod - daysExpired} days)`;
            }
          } else if (daysUntilExpiration <= (rule.requirementDetails.renewalWindow || 60)) {
            // Still valid but expiring soon
            status = "expiring_soon";
            actionRequired = `Schedule ${requiredTrainingType} training renewal (expires in ${daysUntilExpiration} days)`;
          } else {
            // Valid and not expiring soon
            status = "compliant";
          }

          complianceCheck = {
            driverId,
            ruleId: rule.id,
            ruleName: rule.name,
            status,
            trigger: {
              type: "license_endorsement",
              source: licensesWithEndorsement[0].id,
              details: { endorsementCode: rule.triggerValue },
            },
            requirement: {
              type: requiredTrainingType || "training",
              lastCompleted: new Date(latestTraining.completionDate),
              expirationDate,
              daysUntilExpiration,
            },
            actionRequired,
          };
        }

        checks.push(complianceCheck);
      }
    }
  }

  // Calculate summary
  const summary = {
    compliant: checks.filter((c) => c.status === "compliant").length,
    warnings: checks.filter((c) => c.status === "expiring_soon").length,
    critical: checks.filter((c) => c.status === "expired").length,
    missing: checks.filter((c) => c.status === "missing").length,
  };

  // Determine overall status
  let overallStatus: DriverComplianceStatus["overallStatus"];
  if (summary.critical > 0 || summary.missing > 0) {
    overallStatus = "critical";
  } else if (summary.warnings > 0) {
    overallStatus = "warnings";
  } else {
    overallStatus = "compliant";
  }

  return {
    driverId,
    overallStatus,
    checks,
    summary,
  };
}

export function getComplianceStatusColor(status: ComplianceCheck["status"]): string {
  switch (status) {
    case "compliant":
      return "text-green-600 bg-green-100";
    case "expiring_soon":
      return "text-yellow-600 bg-yellow-100";
    case "expired":
      return "text-red-600 bg-red-100";
    case "missing":
      return "text-red-600 bg-red-100";
    default:
      return "text-gray-600 bg-gray-100";
  }
}

export function getComplianceActionPriority(status: ComplianceCheck["status"]): number {
  switch (status) {
    case "expired":
      return 1; // Highest priority
    case "missing":
      return 2;
    case "expiring_soon":
      return 3;
    case "compliant":
      return 4; // Lowest priority
    default:
      return 5;
  }
}
