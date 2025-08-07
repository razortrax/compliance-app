"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layouts/app-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, FileText, AlertTriangle, Clock, Shield, Car, Eye } from 'lucide-react'
import { ActivityLog } from '@/components/ui/activity-log'
import { format } from 'date-fns'
import { useMasterOrg } from '@/hooks/use-master-org'
import { buildStandardDriverNavigation } from '@/lib/utils'
import { EnhancedAccidentForm } from '@/components/accidents/enhanced-accident-form'

interface Accident {
  id: string
  reportNumber?: string
  incidentDate: string
  incidentTime?: string
  officerName: string
  agencyName: string
  officerBadge?: string
  locationAddress?: string
  locationCity?: string
  locationState?: string
  locationZip?: string
  isFatality: boolean
  isReportable: boolean
  isInjury: boolean
  isTow: boolean
  isCitation: boolean
  needsReport: boolean
  needsDrugTest: boolean
  numberOfFatalities?: number
  numberOfVehicles?: number
  accidentDescription?: string
  weatherConditions?: string
  roadConditions?: string
  trafficConditions?: string
  issue: {
    id: string
    title: string
    description: string
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
    vin?: string
  }>
  violations: Array<{
    id: string
    violationCode: string
    description: string
    outOfService: boolean
    severity?: string
    unitNumber?: number
    violationType?: string
    inspectorComments?: string
  }>
}

interface AccidentPageData {
  masterOrg: { id: string; name: string }
  organization: { id: string; name: string }
  driver: { 
    id: string 
    firstName: string
    lastName: string
    licenseNumber?: string
    party?: { id: string }
  }
  accidents: Accident[]
}

