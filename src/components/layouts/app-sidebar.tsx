"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { 
  Building, 
  Building2,
  Users, 
  Truck, 
  ChevronDown,
  ChevronRight,
  BarChart3,
  AlertTriangle,
  ShieldCheck,
  Car,
  Clipboard,
  Settings,
  GraduationCap,
  Stethoscope
} from 'lucide-react'
import Link from 'next/link'

interface Organization {
  id: string
  name: string
  dotNumber?: string | null
  party?: {
    userId?: string | null
  }
}

interface Driver {
  id: string
  firstName: string
  lastName: string
  compliance: {
    expiringIssues: number
    status: 'warning' | 'compliant'
  }
}

interface Equipment {
  id: string
  vehicleType: string
  make?: string | null
  model?: string | null
  plateNumber?: string | null
}

interface AppSidebarProps {
  showOrgSelector?: boolean
  showDriverEquipmentSelector?: boolean
  menuType?: 'organization' | 'driver' | 'equipment'
  // Context IDs for dynamic navigation
  driverId?: string
  equipmentId?: string
  masterOrgId?: string  // Add master organization ID for URL context
  // Props for working organization selector
  organizations?: Organization[]
  currentOrgId?: string
  isSheetOpen?: boolean
  onSheetOpenChange?: (open: boolean) => void
  onOrganizationSelect?: (org: Organization) => void
}

