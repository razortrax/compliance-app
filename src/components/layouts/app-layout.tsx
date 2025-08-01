"use client"

import { ReactNode } from 'react'
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
  
  // Determine context from URL structure
  const hasDriver = !!driverId
  const hasEquipment = !!equipmentId
  const hasOrganization = !!orgId
  const hasMaster = !!masterOrgId
  
  // Auto-detect sidebar menu type from URL
  let sidebarMenu: 'organization' | 'driver' | 'equipment' | undefined
  if (hasDriver) {
    sidebarMenu = 'driver'
  } else if (hasEquipment) {
    sidebarMenu = 'equipment'  
  } else if (hasOrganization) {
    // Check if we're on equipment-related pages
    if (pathname.includes('/equipment')) {
      sidebarMenu = 'equipment'
    } else {
      sidebarMenu = 'organization'
    }
  }
  
  // Auto-detect what selectors to show
  const showOrgSelector = hasMaster // Show org selector if we're in a master context
  const showDriverEquipmentSelector = hasOrganization // Show driver/equipment selector if we're in an org context
  
  return {
    // Context IDs
    masterOrgId,
    orgId: orgId || '',
    driverId,
    equipmentId,
    // Auto-detected UI state
    sidebarMenu,
    showOrgSelector,
    showDriverEquipmentSelector,
    // Context flags
    hasDriver,
    hasEquipment, 
    hasOrganization,
    hasMaster
  }
}

export interface Organization {
  id: string
  name: string
  dotNumber?: string | null
  party?: {
    userId?: string | null
    status?: string
  }
}

interface AppLayoutProps {
  children: ReactNode
  // Header configuration  
  name?: string
  topNav?: Array<{
    label: string
    href: string
    isActive?: boolean
  }>
  // Legacy props (backwards compatibility)
  showOrgSelector?: boolean
  showDriverEquipmentSelector?: boolean
  sidebarMenu?: 'organization' | 'driver' | 'equipment'
  driverId?: string
  equipmentId?: string
  masterOrgId?: string
  currentOrgId?: string
  // Organization selector props
  organizations?: Organization[]
  isSheetOpen?: boolean
  onSheetOpenChange?: (open: boolean) => void
  onOrganizationSelect?: (org: Organization) => void
  // Content configuration
  className?: string
}

export function AppLayout({
  children,
  name,
  topNav = [],
  // Legacy props
  showOrgSelector,
  showDriverEquipmentSelector,
  sidebarMenu,
  driverId,
  equipmentId,
  masterOrgId,
  currentOrgId,
  // Common props
  organizations,
  isSheetOpen,
  onSheetOpenChange,
  onOrganizationSelect,
  className = ""
}: AppLayoutProps) {
  const { user } = useUser()
  
  // Get context automatically from URL (as fallback)
  const urlContext = useUrlContext()
  
  // Use legacy props if provided, otherwise fall back to URL context
  const finalShowOrgSelector = showOrgSelector ?? urlContext.showOrgSelector
  const finalShowDriverEquipmentSelector = showDriverEquipmentSelector ?? urlContext.showDriverEquipmentSelector
  const finalSidebarMenu = sidebarMenu ?? urlContext.sidebarMenu
  const finalDriverId = driverId ?? urlContext.driverId
  const finalEquipmentId = equipmentId ?? urlContext.equipmentId
  const finalMasterOrgId = masterOrgId ?? urlContext.masterOrgId
  const finalCurrentOrgId = currentOrgId ?? urlContext.orgId
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <AppHeader 
        name={name}
        topNav={topNav}
      />
      
      <div className="flex">
        {/* Sidebar - only show if we have selectors or menu */}
        {(finalShowOrgSelector || finalShowDriverEquipmentSelector || finalSidebarMenu) && (
          <AppSidebar
            showOrgSelector={finalShowOrgSelector}
            showDriverEquipmentSelector={finalShowDriverEquipmentSelector}
            menuType={finalSidebarMenu}
            driverId={finalDriverId}
            equipmentId={finalEquipmentId}
            masterOrgId={finalMasterOrgId}
            organizations={organizations}
            currentOrgId={finalCurrentOrgId}
            isSheetOpen={isSheetOpen}
            onSheetOpenChange={onSheetOpenChange}
            onOrganizationSelect={onOrganizationSelect}
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