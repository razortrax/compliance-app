"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser } from '@clerk/nextjs'
import { AppLayout } from '@/components/layouts/app-layout'
import { useMasterOrg } from '@/hooks/use-master-org'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { 
  Building2, 
  MapPin, 
  Users, 
  Truck,
  Edit,
  Save,
  X,
  Plus,
  Phone,
  FileText,
  Building,
  AlertCircle,
  Package
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { OrganizationAddOns } from './organization-add-ons'
import { EmptyState } from "@/components/ui/empty-state"
import { PageHeader } from "@/components/ui/page-header"
import { LocationForm } from "@/components/locations/location-form"
import { StaffForm } from "@/components/staff/staff-form"
import { SectionHeader } from "@/components/ui/section-header"
import { StatusBadge } from "@/components/ui/status-badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import type { Organization } from '@/components/layouts/app-layout'

interface ExtendedOrganization extends Organization {
  einNumber?: string | null
  phone?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  zipCode?: string | null
}

interface Location {
  id: string
  name: string
  locationType: string
  address: string
  city: string
  state: string
  zipCode: string
  phone?: string | null
  email?: string | null
  isMainLocation?: boolean
  _count?: {
    equipment: number
    role: number
  }
}

interface OrganizationDetailContentProps {
  organizationId: string
  navigationContext: 'direct' | 'master'
  masterOrgId?: string
}

export function OrganizationDetailContent({ 
  organizationId, 
  navigationContext,
  masterOrgId 
}: OrganizationDetailContentProps) {
  const router = useRouter()
  const { user } = useUser()
  const { masterOrg } = useMasterOrg()

  const [organization, setOrganization] = useState<ExtendedOrganization | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editedOrg, setEditedOrg] = useState<ExtendedOrganization | null>(null)
  const [activeTab, setActiveTab] = useState('details')
  const [kpis, setKpis] = useState({
    driversCount: 0,
    equipmentCount: 0,
    expiringIssues: 0,
    roadsideInspections: 0,
    accidents: 0
  })
  const [staff, setStaff] = useState<any[]>([])
  const [drivers, setDrivers] = useState<any[]>([])
  const [equipment, setEquipment] = useState<any[]>([])
  const [locationsLoading, setLocationsLoading] = useState(false)
  const [showLocationForm, setShowLocationForm] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [locations, setLocations] = useState<Location[]>([])
  
  // Staff management state
  const [showStaffForm, setShowStaffForm] = useState(false)
  const [editingStaff, setEditingStaff] = useState<any>(null)

  const fetchOrganization = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/organizations/${organizationId}`)
      if (response.ok) {
        const data = await response.json()
        setOrganization(data)
        setEditedOrg(data)

        // Fetch related data
        await Promise.all([
          fetchKPIs(organizationId),
          fetchStaff(organizationId),
          fetchLocations(),
          fetchEquipment(),
          fetchDrivers()
        ])
      }
    } catch (error) {
      console.error('Error fetching organization:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchKPIs = async (orgId: string) => {
    try {
      // You would implement actual KPI fetching here
      setKpis({
        driversCount: drivers.length,
        equipmentCount: equipment.length,
        expiringIssues: 0,
        roadsideInspections: 0,
        accidents: 0
      })
    } catch (error) {
      console.error('Error fetching KPIs:', error)
    }
  }

  const fetchStaff = async (orgId: string) => {
    try {
      const response = await fetch(`/api/staff?organizationId=${orgId}`)
      if (response.ok) {
        const data = await response.json()
        setStaff(data)
      }
    } catch (error) {
      console.error('Error fetching staff:', error)
    }
  }

  const fetchLocations = async () => {
    try {
      setLocationsLoading(true)
      const response = await fetch(`/api/organizations/${organizationId}/locations`)
      if (response.ok) {
        const data = await response.json()
        setLocations(data)
      }
    } catch (error) {
      console.error('Error fetching locations:', error)
    } finally {
      setLocationsLoading(false)
    }
  }

  const fetchEquipment = async () => {
    try {
      const response = await fetch('/api/equipment')
      if (response.ok) {
        const data = await response.json()
        setEquipment(data)
      }
    } catch (error) {
      console.error('Error fetching equipment:', error)
    }
  }

  const fetchDrivers = async () => {
    try {
      const response = await fetch('/api/persons')
      if (response.ok) {
        const data = await response.json()
        setDrivers(data)
      }
    } catch (error) {
      console.error('Error fetching drivers:', error)
    }
  }

  useEffect(() => {
    fetchOrganization()
  }, [organizationId])

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditedOrg(organization)
  }

  const handleSave = async () => {
    if (!editedOrg) return
    
    try {
      setIsSaving(true)
      const response = await fetch(`/api/organizations/${organizationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedOrg)
      })

      if (response.ok) {
        const updated = await response.json()
        setOrganization(updated)
        setIsEditing(false)
      }
    } catch (error) {
      console.error('Error saving organization:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleBack = () => {
    if (navigationContext === 'master' && masterOrgId) {
      router.push(`/master/${masterOrgId}`)
    } else {
      router.push('/organizations')
    }
  }

  const handleViewLocation = (location: Location) => {
    if (navigationContext === 'master' && masterOrgId) {
      router.push(`/master/${masterOrgId}/organization/${organizationId}/locations/${location.id}`)
    } else {
      router.push(`/organizations/${organizationId}/locations/${location.id}`)
    }
  }

  const handleCloseLocationForm = () => {
    setShowLocationForm(false)
    setEditingLocation(null)
  }

  if (isLoading || !organization) {
    return (
      <AppLayout name={masterOrg?.name || 'Loading...'}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading organization details...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  const topNav = navigationContext === 'master' ? [
    { 
      label: 'Master', 
      href: masterOrg?.id ? `/master/${masterOrg.id}` : '/dashboard',
      isActive: false
    },
    { 
      label: 'Organization', 
      href: masterOrgId ? `/master/${masterOrgId}/organization/${organizationId}` : `/organizations/${organizationId}`,
      isActive: true
    },
    { 
      label: 'Drivers', 
      href: masterOrgId ? `/master/${masterOrgId}/organization/${organizationId}/drivers` : `/organizations/${organizationId}/drivers`,
      isActive: false
    },
    { 
      label: 'Equipment', 
      href: masterOrgId ? `/master/${masterOrgId}/organization/${organizationId}/equipment` : `/organizations/${organizationId}/equipment`,
      isActive: false
    }
  ] : [
    { 
      label: 'Organizations', 
      href: '/organizations',
      isActive: false
    },
    { 
      label: organization.name, 
      href: `/organizations/${organizationId}`,
      isActive: true
    }
  ]

  return (
    <AppLayout name={masterOrg?.name || 'Fleetrax'} topNav={topNav} className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{organization.name}</h1>
              <p className="text-gray-600 mt-1">
                {organization.address && `${organization.address}, `}
                {organization.city && `${organization.city}, `}
                {organization.state} {organization.zipCode}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Edit Button */}
            {!isEditing ? (
              <Button onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="locations">Locations</TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
            <TabsTrigger value="others">Others</TabsTrigger>
            <TabsTrigger value="stuff">Stuff</TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-6">
            {/* KPIs Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Overview</CardTitle>
                <CardDescription>
                  Key metrics and counts for {organization.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{kpis.driversCount}</div>
                    <div className="text-sm text-gray-600">Drivers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{kpis.equipmentCount}</div>
                    <div className="text-sm text-gray-600">Equipment</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{kpis.expiringIssues}</div>
                    <div className="text-sm text-gray-600">Expiring Issues</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{kpis.roadsideInspections}</div>
                    <div className="text-sm text-gray-600">Roadside Issues</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{kpis.accidents}</div>
                    <div className="text-sm text-gray-600">Accidents</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Organization Details */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Organization Information</CardTitle>
                    <CardDescription>
                      Basic details and contact information
                    </CardDescription>
                  </div>
                  <StatusBadge 
                    status={organization.party?.status as any || 'active'} 
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Organization Name</Label>
                    {isEditing ? (
                      <Input
                        value={editedOrg?.name || ''}
                        onChange={(e) => setEditedOrg(prev => prev ? {...prev, name: e.target.value} : null)}
                      />
                    ) : (
                      <p className="text-gray-900">{organization.name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>DOT Number</Label>
                    {isEditing ? (
                      <Input
                        value={editedOrg?.dotNumber || ''}
                        onChange={(e) => setEditedOrg(prev => prev ? {...prev, dotNumber: e.target.value} : null)}
                      />
                    ) : (
                      <p className="text-gray-900">{organization.dotNumber}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>EIN Number</Label>
                    {isEditing ? (
                      <Input
                        value={editedOrg?.einNumber || ''}
                        onChange={(e) => setEditedOrg(prev => prev ? {...prev, einNumber: e.target.value} : null)}
                      />
                    ) : (
                      <p className="text-gray-900">{organization.einNumber || 'Not provided'}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Phone</Label>
                    {isEditing ? (
                      <Input
                        value={editedOrg?.phone || ''}
                        onChange={(e) => setEditedOrg(prev => prev ? {...prev, phone: e.target.value} : null)}
                      />
                    ) : (
                      <p className="text-gray-900">{organization.phone || 'Not provided'}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Address</Label>
                    {isEditing ? (
                      <Textarea
                        value={[
                          editedOrg?.address,
                          editedOrg?.city,
                          editedOrg?.state,
                          editedOrg?.zipCode
                        ].filter(Boolean).join('\n') || ''}
                        onChange={(e) => {
                          const lines = e.target.value.split('\n')
                          setEditedOrg(prev => prev ? {
                            ...prev,
                            address: lines[0] || '',
                            city: lines[1] || '',
                            state: lines[2] || '',
                            zipCode: lines[3] || ''
                          } : null)
                        }}
                      />
                    ) : (
                      <div className="text-gray-900">
                        {organization.address && <div>{organization.address}</div>}
                        {(organization.city || organization.state || organization.zipCode) && (
                          <div>
                            {organization.city && `${organization.city}, `}
                            {organization.state} {organization.zipCode}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Locations Tab */}
          <TabsContent value="locations" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Locations</CardTitle>
                    <CardDescription>
                      Manage organization locations and facilities
                    </CardDescription>
                  </div>
                  <Button onClick={() => setShowLocationForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Location
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {locationsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading locations...</p>
                  </div>
                ) : locations.length > 0 ? (
                  <div className="space-y-4">
                    {locations.map((location) => (
                      <div
                        key={location.id}
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => handleViewLocation(location)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <MapPin className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{location.name}</h3>
                                {location.isMainLocation && (
                                  <Badge variant="secondary" className="text-xs">Main</Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">{location.locationType}</p>
                              <p className="text-sm text-gray-500">
                                {location.address}, {location.city}, {location.state} {location.zipCode}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500">
                              {location._count?.equipment || 0} Equipment
                            </div>
                            <div className="text-sm text-gray-500">
                              {location._count?.role || 0} Staff
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={MapPin}
                    title="No locations found"
                    description="Add your first location to get started"
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Staff Tab */}
          <TabsContent value="staff" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Staff</CardTitle>
                    <CardDescription>
                      Manage organization staff and administrative roles
                    </CardDescription>
                  </div>
                  <Button onClick={() => setShowStaffForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Staff Member
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {staff.length > 0 ? (
                  <div className="space-y-4">
                    {staff.map((member) => (
                      <div
                        key={member.id}
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-green-100 rounded-lg">
                              <Users className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold">
                                {member.person?.firstName} {member.person?.lastName}
                              </h3>
                              <p className="text-sm text-gray-600">{member.position}</p>
                              <p className="text-sm text-gray-500">{member.department}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {member.canApproveCAFs && (
                              <Badge variant="secondary" className="text-xs">CAF Approver</Badge>
                            )}
                            {member.canSignCAFs && (
                              <Badge variant="secondary" className="text-xs">CAF Signer</Badge>
                            )}
                            <StatusBadge status={member.isActive ? 'active' : 'inactive'} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={Users}
                    title="No staff members found"
                    description="Add staff members to manage administrative roles and CAF workflows"
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Others Tab */}
          <TabsContent value="others" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Others</CardTitle>
                    <CardDescription>
                      External parties that work with {organization?.name}
                    </CardDescription>
                  </div>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Party
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Vendors */}
                  <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Vendors
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600 mb-1">0</div>
                      <p className="text-xs text-gray-600">Service providers</p>
                    </CardContent>
                  </Card>

                  {/* Agencies */}
                  <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Agencies
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600 mb-1">0</div>
                      <p className="text-xs text-gray-600">Regulatory bodies</p>
                    </CardContent>
                  </Card>

                  {/* Repair Shops */}
                  <Card className="border-l-4 border-l-orange-500">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        Repair Shops
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-600 mb-1">0</div>
                      <p className="text-xs text-gray-600">Maintenance providers</p>
                    </CardContent>
                  </Card>

                  {/* Inspectors */}
                  <Card className="border-l-4 border-l-purple-500">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Inspectors
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-purple-600 mb-1">0</div>
                      <p className="text-xs text-gray-600">DOT inspectors</p>
                    </CardContent>
                  </Card>

                  {/* Testing Labs */}
                  <Card className="border-l-4 border-l-red-500">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Testing Labs
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600 mb-1">0</div>
                      <p className="text-xs text-gray-600">Drug & alcohol testing</p>
                    </CardContent>
                  </Card>

                  {/* Collection Sites */}
                  <Card className="border-l-4 border-l-gray-500">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Collection Sites
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-600 mb-1">0</div>
                      <p className="text-xs text-gray-600">Sample collection</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Coming Soon Message */}
                <div className="mt-6">
                  <EmptyState
                    icon={Building}
                    title="Coming Soon"
                    description="External party management will be available here. Track vendors, agencies, repair shops, inspectors, testing labs, and collection sites."
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stuff Tab */}
          <TabsContent value="stuff" className="space-y-6">
            <OrganizationAddOns 
              organizationId={organizationId} 
              organizationName={organization.name}
            />
          </TabsContent>
        </Tabs>

        {/* Location Form Modal */}
        <Dialog open={showLocationForm} onOpenChange={handleCloseLocationForm}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingLocation ? 'Edit Location' : 'Add New Location'}
              </DialogTitle>
              <DialogDescription>
                {editingLocation 
                  ? `Update details for ${editingLocation.name}` 
                  : `Add a new location to ${organization.name}`
                }
              </DialogDescription>
            </DialogHeader>
            <LocationForm
              organizationId={organizationId}
              location={editingLocation}
              onSuccess={() => {
                handleCloseLocationForm()
                fetchLocations()
              }}
              onCancel={handleCloseLocationForm}
            />
          </DialogContent>
        </Dialog>

        {/* Staff Form Modal */}
        <Dialog open={showStaffForm} onOpenChange={setShowStaffForm}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
              </DialogTitle>
              <DialogDescription>
                {editingStaff 
                  ? `Update details for ${editingStaff.person?.firstName} ${editingStaff.person?.lastName}` 
                  : `Add a new staff member to ${organization.name}`
                }
              </DialogDescription>
            </DialogHeader>
            <StaffForm
              organizationId={organizationId}
              staff={editingStaff}
              onSuccess={() => {
                setShowStaffForm(false)
                setEditingStaff(null)
                fetchStaff(organizationId)
              }}
              onCancel={() => {
                setShowStaffForm(false)
                setEditingStaff(null)
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
} 