'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { EntityDetailLayout } from '@/components/layouts/entity-detail-layout'
import { DataTable } from '@/components/ui/data-table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { LocationForm } from '@/components/locations/location-form'
import { Building2, Users, Truck, AlertCircle, MapPin, Phone, Mail } from 'lucide-react'

interface LocationDetailPageProps {
  params: {
    id: string
    locationId: string
  }
}

export default function LocationDetailPage({ params }: LocationDetailPageProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [location, setLocation] = useState<any>(null)
  const [organization, setOrganization] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    fetchLocationData()
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

  const handleEditLocation = () => {
    setShowEditModal(true)
  }

  const handleDeactivateLocation = async () => {
    if (!confirm('Are you sure you want to deactivate this location?')) {
      return
    }
    
    try {
      const response = await fetch(`/api/organizations/${params.id}/locations/${params.locationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: false
        }),
      })
      
      if (response.ok) {
        // Refresh the data
        fetchLocationData()
      } else {
        console.error('Failed to deactivate location')
      }
    } catch (error) {
      console.error('Error deactivating location:', error)
    }
  }

  if (loading) {
    return <div>Loading...</div>
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

  return (
    <>
      <EntityDetailLayout
        entityType="location"
        entityName={location.name}
        entityStatus={location.isActive ? 'active' : 'inactive'}
        breadcrumbs={[
          { label: organization?.name || 'Organization', href: `/organizations/${params.id}` }
        ]}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={[
          { label: 'Edit Location', onClick: handleEditLocation },
          { 
            label: location.isActive ? 'Deactivate Location' : 'Activate Location', 
            onClick: handleDeactivateLocation, 
            destructive: location.isActive 
          },
        ]}
      />

      {/* Edit Location Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Location</DialogTitle>
            <DialogDescription>
              Update the location details and settings.
            </DialogDescription>
          </DialogHeader>
          <LocationForm
            organizationId={params.id}
            location={location}
            onSuccess={() => {
              setShowEditModal(false)
              fetchLocationData() // Refresh location data
            }}
            onCancel={() => setShowEditModal(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
} 