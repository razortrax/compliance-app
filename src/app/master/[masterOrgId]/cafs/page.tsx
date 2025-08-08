'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layouts/app-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, Filter, Plus, Eye, Edit, FileText, Clock, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import { buildStandardNavigation } from '@/lib/utils'

interface CAF {
  id: string
  cafNumber: string
  incidentId: string
  violationType: string
  violationCodes: string[]
  violationSummary: string
  title?: string
  description?: string
  priority: string
  category: string
  status: string
  assignedStaffId?: string
  assignedBy?: string
  organizationId: string
  dueDate?: string
  createdAt: string
  updatedAt: string
  assigned_staff?: {
    id: string
    position: string
    party: {
      person: {
        firstName: string
        lastName: string
      }
    }
  }
  created_by_staff?: {
    party: {
      person: {
        firstName: string
        lastName: string
      }
    }
  }
  organization?: {
    id: string
    name: string
  }
}

interface UserPermissions {
  canCreateCAFs: boolean
  userType: 'master' | 'organization' | 'none'
  canAssignCrossOrg: boolean
  name: string
  organization?: {
    id: string
    name: string
  }
}

export default function CAFManagementPage() {
  const params = useParams()
  const router = useRouter()
  const masterOrgId = params.masterOrgId as string
  
  const [cafs, setCAFs] = useState<CAF[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [organizationFilter, setOrganizationFilter] = useState('all')
  const [selectedCAF, setSelectedCAF] = useState<CAF | null>(null)
  const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null)
  const [masterOrg, setMasterOrg] = useState<any>(null)

  // Fetch user permissions
  useEffect(() => {
    async function fetchUserPermissions() {
      try {
        const response = await fetch('/api/user/caf-permissions')
        if (response.ok) {
          const permissions = await response.json()
          setUserPermissions(permissions)
        }
      } catch (error) {
        console.error('Error fetching user permissions:', error)
      }
    }
    
    fetchUserPermissions()
  }, [])

  // Fetch master organization data
  useEffect(() => {
    async function fetchMasterOrg() {
      try {
        const response = await fetch(`/api/master/${masterOrgId}/organizations`)
        if (response.ok) {
          const data = await response.json()
          setMasterOrg(data.masterOrg)
        }
      } catch (error) {
        console.error('Error fetching master org:', error)
      }
    }
    
    fetchMasterOrg()
  }, [masterOrgId])

  // Fetch CAFs
  useEffect(() => {
    async function fetchCAFs() {
      try {
        setLoading(true)
        const response = await fetch('/api/corrective-action-forms')
        if (response.ok) {
          const data = await response.json()
          setCAFs(data)
        }
      } catch (error) {
        console.error('Error fetching CAFs:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchCAFs()
  }, [])

  // Filter CAFs based on search and filters
  const filteredCAFs = cafs.filter(caf => {
    const matchesSearch = searchTerm === '' || 
      caf.cafNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caf.violationSummary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caf.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caf.organization?.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || caf.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || caf.priority === priorityFilter
    const matchesOrg = organizationFilter === 'all' || caf.organizationId === organizationFilter
    
    return matchesSearch && matchesStatus && matchesPriority && matchesOrg
  })

  // Get unique organizations for filter
  const organizations = Array.from(new Set(cafs.map(caf => caf.organizationId)))
    .map(orgId => cafs.find(caf => caf.organizationId === orgId)?.organization)
    .filter((org): org is NonNullable<CAF['organization']> => Boolean(org))

  // Get status badge variant and icon
  function getStatusInfo(status: string) {
    switch (status) {
      case 'ASSIGNED':
        return { variant: 'secondary' as const, icon: Clock, label: 'Assigned' }
      case 'IN_PROGRESS':
        return { variant: 'default' as const, icon: AlertTriangle, label: 'In Progress' }
      case 'COMPLETED':
        return { variant: 'default' as const, icon: CheckCircle, label: 'Completed' }
      case 'APPROVED':
        return { variant: 'default' as const, icon: CheckCircle, label: 'Approved' }
      case 'REJECTED':
        return { variant: 'destructive' as const, icon: XCircle, label: 'Rejected' }
      default:
        return { variant: 'secondary' as const, icon: Clock, label: status }
    }
  }

  // Get priority badge variant
  function getPriorityVariant(priority: string) {
    switch (priority) {
      case 'HIGH': return 'destructive' as const
      case 'MEDIUM': return 'default' as const
      case 'LOW': return 'secondary' as const
      default: return 'secondary' as const
    }
  }

  // Build navigation
  const topNav = [
    { label: 'Master', href: `/master/${masterOrgId}`, isActive: false },
    { label: 'CAFs', href: `/master/${masterOrgId}/cafs`, isActive: true }
  ]

  if (loading || !userPermissions) {
    return (
      <AppLayout
        name={masterOrg?.name || 'Fleetrax'}
        topNav={topNav}
        sidebarMenu="master"
      >
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading CAFs...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout
      name={masterOrg?.name || 'Fleetrax'}
      topNav={topNav}
      sidebarMenu="master"
    >
      <div className="flex flex-col h-full max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex-shrink-0 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Corrective Action Forms</h1>
              <p className="text-gray-600 mt-1">
                Manage and track CAFs across {userPermissions.userType === 'master' ? 'all organizations' : 'your organization'}
              </p>
            </div>
            {userPermissions.canCreateCAFs && (
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                New CAF
              </Button>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-yellow-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Assigned</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {cafs.filter(caf => caf.status === 'ASSIGNED').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <AlertTriangle className="h-8 w-8 text-orange-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">In Progress</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {cafs.filter(caf => caf.status === 'IN_PROGRESS').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {cafs.filter(caf => ['COMPLETED', 'APPROVED'].includes(caf.status)).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <FileText className="h-8 w-8 text-blue-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total CAFs</p>
                    <p className="text-2xl font-bold text-gray-900">{cafs.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex-shrink-0 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search CAFs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="ASSIGNED">Assigned</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>

            {userPermissions.userType === 'master' && (
              <Select value={organizationFilter} onValueChange={setOrganizationFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Organization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Organizations</SelectItem>
                  {organizations.map(org => (
                    <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* CAF List */}
        <div className="flex-1 min-h-0">
          {filteredCAFs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No CAFs found</h3>
                <p className="text-gray-600 text-center">
                  {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || organizationFilter !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'CAFs will appear here once they are created from violation incidents'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredCAFs.map(caf => {
                const statusInfo = getStatusInfo(caf.status)
                const StatusIcon = statusInfo.icon
                
                return (
                  <Card key={caf.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{caf.cafNumber}</h3>
                            <Badge variant={statusInfo.variant} className="flex items-center gap-1">
                              <StatusIcon className="h-3 w-3" />
                              {statusInfo.label}
                            </Badge>
                            <Badge variant={getPriorityVariant(caf.priority)}>
                              {caf.priority}
                            </Badge>
                            <Badge variant="outline">
                              {caf.violationType}
                            </Badge>
                          </div>

                          <p className="text-gray-600 mb-2">{caf.violationSummary}</p>
                          
                          {caf.title && (
                            <p className="text-sm text-gray-800 font-medium mb-2">{caf.title}</p>
                          )}

                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            {caf.organization && (
                              <span>Organization: {caf.organization.name}</span>
                            )}
                            {caf.assigned_staff && (
                              <span>
                                Assigned to: {caf.assigned_staff.party.person.firstName} {caf.assigned_staff.party.person.lastName}
                              </span>
                            )}
                            {caf.dueDate && (
                              <span>Due: {new Date(caf.dueDate).toLocaleDateString()}</span>
                            )}
                            <span>Created: {new Date(caf.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl">
                              <DialogHeader>
                                <DialogTitle>CAF Details - {caf.cafNumber}</DialogTitle>
                              </DialogHeader>
                              {/* CAF detail content will go here */}
                              <div className="p-4">
                                <p>CAF detail view coming soon...</p>
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
} 