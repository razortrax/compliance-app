'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { EntityDetailLayout } from '@/components/layouts/entity-detail-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { LocationForm } from '@/components/locations/location-form'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Building2, MapPin, Users, Truck, AlertCircle, Plus, Phone, Mail } from 'lucide-react'

interface OrganizationDetailContentProps {
  organizationId: string
}

export function OrganizationDetailContent({ organizationId }: OrganizationDetailContentProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [organization, setOrganization] = useState<any>(null)
  const [locations, setLocations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showLocationModal, setShowLocationModal] = useState(false)

  useEffect(() => {
    fetchOrganizationData()
  }, [organizationId])

  const fetchOrganizationData = async () => {
    try {
      const [orgResponse, locationsResponse] = await Promise.all([
        fetch(`/api/organizations/${organizationId}`),
        fetch(`/api/organizations/${organizationId}/locations`)
      ])

      if (orgResponse.ok) {
        const orgData = await orgResponse.json()
        setOrganization(orgData)
      }

      if (locationsResponse.ok) {
        const locationsData = await locationsResponse.json()
        setLocations(locationsData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!organization) {
    return <div className="flex items-center justify-center min-h-screen">Organization not found</div>
  }

  // Overview tab - organization info + quick stats
  const overviewContent = (
    <div className="grid gap-6">
      {/* Organization Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Information</CardTitle>
          <CardDescription>Basic details and contact information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">DOT Number</p>
              <p className="mt-1">{organization.dotNumber || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">EIN Number</p>
              <p className="mt-1">{organization.einNumber || 'Not provided'}</p>
            </div>
          </div>

          <div className="space-y-3">
            {organization.address && (
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Address</p>
                  <p className="mt-1">
                    {organization.address}<br />
                    {organization.city}, {organization.state} {organization.zipCode}
                  </p>
                </div>
              </div>
            )}
            
            {organization.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Phone</p>
                  <p className="mt-1">{organization.phone}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Locations</p>
                <p className="text-2xl font-bold">{locations.length}</p>
              </div>
              <Building2 className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Staff</p>
                <p className="text-2xl font-bold">0</p>
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
                <p className="text-2xl font-bold">0</p>
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

  // Locations tab
  const locationsContent = (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Locations</h3>
        <Dialog open={showLocationModal} onOpenChange={setShowLocationModal}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Location
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Location</DialogTitle>
            </DialogHeader>
            <LocationForm
              organizationId={organizationId}
              onSuccess={() => {
                setShowLocationModal(false)
                fetchOrganizationData()
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {locations.length > 0 ? (
        <div className="grid gap-4">
          {locations.map((location) => (
            <Card key={location.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div onClick={() => router.push(`/organizations/${organizationId}/locations/${location.id}`)}>
                    <h4 className="font-medium">{location.name}</h4>
                    <p className="text-sm text-gray-500 capitalize">{location.locationType}</p>
                    {location.address && (
                      <p className="text-sm text-gray-600 mt-1">{location.address}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={location.isActive ? 'default' : 'secondary'}>
                      {location.isActive ? 'Active' : 'Inactive'}
                    </Badge>
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
          description="Add your first location to get started with managing this organization."
          action={{
            label: "Add Location",
            onClick: () => setShowLocationModal(true)
          }}
        />
      )}
    </div>
  )

  // Staff tab (same pattern as location page)
  const staffContent = (
    <EmptyState
      icon={Users}
      title="No staff assigned"
      description="Staff members for this organization will appear here."
      action={{
        label: "Add Staff",
        onClick: () => {
          // TODO: Implement staff management
        }
      }}
    />
  )

  // Equipment tab (same pattern as location page)
  const equipmentContent = (
    <EmptyState
      icon={Truck}
      title="No equipment assigned"
      description="Equipment for this organization will appear here."
      action={{
        label: "Add Equipment",
        onClick: () => {
          // TODO: Implement equipment management
        }
      }}
    />
  )

  // Issues tab (same pattern as location page)
  const issuesContent = (
    <EmptyState
      icon={AlertCircle}
      title="No active issues"
      description="Compliance issues for this organization will appear here."
    />
  )

  const tabs = [
    { id: 'overview', label: 'Overview', content: overviewContent },
    { id: 'locations', label: 'Locations', content: locationsContent },
    { id: 'staff', label: 'Staff', content: staffContent },
    { id: 'equipment', label: 'Equipment', content: equipmentContent },
    { id: 'issues', label: 'Issues', content: issuesContent },
  ]

  return (
    <EntityDetailLayout
      entityType="organization"
      entityName={organization.name}
      entityStatus={organization.party?.status || 'active'}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      actions={[
        { 
          label: 'Edit Organization', 
          onClick: () => router.push(`/organizations/${organizationId}/edit`)
        },
        { 
          label: 'View Reports', 
          onClick: () => {
            // TODO: Implement reports
          }
        },
      ]}
    />
  )
} 