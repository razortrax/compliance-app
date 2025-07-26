"use client"

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { AppLayout } from '@/components/layouts/app-layout'
import { useMasterOrg } from '@/hooks/use-master-org'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import PhysicalIssueForm from '@/components/physical_issues/physical-issue-form'
import { PhysicalRenewalForm } from '@/components/physical_issues/physical-renewal-form'
import { AddAddonModal } from '@/components/licenses/add-addon-modal'
import { Plus, Users, Edit, Trash2, Calendar, MapPin, AlertTriangle, CheckCircle, Clock, XCircle, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { buildStandardDriverNavigation } from '@/lib/utils'
import type { Organization } from '@/components/layouts/app-layout'

interface PhysicalIssue {
  id: string
  type?: string
  medicalExaminer?: string
  selfCertified: boolean
  nationalRegistry: boolean
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

interface Driver {
  id: string
  firstName: string
  lastName: string
  party?: {
    id: string
    role?: {
      id: string
      organization?: {
        id: string
        name: string
      }
    }[]
  }
}

interface Attachment {
  id: string
  fileName: string
  fileType: string
  fileSize: number
  filePath: string
  attachmentType: string
  description?: string
  noteContent?: string
  createdAt: string
}

const PHYSICAL_TYPE_LABELS: Record<string, string> = {
  'Annual': 'Annual',
  'Bi_Annual': 'Bi-Annual',
  'Return_to_Duty': 'Return to Duty',
  'Post_Accident': 'Post Accident',
  'One_Month': '1 Month',
  'Three_Month': '3 Month',
  'Six_Month': '6 Month',
  'Pre_Hire': 'Pre-Hire',
  'No_Physical_Issue': 'No Physical Issue'
}

export default function PhysicalIssuesPage() {
  const searchParams = useSearchParams()
  const driverId = searchParams.get('driverId')
  const { masterOrg, loading } = useMasterOrg()

  const [physicalIssues, setPhysicalIssues] = useState<PhysicalIssue[]>([])
  const [selectedPhysical, setSelectedPhysical] = useState<PhysicalIssue | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showRenewalForm, setShowRenewalForm] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [driver, setDriver] = useState<Driver | null>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [showAddonModal, setShowAddonModal] = useState(false)
  const [partyId, setPartyId] = useState<string>('')

  useEffect(() => {
    if (driverId) {
      fetchDriver()
    }
  }, [driverId])

  useEffect(() => {
    if (partyId) {
      fetchPhysicalIssues()
    }
  }, [partyId])

  useEffect(() => {
    if (selectedPhysical) {
      fetchAttachments()
    }
  }, [selectedPhysical])

  const fetchDriver = async () => {
    try {
      const response = await fetch(`/api/persons/${driverId}`)
      if (response.ok) {
        const driverData = await response.json()
        setDriver(driverData)
        setPartyId(driverData.party?.id || '')
      }
    } catch (error) {
      console.error('Error fetching driver:', error)
    }
  }

  const fetchPhysicalIssues = async () => {
    if (!partyId) {
      console.log('No party ID available yet')
      return
    }
    
    try {
      setIsLoading(true)
      const response = await fetch(`/api/physical_issues?partyId=${partyId}`)
      if (response.ok) {
        const data = await response.json()
        setPhysicalIssues(data)
        console.log('Fetched physical issues:', data.length)
      } else {
        console.error('Failed to fetch physical issues:', response.status)
      }
    } catch (error) {
      console.error('Error fetching physical issues:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAttachments = async () => {
    if (!selectedPhysical) return
    
    try {
      const response = await fetch(`/api/attachments?issueId=${selectedPhysical.issue.id}`)
      if (response.ok) {
        const data = await response.json()
        setAttachments(data)
      }
    } catch (error) {
      console.error('Error fetching attachments:', error)
    }
  }

  const refreshSelectedPhysicalAfterEdit = async () => {
    if (!selectedPhysical) return
    
    try {
      const response = await fetch(`/api/physical_issues/${selectedPhysical.id}`)
      if (response.ok) {
        const updatedPhysical = await response.json()
        setSelectedPhysical(updatedPhysical)
        fetchPhysicalIssues() // Also refresh the list
      }
    } catch (error) {
      console.error('Error refreshing physical:', error)
    }
  }

  const handleAddAddonSuccess = () => {
    setShowAddonModal(false)
    fetchAttachments()
  }

  const handleOrganizationSelect = (organization: Organization) => {
    // Handle organization selection if needed
  }

  if (loading) {
    return (
      <AppLayout 
        name="Loading..." 
        topNav={[]} 
        showOrgSelector={true}
        showDriverEquipmentSelector={true}
        sidebarMenu="driver"
        driverId={driverId}
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AppLayout>
    )
  }

  if (!driver) {
    return (
      <AppLayout 
        name="Driver Not Found" 
        topNav={[]} 
        showOrgSelector={true}
        showDriverEquipmentSelector={true}
        sidebarMenu="driver"
        driverId={driverId}
      >
        <EmptyState
          icon={Users}
          title="Driver not found"
          description="The requested driver could not be found."
        />
      </AppLayout>
    )
  }

  // Calculate and display navigation
  const role = driver.party?.role?.[0]
  const organization = role?.organization
  
  let displayName = 'Master'
  if (masterOrg) {
    displayName = masterOrg.name
  } else if (organization) {
    displayName = organization.name
  }
  
  const topNav = buildStandardDriverNavigation(
    { id: '', role: '' },
    masterOrg,
    organization,
    undefined,
    'drivers'
  )

  return (
    <>
      <AppLayout
        name={displayName}
        topNav={topNav}
        showOrgSelector={true}
        showDriverEquipmentSelector={true}
        sidebarMenu="driver"
        driverId={driverId}
        className="p-6"
        organizations={organizations}
        currentOrgId={organization?.id}
        isSheetOpen={isSheetOpen}
        onSheetOpenChange={setIsSheetOpen}
        onOrganizationSelect={handleOrganizationSelect}
      >
        <div className="max-w-7xl mx-auto h-full">
          {/* Driver and Physical Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-1">
              {masterOrg && organization && (
                <p className="text-sm text-gray-600">{organization.name}</p>
              )}
              <h1 className="text-2xl font-bold text-gray-900">
                {driver.firstName} {driver.lastName} - Physical Examinations
              </h1>
              <p className="text-sm text-gray-600">
                Track and manage DOT physical examinations and medical certifications
              </p>
            </div>
            
            {/* Add Physical Button - only show if there are existing physicals */}
            {physicalIssues.length > 0 && (
              <Button 
                onClick={() => {
                  setSelectedPhysical(null)
                  setShowAddForm(true)
                  setShowEditForm(false)
                }}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Physical Record
              </Button>
            )}
          </div>

          {/* Split Pane Layout */}
          <div className="flex gap-6 h-[calc(100vh-300px)]">
            {/* Left Pane - Physical List */}
            <div className="w-[300px] flex-shrink-0">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Physical Records ({physicalIssues.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {physicalIssues.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No physical records yet</h3>
                      <p className="text-gray-600 mb-4">Add physical examination records for {driver.firstName} {driver.lastName}</p>
                      <Button 
                        onClick={() => {
                          setSelectedPhysical(null)
                          setShowAddForm(true)
                          setShowEditForm(false)
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Physical Record
                      </Button>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {physicalIssues.map((physical) => {
                        const isActive = physical.issue.status === 'active'
                        const isSelected = selectedPhysical?.id === physical.id
                        
                        return (
                          <div
                            key={physical.id}
                            className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                              isSelected ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                            }`}
                            onClick={() => {
                              setSelectedPhysical(physical)
                              setShowAddForm(false)
                              setShowEditForm(false)
                              setShowRenewalForm(false)
                            }}
                          >
                            <div className="space-y-2">
                              {/* First Row: Title & Status */}
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium text-gray-900 text-sm truncate">
                                  {physical.issue.title}
                                </h4>
                                {isActive && (
                                  <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                                    Active
                                  </Badge>
                                )}
                              </div>
                              
                              {/* Second Row: Type & Medical Examiner */}
                              <div className="flex items-center justify-between">
                                <div className="text-xs text-gray-600">
                                  {physical.type && PHYSICAL_TYPE_LABELS[physical.type] || physical.type || 'Physical'}
                                  {physical.medicalExaminer && ` • ${physical.medicalExaminer}`}
                                </div>
                                <div className="flex gap-1">
                                  {physical.selfCertified && (
                                    <Badge variant="secondary" className="text-xs">Self-Cert</Badge>
                                  )}
                                  {physical.nationalRegistry && (
                                    <Badge variant="secondary" className="text-xs">Registry</Badge>
                                  )}
                                </div>
                              </div>
                              
                              {/* Third Row: Date & Expiration */}
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>{format(new Date(physical.createdAt), 'MMM dd, yyyy')}</span>
                                {physical.expirationDate && (
                                  <span className="font-medium">
                                    Expires: {format(new Date(physical.expirationDate), 'MMM dd, yyyy')}
                                  </span>
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
                          <CardTitle>Add Physical Record</CardTitle>
                          <CardDescription>
                            Create a new physical examination record for {driver.firstName} {driver.lastName}
                          </CardDescription>
                        </div>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setShowAddForm(false)
                            setSelectedPhysical(null)
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="overflow-y-auto max-h-[calc(100%-120px)] p-6">
                      <PhysicalIssueForm 
                        partyId={partyId} 
                        onSuccess={(newPhysical) => {
                          setShowAddForm(false)
                          fetchPhysicalIssues()
                          // Auto-select the newly created physical
                          if (newPhysical) {
                            setSelectedPhysical(newPhysical)
                          }
                        }} 
                        onCancel={() => {
                          setShowAddForm(false)
                          setSelectedPhysical(null)
                        }}
                      />
                    </CardContent>
                  </>
                ) : showEditForm ? (
                  <>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Edit Physical Record</CardTitle>
                          <CardDescription>
                            Update physical examination information
                          </CardDescription>
                        </div>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setShowEditForm(false)
                            refreshSelectedPhysicalAfterEdit()
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="overflow-y-auto max-h-[calc(100%-120px)] p-6">
                      <PhysicalIssueForm 
                        partyId={partyId}
                        physicalIssue={selectedPhysical}
                        onSuccess={() => {
                          setShowEditForm(false)
                          refreshSelectedPhysicalAfterEdit()
                        }} 
                        onCancel={() => {
                          setShowEditForm(false)
                          refreshSelectedPhysicalAfterEdit()
                        }}
                      />
                    </CardContent>
                  </>
                ) : showRenewalForm ? (
                  <>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Renew Physical</CardTitle>
                          <CardDescription>
                            Create a new physical record by renewing the current one
                          </CardDescription>
                        </div>
                        <Button 
                          variant="outline" 
                          onClick={() => setShowRenewalForm(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="overflow-y-auto max-h-[calc(100%-120px)] p-6">
                      {selectedPhysical && (
                        <PhysicalRenewalForm 
                          physicalIssue={selectedPhysical}
                          onSuccess={async (newPhysical) => {
                            setShowRenewalForm(false)
                            await fetchPhysicalIssues() // Refresh the list to show new renewed physical
                            if (newPhysical) {
                              setSelectedPhysical(newPhysical) // Auto-select the newly created physical
                            }
                          }}
                          onCancel={() => setShowRenewalForm(false)}
                        />
                      )}
                    </CardContent>
                  </>
                ) : selectedPhysical ? (
                  <>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            {selectedPhysical.issue.title}
                          </CardTitle>
                          <CardDescription>
                            Physical examination details and documentation
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setShowEditForm(true)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setShowRenewalForm(true)}
                          >
                            <Calendar className="h-4 w-4 mr-2" />
                            Renew
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="overflow-y-auto max-h-[calc(100%-120px)] p-6">
                      <div className="space-y-6">
                        {/* Physical Information */}
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-4">Physical Information</h3>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">Type:</span>
                              <p className="text-gray-900">
                                {selectedPhysical.type ? PHYSICAL_TYPE_LABELS[selectedPhysical.type] || selectedPhysical.type : 'Not specified'}
                              </p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Medical Examiner:</span>
                              <p className="text-gray-900">{selectedPhysical.medicalExaminer || 'Not specified'}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Self Certified:</span>
                              <p className="text-gray-900">{selectedPhysical.selfCertified ? 'Yes' : 'No'}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">National Registry:</span>
                              <p className="text-gray-900">{selectedPhysical.nationalRegistry ? 'Yes' : 'No'}</p>
                            </div>
                            {selectedPhysical.startDate && (
                              <div>
                                <span className="font-medium text-gray-700">Start Date:</span>
                                <p className="text-gray-900">{format(new Date(selectedPhysical.startDate), 'MMM dd, yyyy')}</p>
                              </div>
                            )}
                            {selectedPhysical.expirationDate && (
                              <div>
                                <span className="font-medium text-gray-700">Expiration Date:</span>
                                <p className="text-gray-900">{format(new Date(selectedPhysical.expirationDate), 'MMM dd, yyyy')}</p>
                              </div>
                            )}
                            {selectedPhysical.renewalDate && (
                              <div>
                                <span className="font-medium text-gray-700">Renewal Date:</span>
                                <p className="text-gray-900">{format(new Date(selectedPhysical.renewalDate), 'MMM dd, yyyy')}</p>
                              </div>
                            )}
                            <div>
                              <span className="font-medium text-gray-700">Status:</span>
                              <Badge variant={selectedPhysical.issue.status === 'active' ? 'default' : 'secondary'} className="ml-2">
                                {selectedPhysical.issue.status}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Addons Section */}
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-gray-900">Attachments</h3>
                            <Button 
                              size="sm" 
                              onClick={() => setShowAddonModal(true)}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Attachment
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
                                         src={addon.filePath} 
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
                                         href={addon.filePath} 
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
                                <p className="text-xs">Add notes, physical examination results, or other files related to this record</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-center">
                    <div>
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Physical Record</h3>
                      <p className="text-gray-600">Choose a physical examination from the list to view details</p>
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
      isOpen={showAddonModal}
      issueId={selectedPhysical?.issue.id || ''}
      onSuccess={handleAddAddonSuccess}
      onClose={() => setShowAddonModal(false)}
    />
    </>
  )
} 