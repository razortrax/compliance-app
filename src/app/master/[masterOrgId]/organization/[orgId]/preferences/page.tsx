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
  ArrowLeft,
  Settings,
  Bell,
  FileText,
  Users,
  Mail,
  Clock,
  BarChart3,
  Shield,
  Palette,
  Globe,
  AlertTriangle
} from "lucide-react"

interface Organization {
  id: string
  name: string
  dotNumber?: string | null
}

export default function OrganizationPreferencesPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useUser()
  const { masterOrg } = useMasterOrg()
  const masterOrgId = params.masterOrgId as string
  const orgId = params.orgId as string

  const [organization, setOrganization] = useState<Organization | null>(null)
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
      } finally {
        setIsLoading(false)
      }
    }

    if (orgId) {
      fetchOrganization()
    }
  }, [orgId])

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

  // Top navigation breadcrumb
  const topNav = [
    { 
      label: masterOrg?.name || 'Master', 
      href: `/master/${masterOrgId}`,
      isActive: false
    },
    { 
      label: organization?.name || 'Organization', 
      href: `/master/${masterOrgId}/organization/${orgId}`,
      isActive: false
    },
    { 
      label: 'Preferences', 
      href: `/master/${masterOrgId}/organization/${orgId}/preferences`,
      isActive: true
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
              onClick={() => router.push(`/master/${masterOrgId}/organization/${orgId}`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Organization
            </Button>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{organization?.name}</h1>
        </div>

        {/* Coming Soon Hero */}
        <Card className="mb-8 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-green-100 rounded-full">
                <Settings className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Organization Preferences</h2>
            <Badge variant="secondary" className="mb-4">Coming Soon</Badge>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Comprehensive organization settings for customizing reports, notifications, user management, 
              and compliance workflows to match your operational preferences.
            </p>
          </CardContent>
        </Card>

        {/* Feature Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-blue-600" />
                <CardTitle className="text-lg">Report Preferences</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Customize how reports look, what data is included, and default formatting options 
                for compliance documentation.
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <div>• Report templates and branding</div>
                <div>• Default date ranges and filters</div>
                <div>• Data visualization preferences</div>
                <div>• Export formats and scheduling</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Users className="h-6 w-6 text-purple-600" />
                <CardTitle className="text-lg">Staff Distribution</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Manage which staff members receive reports, notifications, and have access 
                to different compliance information.
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <div>• Report distribution lists</div>
                <div>• Role-based access control</div>
                <div>• Notification preferences per role</div>
                <div>• Emergency contact hierarchies</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Bell className="h-6 w-6 text-orange-600" />
                <CardTitle className="text-lg">Notification Settings</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Configure when, how, and how often your organization wants to be reminded 
                of expiring or open compliance issues.
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <div>• Expiration reminder schedules</div>
                <div>• Email vs. in-app notifications</div>
                <div>• Escalation procedures</div>
                <div>• Holiday and weekend settings</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <BarChart3 className="h-6 w-6 text-green-600" />
                <CardTitle className="text-lg">Dashboard Configuration</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Customize dashboard layouts, KPI displays, and default views for 
                different user roles within your organization.
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <div>• Widget arrangement and sizing</div>
                <div>• Default filter settings</div>
                <div>• Role-specific dashboard views</div>
                <div>• Performance metric priorities</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-red-600" />
                <CardTitle className="text-lg">Compliance Policies</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Set organization-specific compliance requirements, grace periods, 
                and enforcement policies for various issue types.
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <div>• Grace period configurations</div>
                <div>• Required vs. optional documentation</div>
                <div>• Approval workflow settings</div>
                <div>• Audit trail requirements</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Clock className="h-6 w-6 text-indigo-600" />
                <CardTitle className="text-lg">Workflow Automation</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Automate routine compliance tasks, set up recurring processes, 
                and configure smart reminders for your team.
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <div>• Automatic renewal scheduling</div>
                <div>• Batch processing preferences</div>
                <div>• Integration trigger settings</div>
                <div>• Smart escalation rules</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Settings Categories */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Additional Configuration Options
            </CardTitle>
            <CardDescription>
              Comprehensive settings for fine-tuning your organization's compliance management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Mail className="h-5 w-5 text-blue-600 mt-1" />
                  <div>
                    <h4 className="font-medium text-gray-900">Communication Templates</h4>
                    <p className="text-sm text-gray-600">
                      Customize email templates for notifications, reports, and compliance 
                      communications with drivers and staff.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Palette className="h-5 w-5 text-purple-600 mt-1" />
                  <div>
                    <h4 className="font-medium text-gray-900">Branding & Appearance</h4>
                    <p className="text-sm text-gray-600">
                      Apply your organization's branding to reports, documents, and system 
                      interfaces for a consistent professional appearance.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Globe className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-medium text-gray-900">Regional Settings</h4>
                    <p className="text-sm text-gray-600">
                      Configure time zones, date formats, measurement units, and local 
                      compliance requirements specific to your operating regions.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <FileText className="h-5 w-5 text-orange-600 mt-1" />
                  <div>
                    <h4 className="font-medium text-gray-900">Document Management</h4>
                    <p className="text-sm text-gray-600">
                      Set default storage locations, retention policies, and naming conventions 
                      for compliance documents and attachments.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Users className="h-5 w-5 text-indigo-600 mt-1" />
                  <div>
                    <h4 className="font-medium text-gray-900">User Access Control</h4>
                    <p className="text-sm text-gray-600">
                      Define user roles, permissions, and access levels for different 
                      areas of the compliance management system.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-red-600 mt-1" />
                  <div>
                    <h4 className="font-medium text-gray-900">Performance Metrics</h4>
                    <p className="text-sm text-gray-600">
                      Choose which KPIs to track, set target values, and configure 
                      performance benchmarks for your organization.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Development Timeline */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-blue-600 mt-1" />
              <div>
                <h4 className="font-medium text-blue-900 mb-2">Development Approach</h4>
                <p className="text-sm text-blue-800 mb-4">
                  Organization preferences will be developed progressively as we implement 
                  reporting processes and identify the most valuable configuration options. 
                  This ensures the preferences system addresses real workflow needs rather 
                  than theoretical requirements.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Core Features Complete ✓</Badge>
                  <Badge variant="outline">Reporting System (Next Phase)</Badge>
                  <Badge variant="outline">Preferences System (Future)</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
} 