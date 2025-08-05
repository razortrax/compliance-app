'use client'

import React, { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layouts/app-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Users, CheckCircle, XCircle, Trash2, Edit, Phone, Mail } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { StaffForm } from '@/components/staff/staff-form'
import { getUserRole, buildStandardNavigation } from '@/lib/utils'

interface Staff {
  id: string
  employeeId?: string
  position?: string
  department?: string
  canApproveCAFs: boolean
  canSignCAFs: boolean
  party: {
    person: {
      firstName: string
      lastName: string
      email?: string
      phone?: string
    }
  }
  supervisor?: {
    party: {
      person: {
        firstName: string
        lastName: string
      }
    }
    position?: string
  }
  createdAt: string
}

interface StaffPageProps {
  params: {
    masterOrgId: string
    orgId: string
  }
}

export default function StaffPage({ params }: StaffPageProps) {
  const [staff, setStaff] = useState<Staff[]>([])
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [masterOrgName, setMasterOrgName] = useState<string>('')
  const [currentOrgName, setCurrentOrgName] = useState<string>('')
  const [userRole, setUserRole] = useState<string>('')
  const { toast } = useToast()

  const { masterOrgId, orgId } = params

  useEffect(() => {
    Promise.all([
      fetchStaff(),
      fetchMasterOrgName(),
      fetchCurrentOrgName(),
      fetchUserRole()
    ])
  }, [masterOrgId, orgId])

  const fetchStaff = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/staff?organizationId=${orgId}`)
      if (response.ok) {
        const data = await response.json()
        setStaff(data)
        if (data.length > 0 && !selectedStaff) {
          setSelectedStaff(data[0])
        }
      } else {
        console.error('Failed to fetch staff:', response.statusText)
      }
    } catch (error) {
      console.error('Error fetching staff:', error)
      toast({
        title: "Error",
        description: "Failed to load staff members",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchMasterOrgName = async () => {
    try {
      const response = await fetch(`/api/organizations/${masterOrgId}`)
      if (response.ok) {
        const data = await response.json()
        setMasterOrgName(data.name)
      }
    } catch (error) {
      console.error('Error fetching master org:', error)
    }
  }

  const fetchCurrentOrgName = async () => {
    try {
      const response = await fetch(`/api/organizations/${orgId}`)
      if (response.ok) {
        const data = await response.json()
        setCurrentOrgName(data.name)
      }
    } catch (error) {
      console.error('Error fetching current org:', error)
    }
  }

  const fetchUserRole = async () => {
    try {
      const role = await getUserRole()
      setUserRole(role || '')
    } catch (error) {
      console.error('Error fetching user role:', error)
    }
  }

  const handleFormSuccess = () => {
    fetchStaff()
    setIsAddModalOpen(false)
    setIsEditModalOpen(false)
    toast({
      title: "Success",
      description: "Staff member saved successfully",
    })
  }

  const handleDeleteStaff = async (staffId: string) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return

    try {
      const response = await fetch(`/api/staff/${staffId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setStaff(prev => prev.filter(s => s.id !== staffId))
        if (selectedStaff?.id === staffId) {
          const remaining = staff.filter(s => s.id !== staffId)
          setSelectedStaff(remaining.length > 0 ? remaining[0] : null)
        }
        toast({
          title: "Success",
          description: "Staff member deleted successfully",
        })
      } else {
        throw new Error('Failed to delete staff member')
      }
    } catch (error) {
      console.error('Error deleting staff:', error)
      toast({
        title: "Error",
        description: "Failed to delete staff member",
        variant: "destructive",
      })
    }
  }

  const navigation = buildStandardNavigation(userRole, masterOrgId, orgId)

  if (loading) {
    return (
      <AppLayout topNav={navigation} name={masterOrgName}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout topNav={navigation} name={masterOrgName}>
      <div className="flex h-[calc(100vh-73px)]">
        {/* Left Sidebar - Staff List */}
        <div className="w-80 border-r border-gray-200 bg-white overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Staff Members</h2>
              <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Staff
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add Staff Member</DialogTitle>
                  </DialogHeader>
                  <StaffForm
                    organizationId={orgId}
                    onSuccess={handleFormSuccess}
                    onCancel={() => setIsAddModalOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>
            <p className="text-sm text-gray-600">
              {staff.length} staff member{staff.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="p-4 space-y-2">
            {staff.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 text-sm">No staff members yet</p>
                <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="mt-4" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Staff Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add Staff Member</DialogTitle>
                    </DialogHeader>
                    <StaffForm
                      organizationId={orgId}
                      onSuccess={handleFormSuccess}
                      onCancel={() => setIsAddModalOpen(false)}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            ) : (
              staff.map((staffMember) => (
                <Card
                  key={staffMember.id}
                  className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                    selectedStaff?.id === staffMember.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedStaff(staffMember)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {staffMember.party.person.firstName} {staffMember.party.person.lastName}
                        </h3>
                        {staffMember.position && (
                          <p className="text-sm text-gray-600">{staffMember.position}</p>
                        )}
                        {staffMember.department && (
                          <p className="text-xs text-gray-500">{staffMember.department}</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        {staffMember.canSignCAFs && (
                          <Badge variant="default" className="text-xs">CAF Signer</Badge>
                        )}
                        {staffMember.canApproveCAFs && (
                          <Badge variant="secondary" className="text-xs">CAF Approver</Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Right Content - Staff Details */}
        <div className="flex-1 overflow-y-auto">
          {selectedStaff ? (
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="text-sm text-gray-500 mb-1">{currentOrgName}</div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {selectedStaff.party.person.firstName} {selectedStaff.party.person.lastName}
                  </h1>
                </div>
                <div className="flex gap-2">
                  <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Edit Staff Member</DialogTitle>
                      </DialogHeader>
                      <StaffForm
                        organizationId={orgId}
                        staff={selectedStaff}
                        onSuccess={handleFormSuccess}
                        onCancel={() => setIsEditModalOpen(false)}
                      />
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteStaff(selectedStaff.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>

              {/* Staff Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Employee ID</label>
                      <p className="text-gray-900">{selectedStaff.employeeId || 'Not assigned'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Position</label>
                      <p className="text-gray-900">{selectedStaff.position || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Department</label>
                      <p className="text-gray-900">{selectedStaff.department || 'Not specified'}</p>
                    </div>
                    {selectedStaff.supervisor && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Supervisor</label>
                        <p className="text-gray-900">
                          {selectedStaff.supervisor.party.person.firstName} {selectedStaff.supervisor.party.person.lastName}
                          {selectedStaff.supervisor.position && ` (${selectedStaff.supervisor.position})`}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedStaff.party.person.email && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Email</label>
                        <div className="flex items-center mt-1">
                          <Mail className="h-4 w-4 text-gray-400 mr-2" />
                          <p className="text-gray-900">{selectedStaff.party.person.email}</p>
                        </div>
                      </div>
                    )}
                    {selectedStaff.party.person.phone && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Phone</label>
                        <div className="flex items-center mt-1">
                          <Phone className="h-4 w-4 text-gray-400 mr-2" />
                          <p className="text-gray-900">{selectedStaff.party.person.phone}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg">CAF Permissions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center">
                        {selectedStaff.canSignCAFs ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                        ) : (
                          <XCircle className="h-5 w-5 text-gray-300 mr-3" />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">Can Sign CAFs</p>
                          <p className="text-sm text-gray-500">
                            {selectedStaff.canSignCAFs ? 'Authorized to sign corrective action forms' : 'Not authorized to sign CAFs'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {selectedStaff.canApproveCAFs ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                        ) : (
                          <XCircle className="h-5 w-5 text-gray-300 mr-3" />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">Can Approve CAFs</p>
                          <p className="text-sm text-gray-500">
                            {selectedStaff.canApproveCAFs ? 'Authorized to approve corrective action forms' : 'Not authorized to approve CAFs'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Users className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">Select a staff member to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
} 