export default function DriverAccidentsPage({ 
  params 
}: { 
  params: { masterOrgId: string; orgId: string; driverId: string } 
}) {
  const { masterOrgId, orgId, driverId } = params
  const router = useRouter()
  
  const [data, setData] = useState<AccidentPageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedAccident, setSelectedAccident] = useState<Accident | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { masterOrg, loading: masterOrgLoading } = useMasterOrg()
  const [organizations, setOrganizations] = useState<any[]>([]) // Changed to any[] as Organization type is removed
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  // Gold Standard: URL-driven data loading
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await fetch(
          `/api/master/${masterOrgId}/organization/${orgId}/driver/${driverId}/accidents`
        )
        
        if (response.ok) {
          const result = await response.json()
          setData(result)
          
          // Auto-select first accident if available
          if (result.accidents.length > 0 && !selectedAccident) {
            setSelectedAccident(result.accidents[0])
          }
        } else {
          console.error('Failed to fetch driver accident data')
        }
      } catch (error) {
        console.error('Error fetching driver accident data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [masterOrgId, orgId, driverId])

  // Fetch organizations for selector
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

  const handleAddAccident = async (accidentData: any) => {
    try {
      setIsSubmitting(true)
      
      // Add partyId to the submission data
      const submissionData = {
        ...accidentData,
        partyId: data?.driver.party?.id,
        incidentType: 'ACCIDENT'
      }
      
      console.log('Submitting accident data:', submissionData)
      
      const response = await fetch('/api/incidents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submissionData)
      })

      if (response.ok) {
        setIsAddDialogOpen(false)
        // Refresh data
        const refreshResponse = await fetch(
          `/api/master/${masterOrgId}/organization/${orgId}/driver/${driverId}/accidents`
        )
        if (refreshResponse.ok) {
          const result = await refreshResponse.json()
          setData(result)
          
          // Select the newly created accident (first in the list)
          if (result.accidents.length > 0) {
            setSelectedAccident(result.accidents[0])
          }
        }
      } else {
        const error = await response.json()
        console.error('Failed to create accident:', error)
        alert(`Failed to create accident: ${error.error}`)
      }
    } catch (error) {
      console.error('Error creating accident:', error)
      alert('Error creating accident')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOrganizationSelect = (org: any) => { // Changed to any as Organization type is removed
    // Navigate to the same driver in the new organization if exists; otherwise to org root
    router.push(`/master/${masterOrgId}/organization/${org.id}/driver/${driverId}/accidents`)
  }

  // Get accident status for display
  const getAccidentStatus = (accident: Accident) => {
    if (accident.isFatality) {
      return {
        badge: <Badge variant="destructive">FATALITY</Badge>,
        priority: 'critical'
      }
    }
    if (accident.violations.some(v => v.outOfService)) {
      return {
        badge: <Badge variant="destructive">OOS</Badge>,
        priority: 'high'
      }
    }
    if (accident.isInjury) {
      return {
        badge: <Badge variant="secondary">INJURY</Badge>,
        priority: 'medium'
      }
    }
    if (accident.violations.length > 0) {
      return {
        badge: <Badge variant="outline">VIOLATIONS</Badge>,
        priority: 'medium'
      }
    }
    return {
      badge: <Badge variant="outline">REPORTED</Badge>,
      priority: 'low'
    }
  }

  // Build navigation
  const topNav = buildStandardDriverNavigation(
    driverId || '',
    masterOrgId || '',
    'drivers'
  )

  // Group accidents by recent vs older
  const recentAccidents = data?.accidents.slice(0, 5) || []
  const olderAccidents = data?.accidents.slice(5) || []

  if (loading || masterOrgLoading) {
    return (
      <AppLayout
        name="Loading..."
        topNav={[]}
        className="p-6"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading accidents...</div>
        </div>
      </AppLayout>
    )
  }

  if (!data) {
    return (
      <AppLayout
        name="Error"
        topNav={[]}
        className="p-6"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">Failed to load accident data</div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout 
      name={data.masterOrg.name}
      topNav={topNav}
      className="p-6"
    >
      <div className="max-w-7xl mx-auto h-full">
        {/* Driver and Accidents Header - Gold Standard */}
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <p className="text-sm text-gray-600">{data.organization.name}</p>
            <h1 className="text-2xl font-bold text-gray-900">
              {data.driver.firstName} {data.driver.lastName} - Accidents
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>Accidents: {data.accidents.length}</span>
              <span>•</span>
              <span>Violations: {data.accidents.reduce((acc, a) => acc + a.violations.length, 0)}</span>
            </div>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Accident
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl h-[95vh] flex flex-col p-0">
              <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
                <DialogTitle>Add New Accident</DialogTitle>
              </DialogHeader>
              <div className="flex-1 flex flex-col overflow-hidden">
                <EnhancedAccidentForm
                  onSubmit={handleAddAccident}
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
          {/* Left Pane - Accidents List (300px) */}
          <div className="w-[300px] flex-shrink-0">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Accidents
                </CardTitle>
                <CardDescription>
                  Motor vehicle accident records
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
                  {data.accidents.length > 0 ? (
                    <div className="space-y-1">
                      {/* Recent Accidents */}
                      {recentAccidents.map((accident) => {
                        const accidentStatus = getAccidentStatus(accident)
                        const isSelected = selectedAccident?.id === accident.id
                        
                        return (
                          <div
                            key={accident.id}
                            className={`p-3 cursor-pointer border-l-4 transition-colors ${
                              isSelected 
                                ? 'bg-blue-50 border-l-blue-500' 
                                : 'hover:bg-gray-50 border-l-transparent'
                            }`}
                            onClick={() => setSelectedAccident(accident)}
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium text-sm truncate">
                                  {format(new Date(accident.incidentDate), 'MMM d, yyyy')}
                                </h4>
                                {accidentStatus.badge}
                              </div>
                              
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Shield className="h-3 w-3" />
                                {accident.agencyName}
                                {accident.reportNumber && (
                                  <>
                                    <span>•</span>
                                    <span>{accident.reportNumber}</span>
                                  </>
                                )}
                              </div>

                              {accident.violations.length > 0 && (
                                <div className="flex items-center gap-1 text-xs text-red-600">
                                  <AlertTriangle className="h-3 w-3" />
                                  {accident.violations.length} violation{accident.violations.length !== 1 ? 's' : ''}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                      
                      {/* Older Accidents - Collapsed */}
                      {olderAccidents.length > 0 && (
                        <div className="p-3 text-center text-gray-400 border-t">
                          <span className="text-xs">{olderAccidents.length} older accidents</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-gray-500">
                      <Car className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <h4 className="font-medium text-gray-900 mb-1">No accidents yet</h4>
                      <p className="text-sm">Add accident records for this driver</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Pane - Accident Details */}
          <div className="flex-1">
            <Card className="h-full">
              {selectedAccident ? (
                <div className="h-full flex flex-col">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Car className="h-5 w-5" />
                        Accident Details
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {getAccidentStatus(selectedAccident).badge}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedAccident(null)}
                        >
                          ✕
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="flex-1 overflow-y-auto space-y-6">
                    {/* Accident Summary */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900">{selectedAccident.issue.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {format(new Date(selectedAccident.incidentDate), 'EEEE, MMMM d, yyyy')}
                          {selectedAccident.incidentTime && ` at ${selectedAccident.incidentTime}`}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Officer:</span>
                          <p className="text-gray-600 mt-1">{selectedAccident.officerName}</p>
                        </div>
                        
                        <div>
                          <span className="font-medium text-gray-700">Agency:</span>
                          <p className="text-gray-600 mt-1">{selectedAccident.agencyName}</p>
                        </div>
                      </div>

                      {selectedAccident.reportNumber && (
                        <div>
                          <span className="font-medium text-gray-700">Report Number:</span>
                          <p className="text-gray-600">{selectedAccident.reportNumber}</p>
                        </div>
                      )}
                    </div>

                    {/* Accident Classifications */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Classifications</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedAccident.isFatality && (
                          <Badge variant="destructive">
                            Fatality {selectedAccident.numberOfFatalities && `(${selectedAccident.numberOfFatalities})`}
                          </Badge>
                        )}
                        {selectedAccident.isInjury && <Badge variant="secondary">Injury</Badge>}
                        {selectedAccident.isReportable && <Badge variant="default">Reportable</Badge>}
                        {selectedAccident.isTow && <Badge variant="outline">Vehicle Towed</Badge>}
                        {selectedAccident.isCitation && <Badge variant="outline">Citations Issued</Badge>}
                        {selectedAccident.needsReport && <Badge variant="outline">Needs Report</Badge>}
                        {selectedAccident.needsDrugTest && <Badge variant="outline">Drug Test Required</Badge>}
                      </div>
                    </div>

                    {/* Location Information */}
                    {(selectedAccident.locationAddress || selectedAccident.locationCity || selectedAccident.locationState) && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Location Information</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          {selectedAccident.locationAddress && (
                            <div>
                              <span className="font-medium text-gray-700">Address:</span>
                              <p className="text-gray-600 mt-1">{selectedAccident.locationAddress}</p>
                            </div>
                          )}
                          {(selectedAccident.locationCity || selectedAccident.locationState || selectedAccident.locationZip) && (
                            <div>
                              <span className="font-medium text-gray-700">Location:</span>
                              <p className="text-gray-600 mt-1">
                                {[selectedAccident.locationCity, selectedAccident.locationState, selectedAccident.locationZip]
                                  .filter(Boolean).join(', ')}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Equipment Involved */}
                    {selectedAccident.equipment.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Equipment Involved</h4>
                        <div className="space-y-2">
                          {selectedAccident.equipment.map((equipment) => (
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
                    {selectedAccident.violations.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Violations Found</h4>
                        <div className="space-y-2">
                          {selectedAccident.violations.map((violation) => (
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
                                  Officer: {violation.inspectorComments}
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
                        issueId={selectedAccident.issue.id}
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
                    <Car className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select an accident</h3>
                    <p className="text-sm">Choose an accident from the list to view details</p>
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