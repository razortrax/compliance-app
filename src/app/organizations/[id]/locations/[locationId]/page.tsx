'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { EntityDetailLayout } from '@/components/layouts/entity-detail-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { Building2, Users, Truck, AlertCircle, MapPin, Phone, Mail, Plus } from 'lucide-react'

interface LocationDetailPageProps {
  params: {
    id: string // organization ID
    locationId: string
  }
}

export default function LocationDetailPage({ params }: LocationDetailPageProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [location, setLocation] = useState<any>(null)
  const [organization, setOrganization] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLocationData()
  }, [params.locationId])

  const fetchLocationData = async () => {
    try {
      // Fetch location details
      const [locResponse, orgResponse] = await Promise.all([
        fetch(`/api/organizations/${params.id}/locations/${params.locationId}`),
        fetch(`/api/organizations/${params.id}`)
      ])

      if (locResponse.ok) {
        const locData = await locResponse.json()
        setLocation(locData)
      }

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

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!location) {
    return <div className="flex items-center justify-center min-h-screen">Location not found</div>
  }

  // Overview tab content
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
              <p className="text-sm font-medium text-gray-500">Status</p>
              <Badge variant={location.isActive ? 'default' : 'secondary'}>
                {location.isActive ? 'Active' : 'Inactive'}
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
                <p className="text-sm font-medium text-gray-600">Staff</p>
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

  // Staff tab content (same pattern as org page)
  const staffContent = (
    <EmptyState
      icon={Users}
      title="No staff assigned"
      description="Staff assigned to this location will appear here."
      action={{
        label: "Assign Staff",
        onClick: () => {
          // TODO: Implement staff assignment
        }
      }}
    />
  )

  // Equipment tab content (same pattern as org page)
  const equipmentContent = (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Equipment at this Location</h3>
        <Button onClick={() => {}}>
          <Plus className="h-4 w-4 mr-2" />
          Add Equipment
        </Button>
      </div>
      <EmptyState
        icon={Truck}
        title="No equipment assigned"
        description="Equipment assigned to this location will appear here."
      />
    </div>
  )

  // Issues tab content (same pattern as org page)
  const issuesContent = (
    <EmptyState
      icon={AlertCircle}
      title="No active issues"
      description="Compliance issues for this location will appear here."
    />
  )

  const tabs = [
    { id: 'overview', label: 'Overview', content: overviewContent },
    { id: 'staff', label: 'Staff', content: staffContent },
    { id: 'equipment', label: 'Equipment', content: equipmentContent },
    { id: 'issues', label: 'Issues', content: issuesContent },
  ]

  return (
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
        { 
          label: 'Edit Location', 
          onClick: () => router.push(`/organizations/${params.id}/locations/${params.locationId}/edit`)
        },
        { 
          label: 'Deactivate Location', 
          onClick: () => {
            // TODO: Implement deactivation
          }, 
          destructive: true 
        },
      ]}
    />
  )
} 