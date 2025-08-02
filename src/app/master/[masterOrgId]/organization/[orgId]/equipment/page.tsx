"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { AppLayout } from '@/components/layouts/app-layout'
import { EquipmentForm } from '@/components/equipment/equipment-form'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { EmptyState } from "@/components/ui/empty-state"
import { SectionHeader } from "@/components/ui/section-header"
import { 
  Truck, 
  Plus, 
  MapPin,
  Hash,
  Eye
} from 'lucide-react'

interface Equipment {
  id: string
  vehicleType: string
  make?: string | null
  model?: string | null
  year?: number | null
  vinNumber?: string | null
  plateNumber?: string | null
  registrationExpiry?: string | null
  location?: { 
    id: string
    name: string
    address?: string
    city?: string
    state?: string
  } | null
  maintenance: {
    status: 'unknown'
    daysSinceLastMaintenance: number | null
    isOverdue: boolean
  }
}

interface Organization {
  id: string
  name: string
  dotNumber?: string | null
}

interface EquipmentPageData {
  organization: Organization
  equipment: Equipment[]
  summary: {
    totalEquipment: number
    activeEquipment: number
    inactiveEquipment: number
    maintenanceOverdue: number
    maintenanceDue: number
    equipmentByType: Record<string, number>
  }
}

