"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Building, 
  Users, 
  Truck, 
  ChevronDown,
  BarChart3,
  AlertTriangle,
  ShieldCheck,
  Car,
  Clipboard,
  Settings
} from 'lucide-react'
import Link from 'next/link'

interface AppSidebarProps {
  showOrgSelector?: boolean
  showDriverEquipmentSelector?: boolean
  menuType?: 'organization' | 'driver' | 'equipment'
}

export function AppSidebar({
  showOrgSelector = false,
  showDriverEquipmentSelector = false,
  menuType
}: AppSidebarProps) {
  const [selectedTab, setSelectedTab] = useState<'drivers' | 'equipment'>('drivers')

  // Organization Selector Button (for master users)
  const OrganizationSelector = () => (
    <Button
      variant="outline"
      className="w-full h-12 justify-between bg-white border-2 border-gray-200 hover:border-blue-300"
    >
      <div className="flex items-center gap-2">
        <Building className="h-4 w-4" />
        <span className="font-medium">Select Organization</span>
      </div>
      <ChevronDown className="h-4 w-4" />
    </Button>
  )

  // Driver/Equipment Selector Button
  const DriverEquipmentSelector = () => (
    <div className="flex flex-col">
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
      
      {/* Selector Dropdown Content (simplified for now) */}
      <div className="mt-2 bg-white border border-gray-200 rounded-md shadow-sm">
        <div className="flex border-b">
          <button
            className={`flex-1 px-3 py-2 text-sm font-medium ${
              selectedTab === 'drivers' 
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setSelectedTab('drivers')}
          >
            Drivers
          </button>
          <button
            className={`flex-1 px-3 py-2 text-sm font-medium ${
              selectedTab === 'equipment' 
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setSelectedTab('equipment')}
          >
            Equipment
          </button>
        </div>
        <div className="p-2 text-sm text-gray-500">
          {selectedTab === 'drivers' ? 'Driver list here' : 'Equipment list here'}
        </div>
      </div>
    </div>
  )

  // Organization Context Menu
  const OrganizationMenu = () => (
    <nav className="space-y-1">
      <h3 className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Organization
      </h3>
      <Link href="#" className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100">
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
        <Clipboard className="mr-3 h-4 w-4" />
        Audits
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
        <div className="space-y-2">
          {showOrgSelector && <OrganizationSelector />}
          {showDriverEquipmentSelector && <DriverEquipmentSelector />}
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