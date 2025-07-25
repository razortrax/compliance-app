"use client"

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { AppLayout } from '@/components/layouts/app-layout'
import { useMasterOrg } from '@/hooks/use-master-org'
import { buildStandardDriverNavigation } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrainingForm } from '@/components/training/training-form'
import { AddAddonModal } from '@/components/licenses/add-addon-modal'
import {
  Edit, Plus, FileText, GraduationCap, ArrowLeft, Loader2, CheckCircle, AlertCircle
} from 'lucide-react'

interface Person {
  id: string
  firstName: string
  lastName: string
  party: {
    id: string
    role?: Array<{
      id: string
      roleType: string
      organizationId: string
      organization: {
        id: string
        name: string
      }
    }>
  }
}

interface Training {
  id: string
  trainingType: string
  provider?: string
  instructor?: string
  location?: string
  startDate?: string
  completionDate: string
  expirationDate: string
  certificateNumber?: string
  hours?: number
  isRequired: boolean
  competencies?: any[]
  notes?: string
  calculatedStatus?: string
  daysUntilExpiry?: number
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
      }
      organization?: {
        name: string
      }
    }
  }
}

interface Organization {
  id: string
  name: string
  party: {
    id: string
  }
}

export default function DriverTrainingPage() {
  const params = useParams()
  const { user, masterOrg } = useMasterOrg()
  
  const driverId = params.id as string
  
  const [driver, setDriver] = useState<Person | null>(null)
  const [trainings, setTrainings] = useState<Training[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTraining, setSelectedTraining] = useState<Training | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showRenewalForm, setShowRenewalForm] = useState(false)
  const [showAddAddonModal, setShowAddAddonModal] = useState(false)
  const [attachments, setAttachments] = useState<any[]>([])
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set())
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  // Helper function to calculate expiration status
  const getExpirationStatus = (expirationDate: string) => {
    const expiry = new Date(expirationDate)
    const today = new Date()
    const daysUntil = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntil < 0) {
      return { status: 'expired', daysUntil: Math.abs(daysUntil) }
    } else if (daysUntil <= 30) {
      return { status: 'expiring', daysUntil }
    } else {
      return { status: 'valid', daysUntil }
    }
  }

  useEffect(() => {
    if (driverId) {
      fetchDriver()
      fetchTrainings()
      fetchOrganizations()
    }
  }, [driverId])

  const fetchDriver = async () => {
    try {
      const response = await fetch(`/api/persons/${driverId}`)
      if (response.ok) {
        const data = await response.json()
        setDriver(data)
      } else {
        console.error('Failed to fetch driver')
      }
    } catch (error) {
      console.error('Error fetching driver:', error)
    }
  }

  const fetchTrainings = async () => {
    try {
      const response = await fetch(`/api/trainings?driverId=${driverId}`)
      if (response.ok) {
        const data = await response.json()
        console.log('📋 Trainings for driver:', data)
        setTrainings(data)
      } else {
        console.error('Failed to fetch trainings')
      }
    } catch (error) {
      console.error('Error fetching trainings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations')
      if (response.ok) {
        const data = await response.json()
        setOrganizations(data)
      }
    } catch (error) {
      console.error('Error fetching organizations:', error)
    }
  }

  const handleOrganizationSelect = (selectedOrg: Organization) => {
    setIsSheetOpen(false)
    window.location.href = `/organizations/${selectedOrg.id}/drivers`
  }

  const handleRenewTraining = (training: Training) => {
    setSelectedTraining(training)
    setShowRenewalForm(true)
    setShowAddForm(false)
    setShowEditForm(false)
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

  const handleAddAddonSuccess = () => {
    if (selectedTraining) {
      fetchAttachments(selectedTraining.issue.id)
    }
  }

  const refreshSelectedTrainingAfterEdit = async () => {
    if (!selectedTraining) return
    
    const trainingId = selectedTraining.id
    
    // Refresh the trainings list
    await fetchTrainings()
    
    // Fetch the specific updated training to get fresh data
    try {
      const response = await fetch(`/api/trainings/${trainingId}`)
      if (response.ok) {
        const updatedTraining = await response.json()
        setSelectedTraining(updatedTraining)
      }
    } catch (error) {
      console.error('Error fetching updated training:', error)
      // Fallback: try to find it in the refreshed list
      setTimeout(() => {
        setTrainings(currentTrainings => {
          const foundTraining = currentTrainings.find(t => t.id === trainingId)
          if (foundTraining) {
            setSelectedTraining(foundTraining)
          }
          return currentTrainings
        })
      }, 100)
    }
  }

  if (isLoading) {
    return (
      <AppLayout 
        sidebarMenu="driver" 
        driverId={driverId}
        topNav={[]}
        organizations={organizations}
        onOrganizationSelect={handleOrganizationSelect}
      >
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AppLayout>
    )
  }

  if (!driver) {
    return (
      <AppLayout 
        sidebarMenu="driver" 
        driverId={driverId}
        topNav={[]}
        organizations={organizations}
        onOrganizationSelect={handleOrganizationSelect}
      >
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900">Driver not found</h2>
            <p className="text-gray-600 mt-2">The driver you're looking for doesn't exist or you don't have permission to view it.</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  // Calculate and display navigation - ONLY after we know driver is not null
  const role = driver.party?.role?.[0]
  const organization = role?.organization
  
  // Calculate display name based on user type
  let displayName = 'Master'
  if (masterOrg) {
    displayName = masterOrg.name
  } else if (organization) {
    displayName = organization.name
  }
  // TODO: Add location name logic when location context is available
  
  // Build standardized top navigation
  const topNav = buildStandardDriverNavigation(
    { id: '', role: '' }, // User object - simplified for now
    masterOrg,
    organization,
    undefined, // No location context in this view
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
          {/* Driver and Training Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-1">
              {/* Only show organization name for Master users */}
              {masterOrg && organization && (
                <p className="text-sm text-gray-600">{organization.name}</p>
              )}
              <h1 className="text-2xl font-bold text-gray-900">
                {driver.firstName} {driver.lastName} - Training
              </h1>
              <p className="text-sm text-gray-600">
                Manage training records and certifications for this driver
              </p>
            </div>
            
            {/* Add Training Button - only show if there are existing trainings */}
            {trainings.length > 0 && (
              <Button 
                onClick={() => {
                  setSelectedTraining(null)
                  setShowAddForm(true)
                  setShowEditForm(false)
                  setShowRenewalForm(false)
                }}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Training
              </Button>
            )}
          </div>

          {/* Split Pane Layout */}
          <div className="flex gap-6 h-[calc(100vh-300px)]">
            {/* Left Pane - Training List (300px width) */}
            <div className="w-[300px] flex-shrink-0">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    Training ({trainings.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {trainings.length === 0 ? (
                    <div className="text-center py-12">
                      <GraduationCap className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No training yet</h3>
                      <p className="text-gray-600 mb-4">Add training records and certifications for {driver.firstName} {driver.lastName}</p>
                      <Button 
                        onClick={() => {
                          setSelectedTraining(null)
                          setShowAddForm(true)
                          setShowEditForm(false)
                          setShowRenewalForm(false)
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Training
                      </Button>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200 max-h-full overflow-y-auto">
                      {trainings
                        .sort((a, b) => {
                          // Sort by status first (active on top), then by expiration date
                          const aActive = a.issue.status === 'active'
                          const bActive = b.issue.status === 'active'
                          if (aActive && !bActive) return -1
                          if (!aActive && bActive) return 1
                          return new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime()
                        })
                        .map((training) => {
                        const expirationStatus = getExpirationStatus(training.expirationDate)
                        const isSelected = selectedTraining?.id === training.id
                        const isActive = training.issue.status === 'active'
                        
                        return (
                          <div
                            key={training.id}
                            onClick={() => {
                              setSelectedTraining(training)
                              setShowAddForm(false)
                              setShowEditForm(false)
                              setShowRenewalForm(false)
                              if (training.issue?.id) {
                                fetchAttachments(training.issue.id)
                              }
                            }}
                            className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                              isSelected ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                            }`}
                          >
                            <div className="space-y-2">
                              {/* First Row: Training Type + Active Badge */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-gray-900 text-sm">
                                    {training.trainingType}
                                  </h4>
                                  {isActive && (
                                    <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                                      Active
                                    </Badge>
                                  )}
                                  {training.isRequired && (
                                    <Badge variant="outline" className="text-xs text-red-600 border-red-200">
                                      Required
                                    </Badge>
                                  )}
                                </div>
                                <Badge 
                                  variant={expirationStatus.status === 'expired' ? 'destructive' : 
                                          expirationStatus.status === 'expiring' ? 'secondary' : 'default'}
                                  className="text-xs"
                                >
                                  {expirationStatus.status === 'expired' 
                                    ? `Expired`
                                    : `${expirationStatus.daysUntil}d`
                                  }
                                </Badge>
                              </div>
                              
                              {/* Second Row: Provider + Hours */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {training.provider && (
                                    <span className="text-xs text-gray-600">{training.provider}</span>
                                  )}
                                </div>
                                
                                {training.hours && (
                                  <Badge variant="outline" className="text-xs">
                                    {training.hours}h
                                  </Badge>
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

            {/* Right Pane - Training Details or Add Form */}
            <div className="flex-1">
              <Card className="h-full">
                {showRenewalForm ? (
                  <>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Renew Training</CardTitle>
                          <CardDescription>
                            Renewing {selectedTraining?.trainingType} for {driver.firstName} {driver.lastName}
                          </CardDescription>
                        </div>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setShowRenewalForm(false)
                            setSelectedTraining(null)
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="overflow-y-auto max-h-[calc(100%-120px)]">
                      <TrainingForm
                        driverId={driverId}
                        renewingTraining={selectedTraining || undefined}
                        onSuccess={() => {
                          setShowRenewalForm(false)
                          fetchTrainings()
                          // Keep training selected - user can see the renewal result
                        }}
                        onCancel={() => {
                          setShowRenewalForm(false)
                          setSelectedTraining(null)
                        }}
                      />
                    </CardContent>
                  </>
                ) : showAddForm ? (
                  <>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Add New Training</CardTitle>
                          <CardDescription>Create a new training record for {driver.firstName} {driver.lastName}</CardDescription>
                        </div>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setShowAddForm(false)
                            setSelectedTraining(null)
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="overflow-y-auto max-h-[calc(100%-120px)]">
                      <TrainingForm
                        driverId={driverId}
                        onSuccess={() => {
                          setShowAddForm(false)
                          fetchTrainings()
                        }}
                        onCancel={() => {
                          setShowAddForm(false)
                          setSelectedTraining(null)
                        }}
                      />
                    </CardContent>
                  </>
                ) : showEditForm ? (
                  <>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Edit Training</CardTitle>
                          <CardDescription>
                            Edit details for {selectedTraining?.trainingType} for {driver.firstName} {driver.lastName}
                          </CardDescription>
                        </div>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setShowEditForm(false)
                            setSelectedTraining(null)
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="overflow-y-auto max-h-[calc(100%-120px)]">
                      <TrainingForm
                        driverId={driverId}
                        training={selectedTraining || undefined}
                        onSuccess={async () => {
                          setShowEditForm(false)
                          // Refresh the training list and update the selected training with fresh data
                          await refreshSelectedTrainingAfterEdit()
                        }}
                        onCancel={() => {
                          setShowEditForm(false)
                          setSelectedTraining(null)
                        }}
                      />
                    </CardContent>
                  </>
                ) : selectedTraining ? (
                  <>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>{selectedTraining.trainingType}</CardTitle>
                          <CardDescription>{selectedTraining.issue.description}</CardDescription>
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
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => handleRenewTraining(selectedTraining)}
                          >
                            Renew Training
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="overflow-y-auto max-h-[calc(100%-120px)]">
                      <div className="space-y-6">
                        {/* Training Information */}
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-3">Training Information</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Type:</span>
                                <span className="font-medium">{selectedTraining.trainingType}</span>
                              </div>
                              {selectedTraining.provider && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Provider:</span>
                                  <span className="font-medium">{selectedTraining.provider}</span>
                                </div>
                              )}
                              {selectedTraining.instructor && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Instructor:</span>
                                  <span className="font-medium">{selectedTraining.instructor}</span>
                                </div>
                              )}
                              {selectedTraining.location && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Location:</span>
                                  <span className="font-medium">{selectedTraining.location}</span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span className="text-gray-600">Status:</span>
                                <span className="font-medium">
                                  {selectedTraining.isRequired ? 'Required' : 'Voluntary'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-medium text-gray-900 mb-3">Important Dates</h4>
                            <div className="space-y-2 text-sm">
                              {selectedTraining.startDate && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Started:</span>
                                  <span className="font-medium">
                                    {new Date(selectedTraining.startDate).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span className="text-gray-600">Completed:</span>
                                <span className="font-medium">
                                  {new Date(selectedTraining.completionDate).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Expires:</span>
                                <span className="font-medium">
                                  {new Date(selectedTraining.expirationDate).toLocaleDateString()}
                                </span>
                              </div>
                              {selectedTraining.hours && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Hours:</span>
                                  <span className="font-medium">{selectedTraining.hours}</span>
                                </div>
                              )}
                              {selectedTraining.certificateNumber && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Certificate:</span>
                                  <span className="font-medium">{selectedTraining.certificateNumber}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Competencies */}
                        {selectedTraining.competencies && selectedTraining.competencies.length > 0 && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-3">Competencies Covered</h4>
                            <div className="flex flex-wrap gap-2">
                              {selectedTraining.competencies.map((competency: any, idx: number) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {competency.name || competency}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Training Notes */}
                        {selectedTraining.notes && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-3">Notes</h4>
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                              <p className="text-sm text-gray-700">{selectedTraining.notes}</p>
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
                            {attachments
                              .map((addon) => (
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
                                <p className="text-xs">Add notes, certificates, or other files related to this training</p>
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
                      <GraduationCap className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Select a training</h3>
                      <p className="text-gray-600">Choose a training from the list to view details</p>
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
        issueId={selectedTraining?.issue?.id || ''}
      />
    </>
  )
} 