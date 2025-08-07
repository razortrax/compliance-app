"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { 
  Building2,
  Users, 
  Truck, 
  ChevronRight,
  BarChart3,
  AlertTriangle,
  ShieldCheck,
  Car,
  Clipboard,
  Settings,
  GraduationCap,
  Stethoscope,
  Plus,
  Shield,
  FileText
} from 'lucide-react'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'

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
  menuType?: 'organization' | 'driver' | 'equipment' | 'master' | 'location'
  driverId?: string
  equipmentId?: string
  masterOrgId?: string
  currentOrgId?: string
}

export function AppSidebar({
  menuType,
  driverId,
  equipmentId,
  masterOrgId,
  currentOrgId
}: AppSidebarProps) {
  const router = useRouter()
  const { user } = useUser()
  const [orgSheetOpen, setOrgSheetOpen] = useState(false)
  const [driverSheetOpen, setDriverSheetOpen] = useState(false)
  const [equipmentSheetOpen, setEquipmentSheetOpen] = useState(false)
  
  // Data states
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  
  // Loading states
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(false)
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(false)
  const [isLoadingEquipment, setIsLoadingEquipment] = useState(false)

  // Check if user is master (has access to multiple organizations)
  const isMaster = !!masterOrgId

  // Fetch organizations (for master users)
  const fetchOrganizations = async () => {
    if (!masterOrgId || organizations.length > 0) return
    
    setIsLoadingOrgs(true)
    try {
      const response = await fetch(`/api/master/${masterOrgId}/organizations`)
      if (response.ok) {
        const data = await response.json()
        // Use childOrganizations from API response (already filtered)
        setOrganizations(data.childOrganizations || [])
      }
    } catch (error) {
      console.error('Failed to fetch organizations:', error)
    } finally {
      setIsLoadingOrgs(false)
    }
  }
  
  // Fetch drivers
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
  
  // Fetch equipment
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

  // Fetch data when sheets open
  useEffect(() => {
    if (orgSheetOpen && isMaster) {
      fetchOrganizations()
    }
  }, [orgSheetOpen, isMaster])

  useEffect(() => {
    if (driverSheetOpen && masterOrgId && currentOrgId) {
      fetchDrivers()
    }
  }, [driverSheetOpen, masterOrgId, currentOrgId])

  useEffect(() => {
    if (equipmentSheetOpen && masterOrgId && currentOrgId) {
      fetchEquipment()
    }
  }, [equipmentSheetOpen, masterOrgId, currentOrgId])

  // Navigation handlers
  const handleOrganizationSelect = (org: Organization) => {
    setOrgSheetOpen(false)
    router.push(`/master/${masterOrgId}/organization/${org.id}`)
  }

  const handleDriverClick = (driver: Driver) => {
    setDriverSheetOpen(false)
    router.push(`/master/${masterOrgId}/organization/${currentOrgId}/driver/${driver.id}`)
  }

  const handleEquipmentClick = (item: Equipment) => {
    setEquipmentSheetOpen(false)
    router.push(`/master/${masterOrgId}/organization/${currentOrgId}/equipment/${item.id}`)
  }

  const handleAddDriver = () => {
    setDriverSheetOpen(false)
    router.push(`/master/${masterOrgId}/organization/${currentOrgId}/drivers`)
  }

  const handleAddEquipment = () => {
    setEquipmentSheetOpen(false)
    router.push(`/master/${masterOrgId}/organization/${currentOrgId}/equipment`)
  }

  // Organizations Sheet Component
  const OrganizationsSheet = () => (
    <Sheet open={orgSheetOpen} onOpenChange={setOrgSheetOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="default"
          className="h-12 flex-1 border-2 border-gray-200 hover:border-blue-300"
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
        <div className="mt-6 space-y-2 max-h-[500px] overflow-y-auto">
          {isLoadingOrgs ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Loading organizations...</p>
            </div>
          ) : organizations.length > 0 ? (
            organizations.map((org) => (
              <button
                key={org.id}
                onClick={() => handleOrganizationSelect(org)}
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
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Building2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No other organizations</p>
              <p className="text-xs mt-2">Return to Master Overview to create organizations</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )

  // Drivers Sheet Component
  const DriversSheet = () => (
    <Sheet open={driverSheetOpen} onOpenChange={setDriverSheetOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="h-12 flex-1 border-2 border-gray-200 hover:border-blue-300"
        >
          <Users className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle>Select Driver</SheetTitle>
          <SheetDescription>
            Navigate to a driver's detail page
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-2 max-h-[500px] overflow-y-auto">
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
              <Button 
                onClick={handleAddDriver}
                className="mt-4"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Driver
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )

  // Equipment Sheet Component
  const EquipmentSheet = () => (
    <Sheet open={equipmentSheetOpen} onOpenChange={setEquipmentSheetOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="h-12 flex-1 border-2 border-gray-200 hover:border-blue-300"
        >
          <Truck className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle>Select Equipment</SheetTitle>
          <SheetDescription>
            Navigate to an equipment detail page
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-2 max-h-[500px] overflow-y-auto">
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
                      {item.make || 'Unknown'} {item.model || ''}
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
              <Button 
                onClick={handleAddEquipment}
                className="mt-4"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Equipment
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )

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
      <Link 
        href={currentOrgId && masterOrgId ? `/master/${masterOrgId}/organization/${currentOrgId}/issues` : "#"} 
        className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100"
      >
        <AlertTriangle className="mr-3 h-4 w-4" />
        Issues
      </Link>
      <Link 
        href={currentOrgId && masterOrgId ? `/master/${masterOrgId}/organization/${currentOrgId}/roadside-inspections` : "#"} 
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
      <Link 
        href={currentOrgId && masterOrgId ? `/master/${masterOrgId}/organization/${currentOrgId}/staff` : "#"} 
        className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100"
      >
        <Users className="mr-3 h-4 w-4" />
        Staff
      </Link>
      <Link 
        href={currentOrgId && masterOrgId ? `/master/${masterOrgId}/organization/${currentOrgId}/audit` : "#"} 
        className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100"
      >
        <Clipboard className="mr-3 h-4 w-4" />
        Audit
      </Link>
      <Link 
        href={currentOrgId && masterOrgId ? `/master/${masterOrgId}/organization/${currentOrgId}/preferences` : "#"} 
        className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100"
      >
        <Settings className="mr-3 h-4 w-4" />
        Preferences
      </Link>
      <Link 
        href={currentOrgId && masterOrgId ? `/master/${masterOrgId}/organization/${currentOrgId}/staff` : "#"} 
        className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100"
      >
        <Users className="mr-3 h-4 w-4" />
        Staff
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
      <Link 
        href={equipmentId && currentOrgId && masterOrgId ? `/master/${masterOrgId}/organization/${currentOrgId}/equipment/${equipmentId}/registrations` : "#"} 
        className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100"
      >
        <Clipboard className="mr-3 h-4 w-4" />
        Registrations
      </Link>
      <Link 
        href={equipmentId && currentOrgId && masterOrgId ? `/master/${masterOrgId}/organization/${currentOrgId}/equipment/${equipmentId}/annual-inspections` : "#"} 
        className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100"
      >
        <Shield className="mr-3 h-4 w-4" />
        Annual Inspections
      </Link>
      <Link 
        href={equipmentId && currentOrgId && masterOrgId ? `/master/${masterOrgId}/organization/${currentOrgId}/equipment/${equipmentId}/maintenance-issues` : "#"} 
        className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100"
      >
        <Settings className="mr-3 h-4 w-4" />
        Maintenance
      </Link>
      <Link 
        href={equipmentId && currentOrgId && masterOrgId ? `/master/${masterOrgId}/organization/${currentOrgId}/equipment/${equipmentId}/roadside-inspections` : "#"} 
        className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100"
      >
        <ShieldCheck className="mr-3 h-4 w-4" />
        Roadside Inspections
      </Link>
      <Link 
        href={equipmentId && currentOrgId && masterOrgId ? `/master/${masterOrgId}/organization/${currentOrgId}/equipment/${equipmentId}/accidents` : "#"} 
        className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100"
      >
        <Car className="mr-3 h-4 w-4" />
        Accidents
      </Link>
    </nav>
  )

  // Master Menu Component
  const MasterMenu = () => (
    <div className="space-y-1">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Master</h3>
      <Link
        href={masterOrgId ? `/master/${masterOrgId}` : "#"}
        className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100"
      >
        <Building2 className="mr-3 h-4 w-4" />
        Dashboard
      </Link>
      <Link
        href={masterOrgId ? `/master/${masterOrgId}/cafs` : "#"}
        className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100"
      >
        <FileText className="mr-3 h-4 w-4" />
        CAFs
      </Link>
    </div>
  )

  const renderContextMenu = () => {
    switch (menuType) {
      case 'master':
        return <MasterMenu />
      case 'organization':
        return <OrganizationMenu />
      case 'driver':
        // Only show driver menu if we have a specific driver selected
        return driverId ? <DriverMenu /> : null
      case 'equipment':
        // Only show equipment menu if we have specific equipment selected  
        return equipmentId ? <EquipmentMenu /> : null
      default:
        return null
    }
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-[calc(100vh-73px)]">
      <div className="p-4 space-y-4">
        {/* Selector Buttons - Icon Only, Stretch Across Width */}
        <div className="flex gap-2">
          {/* Show Organizations button only for master users */}
          {isMaster && <OrganizationsSheet />}
          
          {/* Always show Drivers and Equipment buttons when we have organization context */}
          {currentOrgId && (
            <>
              <DriversSheet />
              <EquipmentSheet />
            </>
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