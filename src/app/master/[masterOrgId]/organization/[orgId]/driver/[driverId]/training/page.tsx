"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layouts/app-layout'
import { buildStandardDriverNavigation } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrainingForm } from '@/components/training/training-form'
import { ActivityLog } from '@/components/ui/activity-log'
import { EmptyState } from '@/components/ui/empty-state'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
  Edit, Plus, FileText, GraduationCap, CheckCircle, AlertCircle, Clock, Shield
} from 'lucide-react'
import { format } from 'date-fns'

interface Training {
  id: string
  trainingType: string
  category?: string
  provider?: string | null
  instructor?: string | null
  location?: string | null
  startDate?: string | null
  completionDate: string
  expirationDate?: string | null
  expirationPeriodMonths?: number | null
  certificateNumber?: string | null
  hours?: number | null
  isRequired: boolean
  competencies?: any
  notes?: string | null
  issue: {
    id: string
    title: string
    description?: string | null
    status: string
    priority: string
  }
}

interface Organization {
  id: string
  name: string
}

interface Driver {
  id: string
  firstName: string
  lastName: string
  licenseNumber?: string
}

interface MasterOrg {
  id: string
  name: string
}

interface PageData {
  masterOrg: MasterOrg
  organization: Organization
  driver: Driver
  trainings: Training[]
}

