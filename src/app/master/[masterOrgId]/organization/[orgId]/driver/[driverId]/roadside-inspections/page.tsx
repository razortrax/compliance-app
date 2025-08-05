"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layouts/app-layout'
import { buildStandardDriverNavigation } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ActivityLog } from '@/components/ui/activity-log'
import { EmptyState } from '@/components/ui/empty-state'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
  FileText, Plus, AlertCircle, CheckCircle, Clock, Shield, Truck, AlertTriangle
} from 'lucide-react'
import { format } from 'date-fns'
import EnhancedRoadsideInspectionForm from '@/components/roadside_inspections/enhanced-roadside-inspection-form'

interface RoadsideInspection {
  id: string
  reportNumber?: string
  incidentDate: string
  incidentTime?: string
  officerName: string
  agencyName?: string
  officerBadge?: string
  locationAddress?: string
  locationCity?: string
  locationState?: string
  locationZip?: string
  inspectionLevel?: string
  overallResult?: string
  dvirReceived: boolean
  dvirSource?: string
  entryMethod?: string
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
    }
  }
  equipment: Array<{
    id: string
    unitNumber: number
    unitType?: string
    make?: string
    model?: string
    year?: number
    plateNumber?: string
    plateState?: string
    vin?: string
    cvsaSticker?: string
    oosSticker?: string
  }>
  violations: Array<{
    id: string
    violationCode: string
    section?: string
    unitNumber?: number
    outOfService: boolean
    outOfServiceDate?: string
    backInServiceDate?: string
    citationNumber?: string
    severity?: string
    description: string
    inspectorComments?: string
    violationType?: string
    assignedPartyId?: string
  }>
}

interface Driver {
  id: string
  firstName: string
  lastName: string
  licenseNumber?: string
  party?: {
    id: string
  }
}

interface Organization {
  id: string
  name: string
}

interface MasterOrg {
  id: string
  name: string
}

interface PageData {
  masterOrg: MasterOrg
  organization: Organization
  driver: Driver
  roadsideInspections: RoadsideInspection[]
}

