import * as Sentry from "@sentry/nextjs";

interface FleetraxErrorContext {
  feature: string;
  userId?: string;
  organizationId?: string;
  driverId?: string;
  equipmentId?: string;
  extra?: Record<string, any>;
}

interface ComplianceErrorContext extends FleetraxErrorContext {
  complianceType: "driver" | "equipment" | "organization";
  issueType?: string;
  expirationDate?: string;
  status?: string;
}

/**
 * Capture equipment-related errors with proper context
 */
export function captureEquipmentError(
  error: Error | string,
  context: {
    equipmentId: string;
    organizationId: string;
    userId?: string;
    action?: string;
    vinNumber?: string;
    equipmentType?: string;
    extra?: Record<string, any>;
  },
) {
  Sentry.captureException(error, {
    tags: {
      feature: "equipment",
      category: "equipment-management",
      action: context.action || "unknown",
    },
    user: context.userId ? { id: context.userId } : undefined,
    extra: {
      equipmentId: context.equipmentId,
      organizationId: context.organizationId,
      vinNumber: context.vinNumber,
      equipmentType: context.equipmentType,
      ...context.extra,
    },
  });
}

/**
 * Capture driver-related errors with proper context
 */
export function captureDriverError(
  error: Error | string,
  context: {
    driverId: string;
    organizationId: string;
    userId?: string;
    action?: string;
    issueType?: string;
    extra?: Record<string, any>;
  },
) {
  Sentry.captureException(error, {
    tags: {
      feature: "driver",
      category: "driver-management",
      action: context.action || "unknown",
      issueType: context.issueType || "unknown",
    },
    user: context.userId ? { id: context.userId } : undefined,
    extra: {
      driverId: context.driverId,
      organizationId: context.organizationId,
      ...context.extra,
    },
  });
}

/**
 * Capture compliance-specific errors
 */
export function captureComplianceError(error: Error | string, context: ComplianceErrorContext) {
  Sentry.captureException(error, {
    tags: {
      feature: context.feature,
      category: "compliance",
      complianceType: context.complianceType,
      issueType: context.issueType || "unknown",
    },
    user: context.userId ? { id: context.userId } : undefined,
    extra: {
      organizationId: context.organizationId,
      driverId: context.driverId,
      equipmentId: context.equipmentId,
      expirationDate: context.expirationDate,
      status: context.status,
      ...context.extra,
    },
  });
}

/**
 * Capture API-related errors with request context
 */
export function captureAPIError(
  error: Error | string,
  context: {
    endpoint: string;
    method: string;
    statusCode?: number;
    userId?: string;
    organizationId?: string;
    requestData?: any;
    extra?: Record<string, any>;
  },
) {
  Sentry.captureException(error, {
    tags: {
      feature: "api",
      category: "api-error",
      endpoint: context.endpoint,
      method: context.method,
    },
    user: context.userId ? { id: context.userId } : undefined,
    extra: {
      endpoint: context.endpoint,
      method: context.method,
      statusCode: context.statusCode,
      organizationId: context.organizationId,
      requestData: context.requestData,
      ...context.extra,
    },
  });
}

/**
 * Capture integration errors (NHTSA, FMCSA, etc.)
 */
export function captureIntegrationError(
  error: Error | string,
  context: {
    integration: "nhtsa-vpic" | "fmcsa" | "tazworks" | "gomotive" | "aws-textract";
    action: string;
    organizationId?: string;
    userId?: string;
    extra?: Record<string, any>;
  },
) {
  Sentry.captureException(error, {
    tags: {
      feature: "integration",
      category: "external-api",
      integration: context.integration,
      action: context.action,
    },
    user: context.userId ? { id: context.userId } : undefined,
    extra: {
      integration: context.integration,
      action: context.action,
      organizationId: context.organizationId,
      ...context.extra,
    },
  });
}

/**
 * Track performance for critical operations
 */
export async function trackPerformance<T>(
  operation: string,
  fn: () => Promise<T>,
  context?: {
    organizationId?: string;
    userId?: string;
    extra?: Record<string, any>;
  },
): Promise<T> {
  return Sentry.withScope(async (scope) => {
    scope.setTag("operation", operation);
    scope.setTag("category", "performance");

    if (context?.userId) {
      scope.setUser({ id: context.userId });
    }

    if (context?.organizationId) {
      scope.setTag("organizationId", context.organizationId);
    }

    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setTag(key, String(value));
      });
    }

    const start = Date.now();

    try {
      const result = await fn();
      const duration = Date.now() - start;

      // Add performance breadcrumb
      Sentry.addBreadcrumb({
        message: `${operation} completed`,
        level: "info",
        data: { duration: `${duration}ms` },
      });

      return result;
    } catch (error) {
      const duration = Date.now() - start;

      Sentry.addBreadcrumb({
        message: `${operation} failed`,
        level: "error",
        data: { duration: `${duration}ms` },
      });

      throw error;
    }
  });
}

/**
 * Add user context for better error tracking
 */
export function setUserContext(user: {
  id: string;
  email?: string;
  organizationId?: string;
  role?: string;
}) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    organizationId: user.organizationId,
    role: user.role,
  });
}

/**
 * Add breadcrumb for debugging user actions
 */
export function addBreadcrumb(
  message: string,
  data?: Record<string, any>,
  level: "info" | "warning" | "error" = "info",
) {
  Sentry.addBreadcrumb({
    message,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}
