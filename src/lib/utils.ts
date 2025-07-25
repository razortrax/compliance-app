import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface User {
  id: string
  role?: string
}

interface Organization {
  id: string
  name: string
}

interface Location {
  id: string
  name: string
}

export function buildStandardDriverNavigation(
  user: User,
  masterOrg?: Organization | any | null,
  organization?: Organization | any | null,
  location?: Location | any | null,
  currentSection?: 'drivers' | 'equipment'
) {
  const topNav = []

  // Add user type based navigation
  if (masterOrg) {
    // Master users see: Master | Organization | Drivers | Equipment
    topNav.push({ 
      label: 'Master', 
      href: '/dashboard', 
      isActive: false 
    })
    if (organization?.id) {
      topNav.push({ 
        label: 'Organization', 
        href: `/organizations/${organization.id}`, 
        isActive: false 
      })
    }
  } else if (organization && !location) {
    // Org users see: Organization | Drivers | Equipment
    topNav.push({ 
      label: 'Organization', 
      href: `/organizations/${organization.id}`, 
      isActive: false 
    })
  } else if (location) {
    // Location users see: Location | Drivers | Equipment
    topNav.push({ 
      label: 'Location', 
      href: `/organizations/${organization?.id}/locations/${location.id}`, 
      isActive: false 
    })
  }

  // Always add Drivers and Equipment if we have an organization context
  if (organization?.id) {
    topNav.push({
      label: 'Drivers',
      href: `/organizations/${organization.id}/drivers`,
      isActive: currentSection === 'drivers'
    })
    topNav.push({
      label: 'Equipment',
      href: `/organizations/${organization.id}/equipment`,
      isActive: currentSection === 'equipment'
    })
  }

  return topNav
} 