export default function MasterDriverTrainingPage() {
  const params = useParams()
  const router = useRouter()
  const masterOrgId = params.masterOrgId as string
  const orgId = params.orgId as string
  const driverId = params.driverId as string
  
  const [data, setData] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTraining, setSelectedTraining] = useState<Training | null>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isRenewalDialogOpen, setIsRenewalDialogOpen] = useState(false)
  const [showAddAddonModal, setShowAddAddonModal] = useState(false)
  const [attachments, setAttachments] = useState<any[]>([])

  // Smart expiration status function - MVR Gold Standard (Training-specific)
  const getExpirationStatus = (training: Training) => {
    if (!training.expirationDate) {
      return {
        status: 'unknown',
        daysUntil: null,
        badge: <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          No Expiration
        </Badge>
      }
    }

    const expirationDate = new Date(training.expirationDate)
    const today = new Date()
    const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    const isExpired = daysUntilExpiration < 0
    
    // Check if this training has been renewed (has a newer training after it)
    const hasNewerTraining = data?.trainings.some(otherTraining => 
      otherTraining.id !== training.id && 
      otherTraining.trainingType === training.trainingType &&
      otherTraining.expirationDate && 
      training.expirationDate &&
      new Date(otherTraining.expirationDate) > new Date(training.expirationDate)
    ) || false

    // INACTIVE Training - Show status tags instead of expiration countdown
    if (hasNewerTraining) {
      // This training was renewed - show "Renewed" tag
      return {
        status: 'renewed',
        daysUntil: null,
        badge: <Badge className="flex items-center gap-1 bg-blue-100 text-blue-800 border-blue-200">
          <CheckCircle className="h-3 w-3" />
          Renewed
        </Badge>
      }
    } else if (isExpired) {
      // This training is expired and not renewed - show "Expired" tag
      return {
        status: 'expired',
        daysUntil: null,
        badge: <Badge variant="destructive" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Expired
        </Badge>
      }
    }

    // ACTIVE Training - Show expiration countdown with proper color coding
    // Note: Training often has longer warning periods (6 months/1 year for 2-year cycles)
    if (daysUntilExpiration <= 90) {
      // Due within 90 days = Orange (3 months for 2-year training cycles)
      return {
        status: 'critical',
        daysUntil: daysUntilExpiration,
        badge: <Badge className="flex items-center gap-1 bg-orange-100 text-orange-800 border-orange-200">
          <Clock className="h-3 w-3" />
          {daysUntilExpiration}d
        </Badge>
      }
    } else if (daysUntilExpiration <= 180) {
      // Due within 180 days = Yellow (6 months for 2-year training cycles)
      return {
        status: 'warning',
        daysUntil: daysUntilExpiration,
        badge: <Badge className="flex items-center gap-1 bg-yellow-100 text-yellow-800 border-yellow-200">
          <Clock className="h-3 w-3" />
          {daysUntilExpiration}d
        </Badge>
      }
    } else {
      // Current and compliant = Green
      return {
        status: 'current',
        daysUntil: daysUntilExpiration,
        badge: <Badge className="flex items-center gap-1 bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="h-3 w-3" />
          Current
        </Badge>
      }
    }
  }

  useEffect(() => {
    fetchData()
    fetchOrganizations()
  }, [masterOrgId, orgId, driverId])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch page data using URL context - MVR Gold Standard pattern
      const response = await fetch(`/api/master/${masterOrgId}/organization/${orgId}/driver/${driverId}/training`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch driver training data')
      }
      
      const pageData = await response.json()
      setData(pageData)
      
      // Auto-select first training if available
      if (pageData.trainings?.length > 0) {
        setSelectedTraining(pageData.trainings[0])
      }
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

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddTraining = async (formData: any) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/trainings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to create training: ${errorText}`)
      }

      const newTraining = await response.json()
      
      // Refresh the training data
      setData(prev => {
        if (!prev) return prev
        return {
          ...prev,
          trainings: [...prev.trainings, newTraining]
        }
      })
      setIsAddDialogOpen(false)
      setSelectedTraining(newTraining)
    } catch (error) {
      console.error('Error creating training:', error)
      alert(error instanceof Error ? error.message : 'An error occurred while creating the training')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditTraining = async (formData: any) => {
    if (!selectedTraining) return
    
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/trainings/${selectedTraining.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to update training: ${errorText}`)
      }

      const updatedTraining = await response.json()
      
      // Update the training in the list
      setData(prev => {
        if (!prev) return prev
        return {
          ...prev,
          trainings: prev.trainings.map(training => 
            training.id === updatedTraining.id ? updatedTraining : training
          )
        }
      })
      setSelectedTraining(updatedTraining)
      setIsEditDialogOpen(false)
    } catch (error) {
      console.error('Error updating training:', error)
      alert(error instanceof Error ? error.message : 'An error occurred while updating the training')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRenewTraining = async (formData: any) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/trainings/renew', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to renew training: ${errorText}`)
      }

      const renewedTraining = await response.json()
      
      // Add the renewed training to the list
      setData(prev => {
        if (!prev) return prev
        return {
          ...prev,
          trainings: [...prev.trainings, renewedTraining]
        }
      })
      setSelectedTraining(renewedTraining)
      setIsRenewalDialogOpen(false)
    } catch (error) {
      console.error('Error renewing training:', error)
      alert(error instanceof Error ? error.message : 'An error occurred while renewing the training')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOrganizationSelect = (org: Organization) => {
    console.log('Organization selected:', org.id)
  }

  const refreshAttachments = async () => {
    if (selectedTraining?.issue.id) {
      try {
        const response = await fetch(`/api/attachments?issueId=${selectedTraining.issue.id}`)
        if (response.ok) {
          const data = await response.json()
          setAttachments(data)
        }
      } catch (error) {
        console.error('Error fetching attachments:', error)
      }
    }
  }

  // URL-driven data loading - Gold Standard pattern! 🚀
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Single URL-driven API call with all contextual data pre-filtered! 
        const [trainingResult, orgsResult] = await Promise.allSettled([
          fetch(`/api/master/${masterOrgId}/organization/${orgId}/driver/${driverId}/training`),
          fetch('/api/organizations') // Still need for org selector
        ])
        
        // Handle training data (primary)
        if (trainingResult.status === 'fulfilled' && trainingResult.value.ok) {
          const pageData: PageData = await trainingResult.value.json()
          setData(pageData)
          console.log('✅ URL-driven training API success!')
          console.log(`📚 Loaded ${pageData.trainings.length} training records for ${pageData.driver.firstName} ${pageData.driver.lastName}`)
        } else {
          const error = trainingResult.status === 'fulfilled' 
            ? await trainingResult.value.text()
            : trainingResult.reason
          throw new Error(`Failed to fetch training data: ${error}`)
        }
        
        // Handle organizations data (secondary)
        if (orgsResult.status === 'fulfilled' && orgsResult.value.ok) {
          const orgs = await orgsResult.value.json()
          setOrganizations(orgs)
        }
        
      } catch (err) {
        console.error('❌ Training data fetch error:', err)
        setError(err instanceof Error ? err.message : 'Failed to load training data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [masterOrgId, orgId, driverId])

  useEffect(() => {
    if (selectedTraining?.issue.id) {
      refreshAttachments()
    } else {
      setAttachments([])
    }
  }, [selectedTraining])

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
            onClick={() => window.location.reload()} 
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      </AppLayout>
    )
  }

  // Build standard navigation with consistent Drivers | Equipment pattern
  const topNav = buildStandardDriverNavigation(
    { id: '', role: '' }, // User object - simplified for now
    data.masterOrg,
    data.organization,
    undefined, // No location context
    'drivers' // Current section is drivers
  )

  // Filter trainings: prioritize required (DOT mandatory) training
  const requiredTrainings = data.trainings.filter(t => t.isRequired)
  const voluntaryTrainings = data.trainings.filter(t => !t.isRequired)

  return (
      <AppLayout 
        name={data.masterOrg.name}
        topNav={topNav}
        organizations={organizations}
        onOrganizationSelect={handleOrganizationSelect}
        isSheetOpen={isSheetOpen}
        onSheetOpenChange={setIsSheetOpen}
        className="p-6"
      >
      <div className="max-w-7xl mx-auto h-full">
        {/* Driver and Training Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <p className="text-sm text-gray-600">{data.organization.name}</p>
            <h1 className="text-2xl font-bold text-gray-900">
              {data.driver.firstName} {data.driver.lastName} - Training
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>Required: {requiredTrainings.length}</span>
              <span>•</span>
              <span>Voluntary: {voluntaryTrainings.length}</span>
            </div>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Training
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Training</DialogTitle>
              </DialogHeader>
              <div className="px-1">
                <TrainingForm
                  personId={data.driver.id}
                  onSubmit={handleAddTraining}
                  onCancel={() => setIsAddDialogOpen(false)}
                  isSubmitting={isSubmitting}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Split Pane Layout */}
        <div className="flex gap-6 h-[calc(100vh-200px)]">
          {/* Left Pane - Training List */}
          <div className="w-[300px] flex-shrink-0">
            <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Training ({data.trainings.length})
              </CardTitle>
              <CardDescription>
                DOT mandatory and voluntary training records
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
              {data.trainings.length === 0 ? (
                <EmptyState
                  icon={GraduationCap}
                  title="No training found"
                  description="This driver doesn't have any training records yet."
                />
              ) : (
                <div className="space-y-4">
                  {/* Required Training Section */}
                  {requiredTrainings.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Shield className="h-4 w-4 text-red-600" />
                        <h3 className="font-medium text-sm text-red-600">DOT Required</h3>
                      </div>
                      <div className="space-y-3">
                        {[...requiredTrainings]
                          .sort((a, b) => {
                            // First, sort by active status (expired trainings go to bottom)
                            const aExpired = a.expirationDate ? new Date(a.expirationDate) < new Date() : false
                            const bExpired = b.expirationDate ? new Date(b.expirationDate) < new Date() : false
                            
                            if (aExpired !== bExpired) {
                              return aExpired ? 1 : -1 // Active trainings first
                            }
                            
                            // Then sort by expiration date (newest first within each group)
                            const aDate = a.expirationDate ? new Date(a.expirationDate) : new Date(0)
                            const bDate = b.expirationDate ? new Date(b.expirationDate) : new Date(0)
                            return bDate.getTime() - aDate.getTime()
                          })
                          .map((training) => (
                          <div
                            key={training.id}
                            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                              selectedTraining?.id === training.id
                                ? 'border-red-500 bg-red-50'
                                : 'border-red-200 hover:border-red-300'
                            }`}
                            onClick={() => setSelectedTraining(training)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-medium text-sm">{training.trainingType}</h3>
                              {getExpirationStatus(training).badge}
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <p>Completed: {format(new Date(training.completionDate), 'MMM d, yyyy')}</p>
                              <p>Expires: {format(new Date(training.expirationDate), 'MMM d, yyyy')}</p>
                              {training.hours && <p>Hours: {training.hours}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Voluntary Training Section */}
                  {voluntaryTrainings.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <GraduationCap className="h-4 w-4 text-blue-600" />
                        <h3 className="font-medium text-sm text-blue-600">Voluntary</h3>
                      </div>
                      <div className="space-y-3">
                        {[...voluntaryTrainings]
                          .sort((a, b) => {
                            // Sort by completion date (newest first)
                            const aDate = new Date(a.completionDate)
                            const bDate = new Date(b.completionDate)
                            return bDate.getTime() - aDate.getTime()
                          })
                          .map((training) => (
                          <div
                            key={training.id}
                            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                              selectedTraining?.id === training.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => setSelectedTraining(training)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-medium text-sm">{training.trainingType}</h3>
                              {training.expirationDate && getExpirationStatus(training).badge}
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <p>Completed: {format(new Date(training.completionDate), 'MMM d, yyyy')}</p>
                              {training.expirationDate && (
                                <p>Expires: {format(new Date(training.expirationDate), 'MMM d, yyyy')}</p>
                              )}
                              {training.hours && <p>Hours: {training.hours}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            </Card>
          </div>

          {/* Right Pane - Training Details */}
          <div className="flex-1">
            <Card className="h-full">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Training Details</CardTitle>
                  <CardDescription>
                    {selectedTraining ? 'Details for selected training' : 'Select a training to view details'}
                  </CardDescription>
                </div>
                {selectedTraining && (
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsEditDialogOpen(true)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    {selectedTraining.isRequired && (
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => setIsRenewalDialogOpen(true)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Renew
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="overflow-y-auto max-h-[calc(100%-120px)]">
              {selectedTraining ? (
                <div className="space-y-6">
                  {/* Training Information */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <h3 className="text-lg font-medium text-gray-900">Training Information</h3>
                      {selectedTraining.isRequired && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          DOT Required
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Training Type:</span>
                        <span className="ml-2">{selectedTraining.trainingType}</span>
                      </div>
                      {selectedTraining.provider && (
                        <div>
                          <span className="font-medium text-gray-700">Provider:</span>
                          <span className="ml-2">{selectedTraining.provider}</span>
                        </div>
                      )}
                      {selectedTraining.instructor && (
                        <div>
                          <span className="font-medium text-gray-700">Instructor:</span>
                          <span className="ml-2">{selectedTraining.instructor}</span>
                        </div>
                      )}
                      {selectedTraining.location && (
                        <div>
                          <span className="font-medium text-gray-700">Location:</span>
                          <span className="ml-2">{selectedTraining.location}</span>
                        </div>
                      )}
                      {selectedTraining.startDate && (
                        <div>
                          <span className="font-medium text-gray-700">Start Date:</span>
                          <span className="ml-2">{format(new Date(selectedTraining.startDate), 'MMM dd, yyyy')}</span>
                        </div>
                      )}
                      <div>
                        <span className="font-medium text-gray-700">Completion Date:</span>
                        <span className="ml-2">{format(new Date(selectedTraining.completionDate), 'MMM dd, yyyy')}</span>
                      </div>
                      {selectedTraining.expirationDate && (
                        <div>
                          <span className="font-medium text-gray-700">Expiration Date:</span>
                          <span className="ml-2">{format(new Date(selectedTraining.expirationDate), 'MMM dd, yyyy')}</span>
                        </div>
                      )}
                      {selectedTraining.certificateNumber && (
                        <div>
                          <span className="font-medium text-gray-700">Certificate #:</span>
                          <span className="ml-2">{selectedTraining.certificateNumber}</span>
                        </div>
                      )}
                      {selectedTraining.hours && (
                        <div>
                          <span className="font-medium text-gray-700">Training Hours:</span>
                          <span className="ml-2">{selectedTraining.hours}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Enhanced Activity Log */}
                  <ActivityLog 
                    issueId={selectedTraining.issue.id}
                    title="Activity Log"
                    allowedTypes={['note', 'communication', 'url', 'credential', 'attachment', 'task']}
                    compact={false}
                    maxHeight="400px"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <GraduationCap className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a training record</h3>
                    <p className="text-gray-600">Choose a training from the list to view its details</p>
                  </div>
                </div>
              )}
            </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Add Training Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Training</DialogTitle>
          </DialogHeader>
          <div className="px-1">
            <TrainingForm
              personId={driverId}
              onSubmit={handleAddTraining}
              onCancel={() => setIsAddDialogOpen(false)}
              isSubmitting={isSubmitting}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Training Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Training</DialogTitle>
          </DialogHeader>
          <div className="px-1">
            <TrainingForm
              personId={driverId}
              initialData={selectedTraining}
              onSubmit={handleEditTraining}
              onCancel={() => setIsEditDialogOpen(false)}
              isSubmitting={isSubmitting}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Renewal Training Dialog - Only for required training */}
      <Dialog open={isRenewalDialogOpen} onOpenChange={setIsRenewalDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Renew Training</DialogTitle>
          </DialogHeader>
          <div className="px-1">
            <TrainingForm
              personId={driverId}
              renewingTraining={selectedTraining}
              onSubmit={handleRenewTraining}
              onCancel={() => setIsRenewalDialogOpen(false)}
              isSubmitting={isSubmitting}
            />
          </div>
        </DialogContent>
      </Dialog>


    </AppLayout>
  )
} 