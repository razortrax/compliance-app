"use client"

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layouts/app-layout'
import { buildStandardNavigation } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ActivityLog } from '@/components/ui/activity-log'
import { EmptyState } from '@/components/ui/empty-state'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
  FileText, Plus, AlertCircle, CheckCircle, Clock, Shield, Truck, AlertTriangle, Edit, Users, Building2
} from 'lucide-react'
import { format } from 'date-fns'
import EnhancedRoadsideInspectionForm from '@/components/roadside_inspections/enhanced-roadside-inspection-form'
import ViolationGroupsWithCAFGeneration from '@/components/cafs/violation-groups-with-caf-generation'
import CAFDetailModal from '@/components/cafs/caf-detail-modal'

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
  const [createdCAFs, setCreatedCAFs] = useState<any[]>([]) // Track created CAFs for this session
  const [selectedCAF, setSelectedCAF] = useState<any>(null)
  const [isCAFModalOpen, setIsCAFModalOpen] = useState(false)

  const refetchInspections = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [inspectionRes, orgsRes] = await Promise.all([
        fetch(`/api/master/${masterOrgId}/organization/${orgId}/driver/${driverId}/roadside-inspections`),
        fetch('/api/organizations')
      ])

      if (inspectionRes.ok) {
        const pageData: PageData = await inspectionRes.json()
        setData(pageData)
        if (pageData.roadsideInspections.length > 0) {
          setSelectedInspection(pageData.roadsideInspections[0])
        } else {
          setSelectedInspection(null)
        }
      } else {
        const errorText = await inspectionRes.text()
        throw new Error(`Failed to fetch roadside inspection data: ${errorText}`)
      }

      if (orgsRes.ok) {
        const orgs = await orgsRes.json()
        setOrganizations(orgs)
      }
    } catch (err) {
      console.error('❌ Roadside inspection data fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load roadside inspection data')
    } finally {
      setLoading(false)
    }
  }, [masterOrgId, orgId, driverId])

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
    router.push(`/master/${masterOrgId}/organization/${org.id}`)
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
            onClick={() => router.refresh()} 
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      </AppLayout>
    )
  }

  // Build standard navigation - Gold Standard
  const topNav = buildStandardNavigation(
    masterOrgId || '',
    orgId || '',
    'master'
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
            
            {/* Show recently created CAFs */}
            {createdCAFs.length > 0 && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      ✅ {createdCAFs.length} CAF{createdCAFs.length !== 1 ? 's' : ''} created this session
                    </p>
                    <p className="text-xs text-green-600">
                      {createdCAFs.map(caf => caf.cafNumber).join(', ')}
                    </p>
                  </div>
                      <Button 
                    size="sm" 
                    variant="outline"
                        onClick={() => router.push(`/master/${masterOrgId}/cafs`)}
                    className="text-green-700 border-green-300 hover:bg-green-100"
                  >
                    View CAF Dashboard
                  </Button>
                </div>
              </div>
            )}
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
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setIsEditDialogOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
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

                      {/* Comprehensive Inspection Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Inspector Information */}
                        <div className="space-y-3">
                          <h5 className="font-medium text-gray-700 border-b pb-1">Inspector Information</h5>
                          
                          <div>
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Inspector Name</span>
                            <p className="text-sm text-gray-900 mt-1">{selectedInspection.officerName}</p>
                          </div>
                          
                          {selectedInspection.agencyName && (
                            <div>
                              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Agency</span>
                              <p className="text-sm text-gray-900 mt-1">{selectedInspection.agencyName}</p>
                            </div>
                          )}
                          
                          {selectedInspection.officerBadge && (
                            <div>
                              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Badge Number</span>
                              <p className="text-sm text-gray-900 mt-1">{selectedInspection.officerBadge}</p>
                            </div>
                          )}
                        </div>

                        {/* Report Information */}
                        <div className="space-y-3">
                          <h5 className="font-medium text-gray-700 border-b pb-1">Report Information</h5>
                          
                          {selectedInspection.reportNumber ? (
                            <div>
                              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Report Number</span>
                              <p className="text-sm text-gray-900 mt-1">{selectedInspection.reportNumber}</p>
                            </div>
                          ) : (
                            <div>
                              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Report Number</span>
                              <p className="text-sm text-gray-500 mt-1">Not provided</p>
                            </div>
                          )}
                          
                          <div>
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Inspection Date & Time</span>
                            <p className="text-sm text-gray-900 mt-1">
                              {format(new Date(selectedInspection.incidentDate), 'MMM d, yyyy')}
                              {selectedInspection.incidentTime && ` at ${selectedInspection.incidentTime}`}
                            </p>
                          </div>
                        </div>

                        {/* Location Information */}
                        <div className="space-y-3">
                          <h5 className="font-medium text-gray-700 border-b pb-1">Inspection Location</h5>
                          
                          <div>
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Address</span>
                            <p className="text-sm text-gray-900 mt-1">
                              {selectedInspection.locationAddress || 'Not specified'}
                            </p>
                          </div>
                          
                          <div>
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">City, State, ZIP</span>
                            <p className="text-sm text-gray-900 mt-1">
                              {[
                                selectedInspection.locationCity,
                                selectedInspection.locationState,
                                selectedInspection.locationZip
                              ].filter(Boolean).join(', ') || 'Not specified'}
                            </p>
                          </div>
                        </div>

                        {/* Inspection Summary Stats */}
                        <div className="space-y-3">
                          <h5 className="font-medium text-gray-700 border-b pb-1">Inspection Summary</h5>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div className="text-center p-2 bg-blue-50 rounded">
                              <div className="text-lg font-bold text-blue-600">{selectedInspection.equipment.length}</div>
                              <div className="text-xs text-blue-600">Equipment</div>
                            </div>
                            <div className="text-center p-2 bg-red-50 rounded">
                              <div className="text-lg font-bold text-red-600">{selectedInspection.violations.length}</div>
                              <div className="text-xs text-red-600">Violations</div>
                            </div>
                          </div>
                          
                          <div className="text-center p-2 bg-gray-50 rounded">
                            <div className="text-lg font-bold text-gray-600">
                              {selectedInspection.violations.filter(v => v.outOfService).length}
                            </div>
                            <div className="text-xs text-gray-600">Out of Service</div>
                          </div>
                        </div>
                      </div>
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

                    {/* Enhanced Violations with CAF Generation */}
                    {selectedInspection.violations.length > 0 && (
                      <div>
                        <ViolationGroupsWithCAFGeneration
                          incident={selectedInspection}
                          violations={selectedInspection.violations}
                          organizationId={data.organization.id}
                          onCAFCreated={(caf) => {
                            console.log('CAF created:', caf)
                            // Add to created CAFs list
                            setCreatedCAFs(prev => [...prev, caf])
                            // Show CAF in modal instead of navigating away
                            setSelectedCAF(caf)
                            setIsCAFModalOpen(true)
                          }}
                          onCAFClick={async (existingCAF) => {
                            try {
                              // Fetch full CAF details
                              const response = await fetch(`/api/corrective-action-forms/${existingCAF.id}`)
                              if (response.ok) {
                                const fullCAF = await response.json()
                                setSelectedCAF(fullCAF)
                                setIsCAFModalOpen(true)
                              }
                            } catch (error) {
                              console.error('Error fetching CAF details:', error)
                            }
                          }}
                        />
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
      
      {/* Edit Inspection Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Roadside Inspection</DialogTitle>
          </DialogHeader>
          <div className="px-1">
            {selectedInspection && (
              <EnhancedRoadsideInspectionForm
                masterOrgId={masterOrgId}
                organizationId={orgId}
                preSelectedDriverId={data.driver.id}
                initialData={selectedInspection as any}
                onSubmit={async () => {
                  setIsEditDialogOpen(false)
                  await refetchInspections()
                }}
                onCancel={() => setIsEditDialogOpen(false)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* CAF Detail Modal */}
      <CAFDetailModal
        cafId={selectedCAF?.id}
        onClose={() => {
          setIsCAFModalOpen(false)
          setSelectedCAF(null)
        }}
      />
    </AppLayout>
  )
} 