export default function EquipmentPage() {
  const params = useParams()
  const masterOrgId = params.masterOrgId as string
  const organizationId = params.orgId as string
  
  const [data, setData] = useState<EquipmentPageData | null>(null)
  const [masterOrg, setMasterOrg] = useState<Organization | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)


  // Fetch all data using URL-driven API 🚀
  useEffect(() => {
    const fetchData = async () => {
      if (!masterOrgId || !organizationId) return
      
      setIsLoading(true)
      try {
        // Fetch equipment data and master organization data in parallel
        const [equipmentResponse, masterOrgResponse] = await Promise.all([
          fetch(`/api/master/${masterOrgId}/organization/${organizationId}/equipment`),
          fetch(`/api/organizations/${masterOrgId}`)
        ])

        if (equipmentResponse.ok) {
          const equipmentResult: EquipmentPageData = await equipmentResponse.json()
          setData(equipmentResult)
          console.log(`✅ Loaded ${equipmentResult.equipment.length} equipment items for ${equipmentResult.organization.name}`)
        } else {
          console.error('Failed to fetch equipment data:', equipmentResponse.status)
        }

        if (masterOrgResponse.ok) {
          const masterOrgResult = await masterOrgResponse.json()
          setMasterOrg({
            id: masterOrgResult.id,
            name: masterOrgResult.name,
            dotNumber: masterOrgResult.dotNumber
          })
          console.log(`✅ Loaded master organization: ${masterOrgResult.name}`)
        } else {
          console.error('Failed to fetch master organization data:', masterOrgResponse.status)
          // Fallback to a default if master org fetch fails
          setMasterOrg({ 
            id: masterOrgId, 
            name: 'Master Organization'
          })
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        // Set fallback master org data
        setMasterOrg({ 
          id: masterOrgId, 
          name: 'Master Organization'
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [masterOrgId, organizationId])



  const refreshData = async () => {
    const response = await fetch(`/api/master/${masterOrgId}/organization/${organizationId}/equipment`)
    if (response.ok) {
      const result: EquipmentPageData = await response.json()
      setData(result)
    }
  }

  const getVehicleTypeLabel = (type: string) => {
    switch (type) {
      case 'TRUCK': return 'Truck'
      case 'TRAILER': return 'Trailer'
      case 'VAN': return 'Van'
      case 'BUS': return 'Bus'
      case 'PICKUP': return 'Pickup Truck'
      case 'CAR': return 'Car'
      case 'MOTORCYCLE': return 'Motorcycle'
      default: return type
    }
  }

  const getVehicleTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'TRUCK': return 'bg-blue-100 text-blue-700'
      case 'TRAILER': return 'bg-green-100 text-green-700'
      case 'VAN': return 'bg-purple-100 text-purple-700'
      case 'BUS': return 'bg-orange-100 text-orange-700'
      case 'PICKUP': return 'bg-teal-100 text-teal-700'
      case 'CAR': return 'bg-indigo-100 text-indigo-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getVehicleDisplayName = (item: Equipment) => {
    const parts = [item.year, item.make, item.model].filter(Boolean)
    return parts.length > 0 ? parts.join(' ') : 'Untitled Vehicle'
  }

  // Build navigation breadcrumbs for equipment page (static labels)
  const topNav = [
    { 
      label: 'Master', 
      href: `/master/${masterOrgId}`, 
      isActive: false 
    },
    { 
      label: 'Organization', 
      href: `/master/${masterOrgId}/organization/${organizationId}`, 
      isActive: false 
    },
    { 
      label: 'Drivers', 
      href: `/master/${masterOrgId}/organization/${organizationId}/drivers`, 
      isActive: false 
    },
    { 
      label: 'Equipment', 
      href: `/master/${masterOrgId}/organization/${organizationId}/equipment`, 
      isActive: true 
    }
  ]

  // Loading state with proper header context
  if (isLoading || !data) {
    return (
      <AppLayout 
        name={masterOrg?.name || 'Master'} 
        topNav={topNav}
        className="p-6"
      >
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading equipment data...</p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout
      name={masterOrg?.name || 'Master'}
      topNav={topNav}
      className="p-6"
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Organization Name & Summary */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{data.organization.name}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
            <span>Total Equipment: <strong>{data.summary.totalEquipment}</strong></span>
            <span>Active: <strong>{data.summary.activeEquipment}</strong></span>
            {data.summary.maintenanceOverdue > 0 && (
              <span className="text-red-600">
                Maintenance Overdue: <strong>{data.summary.maintenanceOverdue}</strong>
              </span>
            )}
          </div>
        </div>
        
        {/* Page Header */}
        <SectionHeader
          title="Equipment & Vehicles"
          description={`Manage vehicles and equipment for ${data.organization.name}`}
          actions={
            <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Equipment
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Equipment</DialogTitle>
                  <DialogDescription>
                    Add a new vehicle or piece of equipment to {data.organization.name}
                  </DialogDescription>
                </DialogHeader>
                <EquipmentForm
                  organizationId={organizationId}
                  onSuccess={() => {
                    setShowAddForm(false)
                    refreshData()
                  }}
                  onCancel={() => setShowAddForm(false)}
                />
              </DialogContent>
            </Dialog>
          }
        />



        {/* Equipment Summary Cards */}
        {Object.keys(data.summary.equipmentByType).length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            {Object.entries(data.summary.equipmentByType).map(([type, count]) => (
              <Card key={type}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{getVehicleTypeLabel(type)}</p>
                      <p className="text-2xl font-bold">{count}</p>
                    </div>
                    <Truck className="h-8 w-8 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Equipment List */}
        {data.equipment.length > 0 ? (
          <div className="grid gap-4">
            {data.equipment.map((item) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      {/* Vehicle Name and Type */}
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">
                          {getVehicleDisplayName(item)}
                        </h3>
                        <Badge className={getVehicleTypeBadgeColor(item.vehicleType)}>
                          {getVehicleTypeLabel(item.vehicleType)}
                        </Badge>
                        {item.location && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {item.location.name}
                          </Badge>
                        )}
                      </div>

                      {/* Vehicle Details */}
                      <div className="space-y-1">
                        {item.vinNumber && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Hash className="h-4 w-4" />
                            VIN: {item.vinNumber}
                          </div>
                        )}
                        {item.plateNumber && (
                          <div className="text-sm text-gray-600">
                            Plate: {item.plateNumber}
                          </div>
                        )}
                        {item.registrationExpiry && (
                          <div className="text-sm text-gray-600">
                            Registration Expires: {new Date(item.registrationExpiry).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.location.href = `/master/${masterOrgId}/organization/${organizationId}/equipment/${item.id}`}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Truck}
            title="No equipment yet"
            description="Add vehicles and equipment to track registrations, maintenance, and inspections"
            action={{
              label: "Add First Vehicle",
              onClick: () => setShowAddForm(true)
            }}
          />
        )}
      </div>
    </AppLayout>
  )
} 