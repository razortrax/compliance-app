"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useUser } from '@clerk/nextjs'
import { AppLayout } from '@/components/layouts/app-layout'
import { useMasterOrg } from '@/hooks/use-master-org'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  AlertTriangle,
  ArrowLeft,
  Calendar,
  User,
  Truck,
  Clock,
  CheckCircle
} from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"

interface Organization {
  id: string
  name: string
  dotNumber?: string | null
}

interface ExpiringIssue {
  id: string
  issueType: 'license' | 'mvr' | 'physical' | 'training' | 'drug_alcohol'
  title: string
  expiryDate: string
  daysUntilExpiry: number
  status: 'expiring_soon' | 'expired' | 'grace_period'
  driverName?: string
  driverId?: string
  equipmentName?: string
  equipmentId?: string
}

export default function OrganizationIssuesPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useUser()
  const { masterOrg } = useMasterOrg()
  const masterOrgId = params.masterOrgId as string
  const orgId = params.orgId as string

  const [organization, setOrganization] = useState<Organization | null>(null)
  const [issues60d, setIssues60d] = useState<ExpiringIssue[]>([])
  const [issues30d, setIssues30d] = useState<ExpiringIssue[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('60d')

  // Fetch organization data and issues
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

    const fetchExpiringIssues = async () => {
      try {
        // TODO: Replace with actual API endpoint when available
        // For now, we'll use mock data structure
        const mockIssues60d: ExpiringIssue[] = [
          {
            id: '1',
            issueType: 'license',
            title: 'CDL License Renewal',
            expiryDate: '2025-03-15',
            daysUntilExpiry: 45,
            status: 'expiring_soon',
            driverName: 'John Smith',
            driverId: 'driver1'
          },
          {
            id: '2', 
            issueType: 'physical',
            title: 'DOT Physical Exam',
            expiryDate: '2025-02-28',
            daysUntilExpiry: 30,
            status: 'expiring_soon',
            driverName: 'Jane Doe',
            driverId: 'driver2'
          }
        ]

        const mockIssues30d: ExpiringIssue[] = [
          {
            id: '3',
            issueType: 'mvr',
            title: 'Motor Vehicle Record Check',
            expiryDate: '2025-02-10',
            daysUntilExpiry: 12,
            status: 'expiring_soon',
            driverName: 'Bob Johnson',
            driverId: 'driver3'
          }
        ]

        setIssues60d(mockIssues60d)
        setIssues30d(mockIssues30d)
      } catch (error) {
        console.error('Error fetching expiring issues:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (orgId) {
      fetchOrganization()
      fetchExpiringIssues()
    }
  }, [orgId])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'expired': return 'destructive'
      case 'grace_period': return 'secondary'
      case 'expiring_soon': return 'outline'
      default: return 'outline'
    }
  }

  const getIssueTypeIcon = (issueType: string) => {
    switch (issueType) {
      case 'license': return <User className="h-4 w-4" />
      case 'mvr': return <Truck className="h-4 w-4" />
      case 'physical': return <CheckCircle className="h-4 w-4" />
      case 'training': return <Calendar className="h-4 w-4" />
      case 'drug_alcohol': return <AlertTriangle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const handleIssueClick = (issue: ExpiringIssue) => {
    if (issue.driverId) {
      router.push(`/master/${masterOrgId}/organization/${orgId}/driver/${issue.driverId}/${issue.issueType}`)
    }
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

  const renderIssuesList = (issues: ExpiringIssue[]) => (
    issues.length > 0 ? (
      <div className="space-y-3">
        {issues.map((issue) => (
          <Card 
            key={issue.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleIssueClick(issue)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {getIssueTypeIcon(issue.issueType)}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{issue.title}</h4>
                    <p className="text-sm text-gray-600">
                      {issue.driverName} • Expires {new Date(issue.expiryDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusColor(issue.status)}>
                    {issue.daysUntilExpiry} days
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {issue.issueType.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    ) : (
      <EmptyState
        icon={CheckCircle}
        title="No expiring issues"
        description="All compliance requirements are up to date"
      />
    )
  )

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
              onClick={() => router.push(`/master/${masterOrgId}/organization/${orgId}`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Organization
            </Button>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{organization?.name}</h1>
        </div>

        {/* Issues Overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Expiring Issues Overview
            </CardTitle>
            <CardDescription>
              Track compliance requirements expiring within 60 and 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="text-2xl font-bold text-yellow-700">{issues60d.length}</div>
                <div className="text-sm text-yellow-600">Expiring within 60 days</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="text-2xl font-bold text-orange-700">{issues30d.length}</div>
                <div className="text-sm text-orange-600">Expiring within 30 days</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="text-2xl font-bold text-red-700">0</div>
                <div className="text-sm text-red-600">Expired issues</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Issues Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="60d" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              60 Days ({issues60d.length})
            </TabsTrigger>
            <TabsTrigger value="30d" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              30 Days ({issues30d.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="60d" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Issues Expiring within 60 Days</CardTitle>
                <CardDescription>
                  Compliance requirements that need attention within the next 60 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderIssuesList(issues60d)}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="30d" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Issues Expiring within 30 Days</CardTitle>
                <CardDescription>
                  Urgent compliance requirements that need immediate attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderIssuesList(issues30d)}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Help Text */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Stay Compliant</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Click on any issue to view details and take action. Keeping up with expiring requirements 
                  helps maintain compliance and avoid violations during inspections.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
} 