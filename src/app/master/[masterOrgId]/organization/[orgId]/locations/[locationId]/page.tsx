'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { AppLayout } from '@/components/layouts/app-layout'
import { useMasterOrg } from '@/hooks/use-master-org'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState } from '@/components/ui/empty-state'
import { ActivityLog } from '@/components/ui/activity-log'
import { Building2, Users, Truck, MapPin, Phone, Mail, Edit, Plus, FileText } from 'lucide-react'

interface LocationPageProps {
  params: {
    masterOrgId: string
    orgId: string
    locationId: string
  }
}

export default function LocationPage({ params }: LocationPageProps) {
  const router = useRouter()
  const { masterOrg } = useMasterOrg()
  const { masterOrgId, orgId, locationId } = params
  
  const [activeTab, setActiveTab] = useState('details')
  const [location, setLocation] = useState<any>(null)
  const [organization, setOrganization] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // Staff Management
  const [staff, setStaff] = useState<any[]>([])
  
  const [kpis, setKpis] = useState({
    driversCount: 0,
    equipmentCount: 0,
    staffCount: 0,
    expiringIssues: 0
  })

  useEffect(() => {
    fetchLocationData()
    fetchOrganization()
    fetchLocationStaff()
  }, [locationId, orgId])

  const fetchLocationData = async () => {
    try {
      const response = await fetch(`/api/organizations/${orgId}/locations/${locationId}`)
      if (response.ok) {
        const data = await response.json()
        setLocation(data)
      }
    } catch (error) {
      console.error('Error fetching location:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchOrganization = async () => {
    try {
      const response = await fetch(`/api/organizations/${orgId}`)
      if (response.ok) {
        const data = await response.json()
        setOrganization(data)
      }
    } catch (error) {
      console.error('Error fetching organization:', error)
    }
  }

  const fetchLocationStaff = async () => {
    try {
      const response = await fetch(`/api/staff?organizationId=${orgId}&locationId=${locationId}`)
      if (response.ok) {
        const data = await response.json()
        setStaff(data)
        setKpis(prev => ({ ...prev, staffCount: data.length }))
      }
    } catch (error) {
      console.error('Error fetching location staff:', error)
    }
  }

  if (loading) {
    return (
      <AppLayout
        name={masterOrg?.name || 'Loading...'}
        topNav={[
          { label: 'Master', href: `/master/${masterOrgId}`, isActive: false },
          { label: 'Organization', href: `/master/${masterOrgId}/organization/${orgId}`, isActive: true },
          { label: 'Drivers', href: `/master/${masterOrgId}/organization/${orgId}/drivers`, isActive: false },
          { label: 'Equipment', href: `/master/${masterOrgId}/organization/${orgId}/equipment`, isActive: false }
        ]}
        sidebarMenu="organization"
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
        name={masterOrg?.name || 'Not Found'}
        topNav={[
          { label: 'Master', href: `/master/${masterOrgId}`, isActive: false },
          { label: 'Organization', href: `/master/${masterOrgId}/organization/${orgId}`, isActive: true },
          { label: 'Drivers', href: `/master/${masterOrgId}/organization/${orgId}/drivers`, isActive: false },
          { label: 'Equipment', href: `/master/${masterOrgId}/organization/${orgId}/equipment`, isActive: false }
        ]}
        sidebarMenu="organization"
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

  const topNav = [
    { label: 'Master', href: `/master/${masterOrgId}`, isActive: false },
    { label: 'Organization', href: `/master/${masterOrgId}/organization/${orgId}`, isActive: true },
    { label: 'Drivers', href: `/master/${masterOrgId}/organization/${orgId}/drivers`, isActive: false },
    { label: 'Equipment', href: `/master/${masterOrgId}/organization/${orgId}/equipment`, isActive: false }
  ]

  return (
    <AppLayout
      name={masterOrg?.name || 'Fleetrax'}
      topNav={topNav}
      sidebarMenu="organization"
      className="p-6"
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section - Match Organization Page Style */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-gray-600">{organization?.name}</p>
            <h1 className="text-2xl font-bold text-gray-900">{location.name}</h1>
            <p className="text-sm text-gray-500">
              {location.address}, {location.city}, {location.state} {location.zipCode}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Reports
            </Button>
            
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit Location
            </Button>
          </div>
        </div>

        {/* KPIs Overview - Match Organization Page */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Staff Members</p>
                  <p className="text-2xl font-bold text-blue-600">{kpis.staffCount}</p>
                </div>
                <Users className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Drivers</p>
                  <p className="text-2xl font-bold text-green-600">{kpis.driversCount}</p>
                </div>
                <Users className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Equipment</p>
                  <p className="text-2xl font-bold text-purple-600">{kpis.equipmentCount}</p>
                </div>
                <Truck className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Expiring Issues</p>
                  <p className="text-2xl font-bold text-red-600">{kpis.expiringIssues}</p>
                </div>
                <FileText className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs - Match Organization Page Structure */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="staff">
              Staff {staff.length > 0 && <span className="ml-1 px-1.5 py-0.5 text-xs bg-gray-200 rounded-full">{staff.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="drivers">Drivers</TabsTrigger>
            <TabsTrigger value="equipment">Equipment</TabsTrigger>
            <TabsTrigger value="issues">Issues</TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Location Information</CardTitle>
                <CardDescription>Basic details and contact information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Location Name</label>
                      <p className="text-gray-900 font-medium">{location.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Location Type</label>
                      <p className="text-gray-900 capitalize">{location.locationType}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <Badge variant={location.isMainLocation ? 'default' : 'secondary'}>
                        {location.isMainLocation ? 'Main Location' : 'Secondary Location'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div>
                        <label className="text-sm font-medium text-gray-500">Address</label>
                        <p className="text-gray-900">
                          {location.address}<br />
                          {location.city}, {location.state} {location.zipCode}
                        </p>
                      </div>
                    </div>
                    
                    {location.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <div>
                          <label className="text-sm font-medium text-gray-500">Phone</label>
                          <p className="text-gray-900">{location.phone}</p>
                        </div>
                      </div>
                    )}
                    
                    {location.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <div>
                          <label className="text-sm font-medium text-gray-500">Email</label>
                          <p className="text-gray-900">{location.email}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gold Standard Add Ons */}
            <Card>
              <CardHeader>
                <CardTitle>Communications & Documentation</CardTitle>
              </CardHeader>
              <CardContent>
                <ActivityLog issueId={locationId} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Staff Tab */}
          <TabsContent value="staff" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Location Staff</CardTitle>
                <CardDescription>
                  Staff members assigned to {location.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {staff.length === 0 ? (
                  <EmptyState
                    icon={Users}
                    title="No Staff Assigned"
                    description="No staff members are currently assigned to this location."
                  />
                ) : (
                  <div className="space-y-4">
                    {staff.map((member) => (
                      <div
                        key={member.id}
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium">
                              {member.party?.person?.firstName} {member.party?.person?.lastName}
                            </div>
                            <div className="text-sm text-gray-600">{member.position}</div>
                            {member.department && (
                              <div className="text-sm text-gray-500">{member.department}</div>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge variant="outline" className="text-xs">
                              {member.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Drivers Tab */}
          <TabsContent value="drivers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Location Drivers</CardTitle>
                <CardDescription>Drivers assigned to this location</CardDescription>
              </CardHeader>
              <CardContent>
                <EmptyState
                  icon={Users}
                  title="No Drivers"
                  description="Driver assignment to locations coming soon."
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Equipment Tab */}
          <TabsContent value="equipment" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Location Equipment</CardTitle>
                <CardDescription>Equipment assigned to this location</CardDescription>
              </CardHeader>
              <CardContent>
                <EmptyState
                  icon={Truck}
                  title="No Equipment"
                  description="Equipment assignment to locations coming soon."
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Issues Tab */}
          <TabsContent value="issues" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Location Issues</CardTitle>
                <CardDescription>Compliance issues for this location</CardDescription>
              </CardHeader>
              <CardContent>
                <EmptyState
                  icon={FileText}
                  title="No Issues"
                  description="Location-specific compliance issues coming soon."
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
} 