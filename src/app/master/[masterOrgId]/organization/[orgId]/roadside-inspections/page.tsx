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
  ShieldCheck,
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  AlertTriangle
} from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"

interface Organization {
  id: string
  name: string
  dotNumber?: string | null
}

interface RoadsideInspection {
  id: string
  reportNumber: string
  inspectionDate: string
  inspectionLocation: string
  driverName: string
  equipmentDescription: string
  violationsCount: number
  status: 'passed' | 'warning' | 'failed'
  overallResult: string
}

export default function OrganizationRoadsideInspectionsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useUser()
  const { masterOrg } = useMasterOrg()
  const masterOrgId = params.masterOrgId as string
  const orgId = params.orgId as string

  const [organization, setOrganization] = useState<Organization | null>(null)
  const [inspections, setInspections] = useState<RoadsideInspection[]>([])
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

    const fetchInspections = async () => {
      try {
        // TODO: Replace with actual API endpoint when available
        // For now, we'll use mock data structure
        const mockInspections: RoadsideInspection[] = [
          {
            id: '1',
            reportNumber: 'US1974906108',
            inspectionDate: '2025-01-07',
            inspectionLocation: 'NEWBERRY SC',
            driverName: 'John Smith',
            equipmentDescription: '2024 Freightliner Cascadia',
            violationsCount: 1,
            status: 'warning',
            overallResult: 'Satisfactory'
          },
          {
            id: '2',
            reportNumber: 'US1974906109', 
            inspectionDate: '2025-01-05',
            inspectionLocation: 'COLUMBIA SC',
            driverName: 'Jane Doe',
            equipmentDescription: '2023 Peterbilt 579',
            violationsCount: 0,
            status: 'passed',
            overallResult: 'No Violations'
          },
          {
            id: '3',
            reportNumber: 'US1974906110',
            inspectionDate: '2025-01-03',
            inspectionLocation: 'CHARLESTON SC',
            driverName: 'Bob Johnson',
            equipmentDescription: '2022 Volvo VNL',
            violationsCount: 3,
            status: 'failed',
            overallResult: 'Out of Service'
          }
        ]

        setInspections(mockInspections)
      } catch (error) {
        console.error('Error fetching inspections:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (orgId) {
      fetchOrganization()
      fetchInspections()
    }
  }, [orgId])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'failed': return 'destructive'
      case 'warning': return 'secondary'
      case 'passed': return 'default'
      default: return 'outline'
    }
  }

  const handleCreateInspection = () => {
    // TODO: Navigate to new inspection form
    console.log('Create new inspection')
  }

  const handleViewInspection = (inspection: RoadsideInspection) => {
    // TODO: Navigate to inspection detail
    console.log('View inspection:', inspection)
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

        {/* Overview Stats */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Roadside Inspections Overview
            </CardTitle>
            <CardDescription>
              All roadside inspections for {organization?.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-700">{inspections.length}</div>
                <div className="text-sm text-gray-600">Total Inspections</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-700">
                  {inspections.filter(i => i.status === 'passed').length}
                </div>
                <div className="text-sm text-green-600">Passed</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="text-2xl font-bold text-yellow-700">
                  {inspections.filter(i => i.status === 'warning').length}
                </div>
                <div className="text-sm text-yellow-600">With Warnings</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="text-2xl font-bold text-red-700">
                  {inspections.filter(i => i.status === 'failed').length}
                </div>
                <div className="text-sm text-red-600">Failed/OOS</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inspections List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Roadside Inspections</CardTitle>
                <CardDescription>
                  All roadside inspections for this organization
                </CardDescription>
              </div>
              <Button onClick={handleCreateInspection}>
                <Plus className="h-4 w-4 mr-2" />
                New Inspection
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {inspections.length > 0 ? (
              <div className="space-y-4">
                {inspections.map((inspection) => (
                  <Card 
                    key={inspection.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleViewInspection(inspection)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-medium text-gray-900">
                              Report #{inspection.reportNumber}
                            </h4>
                            <Badge variant={getStatusColor(inspection.status)}>
                              {inspection.overallResult}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {new Date(inspection.inspectionDate).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              {inspection.inspectionLocation}
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              {inspection.driverName}
                            </div>
                          </div>
                          <div className="mt-2 text-sm text-gray-600">
                            <span className="font-medium">Equipment:</span> {inspection.equipmentDescription}
                          </div>
                          {inspection.violationsCount > 0 && (
                            <div className="mt-2 flex items-center gap-2 text-sm">
                              <AlertTriangle className="h-4 w-4 text-yellow-600" />
                              <span className="text-yellow-700">
                                {inspection.violationsCount} violation{inspection.violationsCount !== 1 ? 's' : ''} found
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={ShieldCheck}
                title="No roadside inspections yet"
                description="Roadside inspections will appear here when they are added to the system"
                action={{
                  label: "Add First Inspection",
                  onClick: handleCreateInspection
                }}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
} 