import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function getUserRole(): Promise<string | null> {
  try {
    const response = await fetch("/api/user/role");
    if (response.ok) {
      const data = await response.json();
      return data.role?.roleType || null;
    }
  } catch (error) {
    console.error("Error fetching user role:", error);
  }
  return null;
}

interface User {
  id: string;
  role: string;
}

interface Organization {
  id: string;
  name: string;
}

interface NavigationItem {
  label: string;
  href: string;
  isActive: boolean;
}

// ✅ DEFINITIVE NAVIGATION FUNCTION - NEVER CHANGE THESE PATTERNS
export function buildStandardNavigation(
  masterOrgId: string,
  orgId: string,
  userRole?: string,
): NavigationItem[] {
  // Master users: Master | Organization | Drivers | Equipment (ALWAYS)
  if (userRole === "master") {
    return [
      {
        label: "Master",
        href: `/master/${masterOrgId}`,
        isActive: false,
      },
      {
        label: "Organization",
        href: `/master/${masterOrgId}/organization/${orgId}`,
        isActive: false,
      },
      {
        label: "Drivers",
        href: `/master/${masterOrgId}/organization/${orgId}/drivers`,
        isActive: false,
      },
      {
        label: "Equipment",
        href: `/master/${masterOrgId}/organization/${orgId}/equipment`,
        isActive: false,
      },
    ];
  }
  // Location users: Location | Drivers | Equipment (ALWAYS)
  else if (userRole === "location") {
    return [
      {
        label: "Location",
        href: `/organizations/${orgId}`,
        isActive: false,
      },
      {
        label: "Drivers",
        href: `/organizations/${orgId}/drivers`,
        isActive: false,
      },
      {
        label: "Equipment",
        href: `/organizations/${orgId}/equipment`,
        isActive: false,
      },
    ];
  }
  // Organization users: Organization | Drivers | Equipment (ALWAYS)
  else {
    return [
      {
        label: "Organization",
        href: `/organizations/${orgId}`,
        isActive: false,
      },
      {
        label: "Drivers",
        href: `/organizations/${orgId}/drivers`,
        isActive: false,
      },
      {
        label: "Equipment",
        href: `/organizations/${orgId}/equipment`,
        isActive: false,
      },
    ];
  }
}

// 🚫 DEPRECATED - DO NOT USE
// These functions create inconsistent navigation - use buildStandardNavigation instead
export function buildStandardDriverNavigation(
  masterOrgId: string,
  orgId: string,
  driverId: string,
  userRole?: string,
): NavigationItem[] {
  console.warn(
    "⚠️ DEPRECATED: Use buildStandardNavigation instead of buildStandardDriverNavigation",
  );
  return buildStandardNavigation(masterOrgId, orgId, userRole);
}

export function buildStandardEquipmentNavigation(
  masterOrgId: string,
  orgId: string,
  equipmentId: string,
  userRole?: string,
): NavigationItem[] {
  console.warn(
    "⚠️ DEPRECATED: Use buildStandardNavigation instead of buildStandardEquipmentNavigation",
  );
  return buildStandardNavigation(masterOrgId, orgId, userRole);
}
