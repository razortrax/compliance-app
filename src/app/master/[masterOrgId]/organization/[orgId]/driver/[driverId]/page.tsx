"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layouts/app-layout'
import { buildStandardDriverNavigation } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import {
  User, IdCard, Car, GraduationCap, AlertCircle, CheckCircle, Clock, Shield
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

interface Driver {
  id: string
  firstName: string
  lastName: string
  licenseNumber?: string
  phone?: string
  email?: string
}

interface Organization {
  id: string
  name: string
}

interface MasterOrg {
  id: string
  name: string
}

interface ComplianceOverview {
  licenses: {
    total: number
    current: number
    expiring: number
    expired: number
  }
  mvrs: {
    total: number
    current: number
    expiring: number
    expired: number
  }
  training: {
    total: number
    required: number
    current: number
    expiring: number
    expired: number
  }
  physicals: {
    total: number
    current: number
    expiring: number
    expired: number
  }
}

interface PageData {
  masterOrg: MasterOrg
  organization: Organization
  driver: Driver
  compliance: ComplianceOverview
}

export default function MasterDriverOverviewPage() {
  const params = useParams()
  const router = useRouter()
  const masterOrgId = params.masterOrgId as string
  const orgId = params.orgId as string
  const driverId = params.driverId as string
  
  const [data, setData] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
    fetchOrganizations()
    fetchUserRole()
  }, [masterOrgId, orgId, driverId])

  const fetchUserRole = async () => {
    try {
      const response = await fetch('/api/user/role')
      if (response.ok) {
        const data = await response.json()
        setUserRole(data.role?.roleType || null)
      }
    } catch (error) {
      console.error('Error fetching user role:', error)
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch driver overview data using URL context
      const response = await fetch(`/api/master/${masterOrgId}/organization/${orgId}/driver/${driverId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch driver overview data')
      }
      
      const pageData = await response.json()
      setData(pageData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations')
      if (response.ok) {
        const orgs = await response.json()
        setOrganizations(orgs)
      }
    } catch (error) {
      console.error('Error fetching organizations:', error)
    }
  }

  const handleOrganizationSelect = (org: Organization) => {
    console.log('Organization selected:', org.id)
  }

  // Get status badge for compliance numbers
  const getComplianceBadge = (current: number, expiring: number, expired: number) => {
    if (expired > 0) {
      return <Badge variant="destructive" className="flex items-center gap-1">
        <AlertCircle className="h-3 w-3" />
        {expired} Expired
      </Badge>
    }
    if (expiring > 0) {
      return <Badge className="flex items-center gap-1 bg-orange-100 text-orange-800 border-orange-200">
        <Clock className="h-3 w-3" />
        {expiring} Expiring
      </Badge>
    }
    if (current > 0) {
      return <Badge className="flex items-center gap-1 bg-green-100 text-green-800 border-green-200">
        <CheckCircle className="h-3 w-3" />
        All Current
      </Badge>
    }
    return <Badge variant="secondary">None</Badge>
  }

  if (loading) {
    return (
      <AppLayout 
        name="Loading..."
        topNav={[]}
        className="p-6"
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AppLayout>
    )
  }

  if (error || !data) {
    return (
      <AppLayout 
        name="FleeTrax"
        topNav={[]}
        className="p-6"
      >
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Data</h2>
          <p className="text-gray-600">{error}</p>
          <Button 
            onClick={() => router.refresh()} 
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      </AppLayout>
    )
  }

  // Build standard navigation
  const topNav = buildStandardDriverNavigation(
    masterOrgId,
    orgId,
    driverId,
    userRole || undefined
  )

  return (
      <AppLayout 
        name={data.masterOrg.name}
        topNav={topNav}
        sidebarMenu="driver"
        driverId={driverId}
        masterOrgId={masterOrgId}
        currentOrgId={orgId}
        className="p-6"
      >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Driver Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-gray-600">{data.organization.name}</p>
            <h1 className="text-3xl font-bold text-gray-900">
              {data.driver.firstName} {data.driver.lastName}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              {data.driver.licenseNumber && (
                <span>License: {data.driver.licenseNumber}</span>
              )}
              {data.driver.phone && (
                <span>Phone: {data.driver.phone}</span>
              )}
              {data.driver.email && (
                <span>Email: {data.driver.email}</span>
              )}
            </div>
          </div>
        </div>

        {/* Compliance Overview Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Licenses Card */}
          <Link href={`/master/${masterOrgId}/organization/${orgId}/driver/${driverId}/licenses`}>
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Licenses</CardTitle>
                <IdCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.compliance.licenses.total}</div>
                <div className="mt-2">
                  {getComplianceBadge(
                    data.compliance.licenses.current,
                    data.compliance.licenses.expiring,
                    data.compliance.licenses.expired
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Click to view all licenses
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* MVRs Card */}
          <Link href={`/master/${masterOrgId}/organization/${orgId}/driver/${driverId}/mvr-issue`}>
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">MVRs</CardTitle>
                <Car className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.compliance.mvrs.total}</div>
                <div className="mt-2">
                  {getComplianceBadge(
                    data.compliance.mvrs.current,
                    data.compliance.mvrs.expiring,
                    data.compliance.mvrs.expired
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Click to view all MVRs
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Training Card */}
          <Link href={`/master/${masterOrgId}/organization/${orgId}/driver/${driverId}/training`}>
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Training</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.compliance.training.total}</div>
                <div className="flex items-center gap-2 mt-2">
                  {getComplianceBadge(
                    data.compliance.training.current,
                    data.compliance.training.expiring,
                    data.compliance.training.expired
                  )}
                  {data.compliance.training.required > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      <Shield className="h-3 w-3 mr-1" />
                      {data.compliance.training.required} DOT Required
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Click to view all training
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Physicals Card */}
          <Card className="opacity-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Physicals</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.compliance.physicals.total}</div>
              <div className="mt-2">
                <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Physical exams tracking
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks for this driver
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <Link href={`/master/${masterOrgId}/organization/${orgId}/driver/${driverId}/licenses`}>
                <Button variant="outline" className="w-full justify-start">
                  <IdCard className="h-4 w-4 mr-2" />
                  Add License
                </Button>
              </Link>
              <Link href={`/master/${masterOrgId}/organization/${orgId}/driver/${driverId}/mvr-issue`}>
                <Button variant="outline" className="w-full justify-start">
                  <Car className="h-4 w-4 mr-2" />
                  Add MVR
                </Button>
              </Link>
              <Link href={`/master/${masterOrgId}/organization/${orgId}/driver/${driverId}/training`}>
                <Button variant="outline" className="w-full justify-start">
                  <GraduationCap className="h-4 w-4 mr-2" />
                  Add Training
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Compliance Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Compliance Summary</CardTitle>
            <CardDescription>
              Overall compliance status for {data.driver.firstName} {data.driver.lastName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <IdCard className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Licenses</p>
                    <p className="text-sm text-gray-600">{data.compliance.licenses.total} total records</p>
                  </div>
                </div>
                {getComplianceBadge(
                  data.compliance.licenses.current,
                  data.compliance.licenses.expiring,
                  data.compliance.licenses.expired
                )}
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Car className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">Motor Vehicle Records</p>
                    <p className="text-sm text-gray-600">{data.compliance.mvrs.total} total records</p>
                  </div>
                </div>
                {getComplianceBadge(
                  data.compliance.mvrs.current,
                  data.compliance.mvrs.expiring,
                  data.compliance.mvrs.expired
                )}
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <GraduationCap className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-medium">Training Records</p>
                    <p className="text-sm text-gray-600">
                      {data.compliance.training.total} total • {data.compliance.training.required} DOT required
                    </p>
                  </div>
                </div>
                {getComplianceBadge(
                  data.compliance.training.current,
                  data.compliance.training.expiring,
                  data.compliance.training.expired
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
} 