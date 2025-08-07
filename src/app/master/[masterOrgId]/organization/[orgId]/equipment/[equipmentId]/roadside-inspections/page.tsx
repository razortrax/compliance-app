"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layouts/app-layout'
import { buildStandardNavigation, getUserRole } from '@/lib/utils'
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
      equipment?: {
        vehicleType: string
        make?: string
        model?: string
        year?: number
        vinNumber?: string
        plateNumber?: string
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

interface Equipment {
  id: string
  vehicleType: string
  make?: string
  model?: string
  year?: number
  vinNumber?: string
  plateNumber?: string
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
  equipment: Equipment
  roadsideInspections: RoadsideInspection[]
}

export default function EquipmentRoadsideInspectionsPage() {
  const params = useParams()
  const router = useRouter()
  const masterOrgId = params.masterOrgId as string
  const orgId = params.orgId as string
  const equipmentId = params.equipmentId as string
  
  const [data, setData] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRoadsideInspection, setSelectedRoadsideInspection] = useState<RoadsideInspection | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  
  // CAF Generation State
  const [createdCAFsInSession, setCreatedCAFsInSession] = useState<string[]>([])
  const [selectedCAFId, setSelectedCAFId] = useState<string | null>(null)

  // Smart expiration status function - Equipment Gold Standard (RSIN-specific)
  const getRoadsideInspectionStatus = (roadsideInspection: RoadsideInspection) => {
    const hasViolations = roadsideInspection.violations.length > 0
    const hasOOSViolations = roadsideInspection.violations.some(v => v.outOfService)
    
    if (hasOOSViolations) {
      return {
        status: 'out-of-service',
        badge: <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Out of Service
        </Badge>
      }
    } else if (hasViolations) {
      return {
        status: 'violations',
        badge: <Badge variant="outline" className="flex items-center gap-1 border-orange-500 text-orange-600">
          <AlertCircle className="h-3 w-3" />
          Violations
        </Badge>
      }
    } else {
      return {
        status: 'clean',
        badge: <Badge variant="secondary" className="flex items-center gap-1 bg-green-100 text-green-700">
          <CheckCircle className="h-3 w-3" />
          Clean Inspection
        </Badge>
      }
    }
  }

  useEffect(() => {
    fetchData()
  }, [masterOrgId, orgId, equipmentId])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/master/${masterOrgId}/organization/${orgId}/equipment/${equipmentId}/roadside-inspections`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch roadside inspections')
      }
      
      const pageData = await response.json()
      setData(pageData)
      
      // Auto-select first roadside inspection if any
      if (pageData.roadsideInspections.length > 0) {
        setSelectedRoadsideInspection(pageData.roadsideInspections[0])
      }
      
    } catch (error) {
      console.error('Error fetching roadside inspections:', error)
      setError(error instanceof Error ? error.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleAddRoadsideInspection = async (formData: any) => {
    try {
      const response = await fetch(`/api/master/${masterOrgId}/organization/${orgId}/equipment/${equipmentId}/roadside-inspections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create roadside inspection')
      }

      const newRoadsideInspection = await response.json()
      
      // Refresh data
      await fetchData()
      
      // Select the new roadside inspection
      setSelectedRoadsideInspection(newRoadsideInspection)
      setIsAddDialogOpen(false)
      
    } catch (error) {
      console.error('Error creating roadside inspection:', error)
      alert(`Failed to create roadside inspection: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  if (loading) {
    return (
      <AppLayout
        name={data?.masterOrg?.name || 'Loading...'}
        sidebarMenu="equipment"
        className="p-6"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Clock className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Loading roadside inspections...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout
        name={data?.masterOrg?.name || 'Error'}
        sidebarMenu="equipment"
        className="p-6"
      >
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold mb-2">Failed to Load Roadside Inspections</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchData}>Try Again</Button>
        </div>
      </AppLayout>
    )
  }

  if (!data) {
    return (
      <AppLayout
        name="Not Found"
        sidebarMenu="equipment"
        className="p-6"
      >
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold mb-2">Equipment Not Found</h3>
          <p className="text-gray-600">The requested equipment could not be found.</p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout
      name={data.masterOrg.name}
      sidebarMenu="equipment"
      topNav={buildStandardNavigation(masterOrgId, orgId)}
      className="p-6"
    >
      <div className="space-y-6">
        {/* Header - Gold Standard Pattern */}
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <p className="text-sm text-gray-600">{data.organization.name}</p>
            <h1 className="text-2xl font-bold text-gray-900">
              {data.equipment.make} {data.equipment.model} - Roadside Inspections
            </h1>
            <p className="text-sm text-gray-500">{data.equipment.vehicleType} • VIN: {data.equipment.vinNumber}</p>
          </div>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-12 gap-6 h-[600px]">
          {/* Left Sidebar - Roadside Inspections List (300px) */}
          <div className="col-span-4 border-r border-gray-200 pr-6">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Roadside Inspections</h3>
                  <p className="text-sm text-gray-600">
                    <Badge variant="secondary">{data.roadsideInspections.length}</Badge>
                    {data.roadsideInspections.length === 1 ? ' inspection' : ' inspections'}
                  </p>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create Roadside Inspection</DialogTitle>
                    </DialogHeader>
                    <EnhancedRoadsideInspectionForm
                      onSubmit={handleAddRoadsideInspection}
                      onCancel={() => setIsAddDialogOpen(false)}
                      preSelectedEquipmentIds={[equipmentId]}
                      organizationId={orgId}
                      masterOrgId={masterOrgId}
                    />
                  </DialogContent>
                </Dialog>
              </div>

              {/* Roadside Inspections List */}
              <div className="space-y-2 overflow-y-auto">
                {data.roadsideInspections.length > 0 ? (
                  data.roadsideInspections.map((roadsideInspection) => {
                    const statusInfo = getRoadsideInspectionStatus(roadsideInspection)
                    return (
                      <Card
                        key={roadsideInspection.id}
                        className={`cursor-pointer transition-colors ${
                          selectedRoadsideInspection?.id === roadsideInspection.id 
                            ? 'ring-2 ring-blue-500 bg-blue-50' 
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedRoadsideInspection(roadsideInspection)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              <Shield className="h-4 w-4 mt-0.5 text-gray-500" />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm truncate">
                                  {roadsideInspection.reportNumber || `Inspection ${format(new Date(roadsideInspection.incidentDate), 'MMM d')}`}
                                </h4>
                                <p className="text-xs text-gray-600 mt-1">
                                  {format(new Date(roadsideInspection.incidentDate), 'MMM d, yyyy')}
                                  {roadsideInspection.incidentTime && ` at ${roadsideInspection.incidentTime}`}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                  {roadsideInspection.officerName} - {roadsideInspection.agencyName}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  {statusInfo.badge}
                                  {roadsideInspection.violations.length > 0 && (
                                    <Badge variant="outline" className="text-xs">
                                      {roadsideInspection.violations.length} violation{roadsideInspection.violations.length !== 1 ? 's' : ''}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })
                ) : (
                  <EmptyState
                    icon={Shield}
                    title="No roadside inspections"
                    description="This equipment has no recorded roadside inspections"
                    action={{
                      label: "Add First Inspection",
                      onClick: () => setIsAddDialogOpen(true)
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Right Content - Roadside Inspection Details */}
          <div className="col-span-8">
            {selectedRoadsideInspection ? (
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Shield className="h-6 w-6 mt-1 text-gray-500" />
                      <div>
                        <CardTitle className="text-xl">
                          {selectedRoadsideInspection.reportNumber || `Roadside Inspection ${format(new Date(selectedRoadsideInspection.incidentDate), 'MMM d, yyyy')}`}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {selectedRoadsideInspection.officerName} - {selectedRoadsideInspection.agencyName}
                        </CardDescription>
                        <div className="flex items-center gap-2 mt-2">
                          {getRoadsideInspectionStatus(selectedRoadsideInspection).badge}
                          <Badge variant="outline">
                            Issue #{selectedRoadsideInspection.issue.id.slice(-6)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Inspection Details */}
                  <div>
                    <h4 className="font-medium mb-3">Inspection Details</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-500">Date & Time:</span>
                        <p>{format(new Date(selectedRoadsideInspection.incidentDate), 'MMM d, yyyy')}
                          {selectedRoadsideInspection.incidentTime && ` at ${selectedRoadsideInspection.incidentTime}`}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-500">Inspection Level:</span>
                        <p>{selectedRoadsideInspection.inspectionLevel || 'Not specified'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-500">Overall Result:</span>
                        <p>{selectedRoadsideInspection.overallResult || 'Not specified'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-500">DVIR Received:</span>
                        <p>{selectedRoadsideInspection.dvirReceived ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  {(selectedRoadsideInspection.locationAddress || selectedRoadsideInspection.locationCity) && (
                    <div>
                      <h4 className="font-medium mb-3">Location</h4>
                      <p className="text-sm">
                        {[
                          selectedRoadsideInspection.locationAddress,
                          selectedRoadsideInspection.locationCity,
                          selectedRoadsideInspection.locationState,
                          selectedRoadsideInspection.locationZip
                        ].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  )}

                  {/* Equipment Involved */}
                  <div>
                    <h4 className="font-medium mb-3">Equipment Involved</h4>
                    <div className="space-y-2">
                      {selectedRoadsideInspection.equipment.map((equipment) => (
                        <div key={equipment.id} className="p-3 border rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Truck className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">Unit {equipment.unitNumber}</span>
                            {equipment.unitType && (
                              <Badge variant="secondary">{equipment.unitType}</Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="font-medium text-gray-500">Vehicle:</span>
                              <p>{[equipment.year, equipment.make, equipment.model].filter(Boolean).join(' ')}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-500">Plate:</span>
                              <p>{equipment.plateNumber} {equipment.plateState && `(${equipment.plateState})`}</p>
                            </div>
                            {equipment.vin && (
                              <div className="col-span-2">
                                <span className="font-medium text-gray-500">VIN:</span>
                                <p className="font-mono text-xs">{equipment.vin}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Violations */}
                  {selectedRoadsideInspection.violations.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">Violations ({selectedRoadsideInspection.violations.length})</h4>
                      <div className="space-y-3">
                        {selectedRoadsideInspection.violations.map((violation) => (
                          <div key={violation.id} className="p-3 border rounded-lg">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant={violation.outOfService ? "destructive" : "outline"}>
                                    {violation.violationCode}
                                  </Badge>
                                  {violation.severity && (
                                    <Badge variant="secondary">{violation.severity}</Badge>
                                  )}
                                  {violation.unitNumber && (
                                    <Badge variant="outline">Unit {violation.unitNumber}</Badge>
                                  )}
                                  {violation.outOfService && (
                                    <Badge variant="destructive">OUT OF SERVICE</Badge>
                                  )}
                                </div>
                                <p className="text-sm font-medium mb-1">{violation.description}</p>
                                {violation.inspectorComments && (
                                  <p className="text-sm text-gray-600 italic">
                                    Inspector: {violation.inspectorComments}
                                  </p>
                                )}
                                {violation.citationNumber && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Citation: {violation.citationNumber}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* CAF Generation and Management */}
                  {selectedRoadsideInspection.violations && selectedRoadsideInspection.violations.length > 0 && (
                    <div>
                      <ViolationGroupsWithCAFGeneration
                        incidentId={selectedRoadsideInspection.id}
                        violations={selectedRoadsideInspection.violations}
                        onCAFCreated={(cafIds) => {
                          setCreatedCAFsInSession(prev => [...prev, ...cafIds])
                        }}
                        onCAFSelected={(cafId) => setSelectedCAFId(cafId)}
                        createdCAFsInSession={createdCAFsInSession}
                      />
                    </div>
                  )}

                  {/* Activity Log */}
                  <div>
                    <h4 className="font-medium mb-3">Activity Log</h4>
                    <ActivityLog 
                      issueId={selectedRoadsideInspection.id}
                    />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <EmptyState
                icon={FileText}
                title="Select a Roadside Inspection"
                description="Choose a roadside inspection from the list to view its details"
              />
            )}
          </div>
        </div>
      </div>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Roadside Inspection</DialogTitle>
          </DialogHeader>
          <EnhancedRoadsideInspectionForm
            onSubmit={handleAddRoadsideInspection}
            onCancel={() => setIsAddDialogOpen(false)}
            preSelectedEquipmentIds={[equipmentId]}
            organizationId={orgId}
            masterOrgId={masterOrgId}
          />
        </DialogContent>
      </Dialog>
      
      {/* CAF Detail Modal */}
      <CAFDetailModal
        cafId={selectedCAFId}
        onClose={() => setSelectedCAFId(null)}
      />
    </AppLayout>
  )
} 