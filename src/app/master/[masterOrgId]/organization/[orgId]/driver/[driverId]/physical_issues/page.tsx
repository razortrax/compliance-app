'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { AppLayout } from '@/components/layouts/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { ActivityLog } from '@/components/ui/activity-log'
import PhysicalIssueForm from '@/components/physical_issues/physical-issue-form'
import { PhysicalRenewalForm } from '@/components/physical_issues/physical-renewal-form'
import { Plus, FileText, AlertTriangle, Clock, CheckCircle, Edit, Stethoscope, RotateCcw } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { buildStandardDriverNavigation } from '@/lib/utils'

interface PhysicalIssue {
  id: string
  issueId: string
  type?: string
  medicalExaminer?: string
  selfCertified: boolean
  nationalRegistry: boolean
  result?: string
  status: string // 'Qualified' | 'Disqualified'
  startDate?: string
  expirationDate?: string
  outOfServiceDate?: string
  backInServiceDate?: string
  createdAt: string
  updatedAt: string
  issue: {
    id: string
    title: string
    description?: string
    status: string
    priority: string
  }
}

interface ContextData {
  driver: {
    id: string
    firstName: string
    lastName: string
    licenseNumber?: string
    party?: {
      id: string
    }
  }
  organization: {
    id: string
    name: string
    dotNumber?: string
  }
  masterOrg: {
    id: string
    name: string
  }
  physicalIssues: PhysicalIssue[]
}

interface PhysicalIssuePageProps {
  params: {
    masterOrgId: string
    orgId: string
    driverId: string
  }
}

// Map physical result to display label
const PHYSICAL_RESULT_LABELS: Record<string, string> = {
  'Three_Month': '3 Month',
  'Six_Month': '6 Month', 
  'One_Year': '1 Year',
  'Two_Years': '2 Years',
  'Disqualified': 'Disqualified'
}

// Enhanced expiration status function
function getExpirationStatus(physical: PhysicalIssue): { label: string; color: string; bgColor: string } {
  // Handle disqualified status
  if (physical.status === 'Disqualified' || physical.result === 'Disqualified') {
    if (physical.backInServiceDate) {
      return { label: 'Reinstated', color: 'text-blue-600', bgColor: 'bg-blue-50' }
    }
    return { label: 'Disqualified', color: 'text-red-600', bgColor: 'bg-red-50' }
  }

  if (!physical.expirationDate) {
    return { label: 'No Expiration', color: 'text-gray-600', bgColor: 'bg-gray-50' }
  }

  const today = new Date()
  const expirationDate = new Date(physical.expirationDate)
  const daysUntilExpiration = differenceInDays(expirationDate, today)

  if (daysUntilExpiration < 0) {
    return { label: 'Expired', color: 'text-red-600', bgColor: 'bg-red-50' }
  } else if (daysUntilExpiration <= 30) {
    return { label: `Due in ${daysUntilExpiration} days`, color: 'text-orange-600', bgColor: 'bg-orange-50' }
  } else if (daysUntilExpiration <= 60) {
    return { label: `Due in ${daysUntilExpiration} days`, color: 'text-yellow-600', bgColor: 'bg-yellow-50' }
  } else {
    return { label: 'Current', color: 'text-green-600', bgColor: 'bg-green-50' }
  }
}

