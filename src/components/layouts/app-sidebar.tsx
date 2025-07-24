"use client"

import { useState } from 'react'
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
  Settings
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

interface AppSidebarProps {
  showOrgSelector?: boolean
  showDriverEquipmentSelector?: boolean
  menuType?: 'organization' | 'driver' | 'equipment'
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
  organizations = [],
  currentOrgId,
  isSheetOpen = false,
  onSheetOpenChange = () => {},
  onOrganizationSelect = () => {}
}: AppSidebarProps) {
  const [selectedTab, setSelectedTab] = useState<'drivers' | 'equipment'>('drivers')

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

  // Driver/Equipment Selector Button (shadcn Sheet approach)
  const DriverEquipmentSelector = () => {
    const [selectorOpen, setSelectorOpen] = useState(false)  // Modal open/close state
    // selectedTab state is already defined at component level - keeps tab selection separate from modal state
    
    return (
      <Sheet open={selectorOpen} onOpenChange={setSelectorOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            className="w-full h-12 justify-between bg-white border-2 border-gray-200 hover:border-blue-300"
          >
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <Truck className="h-4 w-4" />
              <span className="font-medium">Selector</span>
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
            {/* Tab Toggle - using plain buttons to avoid any shadcn Button behavior */}
            <div className="flex border-b border-gray-200 mb-4">
              <button
                type="button"
                className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  selectedTab === 'drivers'
                    ? 'text-blue-600 border-blue-600 bg-blue-50'
                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setSelectedTab('drivers')}
              >
                <Users className="h-4 w-4 mr-2" />
                Drivers
              </button>
              <button
                type="button"
                className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  selectedTab === 'equipment'
                    ? 'text-blue-600 border-blue-600 bg-blue-50'
                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setSelectedTab('equipment')}
              >
                <Truck className="h-4 w-4 mr-2" />
                Equipment
              </button>
            </div>
            
            {/* Content Area - conditional rendering inside, not around the modal */}
            <div className="space-y-2">
              {selectedTab === 'drivers' ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">No drivers found</p>
                  <p className="text-xs mt-2">Drivers will appear here when added to this organization</p>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Truck className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">No equipment found</p>
                  <p className="text-xs mt-2">Equipment will appear here when added to this organization</p>
                </div>
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
        href={currentOrgId ? `/organizations/${currentOrgId}` : "#"} 
        className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100"
      >
        <BarChart3 className="mr-3 h-4 w-4" />
        Overview
      </Link>
      <Link href="#" className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100">
        <AlertTriangle className="mr-3 h-4 w-4" />
        Issues
      </Link>
      <Link href="#" className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100">
        <ShieldCheck className="mr-3 h-4 w-4" />
        Roadside Inspections
      </Link>
      <Link href="#" className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100">
        <Car className="mr-3 h-4 w-4" />
        Accidents
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
      <Link href="#" className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100">
        <BarChart3 className="mr-3 h-4 w-4" />
        Overview
      </Link>
      <Link href="#" className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100">
        <Clipboard className="mr-3 h-4 w-4" />
        Licenses
      </Link>
      <Link href="#" className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100">
        <Car className="mr-3 h-4 w-4" />
        MVRs
      </Link>
      <Link href="#" className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100">
        <ShieldCheck className="mr-3 h-4 w-4" />
        Drug & Alcohol
      </Link>
      <Link href="#" className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100">
        <Users className="mr-3 h-4 w-4" />
        Physicals
      </Link>
      <Link href="#" className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100">
        <Clipboard className="mr-3 h-4 w-4" />
        Training
      </Link>
      <Link href="#" className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100">
        <ShieldCheck className="mr-3 h-4 w-4" />
        Roadside Inspections
      </Link>
      <Link href="#" className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100">
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
      <Link href="#" className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100">
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
      <Link href="#" className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100">
        <ShieldCheck className="mr-3 h-4 w-4" />
        Roadside Inspections
      </Link>
      <Link href="#" className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100">
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