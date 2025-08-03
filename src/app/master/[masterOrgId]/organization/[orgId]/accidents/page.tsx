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
  Car,
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  AlertTriangle,
  DollarSign
} from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"

interface Organization {
  id: string
  name: string
  dotNumber?: string | null
}

interface Accident {
  id: string
  reportNumber: string
  accidentDate: string
  accidentLocation: string
  driverName: string
  equipmentDescription: string
  severity: 'minor' | 'moderate' | 'severe'
  injuriesCount: number
  fatalities: number
  estimatedDamage: number
  status: 'reported' | 'investigating' | 'closed'
}

export default function OrganizationAccidentsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useUser()
  const { masterOrg } = useMasterOrg()
  const masterOrgId = params.masterOrgId as string
  const orgId = params.orgId as string

  const [organization, setOrganization] = useState<Organization | null>(null)
  const [accidents, setAccidents] = useState<Accident[]>([])
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

    const fetchAccidents = async () => {
      try {
        // TODO: Replace with actual API endpoint when available
        // For now, we'll use mock data structure
        const mockAccidents: Accident[] = [
          {
            id: '1',
            reportNumber: 'ACC-2025-001',
            accidentDate: '2025-01-05',
            accidentLocation: 'I-95 North, Mile Marker 45',
            driverName: 'John Smith',
            equipmentDescription: '2024 Freightliner Cascadia',
            severity: 'minor',
            injuriesCount: 0,
            fatalities: 0,
            estimatedDamage: 5000,
            status: 'closed'
          },
          {
            id: '2',
            reportNumber: 'ACC-2025-002',
            accidentDate: '2025-01-03',
            accidentLocation: 'US-301 South, Columbia SC',
            driverName: 'Jane Doe',
            equipmentDescription: '2023 Peterbilt 579',
            severity: 'moderate',
            injuriesCount: 1,
            fatalities: 0,
            estimatedDamage: 15000,
            status: 'investigating'
          },
          {
            id: '3',
            reportNumber: 'ACC-2025-003',
            accidentDate: '2025-01-01',
            accidentLocation: 'I-26 West, Charleston SC',
            driverName: 'Bob Johnson',
            equipmentDescription: '2022 Volvo VNL',
            severity: 'severe',
            injuriesCount: 2,
            fatalities: 0,
            estimatedDamage: 35000,
            status: 'investigating'
          }
        ]

        setAccidents(mockAccidents)
      } catch (error) {
        console.error('Error fetching accidents:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (orgId) {
      fetchOrganization()
      fetchAccidents()
    }
  }, [orgId])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'severe': return 'destructive'
      case 'moderate': return 'secondary'
      case 'minor': return 'default'
      default: return 'outline'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'closed': return 'default'
      case 'investigating': return 'secondary'
      case 'reported': return 'outline'
      default: return 'outline'
    }
  }

  const handleCreateAccident = () => {
    // TODO: Navigate to new accident form
    console.log('Create new accident report')
  }

  const handleViewAccident = (accident: Accident) => {
    // TODO: Navigate to accident detail
    console.log('View accident:', accident)
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
              <Car className="h-5 w-5" />
              Accidents Overview
            </CardTitle>
            <CardDescription>
              All accident reports for {organization?.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-700">{accidents.length}</div>
                <div className="text-sm text-gray-600">Total Accidents</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-700">
                  {accidents.filter(a => a.severity === 'minor').length}
                </div>
                <div className="text-sm text-green-600">Minor</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="text-2xl font-bold text-yellow-700">
                  {accidents.filter(a => a.severity === 'moderate').length}
                </div>
                <div className="text-sm text-yellow-600">Moderate</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="text-2xl font-bold text-red-700">
                  {accidents.filter(a => a.severity === 'severe').length}
                </div>
                <div className="text-sm text-red-600">Severe</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-700">
                  ${accidents.reduce((sum, a) => sum + a.estimatedDamage, 0).toLocaleString()}
                </div>
                <div className="text-sm text-blue-600">Total Damage</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Accidents List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Accidents</CardTitle>
                <CardDescription>
                  All accident reports for this organization
                </CardDescription>
              </div>
              <Button onClick={handleCreateAccident}>
                <Plus className="h-4 w-4 mr-2" />
                New Accident Report
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {accidents.length > 0 ? (
              <div className="space-y-4">
                {accidents.map((accident) => (
                  <Card 
                    key={accident.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleViewAccident(accident)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-medium text-gray-900">
                              {accident.reportNumber}
                            </h4>
                            <Badge variant={getSeverityColor(accident.severity)}>
                              {accident.severity.charAt(0).toUpperCase() + accident.severity.slice(1)}
                            </Badge>
                            <Badge variant={getStatusColor(accident.status)}>
                              {accident.status.charAt(0).toUpperCase() + accident.status.slice(1)}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {new Date(accident.accidentDate).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              {accident.accidentLocation}
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              {accident.driverName}
                            </div>
                          </div>
                          <div className="mt-2 text-sm text-gray-600">
                            <span className="font-medium">Equipment:</span> {accident.equipmentDescription}
                          </div>
                          <div className="mt-2 flex items-center gap-4 text-sm">
                            {accident.injuriesCount > 0 && (
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                <span className="text-yellow-700">
                                  {accident.injuriesCount} injur{accident.injuriesCount !== 1 ? 'ies' : 'y'}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-blue-600" />
                              <span className="text-blue-700">
                                ${accident.estimatedDamage.toLocaleString()} estimated damage
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Car}
                title="No accidents reported"
                description="Accident reports will appear here when they are added to the system"
                action={{
                  label: "Add First Accident Report",
                  onClick: handleCreateAccident
                }}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
} 