export default function PhysicalIssueePage({ params }: PhysicalIssuePageProps) {
  const { masterOrgId, orgId, driverId } = params
  
  const [data, setData] = useState<ContextData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPhysical, setSelectedPhysical] = useState<PhysicalIssue | null>(null)
  const [organizations, setOrganizations] = useState<any[]>([])
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isRenewalDialogOpen, setIsRenewalDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Single API call to get all context and data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/master/${masterOrgId}/organization/${orgId}/driver/${driverId}/physical_issues`)
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Driver not found in this organization')
          } else if (response.status === 403) {
            throw new Error('Access denied to this organization')
          } else {
            throw new Error(`Failed to load data: ${response.status}`)
          }
        }
        
        const result = await response.json()
        setData(result)
        
        // Auto-select first physical if available
        if (result.physicalIssues && result.physicalIssues.length > 0) {
          setSelectedPhysical(result.physicalIssues[0])
        }
        
      } catch (error) {
        console.error('❌ Error fetching Physical data:', error)
        setError(error instanceof Error ? error.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [masterOrgId, orgId, driverId])

  // Fetch organizations for selectors
  useEffect(() => {
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
    fetchOrganizations()
  }, [])

  const handleOrganizationSelect = (org: any) => {
    console.log('Organization selected:', org.id)
    setIsSheetOpen(false)
    // Navigate to the selected organization
    window.location.href = `/master/${masterOrgId}/organization/${org.id}`
  }

  // Gold Standard: Handle form submissions
  const handleAddPhysical = async (formData: any) => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/master/${masterOrgId}/organization/${orgId}/driver/${driverId}/physical_issues`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to create physical: ${errorText}`)
      }

      const newPhysical: PhysicalIssue = await response.json()
      setIsAddDialogOpen(false)
      
      // Refresh data
      const refreshResponse = await fetch(`/api/master/${masterOrgId}/organization/${orgId}/driver/${driverId}/physical_issues`)
      if (refreshResponse.ok) {
        const refreshedData = await refreshResponse.json()
        setData(refreshedData)
        setSelectedPhysical(newPhysical)
      }
    } catch (error) {
      console.error('Error adding physical:', error)
      alert(`Error adding physical: ${(error as Error).message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdatePhysical = async (formData: any) => {
    if (!selectedPhysical) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/physical_issues/${selectedPhysical.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to update physical: ${errorText}`)
      }

      const updatedPhysical: PhysicalIssue = await response.json()
      setIsEditDialogOpen(false)
      
      // Refresh data
      const refreshResponse = await fetch(`/api/master/${masterOrgId}/organization/${orgId}/driver/${driverId}/physical_issues`)
      if (refreshResponse.ok) {
        const refreshedData = await refreshResponse.json()
        setData(refreshedData)
        setSelectedPhysical(updatedPhysical)
      }
    } catch (error) {
      console.error('Error updating physical:', error)
      alert(`Error updating physical: ${(error as Error).message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRenewPhysical = async (formData: any) => {
    if (!selectedPhysical) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/physical_issues/renew', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to renew physical: ${errorText}`)
      }

      const newPhysical: PhysicalIssue = await response.json()
      setIsRenewalDialogOpen(false)
      
      // Refresh data
      const refreshResponse = await fetch(`/api/master/${masterOrgId}/organization/${orgId}/driver/${driverId}/physical_issues`)
      if (refreshResponse.ok) {
        const refreshedData = await refreshResponse.json()
        setData(refreshedData)
        setSelectedPhysical(newPhysical)
      }
    } catch (error) {
      console.error('Error renewing physical:', error)
      alert(`Error renewing physical: ${(error as Error).message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-red-600">{error}</div>
        </div>
      </AppLayout>
    )
  }

  if (!data) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-red-600">Failed to load physical issues data</div>
        </div>
      </AppLayout>
    )
  }

  const { driver, organization, masterOrg } = data

  // Sort physicals: active first, then by expiration date  
  const sortedPhysicals = [...data.physicalIssues].sort((a, b) => {
    // Active issues first
    const aActive = a.issue.status === 'Active' ? 1 : 0
    const bActive = b.issue.status === 'Active' ? 1 : 0
    if (aActive !== bActive) {
      return bActive - aActive
    }

    // Then by expiration date (soonest first)
    if (a.expirationDate && b.expirationDate) {
      return new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime()
    }
    if (a.expirationDate) return -1
    if (b.expirationDate) return 1
    return 0
  })

  // Build standard navigation - FIXED to be static
  const topNav = buildStandardDriverNavigation(
    driverId || '',
    masterOrgId || '',
    'drivers'
  )

  return (
    <AppLayout 
      name={data.masterOrg.name}
      topNav={topNav}
      className="p-6"
    >
      <div className="max-w-7xl mx-auto h-full">
        <div className="space-y-6">
          {/* Driver and Physical Header - Gold Standard Pattern */}
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-1">
              <p className="text-sm text-gray-600">{data.organization.name}</p>
              <h1 className="text-2xl font-bold text-gray-900">
                {data.driver.firstName} {data.driver.lastName} - Physical Examinations
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>Total Records: {data.physicalIssues.length}</span>
                <span>•</span>
                <span>Active: {sortedPhysicals.filter(p => p.issue.status === 'Active').length}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {selectedPhysical && (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsEditDialogOpen(true)
                      setIsAddDialogOpen(false)
                      setIsRenewalDialogOpen(false)
                    }}
                    className="flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setIsRenewalDialogOpen(true)
                      setIsAddDialogOpen(false)
                      setIsEditDialogOpen(false)
                    }}
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Renew
                  </Button>
                </>
              )}
              {/* Add Physical Button - Gold Standard: Always visible */}
              <Button 
                onClick={() => {
                  setSelectedPhysical(null)
                  setIsAddDialogOpen(true)
                  setIsEditDialogOpen(false)
                  setIsRenewalDialogOpen(false)
                }}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Physical
              </Button>
            </div>
          </div>

          {/* Split Pane Layout - Gold Standard Fixed Structure */}
          <div className="flex gap-6 h-[calc(100vh-200px)]">
            {/* Left Pane - Physical List */}
            <div className="w-[300px] flex-shrink-0">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Stethoscope className="h-5 w-5" />
                    Physical Records ({data.physicalIssues.length})
                  </CardTitle>
                  <CardDescription>
                    DOT physical examination records
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto">
                  {data.physicalIssues.length === 0 ? (
                    <EmptyState
                      icon={Stethoscope}
                      title="No physical records yet"
                      description={`Add physical examination records for ${driver.firstName} ${driver.lastName}`}
                    />
                  ) : (
                    <div className="space-y-2">
                      {sortedPhysicals.map((physical) => {
                        const status = getExpirationStatus(physical)
                        return (
                          <div
                            key={physical.id}
                            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                              selectedPhysical?.id === physical.id 
                                ? 'border-blue-200 bg-blue-50' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => setSelectedPhysical(physical)}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="text-sm font-medium">
                                {physical.type || 'Physical Exam'}
                              </div>
                              <Badge 
                                variant="secondary"
                                className={`${status.color} ${status.bgColor} border-0`}
                              >
                                {status.label}
                              </Badge>
                            </div>
                            {physical.expirationDate && (
                              <div className="text-xs text-gray-500">
                                Expires: {format(new Date(physical.expirationDate), 'MMM dd, yyyy')}
                              </div>
                            )}
                            {physical.result && (
                              <div className="text-xs text-gray-500">
                                Result: {PHYSICAL_RESULT_LABELS[physical.result] || physical.result}
                              </div>
                            )}
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
                <CardHeader>
                  <CardTitle>Physical Details</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto">
                  {selectedPhysical ? (
                    <>
                      {/* Header with Badge */}
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                            <Stethoscope className="h-5 w-5" />
                            {selectedPhysical.issue.title}
                          </h2>
                          <p className="text-sm text-gray-600 mt-1">
                            Physical examination details and status information
                          </p>
                        </div>
                        <Badge 
                          variant="secondary"
                          className={`${getExpirationStatus(selectedPhysical).color} ${getExpirationStatus(selectedPhysical).bgColor} border-0`}
                        >
                          {getExpirationStatus(selectedPhysical).label}
                        </Badge>
                      </div>

                      {/* Physical Details */}
                      <div className="grid md:grid-cols-2 gap-4 mb-6">
                        <div className="space-y-3">
                          {selectedPhysical.type && (
                            <div>
                              <span className="font-medium text-gray-700">Type:</span>
                              <span className="ml-2">{selectedPhysical.type}</span>
                            </div>
                          )}
                          {selectedPhysical.medicalExaminer && (
                            <div>
                              <span className="font-medium text-gray-700">Medical Examiner:</span>
                              <span className="ml-2">{selectedPhysical.medicalExaminer}</span>
                            </div>
                          )}
                          {selectedPhysical.result && (
                            <div>
                              <span className="font-medium text-gray-700">Result:</span>
                              <span className="ml-2">{PHYSICAL_RESULT_LABELS[selectedPhysical.result] || selectedPhysical.result}</span>
                            </div>
                          )}
                          <div>
                            <span className="font-medium text-gray-700">Status:</span>
                            <span className="ml-2">{selectedPhysical.status}</span>
                          </div>
                        </div>
                        <div className="space-y-3">
                          {selectedPhysical.startDate && (
                            <div>
                              <span className="font-medium text-gray-700">Exam Date:</span>
                              <span className="ml-2">{format(new Date(selectedPhysical.startDate), 'MMM dd, yyyy')}</span>
                            </div>
                          )}
                          {selectedPhysical.expirationDate && (
                            <div>
                              <span className="font-medium text-gray-700">Expiration Date:</span>
                              <span className="ml-2">{format(new Date(selectedPhysical.expirationDate), 'MMM dd, yyyy')}</span>
                            </div>
                          )}
                          <div>
                            <span className="font-medium text-gray-700">Self Certified:</span>
                            <span className="ml-2">{selectedPhysical.selfCertified ? 'Yes' : 'No'}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">National Registry:</span>
                            <span className="ml-2">{selectedPhysical.nationalRegistry ? 'Yes' : 'No'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Disqualification Details */}
                      {(selectedPhysical.status === 'Disqualified' || selectedPhysical.result === 'Disqualified') && (
                        <div className="border-t pt-4">
                          <h4 className="font-medium text-gray-900 mb-3">Disqualification Details</h4>
                          <div className="grid md:grid-cols-2 gap-4">
                            {selectedPhysical.outOfServiceDate && (
                              <div>
                                <span className="font-medium text-gray-700">Out of Service Date:</span>
                                <span className="ml-2">{format(new Date(selectedPhysical.outOfServiceDate), 'MMM dd, yyyy')}</span>
                              </div>
                            )}
                            {selectedPhysical.backInServiceDate && (
                              <div>
                                <span className="font-medium text-gray-700">Back in Service Date:</span>
                                <span className="ml-2">{format(new Date(selectedPhysical.backInServiceDate), 'MMM dd, yyyy')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Enhanced Activity Log */}
                      <div className="border-t pt-4">
                        <ActivityLog 
                          issueId={selectedPhysical.issue.id}
                          title="Activity Log"
                          allowedTypes={['note', 'communication', 'url', 'credential', 'attachment', 'task']}
                          compact={false}
                          maxHeight="400px"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <Stethoscope className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Select a physical record</h3>
                        <p className="text-gray-600">Choose a physical examination from the list to view details</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Modal Dialogs - Gold Standard */}
          
          {/* Add Physical Dialog */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Physical Record</DialogTitle>
                <DialogDescription>
                  Create a new physical examination record for {driver.firstName} {driver.lastName}
                </DialogDescription>
              </DialogHeader>
              <div className="px-1">
                <PhysicalIssueForm
                  partyId={driver.party?.id}
                  onSubmit={handleAddPhysical}
                  onCancel={() => setIsAddDialogOpen(false)}
                  isSubmitting={isSubmitting}
                />
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit Physical Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Physical Record</DialogTitle>
                <DialogDescription>
                  Update the physical examination record
                </DialogDescription>
              </DialogHeader>
              <div className="px-1">
                {selectedPhysical && (
                  <PhysicalIssueForm
                    physicalIssue={selectedPhysical}
                    onSubmit={handleUpdatePhysical}
                    onCancel={() => setIsEditDialogOpen(false)}
                    isSubmitting={isSubmitting}
                  />
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Renew Physical Dialog */}
          <Dialog open={isRenewalDialogOpen} onOpenChange={setIsRenewalDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Renew Physical Record</DialogTitle>
                <DialogDescription>
                  Create a new physical examination record to replace the expiring one
                </DialogDescription>
              </DialogHeader>
              <div className="px-1">
                {selectedPhysical && (
                  <PhysicalRenewalForm
                    physicalIssue={selectedPhysical}
                    onSubmit={handleRenewPhysical}
                    onCancel={() => setIsRenewalDialogOpen(false)}
                    isSubmitting={isSubmitting}
                  />
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </AppLayout>
  )
} 