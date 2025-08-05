"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layouts/app-layout'
import { useMasterOrg } from '@/hooks/use-master-org'
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
  locationId?: string | null
  location?: { id: string; name: string } | null
  party?: {
    role: Array<{
      roleType: string
      organizationId: string
      locationId?: string | null
      location?: { id: string; name: string } | null
    }>
  }
}

interface Organization {
  id: string
  name: string
}

export default function EquipmentPage() {
  const params = useParams()
  const router = useRouter()
  const organizationId = params.id as string
  const { masterOrg } = useMasterOrg()
  
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)

  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  // Fetch organization details
  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        const response = await fetch(`/api/organizations/${organizationId}`)
        if (response.ok) {
          const data = await response.json()
          setOrganization(data)
        }
      } catch (error) {
        console.error('Error fetching organization:', error)
      }
    }

    fetchOrganization()
  }, [organizationId])

  // Fetch equipment
  const fetchEquipment = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/equipment')
      if (response.ok) {
        const data = await response.json()
        // Filter for this organization
        const orgEquipment = data.filter((item: Equipment) => 
          item.party?.role?.some(role => role.organizationId === organizationId)
        )
        setEquipment(orgEquipment)
      }
    } catch (error) {
      console.error('Error fetching equipment:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch organizations for selector
  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations')
      if (response.ok) {
        const data = await response.json()
        setOrganizations(data)
      }
    } catch (error) {
      console.error('Error fetching organizations:', error)
    }
  }

  useEffect(() => {
    fetchEquipment()
    fetchOrganizations()
  }, [organizationId])

  const handleOrganizationSelect = (selectedOrg: Organization) => {
    setIsSheetOpen(false)
    router.push(`/organizations/${selectedOrg.id}/equipment`)
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

  if (!organization) {
    return (
      <AppLayout
        name={masterOrg?.name || 'Master'}
        topNav={[{ label: 'Master', href: masterOrg?.id ? `/master/${masterOrg.id}` : '/dashboard', isActive: false }]}
        className="p-6"
      >
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        </div>
      </AppLayout>
    )
  }

  const masterName = masterOrg?.name || 'Master'
  const topNav = [
    { label: 'Master', href: masterOrg?.id ? `/master/${masterOrg.id}` : '/dashboard', isActive: false },
    { label: 'Organization', href: `/organizations/${organizationId}`, isActive: false },
    { label: 'Drivers', href: `/organizations/${organizationId}/drivers`, isActive: false },
    { label: 'Equipment', href: `/organizations/${organizationId}/equipment`, isActive: true }
  ]

  return (
    <AppLayout
      name={masterName}
      topNav={topNav}
      className="p-6"
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Organization Name */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">{organization.name}</h1>
        </div>
        
        {/* Page Header */}
        <SectionHeader
          title="Equipment & Vehicles"
          description={`Manage vehicles and equipment for ${organization.name}`}
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
                    Add a new vehicle or piece of equipment to {organization.name}
                  </DialogDescription>
                </DialogHeader>
                <EquipmentForm
                  organizationId={organizationId}
                  onSuccess={() => {
                    setShowAddForm(false)
                    fetchEquipment()
                  }}
                  onCancel={() => setShowAddForm(false)}
                />
              </DialogContent>
            </Dialog>
          }
        />



        {/* Equipment List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          </div>
        ) : equipment.length > 0 ? (
          <div className="grid gap-4">
            {equipment.map((item) => {
              const role = item.party?.role?.[0]
              return (
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
                          {(role?.location || item.location) && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {role?.location?.name || item.location?.name}
                            </Badge>
                          )}
                        </div>

                        {/* Vehicle Details */}
                        {item.vinNumber && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Hash className="h-4 w-4" />
                            VIN: {item.vinNumber}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.location.href = `/organizations/${organizationId}/equipment/${item.id}`}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
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