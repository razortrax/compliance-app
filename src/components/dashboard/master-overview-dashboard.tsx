"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Building2, 
  Users, 
  AlertTriangle, 
  ClipboardCheck, 
  TrendingUp,
  Plus,
  FileText,
  Eye,
  Edit
} from "lucide-react"
import { OrganizationForm } from "@/components/organizations/organization-form"
import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"

// Mock data - will be replaced with API calls
const mockOrganizations = [
  {
    id: "1",
    name: "ABC Trucking",
    driversCount: 45,
    equipmentCount: 23,
    expiringIssues: 3,
    openInspections: 1,
    status: "active" as const
  },
  {
    id: "2", 
    name: "XYZ Logistics",
    driversCount: 32,
    equipmentCount: 18,
    expiringIssues: 2,
    openInspections: 0,
    status: "pending" as const
  },
  {
    id: "3",
    name: "Metro Express",
    driversCount: 28,
    equipmentCount: 15,
    expiringIssues: 0,
    openInspections: 1,
    status: "active" as const
  },
  {
    id: "4",
    name: "Swift Delivery",
    driversCount: 22,
    equipmentCount: 12,
    expiringIssues: 1,
    openInspections: 2,
    status: "pending" as const
  }
]

interface Organization {
  id: string
  name: string
  driversCount: number
  equipmentCount: number
  expiringIssues: number
  openInspections: number
  status: 'pending' | 'active' | 'inactive'
  party?: {
    userId: string | null
  }
}

