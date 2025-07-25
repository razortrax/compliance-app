'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layouts/app-layout'
import { useMasterOrg } from '@/hooks/use-master-org'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState } from '@/components/ui/empty-state'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { LocationForm } from '@/components/locations/location-form'
import { Building2, Users, Truck, AlertCircle, MapPin, Phone, Mail, Edit, Save, X, Plus, FileText } from 'lucide-react'

interface LocationDetailPageProps {
  params: {
    id: string
    locationId: string
  }
}

export default function LocationDetailPage({ params }: LocationDetailPageProps) {
  const router = useRouter()
  const { masterOrg } = useMasterOrg()
  const [activeTab, setActiveTab] = useState('details')
  const [location, setLocation] = useState<any>(null)
  const [organization, setOrganization] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedLocation, setEditedLocation] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [userRole, setUserRole] = useState<any>(null)
  const [kpis, setKpis] = useState({
    driversCount: 0,
    equipmentCount: 0,
    expiringIssues: 0,
    roadsideInspections: 0,
    accidents: 0
  })
  const [drivers, setDrivers] = useState<any[]>([])
  const [equipment, setEquipment] = useState<any[]>([])
  const [organizations, setOrganizations] = useState<any[]>([])
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  useEffect(() => {
    fetchLocationData()
    fetchUserRole()
    fetchOrganizations()
    fetchLocationKpis()
    fetchLocationDrivers()
    fetchLocationEquipment()
  }, [params.locationId])

  const fetchLocationData = async () => {
    try {
      // Fetch location details
      const locResponse = await fetch(`/api/organizations/${params.id}/locations/${params.locationId}`)
      if (locResponse.ok) {
        const locData = await locResponse.json()
        setLocation(locData)
      } else {
        console.error('Location fetch failed:', locResponse.status, params.locationId)
      }

      // Fetch organization details for context
      const orgResponse = await fetch(`/api/organizations/${params.id}`)
      if (orgResponse.ok) {
        const orgData = await orgResponse.json()
        setOrganization(orgData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch user role to determine navigation context
  const fetchUserRole = async () => {
    try {
      const response = await fetch('/api/user/role')
      if (response.ok) {
        const data = await response.json()
        setUserRole(data.role)
      }
    } catch (error) {
      console.error('Error fetching user role:', error)
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

  // Fetch location-specific KPIs
  const fetchLocationKpis = async () => {
    try {
      // Fetch drivers count for this location
      const driversResponse = await fetch('/api/persons')
      if (driversResponse.ok) {
        const driversData = await driversResponse.json()
        const locationDrivers = driversData.filter((person: any) => 
          person.party?.role?.some((role: any) => 
            role.organizationId === params.id && 
            role.locationId === params.locationId
          )
        )
        setKpis(prev => ({ ...prev, driversCount: locationDrivers.length }))
      }

      // Fetch equipment count for this location
      const equipmentResponse = await fetch('/api/equipment')
      if (equipmentResponse.ok) {
        const equipmentData = await equipmentResponse.json()
        const locationEquipment = equipmentData.filter((item: any) => 
          item.party?.role?.some((role: any) => 
            role.organizationId === params.id && 
            role.locationId === params.locationId
          )
        )
        setKpis(prev => ({ ...prev, equipmentCount: locationEquipment.length }))
      }

      // TODO: Add location-specific issue counts when implemented
      setKpis(prev => ({ 
        ...prev, 
        expiringIssues: 0, 
        roadsideInspections: 0, 
        accidents: 0 
      }))
    } catch (error) {
      console.error('Error fetching location KPIs:', error)
    }
  }

  // Fetch drivers assigned to this location
  const fetchLocationDrivers = async () => {
    try {
      const response = await fetch('/api/persons')
      if (response.ok) {
        const data = await response.json()
        const locationDrivers = data.filter((person: any) => 
          person.party?.role?.some((role: any) => 
            role.organizationId === params.id && 
            role.locationId === params.locationId &&
            role.roleType === 'DRIVER'
          )
        )
        setDrivers(locationDrivers)
      }
    } catch (error) {
      console.error('Error fetching location drivers:', error)
    }
  }

  // Fetch equipment assigned to this location
  const fetchLocationEquipment = async () => {
    try {
      const response = await fetch('/api/equipment')
      if (response.ok) {
        const data = await response.json()
        const locationEquipment = data.filter((item: any) => 
          item.party?.role?.some((role: any) => 
            role.organizationId === params.id && 
            role.locationId === params.locationId
          )
        )
        setEquipment(locationEquipment)
      }
    } catch (error) {
      console.error('Error fetching location equipment:', error)
    }
  }

  // Loading state
  if (loading) {
    return (
      <AppLayout
        name="Loading..."
        topNav={[]}
        className="p-6"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!location) {
    return (
      <AppLayout
        name="Not Found"
        topNav={[]}
        className="p-6"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Location not found</h2>
            <Button onClick={() => router.back()}>
              Go Back
            </Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!location) {
    return <div>Location not found</div>
  }

  const overviewContent = (
    <div className="grid gap-6">
      {/* Location Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Location Information</CardTitle>
          <CardDescription>Basic details about this location</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Location Type</p>
              <p className="mt-1 capitalize">{location.locationType}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Main Location</p>
              <Badge variant={location.isMainLocation ? 'default' : 'secondary'}>
                {location.isMainLocation ? 'Main Location' : 'Secondary Location'}
              </Badge>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500">Address</p>
                <p className="mt-1">
                  {location.address}<br />
                  {location.city}, {location.state} {location.zipCode}
                </p>
              </div>
            </div>
            
            {location.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Phone</p>
                  <p className="mt-1">{location.phone}</p>
                </div>
              </div>
            )}
            
            {location.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="mt-1">{location.email}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Drivers</p>
                <p className="text-2xl font-bold">{location._count?.role || 0}</p>
              </div>
              <Users className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Equipment</p>
                <p className="text-2xl font-bold">{location._count?.equipment || 0}</p>
              </div>
              <Truck className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Issues</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <AlertCircle className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const driversContent = (
    <EmptyState
      icon={Users}
      title="No drivers assigned"
      description="Drivers assigned to this location will appear here."
      action={{
        label: "Add Driver",
        onClick: () => {
          // TODO: Implement add driver
        }
      }}
    />
  )

  const equipmentContent = (
    <EmptyState
      icon={Truck}
      title="No equipment assigned"
      description="Equipment assigned to this location will appear here."
      action={{
        label: "Add Equipment",
        onClick: () => {
          // TODO: Implement add equipment
        }
      }}
    />
  )

  const issuesContent = (
    <EmptyState
      icon={AlertCircle}
      title="No active issues"
      description="Compliance issues for this location will appear here."
    />
  )

  const tabs = [
    { id: 'overview', label: 'Overview', content: overviewContent },
    { id: 'drivers', label: 'Drivers', content: driversContent },
    { id: 'equipment', label: 'Equipment', content: equipmentContent },
    { id: 'issues', label: 'Issues', content: issuesContent },
  ]

  // Build contextual navigation based on user role
  const buildTopNav = () => {
    const nav = []
    
    // Add Master if user has master org AND is viewing from outside their primary location
    if (masterOrg && userRole?.roleType !== 'location') {
      nav.push({ label: 'Master', href: '/dashboard', isActive: false })
    }
    
    // Add Organization if not a location manager or if drilling down
    if (userRole?.roleType !== 'location' && organization) {
      nav.push({ 
        label: userRole?.roleType === 'master' ? 'Organization' : 'Organization', 
        href: `/organizations/${params.id}`, 
        isActive: false 
      })
    }
    
    // Add Location for location managers, or current location name for drill-down
    nav.push({ 
      label: userRole?.roleType === 'location' ? 'Location' : location?.name, 
      href: `/organizations/${params.id}/locations/${params.locationId}`, 
      isActive: false 
    })
    
    nav.push({ label: 'Drivers', href: `/organizations/${params.id}/locations/${params.locationId}/drivers`, isActive: false })
    nav.push({ label: 'Equipment', href: `/organizations/${params.id}/locations/${params.locationId}/equipment`, isActive: false })
    
    return nav
  }

  const handleEdit = () => {
    setEditedLocation({ ...location })
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditedLocation(null)
  }

  const handleSave = async () => {
    if (!editedLocation) return
    setIsSaving(true)
    // TODO: Implement location update API call
    setIsEditing(false)
    setIsSaving(false)
  }

  const handleOrganizationSelect = (selectedOrg: any) => {
    setIsSheetOpen(false)
    router.push(`/organizations/${selectedOrg.id}`)
  }

  return (
    <AppLayout
      name={userRole?.roleType === 'location' ? location?.name : (masterOrg?.name || 'Master')}
      topNav={buildTopNav()}
      showOrgSelector={userRole?.roleType !== 'location'}
      sidebarMenu="organization"
      className="p-6"
      organizations={organizations}
      currentOrgId={params.id}
      isSheetOpen={isSheetOpen}
      onSheetOpenChange={setIsSheetOpen}
      onOrganizationSelect={handleOrganizationSelect}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Name row per pagesContentOutline: Location name + Edit/Reports buttons */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{location?.name}</h1>
          
          <div className="flex items-center gap-2">
            {/* Reports Button */}
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Reports
            </Button>
            
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="drivers">Drivers</TabsTrigger>
            <TabsTrigger value="equipment">Equipment</TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-6">
            {/* KPIs Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Overview</CardTitle>
                <CardDescription>
                  Key metrics and counts for {location?.name}
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

            {/* Location Details */}
            <Card>
              <CardHeader>
                <CardTitle>Location Information</CardTitle>
                <CardDescription>
                  Basic details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Location Name</label>
                    <p className="text-gray-900">{location?.name}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Address</label>
                    <p className="text-gray-900">{location?.address || 'Not provided'}</p>
                  </div>
                  {/* Add more location fields as needed */}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Drivers Tab */}
          <TabsContent value="drivers" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Drivers</CardTitle>
                    <CardDescription>
                      Drivers assigned to {location?.name}
                    </CardDescription>
                  </div>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Driver
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {drivers.length > 0 ? (
                  <div className="space-y-4">
                    {/* Driver list implementation */}
                    <p className="text-gray-500">Driver list coming soon...</p>
                  </div>
                ) : (
                  <EmptyState
                    icon={Users}
                    title="No drivers assigned"
                    description="No drivers are currently assigned to this location"
                    action={{
                      label: "Add First Driver",
                      onClick: () => {}
                    }}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Equipment Tab */}
          <TabsContent value="equipment" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Equipment</CardTitle>
                    <CardDescription>
                      Equipment assigned to {location?.name}
                    </CardDescription>
                  </div>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Equipment
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {equipment.length > 0 ? (
                  <div className="space-y-4">
                    {/* Equipment list implementation */}
                    <p className="text-gray-500">Equipment list coming soon...</p>
                  </div>
                ) : (
                  <EmptyState
                    icon={Truck}
                    title="No equipment assigned"
                    description="No equipment is currently assigned to this location"
                    action={{
                      label: "Add First Equipment",
                      onClick: () => {}
                    }}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
} 