"use client"

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { AppLayout } from '@/components/layouts/app-layout'
import { useMasterOrg } from '@/hooks/use-master-org'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import MvrIssueForm from '@/components/mvr_issues/mvr-issue-form'
import { MvrRenewalForm } from '@/components/mvr_issues/mvr-renewal-form'
import { AddAddonModal } from '@/components/licenses/add-addon-modal'
import { Plus, Car, Edit, Trash2, Calendar, MapPin, AlertTriangle, CheckCircle, Clock, XCircle, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { buildStandardDriverNavigation } from '@/lib/utils'

interface Organization {
  id: string
  name: string
  dotNumber: string | null
  party: {
    userId: string | null
    status: string
  }
}

interface MvrIssue {
  id: string
  state: string
  violationsCount: number
  cleanRecord: boolean
  notes?: string
  type?: string
  result?: string
  result_dach?: string
  result_status?: string
  reviewedBy?: any
  certification?: string
  status?: string
  startDate?: string
  expirationDate?: string
  renewalDate?: string
  createdAt: string
  updatedAt: string
  issue: {
    id: string
    title: string
    description?: string
    status: string
    priority: string
    party: {
      id: string
      person?: {
        firstName: string
        lastName: string
      } | null
      organization?: {
        name: string
      } | null
    }
  }
}

const MVR_TYPE_LABELS: Record<string, string> = {
  'PreHire_Check': 'Pre-Hire Check',
  'Annual_Review': 'Annual Review',
  'Drug_Testing_Clearinghouse': 'Drug Testing Clearinghouse',
  'After_Accident': 'After Accident',
  'Reasonable_Suspicion': 'Reasonable Suspicion',
  'Endorsement_Update': 'Endorsement Update',
  'Med_Cert_Update': 'Medical Certificate Update'
}

const MVR_STATUS_LABELS: Record<string, string> = {
  'Not_Released': 'Not Released',
  'Active': 'Active',
  'Inactive': 'Inactive',
  'Disqualified': 'Disqualified',
  'Not_Driver': 'Not Driver',
  'One_Time_Training': 'One Time Training'
}

export default function MvrIssuesPage() {
  const { masterOrg } = useMasterOrg()
  const searchParams = useSearchParams()
  const driverId = searchParams.get('driverId')

  const [mvrIssues, setMvrIssues] = useState<MvrIssue[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMvr, setSelectedMvr] = useState<MvrIssue | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showRenewalForm, setShowRenewalForm] = useState(false)
  const [showAddAddonModal, setShowAddAddonModal] = useState(false)
  const [attachments, setAttachments] = useState<any[]>([])
  const [partyId, setPartyId] = useState<string>('')
  const [driver, setDriver] = useState<any>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  // Fetch driver information when driverId is available
  useEffect(() => {
    if (driverId) {
      fetchDriver()
    }
  }, [driverId])

  // Fetch organizations for organization selector
  useEffect(() => {
    fetchOrganizations()
  }, [])

  // Fetch MVR issues when partyId is available
  useEffect(() => {
    if (partyId) {
      fetchMvrIssues()
    }
  }, [partyId])

  // Fetch attachments when selected MVR changes
  useEffect(() => {
    if (selectedMvr?.issue.id) {
      fetchAttachments(selectedMvr.issue.id)
    }
  }, [selectedMvr])

  const fetchDriver = async () => {
    try {
      const response = await fetch(`/api/persons/${driverId}`)
      if (response.ok) {
        const driverData = await response.json()
        setDriver(driverData)
        setPartyId(driverData.party?.id)
      }
    } catch (error) {
      console.error('Error fetching driver:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations')
      if (response.ok) {
        const data = await response.json()
        const mappedOrgs = data.map((org: any): Organization => ({
          id: org?.id || '',
          name: org?.name || 'No Organization',
          dotNumber: org?.dotNumber || null,
          party: org?.party
            ? {
                userId: org.party.userId || null,
                status: org.party.status || '',
              }
            : {
                userId: null,
                status: '',
              },
        }))
        setOrganizations(mappedOrgs)
      }
    } catch (error) {
      console.error('Error fetching organizations:', error)
    }
  }

  const fetchMvrIssues = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/mvr_issues?partyId=${partyId}`)
      if (response.ok) {
        const data = await response.json()
        setMvrIssues(data)
      }
    } catch (error) {
      console.error('Error fetching MVR issues:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAttachments = async (issueId: string) => {
    try {
      const response = await fetch(`/api/attachments?issueId=${issueId}`)
      if (response.ok) {
        const data = await response.json()
        setAttachments(data)
      }
    } catch (error) {
      console.error('Error fetching attachments:', error)
    }
  }

  const handleDeleteMvr = async (mvrId: string) => {
    if (!confirm('Are you sure you want to deactivate this MVR record?')) return
    
    try {
      const response = await fetch(`/api/mvr_issues/${mvrId}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        if (selectedMvr?.id === mvrId) {
          setSelectedMvr(null)
        }
        fetchMvrIssues()
      }
    } catch (error) {
      console.error('Error deleting MVR:', error)
    }
  }

  const handleOrganizationSelect = (org: Organization) => {
    console.log('Organization selected:', org.id)
  }

  const handleAddAddonSuccess = () => {
    setShowAddAddonModal(false)
    fetchAttachments(selectedMvr?.issue.id || '')
  }

  const refreshSelectedMvrAfterEdit = async () => {
    if (!selectedMvr) return
    
    const mvrId = selectedMvr.id
    
    // Refresh the MVR list
    await fetchMvrIssues()
    
    // Fetch the specific updated MVR to get fresh data
    try {
      const response = await fetch(`/api/mvr_issues/${mvrId}`)
      if (response.ok) {
        const updatedMvr = await response.json()
        setSelectedMvr(updatedMvr)
      }
    } catch (error) {
      console.error('Error fetching updated MVR:', error)
      // Fallback: try to find it in the refreshed list
      setTimeout(() => {
        setMvrIssues(currentMvrs => {
          const foundMvr = currentMvrs.find(m => m.id === mvrId)
          if (foundMvr) {
            setSelectedMvr(foundMvr)
          }
          return currentMvrs
        })
      }, 100)
    }
  }

  const getStatusIcon = (mvr: MvrIssue) => {
    if (mvr.status === 'Disqualified') return <XCircle className="h-4 w-4" />
    if (mvr.cleanRecord) return <CheckCircle className="h-4 w-4" />
    if (mvr.violationsCount > 0) return <AlertTriangle className="h-4 w-4" />
    return <Clock className="h-4 w-4" />
  }

  const getStatusColor = (mvr: MvrIssue) => {
    if (mvr.status === 'Disqualified') return 'text-red-600'
    if (mvr.cleanRecord) return 'text-green-600'
    if (mvr.violationsCount > 0) return 'text-yellow-600'
    return 'text-gray-600'
  }

  if (!driverId) {
    return (
      <AppLayout
        name={masterOrg?.name || 'Master'}
        topNav={[]}
        sidebarMenu="driver"
        className="p-6"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No driver selected. Please select a driver to view their MVR records.</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (loading) {
    return (
      <AppLayout
        name={masterOrg?.name || 'Master'}
        topNav={[]}
        sidebarMenu="driver"
        driverId={driverId}
        masterOrgId={masterOrg?.id}
        className="p-6"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading MVR records...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!driver) {
    return (
      <AppLayout
        name={masterOrg?.name || 'Master'}
        topNav={[]}
        sidebarMenu="driver"
        driverId={driverId}
        masterOrgId={masterOrg?.id}
        className="p-6"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900">Driver not found</h2>
              <p className="text-gray-600 mt-2">The driver you're looking for doesn't exist or you don't have permission to view it.</p>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  // Calculate and display navigation
  const userRole = driver.party?.role?.[0]
  const organization = userRole?.organization
  
  let displayName = 'Master'
  if (masterOrg) {
    displayName = masterOrg.name
  } else if (organization) {
    displayName = organization.name
  }
  
  const topNav = buildStandardDriverNavigation(
    masterOrg?.id || '',
    organization?.id || '',
    userRole
  )

  return (
    <>
      <AppLayout
      name={displayName}
      topNav={topNav}
      sidebarMenu="driver"
      driverId={driverId}
      masterOrgId={masterOrg?.id}
      currentOrgId={organization?.id}
      className="p-6"
    >
      <div className="max-w-7xl mx-auto h-full">
        {/* Driver and MVR Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            {masterOrg && organization && (
              <p className="text-sm text-gray-600">{organization.name}</p>
            )}
            <h1 className="text-2xl font-bold text-gray-900">
              {driver.firstName} {driver.lastName} - Motor Vehicle Records
            </h1>
            <p className="text-sm text-gray-600">
              Track and manage MVR records and driving history
            </p>
          </div>
          
          {/* Add MVR Button - only show if there are existing MVRs */}
          {mvrIssues.length > 0 && (
            <Button 
              onClick={() => {
                setSelectedMvr(null)
                setShowAddForm(true)
                setShowEditForm(false)
              }}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add MVR Record
            </Button>
          )}
        </div>

        {/* Split Pane Layout */}
        <div className="flex gap-6 h-[calc(100vh-300px)]">
          {/* Left Pane - MVR List */}
          <div className="w-[300px] flex-shrink-0">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  MVR Records ({mvrIssues.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {mvrIssues.length === 0 ? (
                  <div className="text-center py-12">
                    <Car className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No MVR records yet</h3>
                    <p className="text-gray-600 mb-4">Add MVR records for {driver.firstName} {driver.lastName}</p>
                    <Button 
                      onClick={() => {
                        setSelectedMvr(null)
                        setShowAddForm(true)
                        setShowEditForm(false)
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add First MVR Record
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 max-h-full overflow-y-auto">
                    {mvrIssues
                      .sort((a, b) => {
                        // Sort by status first (active on top), then by date
                        const aActive = a.issue.status === 'active'
                        const bActive = b.issue.status === 'active'
                        if (aActive && !bActive) return -1
                        if (!aActive && bActive) return 1
                        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                      })
                      .map((mvr) => {
                        const isSelected = selectedMvr?.id === mvr.id
                        const isActive = mvr.issue.status === 'active'
                        
                        return (
                          <div
                            key={mvr.id}
                            onClick={() => {
                              setSelectedMvr(mvr)
                              setShowAddForm(false)
                              setShowEditForm(false)
                            }}
                            className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                              isSelected ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                            }`}
                          >
                            <div className="space-y-2">
                              {/* First Row: Title + Status Badge */}
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium text-gray-900 text-sm truncate">
                                  {mvr.issue.title}
                                </h4>
                                {isActive && (
                                  <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                                    Active
                                  </Badge>
                                )}
                              </div>
                              
                              {/* Second Row: Type & State */}
                              <div className="flex items-center justify-between">
                                <div className="text-xs text-gray-600">
                                  {mvr.type && MVR_TYPE_LABELS[mvr.type] || mvr.type || 'MVR'} • {mvr.state}
                                </div>
                                <Badge 
                                  variant={mvr.status === 'Disqualified' ? 'destructive' : 
                                          mvr.cleanRecord ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  {mvr.status === 'Disqualified' 
                                    ? 'Disqualified'
                                    : mvr.cleanRecord 
                                    ? 'Clean'
                                    : `${mvr.violationsCount} Violation${mvr.violationsCount !== 1 ? 's' : ''}`
                                  }
                                </Badge>
                              </div>
                              
                              {/* Third Row: Date & Result */}
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>{format(new Date(mvr.createdAt), 'MMM dd, yyyy')}</span>
                                {mvr.result && (
                                  <span className="font-medium">{mvr.result}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Pane - Details */}
          <div className="flex-1">
            <Card className="h-full">
              {showAddForm ? (
                <>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Add MVR Record</CardTitle>
                        <CardDescription>
                          Create a new Motor Vehicle Record for {driver.firstName} {driver.lastName}
                        </CardDescription>
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setShowAddForm(false)
                          setSelectedMvr(null)
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="overflow-y-auto max-h-[calc(100%-120px)]">
                                        <MvrIssueForm 
                      partyId={partyId} 
                      onSuccess={(newMvr) => {
                        setShowAddForm(false)
                        fetchMvrIssues()
                        // Auto-select the newly created MVR
                        if (newMvr) {
                          setSelectedMvr(newMvr)
                        }
                      }} 
                      onCancel={() => {
                        setShowAddForm(false)
                        setSelectedMvr(null)
                      }}
                    />
                  </CardContent>
                </>
              ) : showEditForm ? (
                <>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Edit MVR Record</CardTitle>
                        <CardDescription>
                          Edit details for {selectedMvr?.issue.title} for {driver.firstName} {driver.lastName}
                        </CardDescription>
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setShowEditForm(false)
                          setSelectedMvr(null)
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="overflow-y-auto max-h-[calc(100%-120px)]">
                    <MvrIssueForm
                      mvrIssue={selectedMvr || undefined}
                      onSuccess={async () => {
                        setShowEditForm(false)
                        // Refresh the MVR list and update the selected MVR with fresh data
                        await refreshSelectedMvrAfterEdit()
                      }}
                      onCancel={() => {
                        setShowEditForm(false)
                        setSelectedMvr(null)
                      }}
                    />
                  </CardContent>
                </>
              ) : showRenewalForm ? (
                <>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Renew MVR Record</CardTitle>
                        <CardDescription>
                          Renew {selectedMvr?.issue.title} for {driver.firstName} {driver.lastName}
                        </CardDescription>
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setShowRenewalForm(false)
                          setSelectedMvr(null)
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="overflow-y-auto max-h-[calc(100%-120px)]">
                    <MvrRenewalForm
                      mvrIssue={selectedMvr || undefined}
                      onSuccess={async (newMvr) => {
                        setShowRenewalForm(false)
                        await fetchMvrIssues() // Refresh the list to show new renewed MVR
                        // Auto-select the newly created MVR
                        if (newMvr) {
                          setSelectedMvr(newMvr)
                        }
                      }}
                      onCancel={() => {
                        setShowRenewalForm(false)
                        setSelectedMvr(null)
                      }}
                    />
                  </CardContent>
                </>
              ) : selectedMvr ? (
                <>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{selectedMvr.issue.title}</CardTitle>
                        <CardDescription>{selectedMvr.issue.description}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setShowEditForm(true)
                            setShowAddForm(false)
                            setShowRenewalForm(false)
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setShowRenewalForm(true)
                            setShowEditForm(false)
                            setShowAddForm(false)
                          }}
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Renew
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="overflow-y-auto max-h-[calc(100%-120px)]">
                    <div className="space-y-6">
                      {/* Basic Information */}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">State:</span>
                            <span className="ml-2">{selectedMvr.state}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Type:</span>
                            <span className="ml-2">{selectedMvr.type && MVR_TYPE_LABELS[selectedMvr.type] || selectedMvr.type || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Violations Count:</span>
                            <span className="ml-2">{selectedMvr.violationsCount}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Clean Record:</span>
                            <span className="ml-2">{selectedMvr.cleanRecord ? 'Yes' : 'No'}</span>
                          </div>
                                                      <div>
                              <span className="font-medium text-gray-700">Date Created:</span>
                              <span className="ml-2">{format(new Date(selectedMvr.createdAt), 'MMM dd, yyyy')}</span>
                            </div>
                            {selectedMvr.startDate && (
                              <div>
                                <span className="font-medium text-gray-700">Start Date:</span>
                                <span className="ml-2">{format(new Date(selectedMvr.startDate), 'MMM dd, yyyy')}</span>
                              </div>
                            )}
                            {selectedMvr.expirationDate && (
                              <div>
                                <span className="font-medium text-gray-700">Expiration Date:</span>
                                <span className="ml-2">{format(new Date(selectedMvr.expirationDate), 'MMM dd, yyyy')}</span>
                              </div>
                            )}
                            {selectedMvr.renewalDate && (
                              <div>
                                <span className="font-medium text-gray-700">Renewal Date:</span>
                                <span className="ml-2">{format(new Date(selectedMvr.renewalDate), 'MMM dd, yyyy')}</span>
                              </div>
                            )}
                          <div>
                            <span className="font-medium text-gray-700">Last Updated:</span>
                            <span className="ml-2">{format(new Date(selectedMvr.updatedAt), 'MMM dd, yyyy')}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">MVR Status:</span>
                            <span className="ml-2">{selectedMvr.status && MVR_STATUS_LABELS[selectedMvr.status] || selectedMvr.status || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Issue Priority:</span>
                            <span className="ml-2 capitalize">{selectedMvr.issue.priority || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Results */}
                      {(selectedMvr.result || selectedMvr.result_dach || selectedMvr.result_status || selectedMvr.certification) && (
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-4">Results & Status</h3>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            {selectedMvr.result && (
                              <div>
                                <span className="font-medium text-gray-700">Result:</span>
                                <span className="ml-2">{selectedMvr.result}</span>
                              </div>
                            )}
                            {selectedMvr.result_dach && (
                              <div>
                                <span className="font-medium text-gray-700">DACH Result:</span>
                                <span className="ml-2">{selectedMvr.result_dach}</span>
                              </div>
                            )}
                            {selectedMvr.result_status && (
                              <div>
                                <span className="font-medium text-gray-700">Result Status:</span>
                                <span className="ml-2">{selectedMvr.result_status.replace('_', ' ')}</span>
                              </div>
                            )}
                            {selectedMvr.certification && (
                              <div>
                                <span className="font-medium text-gray-700">Certification:</span>
                                <span className="ml-2">{selectedMvr.certification.replace('_', ' ')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Addons Section */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900">Addons</h4>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setShowAddAddonModal(true)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Addon
                          </Button>
                        </div>
                        
                        {/* List of Addons */}
                        <div className="space-y-2">
                          {attachments.map((addon) => (
                            <div key={addon.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                              <div className="flex-shrink-0">
                                {addon.attachmentType === 'note' || addon.noteContent ? (
                                  <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center">
                                    <FileText className="h-5 w-5 text-blue-600" />
                                  </div>
                                ) : addon.fileType?.startsWith('image/') ? (
                                  <div className="w-10 h-10 rounded border overflow-hidden">
                                    <img 
                                      src={addon.url} 
                                      alt={addon.fileName}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ) : addon.fileType?.startsWith('video/') ? (
                                  <div className="w-10 h-10 bg-purple-100 rounded flex items-center justify-center">
                                    <FileText className="h-5 w-5 text-purple-600" />
                                  </div>
                                ) : (
                                  <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                                    <FileText className="h-5 w-5 text-gray-600" />
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {addon.fileName || 'Untitled'}
                                </p>
                                {addon.description && (
                                  <p className="text-xs text-gray-600 truncate">{addon.description}</p>
                                )}
                                {addon.noteContent && (
                                  <p className="text-xs text-gray-600 truncate italic">
                                    "{addon.noteContent.substring(0, 50)}..."
                                  </p>
                                )}
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {addon.attachmentType === 'note' ? 'Note' : 
                                     addon.noteContent ? 'File + Note' : 'File'}
                                  </Badge>
                                  <span className="text-xs text-gray-500">
                                    {new Date(addon.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1">
                                {addon.attachmentType === 'note' || addon.noteContent ? (
                                  <Button size="sm" variant="ghost">
                                    View
                                  </Button>
                                ) : (
                                  <Button size="sm" variant="ghost" asChild>
                                    <a 
                                      href={addon.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                    >
                                      View
                                    </a>
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                          
                          {attachments.length === 0 && (
                            <div className="text-center py-6 text-gray-500">
                              <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                              <p className="text-sm">No addons yet</p>
                              <p className="text-xs">Add notes, MVR documents, or other files related to this record</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Car className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select an MVR record</h3>
                    <p className="text-gray-600">Choose an MVR record from the list to view its details</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>

    {/* Add Addon Modal */}
    <AddAddonModal
      isOpen={showAddAddonModal}
      onClose={() => setShowAddAddonModal(false)}
      onSuccess={handleAddAddonSuccess}
      issueId={selectedMvr?.issue.id || ''}
    />
  </>
  )
} 