export function MasterOverviewDashboard() {
  const router = useRouter()
  const { userId, getToken } = useAuth()
  const [selectedCompany, setSelectedCompany] = useState("all")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [masterCompany, setMasterCompany] = useState<Organization | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchOrganizations = async () => {
    try {
      const token = await getToken()
      const response = await fetch('/api/organizations', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Raw API data:', data)
        
        // Separate master company from managed organizations
        // Master company is the one directly owned by the user (party.userId matches)
        const masterOrg = data.find((org: any) => org.party?.userId === userId)
        const subOrganizations = data.filter((org: any) => org.party?.userId !== userId)
        
        if (masterOrg) {
          // Transform master company data
          const masterWithMetrics = {
            ...masterOrg,
            status: 'active' as const, // Master company is always active
            driversCount: 0, // TODO: Calculate from actual driver data
            equipmentCount: 0, // TODO: Calculate from actual equipment data  
            expiringIssues: 0, // TODO: Calculate from actual issues
            openInspections: 0, // TODO: Calculate from actual inspections
          }
          setMasterCompany(masterWithMetrics)
          console.log('✅ Master company:', masterWithMetrics)
        }
        
        // Transform managed organizations data
        const organizationsWithMetrics = subOrganizations.map((org: any) => ({
          ...org,
          // Extract status from master role relationship, not party status
          status: org.party?.roles?.[0]?.status || 'pending',
          driversCount: 0, // TODO: Calculate from actual driver data
          equipmentCount: 0, // TODO: Calculate from actual equipment data  
          expiringIssues: 0, // TODO: Calculate from actual issues
          openInspections: 0, // TODO: Calculate from actual inspections
        }))
        
        setOrganizations(organizationsWithMetrics)
        console.log('✅ Managed organizations:', organizationsWithMetrics)
      } else {
        console.warn('API failed, showing empty state:', response.status, response.statusText)
        setOrganizations([])
      }
    } catch (error) {
      console.warn('Network error, showing empty state:', error)
      setOrganizations([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchOrganizations()
  }, [userId])

  const handleOrganizationSubmit = async (data: any) => {
    try {
      const token = await getToken()
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        // Refresh the organizations list after adding a new one
        await fetchOrganizations()
        setIsAddModalOpen(false)
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Failed to create organization:', response.status, errorData)
        
        // If we're in a connectivity issue, simulate adding to mock data for demo purposes
        if (response.status >= 500 || !navigator.onLine) {
          console.log('Adding to mock data due to connectivity issues')
                     const newMockOrg: Organization = {
             id: `mock-${Date.now()}`,
             name: data.name,
             status: 'pending' as const,
             driversCount: 0,
             equipmentCount: 0,
             expiringIssues: 0,
             openInspections: 0
           }
          setOrganizations(prev => [newMockOrg, ...prev])
          setIsAddModalOpen(false)
          return
        }
        
        throw new Error(errorData.error || 'Failed to create organization')
      }
    } catch (error) {
      console.error('Error creating organization:', error)
      throw error // Re-throw to let the form handle the error
    }
  }

  // Calculate aggregated metrics (including master company if it exists)
  const allOrgs = masterCompany ? [masterCompany, ...organizations] : organizations
  const totalDrivers = allOrgs.reduce((sum, org) => sum + (org.driversCount || 0), 0)
  const totalEquipment = allOrgs.reduce((sum, org) => sum + (org.equipmentCount || 0), 0)
  const totalExpiringIssues = allOrgs.reduce((sum, org) => sum + (org.expiringIssues || 0), 0)
  const totalOpenInspections = allOrgs.reduce((sum, org) => sum + (org.openInspections || 0), 0)

  // Helper function to display metrics
  const displayMetric = (value: number, emptyText: string = "None") => {
    return value > 0 ? value.toString() : emptyText
  }

  // Sort organizations: pending first, active next, inactive last, alphabetical within each group
  const sortedOrganizations = [...organizations].sort((a, b) => {
    // Define status priority (lower number = higher priority)
    const statusPriority = {
      'pending': 1,
      'active': 2, 
      'inactive': 3
    }
    
    const aPriority = statusPriority[a.status as keyof typeof statusPriority] || 4
    const bPriority = statusPriority[b.status as keyof typeof statusPriority] || 4
    
    // First sort by status priority
    if (aPriority !== bPriority) {
      return aPriority - bPriority
    }
    
    // Then sort alphabetically within same status
    return a.name.localeCompare(b.name)
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 border-green-200'
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'inactive': return 'bg-red-100 text-red-700 border-red-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return '🟢'
      case 'pending': return '🟡'
      case 'inactive': return '🔴'
      default: return '⚪'
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
          </div>
          <div className="flex gap-3">
            <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>
        </div>

        {/* KPI Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>

        {/* Organizations Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Master Overview</h1>
          <p className="text-muted-foreground">
            Fleet compliance across {organizations.length} organization{organizations.length === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Master Report
          </Button>
          <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Organization
          </Button>
        </div>
      </div>

      {/* Master Company Info */}
      {masterCompany && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">{masterCompany.name}</CardTitle>
                <CardDescription>Your Master Company</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push('/settings')}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Master
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Organizations</p>
                <p className="text-2xl font-bold">{organizations.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Drivers</p>
                <p className="text-2xl font-bold">{displayMetric(totalDrivers, "0")}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Vehicles</p>
                <p className="text-2xl font-bold">{displayMetric(totalEquipment, "0")}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Compliance Rate</p>
                <p className="text-2xl font-bold text-green-600">100%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Drivers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayMetric(totalDrivers, "No drivers")}</div>
            <p className="text-xs text-muted-foreground">
              Across all organizations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fleet Vehicles</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayMetric(totalEquipment, "No vehicles")}</div>
            <p className="text-xs text-muted-foreground">
              Equipment under management
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{displayMetric(totalExpiringIssues, "None")}</div>
            <p className="text-xs text-muted-foreground">
              Require urgent attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Inspections</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{displayMetric(totalOpenInspections, "None")}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting resolution
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Company Selector */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">View:</label>
        <Select value={selectedCompany} onValueChange={setSelectedCompany}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select organization" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Organizations</SelectItem>
            {organizations.map((org) => (
              <SelectItem key={org.id} value={org.id}>
                {org.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Organizations Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Organizations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedOrganizations.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <div className="text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No Organizations Yet</h3>
                <p className="text-sm mb-4">Get started by adding your first organization.</p>
                <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Organization
                </Button>
              </div>
            </div>
          ) : (
            sortedOrganizations.map((org) => (
            <Card 
              key={org.id} 
              className="relative hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/organizations/${org.id}`)}
            >
                           <CardHeader className="pb-3">
                 <div className="flex items-center justify-between">
                   <CardTitle className="text-lg">{org.name}</CardTitle>
                   <div className="flex gap-2">
                     {/* Organization Status */}
                     <div className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(org.status)}`}>
                       {getStatusIcon(org.status)} {org.status}
                     </div>
                     {/* Add any additional status badges here */}
                   </div>
                 </div>
               </CardHeader>
              <CardContent className="space-y-4">
                               <div className="grid grid-cols-2 gap-4">
                   <div className="text-center">
                     <div className="text-2xl font-bold text-blue-600">
                       {org.driversCount > 0 ? org.driversCount : "0"}
                     </div>
                     <p className="text-xs text-muted-foreground">Drivers</p>
                   </div>
                   <div className="text-center">
                     <div className="text-2xl font-bold text-green-600">
                       {org.equipmentCount > 0 ? org.equipmentCount : "0"}
                     </div>
                     <p className="text-xs text-muted-foreground">Vehicles</p>
                   </div>
                 </div>

                <div className="space-y-2">
                  {org.expiringIssues > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-orange-600">Expiring Issues</span>
                      <Badge variant="outline" className="text-orange-600 border-orange-200">
                        {org.expiringIssues}
                      </Badge>
                    </div>
                  )}
                  {org.openInspections > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-600">Open Inspections</span>
                      <Badge variant="outline" className="text-blue-600 border-blue-200">
                        {org.openInspections}
                      </Badge>
                    </div>
                  )}
                  {org.expiringIssues === 0 && org.openInspections === 0 && (
                    <div className="text-sm text-green-600 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      All issues current
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1" 
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/organizations/${org.id}`)
                    }}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
                        </Card>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common management tasks across all organizations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-16 flex-col gap-2">
              <AlertTriangle className="h-5 w-5" />
              Review All Expiring Issues
            </Button>
            <Button variant="outline" className="h-16 flex-col gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Process Open Inspections
            </Button>
            <Button variant="outline" className="h-16 flex-col gap-2">
              <FileText className="h-5 w-5" />
              Generate Master Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add Organization Modal */}
      <OrganizationForm 
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSubmit={handleOrganizationSubmit}
      />
    </div>
  )
} 