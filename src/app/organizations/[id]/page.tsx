"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  MapPin, 
  Users, 
  Truck,
  ArrowLeft,
  Edit,
  Save,
  X,
  Plus,
  Phone,
  FileText,
  Building,
  AlertCircle,
  ChevronRight
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { EmptyState } from "@/components/ui/empty-state"
import { PageHeader } from "@/components/ui/page-header"
import { SectionHeader } from "@/components/ui/section-header"
import { StatusBadge } from "@/components/ui/status-badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { LocationForm } from "@/components/locations/location-form"

interface Organization {
  id: string
  name: string
  dotNumber?: string | null
  einNumber?: string | null
  phone?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  zipCode?: string | null
  party?: {
    status: string
    userId?: string | null
  }
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

export default function OrganizationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const organizationId = params.id as string

  const [organization, setOrganization] = useState<Organization | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editedOrg, setEditedOrg] = useState<Organization | null>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [locations, setLocations] = useState<Location[]>([])
  const [showLocationForm, setShowLocationForm] = useState(false)

  const fetchLocations = async () => {
    if (!organizationId) return
    
    try {
      const response = await fetch(`/api/organizations/${organizationId}/locations`)
      if (response.ok) {
        const data = await response.json()
        setLocations(data)
      } else {
        console.error('Failed to fetch locations - Status:', response.status)
        const errorText = await response.text()
        console.error('Error response:', errorText)
      }
    } catch (error) {
      console.error('Error fetching locations:', error)
    }
  }

  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        const response = await fetch(`/api/organizations/${organizationId}`)
        console.log('API Response status:', response.status)
        
        if (response.ok) {
          const data = await response.json()
          console.log('API Response data:', data)
          setOrganization(data)
          setEditedOrg(data)
        } else {
          console.error('Failed to fetch organization - Status:', response.status)
          const errorText = await response.text()
          console.error('Error response:', errorText)
        }
      } catch (error) {
        console.error('Error fetching organization:', error)
      } finally {
        setIsLoading(false)
      }
    }

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



    if (organizationId) {
      fetchOrganization()
      fetchOrganizations()
      fetchLocations()
    }
  }, [organizationId])

  const handleEdit = () => {
    setIsEditing(true)
    setEditedOrg(organization)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditedOrg(organization)
  }

  const handleSave = async () => {
    if (!editedOrg) return
    
    setIsSaving(true)
    try {
      const response = await fetch(`/api/organizations/${organizationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedOrg),
      })

      if (response.ok) {
        const updatedOrg = await response.json()
        setOrganization(updatedOrg)
        setIsEditing(false)
      } else {
        console.error('Failed to save organization')
      }
    } catch (error) {
      console.error('Error saving organization:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleOrganizationSelect = (selectedOrg: Organization) => {
    setIsSheetOpen(false)
    router.push(`/organizations/${selectedOrg.id}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Organization not found</h2>
            <Button onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {/* Company Selector */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="outline" 
                  size="default"
                  className="h-10 px-3 border-gray-300 hover:bg-gray-50"
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
                      !org.party?.userId && org.id !== organizationId
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
                  })()}
                </div>
              </SheetContent>
            </Sheet>
            
            {/* Page Title */}
            <PageHeader
              title={organization.name}
            />
          </div>
          
          {/* Edit Button (moved to right) */}
          <div>
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

        {/* Tabs Section - Moved to top */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="locations">Locations</TabsTrigger>
            <TabsTrigger value="drivers">Drivers</TabsTrigger>
            <TabsTrigger value="equipment">Equipment</TabsTrigger>
            <TabsTrigger value="issues">Issues</TabsTrigger>
          </TabsList>
          
          {/* Overview Tab - Contains Organization Details */}
          <TabsContent value="overview" className="space-y-4">
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
                      <p className="text-gray-900">
                        {organization.dotNumber === 'NO_DOT' 
                          ? 'No DOT Number' 
                          : organization.dotNumber || 'Not provided'}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>EIN Number</Label>
                    {isEditing ? (
                      <Input
                        value={editedOrg?.einNumber || ''}
                        onChange={(e) => setEditedOrg(prev => prev ? {...prev, einNumber: e.target.value} : null)}
                        placeholder="XX-XXXXXXX"
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

                  <div className="space-y-2 md:col-span-2">
                    <Label>Address</Label>
                    {isEditing ? (
                      <Textarea
                        value={editedOrg?.address || ''}
                        onChange={(e) => setEditedOrg(prev => prev ? {...prev, address: e.target.value} : null)}
                        rows={2}
                      />
                    ) : (
                      <p className="text-gray-900">{organization.address || 'Not provided'}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>City</Label>
                    {isEditing ? (
                      <Input
                        value={editedOrg?.city || ''}
                        onChange={(e) => setEditedOrg(prev => prev ? {...prev, city: e.target.value} : null)}
                      />
                    ) : (
                      <p className="text-gray-900">{organization.city || 'Not provided'}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>State</Label>
                    {isEditing ? (
                      <Input
                        value={editedOrg?.state || ''}
                        onChange={(e) => setEditedOrg(prev => prev ? {...prev, state: e.target.value} : null)}
                      />
                    ) : (
                      <p className="text-gray-900">{organization.state || 'Not provided'}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Zip Code</Label>
                    {isEditing ? (
                      <Input
                        value={editedOrg?.zipCode || ''}
                        onChange={(e) => setEditedOrg(prev => prev ? {...prev, zipCode: e.target.value} : null)}
                      />
                    ) : (
                      <p className="text-gray-900">{organization.zipCode || 'Not provided'}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Locations Tab */}
          <TabsContent value="locations" className="space-y-4">
            <SectionHeader
              title="Locations"
              description="Manage terminals, yards, and offices"
              actions={
                <Dialog open={showLocationForm} onOpenChange={setShowLocationForm}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Location
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Add New Location</DialogTitle>
                      <DialogDescription>
                        Add a new terminal, yard, office, or warehouse location.
                      </DialogDescription>
                    </DialogHeader>
                    <LocationForm
                      organizationId={organizationId}
                      onSuccess={() => {
                        setShowLocationForm(false)
                        fetchLocations()
                      }}
                      onCancel={() => setShowLocationForm(false)}
                    />
                  </DialogContent>
                </Dialog>
              }
            />
            
            {locations.length > 0 ? (
              <div className="grid gap-4">
                {locations.map((location) => (
                  <Card key={location.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{location.name}</h3>
                            {location.isMainLocation && (
                              <Badge variant="default">Main Location</Badge>
                            )}
                            <Badge variant="outline" className="capitalize">
                              {location.locationType}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            {location.address}, {location.city}, {location.state} {location.zipCode}
                          </p>
                          <div className="flex gap-4 text-sm text-gray-500">
                            {location.phone && <span>📞 {location.phone}</span>}
                            {location.email && <span>✉️ {location.email}</span>}
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
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Building2}
                title="No locations yet"
                description="Add terminals, yards, or offices to organize your operations"
                action={{
                  label: "Add First Location",
                  onClick: () => setShowLocationForm(true)
                }}
              />
            )}
          </TabsContent>
          
          {/* Drivers Tab */}
          <TabsContent value="drivers" className="space-y-4">
            <SectionHeader
              title="Drivers"
              description="Manage drivers and their compliance status"
              actions={
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Driver
                </Button>
              }
            />
            
            {/* Empty state for drivers */}
            <EmptyState
              icon={Users}
              title="No drivers yet"
              description="Add drivers to track licenses, medical certificates, and training"
              action={{
                label: "Add First Driver",
                onClick: () => {}
              }}
            />
          </TabsContent>
          
          {/* Equipment Tab */}
          <TabsContent value="equipment" className="space-y-4">
            <SectionHeader
              title="Equipment"
              description="Manage vehicles and their maintenance schedules"
              actions={
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Equipment
                </Button>
              }
            />
            
            {/* Empty state for equipment */}
            <EmptyState
              icon={Truck}
              title="No equipment yet"
              description="Add vehicles to track registrations and maintenance"
              action={{
                label: "Add First Vehicle",
                onClick: () => {}
              }}
            />
          </TabsContent>
          
          {/* Issues Tab */}
          <TabsContent value="issues" className="space-y-4">
            <SectionHeader
              title="Issues"
              description="View and manage compliance issues"
              actions={
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Issue
                </Button>
              }
            />
            
            {/* Empty state for issues */}
            <EmptyState
              icon={AlertCircle}
              title="No issues found"
              description="All compliance items are up to date"
              action={{
                label: "Report an Issue",
                onClick: () => {}
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 