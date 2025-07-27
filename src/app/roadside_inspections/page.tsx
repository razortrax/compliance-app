"use client"

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { AppLayout, Organization } from '@/components/layouts/app-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { Plus, FileText, Eye, Edit } from 'lucide-react'
import { RoadsideInspectionForm } from '@/components/roadside_inspections/roadside-inspection-form'
import { useMasterOrg } from '@/hooks/use-master-org'
import { buildStandardDriverNavigation } from '@/lib/utils'

interface RoadsideInspection {
  id: string
  reportNumber?: string
  inspectionDate: string
  inspectionTime?: string
  inspectorName: string
  inspectorBadge?: string
  inspectionLocation: string
  facilityName?: string
  facilityAddress?: string
  facilityCity?: string
  facilityState?: string
  facilityZip?: string
  inspectionLevel?: string
  overallResult?: string
  dverReceived: boolean
  dverSource?: string
  entryMethod?: string
  createdAt: string
  issue: {
    id: string
    title: string
    status: string
    priority: string
    party: {
      id: string
      person?: {
        firstName: string
        lastName: string
      }
      equipment?: {
        make: string
        model: string
        year: number
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
  }>
}

export default function RoadsideInspectionsPage() {
  const searchParams = useSearchParams()
  const organizationId = searchParams.get('organizationId')
  const driverId = searchParams.get('driverId')
  
  const { masterOrg, loading: masterOrgLoading } = useMasterOrg()
  
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [roadsideInspections, setRoadsideInspections] = useState<RoadsideInspection[]>([])
  const [selectedInspection, setSelectedInspection] = useState<RoadsideInspection | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [attachments, setAttachments] = useState<any[]>([])
  const [driver, setDriver] = useState<any>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  // Fetch organizations for selector
  useEffect(() => {
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
    fetchOrganizations()
  }, [])

  // Fetch driver data if driverId is present
  useEffect(() => {
    const fetchDriver = async () => {
      if (!driverId) return
      try {
        const response = await fetch(`/api/persons/${driverId}`)
        if (response.ok) {
          const driverData = await response.json()
          setDriver(driverData)
        }
      } catch (error) {
        console.error('Error fetching driver:', error)
      }
    }
    fetchDriver()
  }, [driverId])

  // Fetch organization data
  useEffect(() => {
    if (organizationId) {
      fetchOrganization()
    } else if (driverId) {
      fetchDriverAndOrganization()
    }
  }, [organizationId, driverId])

  // Fetch roadside inspections
  useEffect(() => {
    if (organizationId || (driverId && driver?.partyId)) {
      fetchRoadsideInspections()
    }
  }, [organizationId, driverId, driver?.partyId])

  // Fetch attachments when inspection is selected
  useEffect(() => {
    if (selectedInspection) {
      fetchAttachments()
    }
  }, [selectedInspection])

  const fetchOrganization = async () => {
    try {
      const response = await fetch(`/api/organizations/${organizationId}`)
      if (response.ok) {
        const data = await response.json()
        setOrganization(data)
      }
    } catch (error) {
      console.error('Error fetching organization:', error)
    }
  }

  const fetchDriverAndOrganization = async () => {
    try {
      // Fetch driver details to get organization info
      const driverResponse = await fetch(`/api/persons/${driverId}`)
      if (driverResponse.ok) {
        const driverData = await driverResponse.json()
        
        // Find the driver's active role to get organization
        const activeRole = driverData.role?.find((r: any) => r.isActive && r.organizationId)
        if (activeRole?.organizationId) {
          const orgResponse = await fetch(`/api/organizations/${activeRole.organizationId}`)
          if (orgResponse.ok) {
            const orgData = await orgResponse.json()
            setOrganization(orgData)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching driver and organization:', error)
    }
  }

  const fetchRoadsideInspections = async () => {
    try {
      setLoading(true)
      let url = '/api/roadside_inspections?'
      if (organizationId) {
        url += `organizationId=${organizationId}`
      } else if (driverId && driver?.partyId) {
        // Use the driver's partyId, not the person ID
        url += `partyId=${driver.partyId}`
      }
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setRoadsideInspections(data)
        
        // Auto-select first inspection
        if (data.length > 0 && !selectedInspection) {
          setSelectedInspection(data[0])
        }
      }
    } catch (error) {
      console.error('Error fetching roadside inspections:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAttachments = async () => {
    if (!selectedInspection) return
    
    try {
      const response = await fetch(`/api/attachments?issueId=${selectedInspection.issue.id}`)
      if (response.ok) {
        const data = await response.json()
        setAttachments(data)
      }
    } catch (error) {
      console.error('Error fetching attachments:', error)
    }
  }

  const handleCreateInspection = async (data: any) => {
    try {
      setFormLoading(true)
      const response = await fetch('/api/roadside_inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        const newInspection = await response.json()
        setRoadsideInspections(prev => [newInspection, ...prev])
        setSelectedInspection(newInspection)
        setShowCreateModal(false)
      } else {
        const error = await response.json()
        alert(`Error creating roadside inspection: ${error.error}`)
      }
    } catch (error) {
      console.error('Error creating roadside inspection:', error)
      alert('Error creating roadside inspection')
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdateInspection = async (data: any) => {
    if (!selectedInspection) return

    try {
      setFormLoading(true)
      const response = await fetch(`/api/roadside_inspections/${selectedInspection.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        const updatedInspection = await response.json()
        setRoadsideInspections(prev => 
          prev.map(inspection => 
            inspection.id === selectedInspection.id ? updatedInspection : inspection
          )
        )
        setSelectedInspection(updatedInspection)
        setIsEditing(false)
      } else {
        const error = await response.json()
        alert(`Error updating roadside inspection: ${error.error}`)
      }
    } catch (error) {
      console.error('Error updating roadside inspection:', error)
      alert('Error updating roadside inspection')
    } finally {
      setFormLoading(false)
    }
  }

  const refreshSelectedInspectionAfterEdit = async () => {
    if (!selectedInspection) return
    
    try {
      const response = await fetch(`/api/roadside_inspections/${selectedInspection.id}`)
      if (response.ok) {
        const updatedInspection = await response.json()
        setSelectedInspection(updatedInspection)
        await fetchAttachments()
      }
    } catch (error) {
      console.error('Error refreshing inspection:', error)
    }
  }

  const handleOrganizationSelect = (org: Organization) => {
    window.location.href = `/roadside_inspections?organizationId=${org.id}`
  }

  const handleDriverSelect = (driverId: string) => {
    window.location.href = `/roadside_inspections?driverId=${driverId}`
  }

  // Build contextual navigation
  // Get organization from driver's role if we have driver context
  const role = driver?.party?.role?.[0]
  const contextOrganization = role?.organization || organization
  
  // DisplayName should show who the user is (right of logo)
  let displayName = 'Roadside Inspections'
  if (masterOrg) {
    displayName = masterOrg.name
  } else if (contextOrganization) {
    displayName = contextOrganization.name
  }
  
  const topNav = buildStandardDriverNavigation(
    { id: '', role: '' },
    masterOrg,
    contextOrganization,
    undefined,
    'drivers'
  )

  if (masterOrgLoading || loading) {
    return (
      <AppLayout
        name="Loading..."
        topNav={[]}
        showOrgSelector={true}
        showDriverEquipmentSelector={false}
        sidebarMenu="organization"
        onOrganizationSelect={handleOrganizationSelect}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading roadside inspections...</div>
        </div>
      </AppLayout>
    )
  }

  if (!organizationId && !driverId) {
    return (
      <AppLayout
        name="Roadside Inspections"
        topNav={[]}
        showOrgSelector={true}
        showDriverEquipmentSelector={false}
        sidebarMenu="organization"
        onOrganizationSelect={handleOrganizationSelect}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Please select an organization or driver to view roadside inspections.</div>
        </div>
      </AppLayout>
    )
  }

  return (
    <>
      <AppLayout
        name={displayName}
        topNav={topNav}
        showOrgSelector={true}
        showDriverEquipmentSelector={true}
        sidebarMenu={driverId ? "driver" : "organization"}
        driverId={driverId || undefined}
        className="p-6"
        organizations={organizations}
        currentOrgId={contextOrganization?.id}
        isSheetOpen={isSheetOpen}
        onSheetOpenChange={setIsSheetOpen}
        onOrganizationSelect={handleOrganizationSelect}
      >
        <div className="max-w-7xl mx-auto h-full">
          {/* Driver/Organization and Roadside Inspections Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-1">
              {masterOrg && contextOrganization && (
                <p className="text-sm text-gray-600">{contextOrganization.name}</p>
              )}
              <h1 className="text-2xl font-bold text-gray-900">
                {driverId && driver ? 
                  `${driver.firstName} ${driver.lastName} - Roadside Inspections` :
                  `${contextOrganization?.name || 'Organization'} - Roadside Inspections`
                }
              </h1>
              <p className="text-sm text-gray-600">
                {driverId ? 
                  'Track and manage roadside inspection records for this driver' :
                  'Track and manage roadside inspection records for this organization'
                }
              </p>
            </div>
            
            {/* Add Roadside Inspection Button - only show if there are existing inspections */}
            {roadsideInspections.length > 0 && (
              <Button 
                onClick={() => {
                  setSelectedInspection(null)
                  setIsEditing(false)
                  setShowCreateModal(true)
                }}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Roadside Inspection
              </Button>
            )}
          </div>

          {/* Split Pane Layout */}
          <div className="flex gap-6 min-h-[600px]">
            {/* Left Pane - Roadside Inspections List */}
            <div className="w-[400px] flex-shrink-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Roadside Inspections ({roadsideInspections.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {roadsideInspections.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No roadside inspections yet</h3>
                      <p className="text-gray-600 mb-4">
                        {driverId ? 
                          `Add roadside inspections for ${driver?.firstName} ${driver?.lastName}` :
                          `Add roadside inspections for ${contextOrganization?.name}`
                        }
                      </p>
                      <Button 
                        onClick={() => {
                          setSelectedInspection(null)
                          setIsEditing(false)
                          setShowCreateModal(true)
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Roadside Inspection
                      </Button>
                    </div>
                                     ) : (
                     <div className="divide-y">
                    {roadsideInspections.map((inspection) => (
                      <div
                        key={inspection.id}
                        className={`p-4 cursor-pointer hover:bg-gray-50 ${
                          selectedInspection?.id === inspection.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                        }`}
                        onClick={() => setSelectedInspection(inspection)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="text-sm font-medium text-gray-900">
                            {new Date(inspection.inspectionDate).toLocaleDateString()}
                          </div>
                          <div className="flex gap-1">
                            {inspection.overallResult && (
                              <Badge variant={
                                inspection.overallResult === 'Pass' ? 'default' : 
                                inspection.overallResult === 'Warning' ? 'secondary' : 'destructive'
                              }>
                                {inspection.overallResult.replace('_', ' ')}
                              </Badge>
                            )}
                            {inspection.violations.some(v => v.outOfService) && (
                              <Badge variant="destructive">OOS</Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 mb-1">
                          {inspection.inspectionLocation}
                        </div>
                        <div className="text-xs text-gray-500">
                          {inspection.issue.party.person 
                            ? `${inspection.issue.party.person.firstName} ${inspection.issue.party.person.lastName}`
                            : 'Driver'
                          }
                        </div>
                        {inspection.violations.length > 0 && (
                          <div className="text-xs text-red-600 mt-1">
                            {inspection.violations.length} violation{inspection.violations.length !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

            {/* Right Pane - Details Panel */}
            <div className="flex-1">
            {selectedInspection ? (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>
                        Roadside Inspection - {selectedInspection.inspectionLocation}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(selectedInspection.inspectionDate).toLocaleDateString()} 
                        {selectedInspection.inspectionTime && ` at ${selectedInspection.inspectionTime}`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(!isEditing)}
                      >
                        {isEditing ? <Eye className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                        {isEditing ? 'View' : 'Edit'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {isEditing ? (
                    <RoadsideInspectionForm
                      initialData={selectedInspection}
                      isEditing={true}
                      onSubmit={handleUpdateInspection}
                      onCancel={() => setIsEditing(false)}
                      loading={formLoading}
                      organizationId={organizationId || contextOrganization?.id}
                      driverId={driverId || undefined}
                    />
                  ) : (
                    <div className="space-y-6">
                      {/* DVER Information */}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">DVER Information</h3>
                        <div className="grid grid-cols-2 gap-4">
                          {selectedInspection.reportNumber && (
                            <div>
                              <span className="font-medium text-gray-700">Report Number:</span>
                              <p className="text-gray-900">{selectedInspection.reportNumber}</p>
                            </div>
                          )}
                          <div>
                            <span className="font-medium text-gray-700">Inspector:</span>
                            <p className="text-gray-900">{selectedInspection.inspectorName}</p>
                          </div>
                          {selectedInspection.inspectorBadge && (
                            <div>
                              <span className="font-medium text-gray-700">Inspector Badge:</span>
                              <p className="text-gray-900">{selectedInspection.inspectorBadge}</p>
                            </div>
                          )}
                          <div>
                            <span className="font-medium text-gray-700">Inspection Date:</span>
                            <p className="text-gray-900">{new Date(selectedInspection.inspectionDate).toLocaleDateString()}</p>
                          </div>
                          {selectedInspection.inspectionTime && (
                            <div>
                              <span className="font-medium text-gray-700">Inspection Time:</span>
                              <p className="text-gray-900">{selectedInspection.inspectionTime}</p>
                            </div>
                          )}
                          {selectedInspection.inspectionLevel && (
                            <div>
                              <span className="font-medium text-gray-700">Inspection Level:</span>
                              <p className="text-gray-900">{selectedInspection.inspectionLevel.replace('_', ' ')}</p>
                            </div>
                          )}
                          {selectedInspection.overallResult && (
                            <div>
                              <span className="font-medium text-gray-700">Overall Result:</span>
                              <p className="text-gray-900">{selectedInspection.overallResult.replace('_', ' ')}</p>
                            </div>
                          )}
                          <div>
                            <span className="font-medium text-gray-700">DVER Received:</span>
                            <p className="text-gray-900">{selectedInspection.dverReceived ? 'Yes' : 'No'}</p>
                          </div>
                          {selectedInspection.dverSource && (
                            <div>
                              <span className="font-medium text-gray-700">DVER Source:</span>
                              <p className="text-gray-900">{selectedInspection.dverSource.replace('_', ' ')}</p>
                            </div>
                          )}
                          <div>
                            <span className="font-medium text-gray-700">Entry Method:</span>
                            <p className="text-gray-900">{selectedInspection.entryMethod?.replace('_', ' ') || 'Manual Entry'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Location Information */}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Location Information</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="font-medium text-gray-700">Inspection Location:</span>
                            <p className="text-gray-900">{selectedInspection.inspectionLocation}</p>
                          </div>
                          {selectedInspection.facilityName && (
                            <div>
                              <span className="font-medium text-gray-700">Facility Name:</span>
                              <p className="text-gray-900">{selectedInspection.facilityName}</p>
                            </div>
                          )}
                          {selectedInspection.facilityAddress && (
                            <div>
                              <span className="font-medium text-gray-700">Facility Address:</span>
                              <p className="text-gray-900">{selectedInspection.facilityAddress}</p>
                            </div>
                          )}
                          {(selectedInspection.facilityCity || selectedInspection.facilityState || selectedInspection.facilityZip) && (
                            <div>
                              <span className="font-medium text-gray-700">Facility Location:</span>
                              <p className="text-gray-900">
                                {[selectedInspection.facilityCity, selectedInspection.facilityState, selectedInspection.facilityZip]
                                  .filter(Boolean).join(', ')}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Driver Information */}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Driver Information</h3>
                        <div>
                          <span className="font-medium text-gray-700">Driver:</span>
                          <p className="text-gray-900">
                            {selectedInspection.issue.party.person 
                              ? `${selectedInspection.issue.party.person.firstName} ${selectedInspection.issue.party.person.lastName}`
                              : 'Unknown Driver'
                            }
                          </p>
                        </div>
                      </div>

                      {/* Equipment Involved */}
                      {selectedInspection.equipment.length > 0 && (
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-4">Equipment Involved</h3>
                          <div className="space-y-2">
                            {selectedInspection.equipment.map((equipment, index) => (
                              <div key={equipment.id} className="border rounded-lg p-3">
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
                          <h3 className="text-lg font-medium text-gray-900 mb-4">Violations Found</h3>
                          <div className="space-y-2">
                            {selectedInspection.violations.map((violation) => (
                              <div key={violation.id} className="border rounded-lg p-3">
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
                                <div className="text-sm text-gray-600">{violation.description}</div>
                                {violation.unitNumber && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    Equipment Unit {violation.unitNumber}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Addons */}
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-medium text-gray-900">Addons</h3>
                          <Button 
                            size="sm" 
                            onClick={() => {/* Add addon modal logic */}}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Addon
                          </Button>
                        </div>
                        
                        {attachments.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                            <p>No addons yet</p>
                            <p className="text-sm">Upload DVER forms, photos, or add notes</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {attachments.map((addon) => (
                              <div key={addon.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-medium">{addon.description || addon.fileName || 'Attachment'}</span>
                                    {addon.fileName && (
                                      <Badge variant="outline">File</Badge>
                                    )}
                                    {addon.noteContent && (
                                      <Badge variant="outline">Note</Badge>
                                    )}
                                  </div>
                                  {addon.noteContent && (
                                    <p className="text-sm text-gray-600 mt-1 line-clamp-2" 
                                       style={{
                                         display: '-webkit-box',
                                         WebkitLineClamp: 2,
                                         WebkitBoxOrient: 'vertical',
                                         overflow: 'hidden'
                                       }}>
                                      {addon.noteContent.length > 150 
                                        ? `${addon.noteContent.substring(0, 150)}...` 
                                        : addon.noteContent
                                      }
                                    </p>
                                  )}
                                  <p className="text-xs text-gray-500 mt-1">
                                    {new Date(addon.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center text-gray-500">
                    Select a roadside inspection to view details
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>

    {/* Create/Edit Dialog */}
    <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Roadside Inspection</DialogTitle>
        </DialogHeader>
        <RoadsideInspectionForm
          onSubmit={handleCreateInspection}
          onCancel={() => setShowCreateModal(false)}
          loading={formLoading}
          organizationId={organizationId || contextOrganization?.id}
          driverId={driverId || undefined}
        />
      </DialogContent>
    </Dialog>
  </>
  )
} 