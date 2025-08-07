"use client"

import { ReactNode, useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import { useUser } from '@clerk/nextjs'
import { useParams, usePathname } from 'next/navigation'
import { AppHeader } from './app-header'
import { AppSidebar } from './app-sidebar'

// Hook to derive context from URL structure
function useUrlContext() {
  const params = useParams()
  const pathname = usePathname()
  
  // Extract IDs from URL params
  const masterOrgId = params.masterOrgId as string | undefined
  const orgId = params.orgId as string | undefined  
  const driverId = params.driverId as string | undefined
  const equipmentId = params.equipmentId as string | undefined
  const locationId = params.locationId as string | undefined
  
  // Determine context from URL structure
  const hasDriver = !!driverId
  const hasEquipment = !!equipmentId
  const hasOrganization = !!orgId
  const hasMaster = !!masterOrgId
  
  // Auto-detect sidebar menu type from URL
  let sidebarMenu: 'organization' | 'driver' | 'equipment' | 'location' | undefined
  if (hasDriver) {
    sidebarMenu = 'driver'
  } else if (hasEquipment) {
    sidebarMenu = 'equipment'  
  } else if (hasOrganization) {
    // Check if we're on equipment-related pages
    if (pathname.includes('/equipment')) {
      sidebarMenu = 'equipment'
    } else if (pathname.includes('/locations')) {
      sidebarMenu = 'location'
    } else {
      sidebarMenu = 'organization'
    }
  }
  
  return {
    // Context IDs
    masterOrgId,
    orgId: orgId || '',
    driverId,
    equipmentId,
    locationId,
    // Auto-detected UI state
    sidebarMenu,
    // Context flags
    hasDriver,
    hasEquipment, 
    hasOrganization,
    hasMaster
  }
}

interface AppLayoutProps {
  name: string
  topNav?: Array<{
    label: string
    href: string
    isActive: boolean
  }>
  sidebarMenu?: 'organization' | 'driver' | 'equipment' | 'location' | 'master'
  className?: string
  children: React.ReactNode
}

export function AppLayout({
  children,
  name,
  topNav = [],
  // Legacy props
  sidebarMenu,
  driverId,
  equipmentId,
  locationId,
  masterOrgId,
  currentOrgId,
  className = ""
}: AppLayoutProps) {
  const { user } = useUser()
  
  // Get context automatically from URL (as fallback)
  const urlContext = useUrlContext()
  
  // Use legacy props if provided, otherwise fall back to URL context
  const finalSidebarMenu = sidebarMenu ?? urlContext.sidebarMenu
  const finalDriverId = driverId ?? urlContext.driverId
  const finalEquipmentId = equipmentId ?? urlContext.equipmentId
  const finalLocationId = locationId ?? urlContext.locationId
  const finalMasterOrgId = masterOrgId ?? urlContext.masterOrgId
  const finalCurrentOrgId = currentOrgId ?? urlContext.orgId
  
  // Show sidebar if we have organization context or are on organization/driver/equipment pages
  const showSidebar = finalMasterOrgId || finalCurrentOrgId || finalSidebarMenu

  // Set Sentry tags for URL-derived context (dev-friendly and safe)
  useEffect(() => {
    Sentry.setTag('ctx.masterOrgId', finalMasterOrgId || '')
    Sentry.setTag('ctx.orgId', finalCurrentOrgId || '')
    if (finalSidebarMenu) Sentry.setTag('ctx.sidebarMenu', finalSidebarMenu)
    if (finalDriverId) Sentry.setTag('ctx.driverId', finalDriverId)
    if (finalEquipmentId) Sentry.setTag('ctx.equipmentId', finalEquipmentId)
    if (finalLocationId) Sentry.setTag('ctx.locationId', finalLocationId)
  }, [finalMasterOrgId, finalCurrentOrgId, finalSidebarMenu, finalDriverId, finalEquipmentId, finalLocationId])
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <AppHeader 
        name={name}
        topNav={topNav}
      />
      
      <div className="flex">
        {/* Sidebar - show when we have context */}
        {showSidebar && (
          <AppSidebar
            menuType={finalSidebarMenu}
            driverId={finalDriverId}
            equipmentId={finalEquipmentId}
            masterOrgId={finalMasterOrgId}
            currentOrgId={finalCurrentOrgId}
          />
        )}
        
        {/* Main Content */}
        <main className={`flex-1 ${className}`}>
          {children}
        </main>
      </div>
    </div>
  )
} 