export function AppSidebar({
  showOrgSelector = false,
  showDriverEquipmentSelector = false,
  menuType,
  driverId,
  equipmentId,
  masterOrgId,  // Add to destructured props
  organizations = [],
  currentOrgId,
  isSheetOpen = false,
  onSheetOpenChange = () => {},
  onOrganizationSelect = () => {}
}: AppSidebarProps) {
  // Initialize tab based on current page type - default to drivers unless on equipment page
  const [selectedTab, setSelectedTab] = useState<'drivers' | 'equipment'>(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname.includes('/equipment') ? 'equipment' : 'drivers'
    }
    return menuType === 'equipment' ? 'equipment' : 'drivers'
  })

  // Organization Selector Button (working version from org page)
  const OrganizationSelector = () => (
    <Sheet open={isSheetOpen} onOpenChange={onSheetOpenChange}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="default"
          className="h-12 w-12 p-0 border-2 border-gray-200 hover:border-blue-300"
        >
          <Building2 className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle>Switch Organization</SheetTitle>
          <SheetDescription>
            Select a different organization to manage
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-2">
          {(() => {
            // Always exclude master organization and current organization
            const filteredOrgs = organizations.filter(org => 
              !org.party?.userId && org.id !== currentOrgId
            )

            if (filteredOrgs.length === 0) {
              return (
                <div className="text-center py-8 text-gray-500">
                  <Building2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">No other organizations to switch to</p>
                  <p className="text-xs mt-2">Return to Master Overview to create or manage organizations</p>
                </div>
              )
            }

            return filteredOrgs.map((org) => (
              <button
                key={org.id}
                onClick={() => onOrganizationSelect(org)}
                className="w-full text-left p-3 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-between group"
              >
                <div>
                  <div className="font-medium">{org.name}</div>
                  {org.dotNumber && (
                    <div className="text-sm text-gray-500">DOT: {org.dotNumber}</div>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
              </button>
            ))
          })()}
        </div>
      </SheetContent>
    </Sheet>
  )

  // Driver/Equipment Selector Button - Fixed based on debugging recommendations 🔧
  const DriverEquipmentSelector = () => {
    const [selectorOpen, setSelectorOpen] = useState(false)
    const [drivers, setDrivers] = useState<Driver[]>([])
    const [equipment, setEquipment] = useState<Equipment[]>([])
    const [isLoadingDrivers, setIsLoadingDrivers] = useState(false)
    const [isLoadingEquipment, setIsLoadingEquipment] = useState(false)
    
    // Fetch drivers data
    const fetchDrivers = async () => {
      if (!masterOrgId || !currentOrgId || drivers.length > 0) return
      
      setIsLoadingDrivers(true)
      try {
        const response = await fetch(`/api/master/${masterOrgId}/organization/${currentOrgId}/drivers`)
        if (response.ok) {
          const data = await response.json()
          setDrivers(data.drivers || [])
        }
      } catch (error) {
        console.error('Failed to fetch drivers:', error)
      } finally {
        setIsLoadingDrivers(false)
      }
    }
    
    // Fetch equipment data
    const fetchEquipment = async () => {
      if (!masterOrgId || !currentOrgId || equipment.length > 0) return
      
      setIsLoadingEquipment(true)
      try {
        const response = await fetch(`/api/master/${masterOrgId}/organization/${currentOrgId}/equipment`)
        if (response.ok) {
          const data = await response.json()
          setEquipment(data.equipment || [])
        }
      } catch (error) {
        console.error('Failed to fetch equipment:', error)
      } finally {
        setIsLoadingEquipment(false)
      }
    }
    
    // Fetch data when modal opens
    useEffect(() => {
      if (selectorOpen && masterOrgId && currentOrgId) {
        fetchDrivers()
        fetchEquipment()
      }
    }, [selectorOpen, masterOrgId, currentOrgId])
    
    const handleDriverClick = (driver: Driver) => {
      setSelectorOpen(false)
      window.location.href = `/master/${masterOrgId}/organization/${currentOrgId}/driver/${driver.id}`
    }
    
    const handleEquipmentClick = (item: Equipment) => {
      setSelectorOpen(false)
      window.location.href = `/master/${masterOrgId}/organization/${currentOrgId}/equipment/${item.id}`
    }
    
    return (
      <Sheet open={selectorOpen} onOpenChange={setSelectorOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            className="w-full h-12 justify-between bg-white border-2 border-gray-200 hover:border-blue-300"
          >
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="font-medium">Select</span>
            </div>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] sm:w-[400px]">
          <SheetHeader>
            <SheetTitle>Select Driver or Equipment</SheetTitle>
            <SheetDescription>
              Switch between drivers and equipment for this organization
            </SheetDescription>
          </SheetHeader>
          
          <div className="mt-6">
            {/* Tab Toggle - Using proper Button components */}
            <div className="flex border-b border-gray-200 mb-4">
              <Button
                variant={selectedTab === 'drivers' ? 'default' : 'outline'}
                size="sm"
                className="flex-1 rounded-none border-0 border-b-2 border-transparent data-[state=active]:border-blue-600"
                onClick={() => setSelectedTab('drivers')}
              >
                <Users className="h-4 w-4 mr-2" />
                Drivers ({drivers.length})
              </Button>
              <Button
                variant={selectedTab === 'equipment' ? 'default' : 'outline'}
                size="sm"
                className="flex-1 rounded-none border-0 border-b-2 border-transparent data-[state=active]:border-blue-600"
                onClick={() => setSelectedTab('equipment')}
              >
                <Truck className="h-4 w-4 mr-2" />
                Equipment ({equipment.length})
              </Button>
            </div>
            
            {/* Content Area - Keep this completely stable, no key changes */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {selectedTab === 'drivers' ? (
                <>
                  {isLoadingDrivers ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-sm text-gray-500 mt-2">Loading drivers...</p>
                    </div>
                  ) : drivers.length > 0 ? (
                    drivers.map((driver) => (
                      <button
                        key={driver.id}
                        onClick={() => handleDriverClick(driver)}
                        className="w-full p-3 text-left rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">
                              {driver.firstName} {driver.lastName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {driver.compliance.expiringIssues > 0 ? (
                                <span className="text-orange-600">
                                  {driver.compliance.expiringIssues} expiring issues
                                </span>
                              ) : (
                                <span className="text-green-600">Compliant</span>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-sm">No drivers found</p>
                      <p className="text-xs mt-2">Drivers will appear here when added to this organization</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {isLoadingEquipment ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-sm text-gray-500 mt-2">Loading equipment...</p>
                    </div>
                  ) : equipment.length > 0 ? (
                    equipment.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleEquipmentClick(item)}
                        className="w-full p-3 text-left rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">
                              {item.make} {item.model}
                            </div>
                            <div className="text-xs text-gray-500">
                              {item.vehicleType} • {item.plateNumber || 'No plate'}
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Truck className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-sm">No equipment found</p>
                      <p className="text-xs mt-2">Equipment will appear here when added to this organization</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  // Organization Context Menu
  const OrganizationMenu = () => (
    <nav className="space-y-1">
      <h3 className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Organization
      </h3>
      <Link 
        href={currentOrgId && masterOrgId ? `/master/${masterOrgId}/organization/${currentOrgId}` : "#"} 
        className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100"
      >
        <BarChart3 className="mr-3 h-4 w-4" />
        Overview
      </Link>
      <Link href="#" className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100">
        <AlertTriangle className="mr-3 h-4 w-4" />
        Issues
      </Link>
      <Link 
        href={currentOrgId && masterOrgId ? `/master/${masterOrgId}/organization/${currentOrgId}/roadside_inspections` : "#"} 
        className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100"
      >
        <ShieldCheck className="mr-3 h-4 w-4" />
        Roadside Inspections
      </Link>
      <Link 
        href={currentOrgId && masterOrgId ? `/master/${masterOrgId}/organization/${currentOrgId}/accidents` : "#"} 
        className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100"
      >
        <Car className="mr-3 h-4 w-4" />
        Accidents
      </Link>
      <Link href="#" className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100">
        <Clipboard className="mr-3 h-4 w-4" />
        Audit
      </Link>
      <Link href="#" className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100">
        <Settings className="mr-3 h-4 w-4" />
        Preferences
      </Link>
    </nav>
  )

  // Driver Context Menu
  const DriverMenu = () => (
    <nav className="space-y-1">
      <h3 className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Drivers
      </h3>
      <Link 
        href={driverId && masterOrgId && currentOrgId ? `/master/${masterOrgId}/organization/${currentOrgId}` : "#"} 
        className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100"
      >
        <BarChart3 className="mr-3 h-4 w-4" />
        Overview
      </Link>
      <Link 
        href={driverId && masterOrgId && currentOrgId ? `/master/${masterOrgId}/organization/${currentOrgId}/driver/${driverId}/licenses` : "#"} 
        className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100"
      >
        <Clipboard className="mr-3 h-4 w-4" />
        Licenses
      </Link>
      <Link 
        href={driverId && masterOrgId && currentOrgId ? `/master/${masterOrgId}/organization/${currentOrgId}/driver/${driverId}/mvr-issue` : "#"} 
        className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100"
      >
        <Car className="mr-3 h-4 w-4" />
        MVRs
      </Link>
      <Link 
        href={driverId && masterOrgId && currentOrgId ? `/master/${masterOrgId}/organization/${currentOrgId}/driver/${driverId}/physical_issues` : "#"} 
        className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100"
      >
        <Stethoscope className="mr-3 h-4 w-4" />
        Physicals
      </Link>
      <Link 
        href={driverId && masterOrgId && currentOrgId ? `/master/${masterOrgId}/organization/${currentOrgId}/driver/${driverId}/drugalcohol` : "#"} 
        className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100"
      >
        <Users className="mr-3 h-4 w-4" />
        Drug & Alcohol
      </Link>
      <Link 
        href={driverId && masterOrgId && currentOrgId ? `/master/${masterOrgId}/organization/${currentOrgId}/driver/${driverId}/training` : "#"} 
        className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100"
      >
        <GraduationCap className="mr-3 h-4 w-4" />
        Training
      </Link>
      <Link 
        href={driverId && masterOrgId && currentOrgId ? `/master/${masterOrgId}/organization/${currentOrgId}/driver/${driverId}/roadside-inspections` : "#"} 
        className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100"
      >
        <ShieldCheck className="mr-3 h-4 w-4" />
        Roadside Inspections
      </Link>
      <Link 
        href={driverId && masterOrgId && currentOrgId ? `/master/${masterOrgId}/organization/${currentOrgId}/driver/${driverId}/accidents` : "#"} 
        className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100"
      >
        <Car className="mr-3 h-4 w-4" />
        Accidents
      </Link>
    </nav>
  )

  // Equipment Context Menu
  const EquipmentMenu = () => (
    <nav className="space-y-1">
      <h3 className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Equipment
      </h3>
      <Link 
        href={currentOrgId && masterOrgId ? `/master/${masterOrgId}/organization/${currentOrgId}` : "#"} 
        className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100"
      >
        <BarChart3 className="mr-3 h-4 w-4" />
        Overview
      </Link>
      <Link href="#" className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100">
        <Clipboard className="mr-3 h-4 w-4" />
        Registrations
      </Link>
      <Link href="#" className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100">
        <ShieldCheck className="mr-3 h-4 w-4" />
        Annual Inspections
      </Link>
      <Link href="#" className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100">
        <Settings className="mr-3 h-4 w-4" />
        Maintenance
      </Link>
      <Link 
        href={currentOrgId && masterOrgId ? `/master/${masterOrgId}/organization/${currentOrgId}/roadside_inspections` : "#"} 
        className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100"
      >
        <ShieldCheck className="mr-3 h-4 w-4" />
        Roadside Inspections
      </Link>
      <Link 
        href={currentOrgId && masterOrgId ? `/master/${masterOrgId}/organization/${currentOrgId}/accidents` : "#"} 
        className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100"
      >
        <Car className="mr-3 h-4 w-4" />
        Accidents
      </Link>
    </nav>
  )

  const renderContextMenu = () => {
    switch (menuType) {
      case 'organization':
        return <OrganizationMenu />
      case 'driver':
        return <DriverMenu />
      case 'equipment':
        return <EquipmentMenu />
      default:
        return null
    }
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-[calc(100vh-73px)]">
      <div className="p-4 space-y-4">
        {/* Selector Buttons */}
        <div className="flex gap-2">
          {showOrgSelector && <OrganizationSelector />}
          {showDriverEquipmentSelector && (
            <div className="flex-1">
              <DriverEquipmentSelector />
            </div>
          )}
        </div>
        
        {/* Context Menu */}
        {menuType && (
          <div className="pt-4 border-t border-gray-200">
            {renderContextMenu()}
          </div>
        )}
      </div>
    </aside>
  )
} 