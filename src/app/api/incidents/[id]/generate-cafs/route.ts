import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { createId } from "@paralleldrive/cuid2";

interface CAFRule {
  violationType: string;
  category: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  requiresApproval: boolean;
  dueDays: number;
}

// CAF generation rules based on violation codes
const CAF_RULES: Record<string, CAFRule> = {
  // Driver violations
  "392.2A": {
    violationType: "DRIVER",
    category: "DRIVER_PERFORMANCE",
    priority: "HIGH",
    requiresApproval: true,
    dueDays: 3,
  },
  "391.": {
    violationType: "DRIVER",
    category: "DRIVER_QUALIFICATION",
    priority: "HIGH",
    requiresApproval: true,
    dueDays: 3,
  },
  // Equipment violations
  "393.": {
    violationType: "EQUIPMENT",
    category: "EQUIPMENT_MAINTENANCE",
    priority: "MEDIUM",
    requiresApproval: true,
    dueDays: 7,
  },
  "396.": {
    violationType: "EQUIPMENT",
    category: "EQUIPMENT_MAINTENANCE",
    priority: "HIGH",
    requiresApproval: true,
    dueDays: 3,
  },
  // Company violations
  "390.": {
    violationType: "COMPANY",
    category: "COMPANY_OPERATIONS",
    priority: "MEDIUM",
    requiresApproval: true,
    dueDays: 7,
  },
};

function getCAFRuleForViolation(violationCode: string): CAFRule {
  // Find matching rule by checking if violation code starts with any rule key
  for (const [ruleKey, rule] of Object.entries(CAF_RULES)) {
    if (violationCode.startsWith(ruleKey)) {
      return rule;
    }
  }

  // Default rule for unknown violations
  return {
    violationType: "COMPANY",
    category: "OTHER",
    priority: "MEDIUM",
    requiresApproval: true,
    dueDays: 7,
  };
}

async function generateCAFNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await db.corrective_action_form.count({
    where: {
      cafNumber: {
        startsWith: `CAF-${year}-`,
      },
    },
  });

  return `CAF-${year}-${String(count + 1).padStart(4, "0")}`;
}

async function findResponsibleStaff(
  organizationId: string,
  violationType: string,
): Promise<string | null> {
  // Find staff that can approve CAFs for this organization
  // This is a simplified assignment - in real implementation you'd have more sophisticated logic
  const staff = await db.staff.findFirst({
    where: {
      party: {
        organization: {
          id: organizationId,
        },
      },
      isActive: true,
      canApproveCAFs: true,
    },
  });

  return staff?.id || null;
}

function generateCorrectiveActions(violation: any, incidentType: string): string {
  const templates = {
    DRIVER: `1. Review violation with driver\n2. Provide additional training on ${violation.violationCode}\n3. Document corrective action taken\n4. Monitor driver compliance`,
    EQUIPMENT: `1. Inspect equipment for compliance\n2. Repair or replace deficient components\n3. Verify compliance with regulations\n4. Update maintenance records`,
    COMPANY: `1. Review company policies and procedures\n2. Update procedures as necessary\n3. Train staff on policy changes\n4. Monitor implementation`,
  };

  const rule = getCAFRuleForViolation(violation.violationCode);
  return templates[rule.violationType as keyof typeof templates] || templates.COMPANY;
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the incident with violations
    const incident = await db.incident.findUnique({
      where: { id: params.id },
      include: {
        violations: {
          where: {
            // Only generate CAFs for violations that don't already have them
            corrective_action_forms: {
              none: {},
            },
          },
        },
        issue: {
          include: {
            party: {
              include: {
                organization: true,
              },
            },
          },
        },
      },
    });

    if (!incident) {
      return Response.json({ error: "Incident not found" }, { status: 404 });
    }

    // Check access permissions
    const party = incident.issue.party;
    if (party.userId !== userId) {
      // Check if user has role access to this organization
      const hasAccess = await db.role.findFirst({
        where: {
          party: { userId },
          organizationId: party.organization?.id,
          isActive: true,
        },
      });

      if (!hasAccess) {
        return Response.json({ error: "Access denied" }, { status: 403 });
      }
    }

    const generatedCAFs = [];

    // Generate CAFs for each violation
    for (const violation of incident.violations) {
      const rule = getCAFRuleForViolation(violation.violationCode);

      // Determine priority based on out of service status
      const priority = violation.outOfService ? "CRITICAL" : rule.priority;

      // Generate CAF title and description
      const title = `${rule.violationType} Issue - ${violation.violationCode}`;
      const description = `Corrective action required for violation: ${violation.description}`;

      // Generate corrective actions
      const correctiveActions = generateCorrectiveActions(violation, incident.incidentType);

      // Find responsible staff
      const assignedStaffId = await findResponsibleStaff(
        party.organization?.id || "",
        rule.violationType,
      );

      if (assignedStaffId) {
        // Calculate due date
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + rule.dueDays);

        const caf = await db.corrective_action_form.create({
          data: {
            cafNumber: await generateCAFNumber(),
            incidentViolationId: violation.id,
            title,
            description,
            correctiveActions,
            priority,
            category: rule.category as any,
            assignedStaffId,
            assignedBy: assignedStaffId, // In real implementation, this would be the current user's staff record
            organizationId: party.organization?.id || "",
            dueDate,
            requiresApproval: rule.requiresApproval,
            status: "ASSIGNED",
          },
        });

        generatedCAFs.push(caf);
      }
    }

    return Response.json({
      message: `Generated ${generatedCAFs.length} CAFs for ${incident.incidentType.toLowerCase()}`,
      cafs: generatedCAFs,
      incident: {
        id: incident.id,
        type: incident.incidentType,
        date: incident.incidentDate,
      },
    });
  } catch (error) {
    console.error("Error generating CAFs:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