export default function MasterDriverRoadsideInspectionsPage() {
  const params = useParams()
  const router = useRouter()
  const masterOrgId = params.masterOrgId as string
  const orgId = params.orgId as string
  const driverId = params.driverId as string
  
  const [data, setData] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedInspection, setSelectedInspection] = useState<RoadsideInspection | null>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // URL-driven data loading - Gold Standard pattern! 🚀
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Single URL-driven API call with all contextual data pre-filtered! 
        const [inspectionResult, orgsResult] = await Promise.allSettled([
          fetch(`/api/master/${masterOrgId}/organization/${orgId}/driver/${driverId}/roadside-inspections`),
          fetch('/api/organizations') // Still need for org selector
        ])
        
        // Handle roadside inspection data (primary)
        if (inspectionResult.status === 'fulfilled' && inspectionResult.value.ok) {
          const pageData: PageData = await inspectionResult.value.json()
          setData(pageData)
          console.log('✅ URL-driven roadside inspections API success!')
          console.log(`🚛 Loaded ${pageData.roadsideInspections.length} inspection records for ${pageData.driver.firstName} ${pageData.driver.lastName}`)
          
          // Auto-select first inspection if available
          if (pageData.roadsideInspections.length > 0) {
            setSelectedInspection(pageData.roadsideInspections[0])
          }
        } else {
          const error = inspectionResult.status === 'fulfilled' 
            ? await inspectionResult.value.text()
            : inspectionResult.reason
          throw new Error(`Failed to fetch roadside inspection data: ${error}`)
        }
        
        // Handle organizations data (secondary)
        if (orgsResult.status === 'fulfilled' && orgsResult.value.ok) {
          const orgs = await orgsResult.value.json()
          setOrganizations(orgs)
        }
        
      } catch (err) {
        console.error('❌ Roadside inspection data fetch error:', err)
        setError(err instanceof Error ? err.message : 'Failed to load roadside inspection data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [masterOrgId, orgId, driverId])

  // Get inspection result status for display
  const getInspectionStatus = (inspection: RoadsideInspection) => {
    const hasOOSViolations = inspection.violations.some(v => v.outOfService)
    
    if (hasOOSViolations) {
      return {
        status: 'oos',
        badge: <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Out of Service
        </Badge>
      }
    } else if (inspection.overallResult === 'Warning') {
      return {
        status: 'warning',
        badge: <Badge className="flex items-center gap-1 bg-yellow-100 text-yellow-800 border-yellow-200">
          <AlertCircle className="h-3 w-3" />
          Warning
        </Badge>
      }
    } else if (inspection.overallResult === 'Pass') {
      return {
        status: 'pass',
        badge: <Badge className="flex items-center gap-1 bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="h-3 w-3" />
          Pass
        </Badge>
      }
    }
    
    return {
      status: 'unknown',
      badge: <Badge variant="secondary" className="flex items-center gap-1">
        <Clock className="h-3 w-3" />
        Pending
      </Badge>
    }
  }

  const handleAddInspection = async (formData: any) => {
    setIsSubmitting(true)
    
    // Debug the partyId
    const partyId = data?.driver.party?.id
    console.log('Debug submission data:', {
      partyId,
      driverData: data?.driver,
      formData
    })
    
    if (!partyId) {
      alert('Error: Driver party ID not found. Please refresh the page and try again.')
      setIsSubmitting(false)
      return
    }
    
    try {
      const response = await fetch('/api/incidents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          partyId: partyId
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to create inspection: ${errorText}`)
      }

      const newInspection = await response.json()
      
      // Refresh the data
      setData(prev => {
        if (!prev) return prev
        return {
          ...prev,
          roadsideInspections: [newInspection, ...prev.roadsideInspections]
        }
      })
      setIsAddDialogOpen(false)
      setSelectedInspection(newInspection)
    } catch (error) {
      console.error('Error creating inspection:', error)
      alert(error instanceof Error ? error.message : 'An error occurred while creating the inspection')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Organization selector handler - Gold Standard
  const handleOrganizationSelect = (org: Organization) => {
    console.log('Organization selected:', org.id)
    setIsSheetOpen(false)
    window.location.href = `/master/${masterOrgId}/organization/${org.id}`
  }

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

  // Build standard navigation - Gold Standard
  const topNav = buildStandardDriverNavigation(
    driverId || '',
    masterOrgId || '',
    'drivers'
  )

  // Filter inspections: prioritize recent inspections
  const recentInspections = data.roadsideInspections.filter(i => {
    const inspectionDate = new Date(i.incidentDate)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    return inspectionDate >= sixMonthsAgo
  })
  const olderInspections = data.roadsideInspections.filter(i => {
    const inspectionDate = new Date(i.incidentDate)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    return inspectionDate < sixMonthsAgo
  })

  return (
    <AppLayout 
      name={data.masterOrg.name}
      topNav={topNav}
      className="p-6"
    >
      <div className="max-w-7xl mx-auto h-full">
        {/* Driver and Roadside Inspections Header - Gold Standard */}
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <p className="text-sm text-gray-600">{data.organization.name}</p>
            <h1 className="text-2xl font-bold text-gray-900">
              {data.driver.firstName} {data.driver.lastName} - Roadside Inspections
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>Inspections: {data.roadsideInspections.length}</span>
              <span>•</span>
              <span>Violations: {data.roadsideInspections.reduce((acc, i) => acc + i.violations.length, 0)}</span>
            </div>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Inspection
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl h-[95vh] flex flex-col p-0">
              <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
                <DialogTitle>Add New Roadside Inspection</DialogTitle>
              </DialogHeader>
              <div className="flex-1 flex flex-col overflow-hidden">
                <EnhancedRoadsideInspectionForm
                  onSubmit={handleAddInspection}
                  onCancel={() => setIsAddDialogOpen(false)}
                  isSubmitting={isSubmitting}
                  preSelectedDriverId={data.driver.id}
                  organizationId={data.organization.id}
                  masterOrgId={data.masterOrg.id}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Split Pane Layout - Gold Standard */}
        <div className="flex gap-6 h-[calc(100vh-200px)]">
          {/* Left Pane - Inspections List (300px) */}
          <div className="w-[300px] flex-shrink-0">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Roadside Inspections
                </CardTitle>
                <CardDescription>
                  DOT roadside inspection records
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
                  {data.roadsideInspections.length > 0 ? (
                    <div className="space-y-1">
                      {/* Recent Inspections */}
                      {recentInspections.map((inspection) => {
                        const inspectionStatus = getInspectionStatus(inspection)
                        const isSelected = selectedInspection?.id === inspection.id
                        
                        return (
                          <div
                            key={inspection.id}
                            className={`p-3 cursor-pointer border-l-4 transition-colors ${
                              isSelected 
                                ? 'bg-blue-50 border-l-blue-500' 
                                : 'hover:bg-gray-50 border-l-transparent'
                            }`}
                            onClick={() => setSelectedInspection(inspection)}
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium text-sm truncate">
                                  {format(new Date(inspection.incidentDate), 'MMM d, yyyy')}
                                </h4>
                                {inspectionStatus.badge}
                              </div>
                              
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Shield className="h-3 w-3" />
                                {inspection.officerName}
                                {inspection.reportNumber && (
                                  <>
                                    <span>•</span>
                                    <span>{inspection.reportNumber}</span>
                                  </>
                                )}
                              </div>

                              {inspection.violations.length > 0 && (
                                <div className="flex items-center gap-1 text-xs text-red-600">
                                  <AlertTriangle className="h-3 w-3" />
                                  {inspection.violations.length} violation{inspection.violations.length !== 1 ? 's' : ''}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                      
                      {/* Older Inspections - Collapsed */}
                      {olderInspections.length > 0 && (
                        <div className="p-3 text-center text-gray-400 border-t">
                          <span className="text-xs">{olderInspections.length} older inspections</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-gray-500">
                      <Truck className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <h4 className="font-medium text-gray-900 mb-1">No inspections yet</h4>
                      <p className="text-sm">Add roadside inspection records</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Pane - Inspection Details */}
          <div className="flex-1">
            <Card className="h-full">
              {selectedInspection ? (
                <div className="h-full flex flex-col">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Truck className="h-5 w-5" />
                        Inspection Details
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {getInspectionStatus(selectedInspection).badge}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedInspection(null)}
                        >
                          ✕
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="flex-1 overflow-y-auto space-y-6">
                    {/* Inspection Summary */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900">{selectedInspection.issue.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {format(new Date(selectedInspection.incidentDate), 'EEEE, MMMM d, yyyy')}
                          {selectedInspection.incidentTime && ` at ${selectedInspection.incidentTime}`}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Inspector:</span>
                          <p className="text-gray-600 mt-1">{selectedInspection.officerName}</p>
                        </div>
                        
                        <div>
                          <span className="font-medium text-gray-700">Location:</span>
                          <p className="text-gray-600 mt-1">
                            {[
                              selectedInspection.locationAddress,
                              selectedInspection.locationCity,
                              selectedInspection.locationState
                            ].filter(Boolean).join(', ') || 'Not specified'}
                          </p>
                        </div>
                      </div>

                      {selectedInspection.reportNumber && (
                        <div>
                          <span className="font-medium text-gray-700">Report Number:</span>
                          <p className="text-gray-600">{selectedInspection.reportNumber}</p>
                        </div>
                      )}
                    </div>

                    {/* Equipment Involved */}
                    {selectedInspection.equipment.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Equipment Involved</h4>
                        <div className="space-y-2">
                          {selectedInspection.equipment.map((equipment) => (
                            <div key={equipment.id} className="bg-gray-50 p-3 rounded border">
                              <div className="font-medium">
                                Unit {equipment.unitNumber}
                                {(equipment.make || equipment.model) && 
                                  ` - ${[equipment.make, equipment.model, equipment.year].filter(Boolean).join(' ')}`
                                }
                              </div>
                              <div className="text-sm text-gray-600">
                                {equipment.plateNumber && `Plate: ${equipment.plateNumber}`}
                                {equipment.vin && ` • VIN: ${equipment.vin}`}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Violations */}
                    {selectedInspection.violations.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Violations Found</h4>
                        <div className="space-y-2">
                          {selectedInspection.violations.map((violation) => (
                            <div key={violation.id} className="bg-gray-50 p-3 rounded border">
                              <div className="flex justify-between items-start mb-2">
                                <div className="font-medium">{violation.violationCode}</div>
                                <div className="flex gap-1">
                                  {violation.outOfService && (
                                    <Badge variant="destructive">OOS</Badge>
                                  )}
                                  {violation.severity && (
                                    <Badge variant="secondary">{violation.severity}</Badge>
                                  )}
                                </div>
                              </div>
                              <div className="text-sm text-gray-600 mb-1">{violation.description}</div>
                              {violation.inspectorComments && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Inspector: {violation.inspectorComments}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Activity Log */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Activity Log</h4>
                      <ActivityLog 
                        issueId={selectedInspection.issue.id}
                        title="Activity Log"
                        allowedTypes={['note', 'communication', 'url', 'credential', 'attachment', 'task']}
                        compact={false}
                        maxHeight="400px"
                      />
                    </div>
                  </CardContent>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <Truck className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select an inspection</h3>
                    <p className="text-sm">Choose an inspection from the list to view details</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  )
} 