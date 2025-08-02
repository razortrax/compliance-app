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
  Users,
  ArrowLeft,
  Building
} from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { StaffForm } from "@/components/staff/staff-form"
import { ActivityLog } from "@/components/ui/activity-log"

interface Organization {
  id: string
  name: string
  dotNumber?: string | null
}

interface Staff {
  id: string
  position?: string | null
  department?: string | null
  canSignCAFs: boolean
  canApproveCAFs: boolean
  badgeNumber?: string | null
  party?: {
    person?: {
      firstName: string
      lastName: string
      email?: string | null
      phone?: string | null
    }
  }
}

export default function OrganizationStaffPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useUser()
  const { masterOrg } = useMasterOrg()
  const masterOrgId = params.masterOrgId as string
  const orgId = params.orgId as string

  const [organization, setOrganization] = useState<Organization | null>(null)
  const [staff, setStaff] = useState<Staff[]>([])
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showStaffForm, setShowStaffForm] = useState(false)
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)

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

    const fetchStaff = async () => {
      try {
        const response = await fetch(`/api/staff?organizationId=${orgId}`)
        if (response.ok) {
          const data = await response.json()
          setStaff(data)
          // Auto-select first staff if any
          if (data.length > 0 && !selectedStaff) {
            setSelectedStaff(data[0])
          }
        }
      } catch (error) {
        console.error('Error fetching staff:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (orgId) {
      fetchOrganization()
      fetchStaff()
    }
  }, [orgId, selectedStaff])

  const handleAddStaff = () => {
    setEditingStaff(null)
    setShowStaffForm(true)
  }

  const handleEditStaff = (staffMember: Staff) => {
    setEditingStaff(staffMember)
    setShowStaffForm(true)
  }

  const handleCloseStaffForm = () => {
    setShowStaffForm(false)
    setEditingStaff(null)
  }

  const handleStaffSuccess = () => {
    setShowStaffForm(false)
    setEditingStaff(null)
    // Refresh staff list
    fetchStaff()
  }

  const fetchStaff = async () => {
    try {
      const response = await fetch(`/api/staff?organizationId=${orgId}`)
      if (response.ok) {
        const data = await response.json()
        setStaff(data)
      }
    } catch (error) {
      console.error('Error fetching staff:', error)
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
      label: 'Staff', 
      href: `/master/${masterOrgId}/organization/${orgId}/staff`,
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

        {/* Two-block layout: 300px master list + content area */}
        <div className="grid grid-cols-[300px_1fr] gap-6 h-[calc(100vh-200px)]">
          {/* Master List Area */}
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Staff Members</CardTitle>
                  <CardDescription>
                    Administrative and management staff
                  </CardDescription>
                </div>
                <Button onClick={handleAddStaff} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="h-[calc(100%-120px)] overflow-y-auto">
              {staff.length > 0 ? (
                <div className="space-y-2">
                  {staff.map((staffMember) => (
                    <Card 
                      key={staffMember.id}
                      className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                        selectedStaff?.id === staffMember.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedStaff(staffMember)}
                    >
                      <CardContent className="p-3">
                        <div className="space-y-1">
                          <h4 className="font-medium text-sm">
                            {staffMember.party?.person?.firstName} {staffMember.party?.person?.lastName}
                          </h4>
                          <p className="text-xs text-gray-600">
                            {staffMember.position || 'Staff Member'}
                            {staffMember.department && ` • ${staffMember.department}`}
                          </p>
                          <div className="flex gap-1 flex-wrap">
                            {staffMember.canSignCAFs && (
                              <Badge variant="secondary" className="text-xs px-1 py-0">Sign CAFs</Badge>
                            )}
                            {staffMember.canApproveCAFs && (
                              <Badge variant="default" className="text-xs px-1 py-0">Approve CAFs</Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Users}
                  title="No staff yet"
                  description="Add staff members to manage administrative roles"
                  action={{
                    label: "Add First Staff Member",
                    onClick: handleAddStaff
                  }}
                />
              )}
            </CardContent>
          </Card>

          {/* Content Area */}
          <div className="space-y-6">
            {selectedStaff ? (
              <>
                {/* Name row */}
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">
                    {selectedStaff.party?.person?.firstName} {selectedStaff.party?.person?.lastName}
                  </h2>
                  <Button onClick={() => handleEditStaff(selectedStaff)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>

                {/* Staff Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>Staff Information</CardTitle>
                    <CardDescription>
                      Position, permissions, and contact details
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                        <p className="text-gray-900">{selectedStaff.position || 'Not specified'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                        <p className="text-gray-900">{selectedStaff.department || 'Not specified'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Badge Number</label>
                        <p className="text-gray-900">{selectedStaff.badgeNumber || 'Not specified'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <p className="text-gray-900">{selectedStaff.party?.person?.email || 'Not specified'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <p className="text-gray-900">{selectedStaff.party?.person?.phone || 'Not specified'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">CAF Permissions</label>
                        <div className="flex gap-2">
                          {selectedStaff.canSignCAFs && (
                            <Badge variant="secondary">Can Sign CAFs</Badge>
                          )}
                          {selectedStaff.canApproveCAFs && (
                            <Badge variant="default">Can Approve CAFs</Badge>
                          )}
                          {!selectedStaff.canSignCAFs && !selectedStaff.canApproveCAFs && (
                            <p className="text-gray-500">No CAF permissions</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Activity Log */}
                <ActivityLog 
                  entityType="staff" 
                  entityId={selectedStaff.id}
                  entityName={`${selectedStaff.party?.person?.firstName} ${selectedStaff.party?.person?.lastName}`}
                />
              </>
            ) : (
              <div className="h-full flex items-center justify-center">
                <EmptyState
                  icon={Users}
                  title="Select a staff member"
                  description="Choose a staff member from the list to view details"
                />
              </div>
            )}
          </div>
        </div>

        {/* Staff Form Modal */}
        <Dialog open={showStaffForm} onOpenChange={handleCloseStaffForm}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
              </DialogTitle>
              <DialogDescription>
                {editingStaff 
                  ? `Update staff details and permissions` 
                  : `Add a new staff member to ${organization?.name} with appropriate permissions`
                }
              </DialogDescription>
            </DialogHeader>
            <StaffForm
              organizationId={orgId}
              staff={editingStaff}
              onSuccess={handleStaffSuccess}
              onCancel={handleCloseStaffForm}
            />
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
} 