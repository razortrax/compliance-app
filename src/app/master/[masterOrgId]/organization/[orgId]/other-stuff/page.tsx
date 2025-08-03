"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useUser } from '@clerk/nextjs'
import { AppLayout } from '@/components/layouts/app-layout'
import { useMasterOrg } from '@/hooks/use-master-org'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Plus,
  Edit,
  Package,
  ArrowLeft,
  Settings
} from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"
import { ActivityLog } from "@/components/ui/activity-log"

interface Organization {
  id: string
  name: string
  dotNumber?: string | null
}

interface Addon {
  id: string
  name: string
  category: string
  description?: string
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

export default function OrganizationOtherStuffPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useUser()
  const { masterOrg } = useMasterOrg()
  const masterOrgId = params.masterOrgId as string
  const orgId = params.orgId as string

  const [organization, setOrganization] = useState<Organization | null>(null)
  const [addons, setAddons] = useState<Addon[]>([])
  const [selectedAddon, setSelectedAddon] = useState<Addon | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch organization data
  useEffect(() => {
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

    const fetchAddons = async () => {
      try {
        // TODO: Replace with actual API endpoint when available
        // For now, we'll use mock data structure
        const mockAddons: Addon[] = [
          {
            id: '1',
            name: 'Safety Equipment Tracking',
            category: 'Safety',
            description: 'Track safety equipment maintenance and inspections',
            status: 'active',
            createdAt: '2024-01-15',
            updatedAt: '2024-01-20'
          },
          {
            id: '2',
            name: 'Fuel Management System',
            category: 'Operations',
            description: 'Monitor fuel consumption and efficiency metrics',
            status: 'active',
            createdAt: '2024-01-10',
            updatedAt: '2024-01-18'
          },
          {
            id: '3',
            name: 'Route Optimization',
            category: 'Logistics',
            description: 'Optimize delivery routes for efficiency',
            status: 'inactive',
            createdAt: '2024-01-05',
            updatedAt: '2024-01-12'
          }
        ]

        setAddons(mockAddons)
        // Auto-select first addon if any
        if (mockAddons.length > 0 && !selectedAddon) {
          setSelectedAddon(mockAddons[0])
        }
      } catch (error) {
        console.error('Error fetching addons:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (orgId) {
      fetchOrganization()
      fetchAddons()
    }
  }, [orgId, selectedAddon])

  const handleAddAddon = () => {
    // TODO: Implement add addon functionality
    console.log('Add new addon')
  }

  const handleEditAddon = (addon: Addon) => {
    // TODO: Implement edit addon functionality
    console.log('Edit addon:', addon)
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

  // Correct static top navigation - NEVER make these dynamic!
  const topNav = [
    { 
      label: 'Master', 
      href: masterOrg?.id ? `/master/${masterOrg.id}` : '/dashboard',
      isActive: false
    },
    { 
      label: 'Organization', 
      href: `/organizations/${orgId}`,
      isActive: true
    },
    { 
      label: 'Drivers', 
      href: `/organizations/${orgId}/drivers`,
      isActive: false
    },
    { 
      label: 'Equipment', 
      href: `/organizations/${orgId}/equipment`,
      isActive: false
    }
  ]

  return (
    <AppLayout
      name={masterOrg?.name || 'Master'}
      topNav={topNav}
      className="p-6"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header with organization name */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.push(`/organizations/${orgId}`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Organization
            </Button>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{organization?.name}</h1>
        </div>

        {/* Two-block layout: 300px master list + content area */}
        <div className="grid grid-cols-[300px_1fr] gap-6 h-[calc(100vh-200px)]">
          {/* Master List Area */}
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Other Stuff</CardTitle>
                  <CardDescription>
                    Additional organization features and addons
                  </CardDescription>
                </div>
                <Button onClick={handleAddAddon} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="h-[calc(100%-120px)] overflow-y-auto">
              {addons.length > 0 ? (
                <div className="space-y-2">
                  {addons.map((addon) => (
                    <Card 
                      key={addon.id}
                      className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                        selectedAddon?.id === addon.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedAddon(addon)}
                    >
                      <CardContent className="p-3">
                        <div className="space-y-1">
                          <h4 className="font-medium text-sm">{addon.name}</h4>
                          <p className="text-xs text-gray-600">{addon.category}</p>
                          <div className="flex gap-1">
                            <Badge 
                              variant={addon.status === 'active' ? 'default' : 'secondary'}
                              className="text-xs px-1 py-0"
                            >
                              {addon.status}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Package}
                  title="No addons yet"
                  description="Add organization features and addons"
                  action={{
                    label: "Add First Addon",
                    onClick: handleAddAddon
                  }}
                />
              )}
            </CardContent>
          </Card>

          {/* Content Area */}
          <div className="space-y-6">
            {selectedAddon ? (
              <>
                {/* Name row */}
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">{selectedAddon.name}</h2>
                  <Button onClick={() => handleEditAddon(selectedAddon)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>

                {/* Addon Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>Addon Information</CardTitle>
                    <CardDescription>
                      Details and configuration for this addon
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <p className="text-gray-900">{selectedAddon.name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <p className="text-gray-900">{selectedAddon.category}</p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <p className="text-gray-900">{selectedAddon.description || 'No description provided'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <Badge variant={selectedAddon.status === 'active' ? 'default' : 'secondary'}>
                          {selectedAddon.status}
                        </Badge>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                        <p className="text-gray-900">{new Date(selectedAddon.updatedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Activity Log */}
                <ActivityLog 
                  entityType="addon" 
                  entityId={selectedAddon.id}
                  entityName={selectedAddon.name}
                />
              </>
            ) : (
              <div className="h-full flex items-center justify-center">
                <EmptyState
                  icon={Package}
                  title="Select an addon"
                  description="Choose an addon from the list to view details"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
} 