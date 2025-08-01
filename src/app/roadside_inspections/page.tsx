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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

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
    violationType?: string // Added for CAF filtering
  }>
}

export default function RoadsideInspectionsPage() {
  const searchParams = useSearchParams()
  const organizationId = searchParams.get('organizationId')
  const driverId = searchParams.get('driverId')
  
  const { masterOrg, loading: masterOrgLoading } = useMasterOrg()
  
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [roadsideInspections, setRoadsideInspections] = useState<RoadsideInspection[]>([])
  const [selectedRoadsideInspection, setSelectedRoadsideInspection] = useState<RoadsideInspection | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [attachments, setAttachments] = useState<any[]>([])
  const [driver, setDriver] = useState<any>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  
  // CAF management state
  const [cafs, setCafs] = useState<any[]>([])
  const [generatingCAFs, setGeneratingCAFs] = useState(false)
  const [selectedCAF, setSelectedCAF] = useState<any>(null)
  const [showCAFDetails, setShowCAFDetails] = useState(false)
  const [editingCAF, setEditingCAF] = useState<any>(null)
  const [showEditCAF, setShowEditCAF] = useState(false)
  const [organizationStaff, setOrganizationStaff] = useState<any[]>([])
  const [cafFormData, setCafFormData] = useState({
    assignedStaffId: '',
    correctiveActions: '',
    notes: '',
    dueDate: ''
  })
  const [savingCAF, setSavingCAF] = useState(false)

  // State for individual violation corrective actions
  const [violationCorrectiveActions, setViolationCorrectiveActions] = useState<Record<string, string>>({})

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
    } else {
      setLoading(false) // Set loading to false if conditions aren't met
    }
  }, [organizationId, driverId, driver?.partyId])

  // Fetch attachments when inspection is selected
  useEffect(() => {
    if (selectedRoadsideInspection) {
      fetchAttachments()
      fetchCAFs()
    }
  }, [selectedRoadsideInspection])

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
        console.log('🔧 RINS - Fetched inspections:', data.length)
        console.log('🔧 RINS - First inspection violations:', data[0]?.violations)
        
        setRoadsideInspections(data)
        
        // Auto-select first inspection
        if (data.length > 0 && !selectedRoadsideInspection) {
          setSelectedRoadsideInspection(data[0])
        }
      } else {
        console.error('RINS fetch failed:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error fetching roadside inspections:', error)
    } finally {
      setLoading(false)
    }
  }

  // Refresh the selected RINS data after individual violation saves
  const refreshSelectedRINS = async () => {
    if (!selectedRoadsideInspection?.id) {
      console.log('🔧 REFRESH - No selected RINS to refresh')
      return
    }

    try {
      console.log('🔧 REFRESH - Starting refresh for RINS:', selectedRoadsideInspection.id)
      
      // Check that we have valid parameters before fetching
      if (!organizationId && (!driverId || !driver?.partyId)) {
        console.log('🔧 REFRESH - Missing required parameters, skipping refresh')
        return
      }
      
      // Simpler approach: refresh the entire list
      const selectedId = selectedRoadsideInspection.id
      await fetchRoadsideInspections()
      
      // Re-select the same RINS after refresh
      setTimeout(() => {
        setRoadsideInspections(prev => {
          const updatedRINS = prev.find(r => r.id === selectedId)
          if (updatedRINS) {
            console.log('🔧 REFRESH - Re-selected RINS violations:', updatedRINS.violations?.length)
            setSelectedRoadsideInspection(updatedRINS)
          } else {
            console.log('🔧 REFRESH - RINS not found after refresh, keeping current selection')
          }
          return prev
        })
      }, 100)
      
      // Also refresh CAFs
      fetchCAFs()
    } catch (error) {
      console.error('Error refreshing RINS data:', error)
      // Don't throw - just log the error to prevent crashes
    }
  }

  const fetchAttachments = async () => {
    if (!selectedRoadsideInspection) return
    
    try {
      const response = await fetch(`/api/attachments?issueId=${selectedRoadsideInspection.issue.id}`)
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
        setSelectedRoadsideInspection(newInspection)
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
    if (!selectedRoadsideInspection) return

    try {
      console.log('🔧 CLIENT - Starting RINS update for ID:', selectedRoadsideInspection.id)
      console.log('🔧 CLIENT - Data being sent:', data)
      console.log('🔧 CLIENT - Violations details:', data.violations)
      
      setFormLoading(true)
      const response = await fetch(`/api/roadside_inspections/${selectedRoadsideInspection.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      console.log('🔧 CLIENT - Response status:', response.status)
      console.log('🔧 CLIENT - Response headers:', response.headers)

      if (response.ok) {
        const updatedInspection = await response.json()
        console.log('🔧 CLIENT - Success:', updatedInspection)
        setRoadsideInspections(prev => 
          prev.map(inspection => 
            inspection.id === selectedRoadsideInspection.id ? updatedInspection : inspection
          )
        )
        setSelectedRoadsideInspection(updatedInspection)
        setIsEditing(false)
      } else {
        const error = await response.json()
        console.error('🔧 CLIENT - Error updating roadside inspection:', error)
        alert(`Error updating roadside inspection: ${error.error}`)
      }
    } catch (error: any) {
      console.error('🔧 CLIENT - Exception during update:', error)
      console.error('🔧 CLIENT - Exception details:', {
        message: error?.message,
        stack: error?.stack
      })
      alert('Error updating roadside inspection')
    } finally {
      setFormLoading(false)
    }
  }

  const refreshSelectedRoadsideInspectionAfterEdit = async () => {
    if (!selectedRoadsideInspection) return
    
    try {
      const response = await fetch(`/api/roadside_inspections/${selectedRoadsideInspection.id}`)
      if (response.ok) {
        const updatedInspection = await response.json()
        setSelectedRoadsideInspection(updatedInspection)
        await fetchAttachments()
        await fetchCAFs()
      }
    } catch (error) {
      console.error('Error refreshing inspection:', error)
    }
  }

  // CAF management functions
  const fetchCAFs = async () => {
    if (!selectedRoadsideInspection) return []
    
    try {
      // Fetch CAFs directly for this RINS using the rinsId parameter
      const response = await fetch(`/api/cafs?rinsId=${selectedRoadsideInspection.id}`)
      if (response.ok) {
        const rinsCAFs = await response.json()
        setCafs(rinsCAFs)
        return rinsCAFs
      } else {
        console.error('Failed to fetch CAFs:', response.status, response.statusText)
        return []
      }
    } catch (error) {
      console.error('Error fetching CAFs:', error)
      return []
    }
  }

  const generateCAFs = async () => {
    if (!selectedRoadsideInspection?.violations || selectedRoadsideInspection.violations.length === 0) {
      alert('No violations found to generate CAFs for')
      return
    }

    setGeneratingCAFs(true)
    try {
      // Check if CAFs already exist
      const existingCAFs = await fetchCAFs()
      const hasExistingCAFs = existingCAFs.length > 0

      let shouldProceed = true
      let action = 'create'

      if (hasExistingCAFs) {
        // Ask user if they want to recreate (which will delete all existing CAFs)
        shouldProceed = confirm(
          `${existingCAFs.length} CAF(s) already exist for this RINS.\n\n` +
          `Click OK to RECREATE ALL CAFs (this will delete existing CAFs and create new ones based on current violations).\n\n` +
          `Click Cancel to keep existing CAFs.`
        )
        action = 'recreate'
      }

      if (!shouldProceed) {
        setGeneratingCAFs(false)
        return
      }

      // Call the API with recreate flag if needed
      const response = await fetch(`/api/roadside_inspections/${selectedRoadsideInspection.id}/generate-cafs?recreate=${hasExistingCAFs}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const result = await response.json()
        
        // Refresh CAF list
        setTimeout(() => {
          fetchCAFs()
        }, 500)

        // CAFs generated successfully - removed alert dialog

        // Auto-open first CAF if any were generated
        if (result.cafs && result.cafs.length > 0) {
          setTimeout(() => {
            const firstCAF = result.cafs[0]
            setEditingCAF(firstCAF)
            setShowEditCAF(true)
            setCafFormData({
              assignedStaffId: firstCAF.assignedStaffId || '',
              correctiveActions: firstCAF.correctiveActions || '',
              notes: firstCAF.notes || '',
              dueDate: firstCAF.dueDate ? new Date(firstCAF.dueDate).toISOString().split('T')[0] : ''
            })
            
            // Initialize violation corrective actions
            let initialCorrectiveActions = {}
            try {
              if (firstCAF.correctiveActions) {
                initialCorrectiveActions = JSON.parse(firstCAF.correctiveActions)
              }
            } catch (e) {
              console.log('CAF has old format corrective actions')
            }
            setViolationCorrectiveActions(initialCorrectiveActions)
            
            // Fetch staff for the organization
            const orgId = firstCAF.organizationId || contextOrganization?.id
            if (orgId) {
              fetchOrganizationStaff(orgId)
            }
          }, 800)
        }
      } else {
        const error = await response.json()
        alert(`Error: ${error.error || 'Failed to generate CAFs'}`)
      }
    } catch (error) {
      console.error('Error generating CAFs:', error)
      alert('Error generating CAFs')
    } finally {
      setGeneratingCAFs(false)
    }
  }

  // Fetch organization staff for CAF assignment
  const fetchOrganizationStaff = async (organizationId: string) => {
    try {
      const response = await fetch(`/api/staff?organizationId=${organizationId}`)
      if (response.ok) {
        const data = await response.json()
        setOrganizationStaff(data)
      }
    } catch (error) {
      console.error('Error fetching staff:', error)
    }
  }

  // Handle CAF form changes
  const handleCafFormChange = (field: string, value: string) => {
    setCafFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Handle CAF update with individual violation corrective actions
  const handleUpdateCAF = async (isDraft: boolean = false) => {
    if (!editingCAF) return
    
    setSavingCAF(true)
    try {
      const response = await fetch(`/api/cafs/${editingCAF.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...cafFormData,
          violationCorrectiveActions, // Include individual violation corrective actions
          status: isDraft ? 'ASSIGNED' : 'IN_PROGRESS'
        })
      })

      if (response.ok) {
        setShowEditCAF(false)
        fetchCAFs() // Refresh the CAF list
        alert(isDraft ? 'CAF saved as draft' : 'CAF updated and ready for assignment')
      } else {
        const error = await response.json()
        alert(`Error: ${error.error || 'Failed to update CAF'}`)
      }
    } catch (error) {
      console.error('Error updating CAF:', error)
      alert('Error updating CAF')
    } finally {
      setSavingCAF(false)
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
        masterOrgId={masterOrg?.id}
        currentOrgId={contextOrganization?.id}
        className="p-6"
        organizations={organizations}
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
                  setSelectedRoadsideInspection(null)
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
          <div className="flex gap-6 h-[calc(100vh-300px)]">
            {/* Left Pane - Roadside Inspections List */}
            <div className="w-[300px] flex-shrink-0">
              <Card className="h-full">
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
                          setSelectedRoadsideInspection(null)
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
                          selectedRoadsideInspection?.id === inspection.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                        }`}
                        onClick={() => {
                          setSelectedRoadsideInspection(inspection)
                        }}
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
            {selectedRoadsideInspection ? (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>
                        Roadside Inspection - {selectedRoadsideInspection.inspectionLocation}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(selectedRoadsideInspection.inspectionDate).toLocaleDateString()} 
                        {selectedRoadsideInspection.inspectionTime && ` at ${selectedRoadsideInspection.inspectionTime}`}
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
                      initialData={selectedRoadsideInspection}
                      isEditing={true}
                      onSubmit={handleUpdateInspection}
                      onCancel={() => setIsEditing(false)}
                      loading={formLoading}
                      organizationId={organizationId || contextOrganization?.id}
                      driverId={driverId || undefined}
                      onViolationSaved={refreshSelectedRINS}
                    />
                  ) : (
                    <div className="space-y-6">
                      {/* DVER Information */}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">DVER Information</h3>
                        <div className="grid grid-cols-2 gap-4">
                          {selectedRoadsideInspection.reportNumber && (
                            <div>
                              <span className="font-medium text-gray-700">Report Number:</span>
                              <p className="text-gray-900">{selectedRoadsideInspection.reportNumber}</p>
                            </div>
                          )}
                          <div>
                            <span className="font-medium text-gray-700">Inspector:</span>
                            <p className="text-gray-900">{selectedRoadsideInspection.inspectorName}</p>
                          </div>
                          {selectedRoadsideInspection.inspectorBadge && (
                            <div>
                              <span className="font-medium text-gray-700">Inspector Badge:</span>
                              <p className="text-gray-900">{selectedRoadsideInspection.inspectorBadge}</p>
                            </div>
                          )}
                          <div>
                            <span className="font-medium text-gray-700">Inspection Date:</span>
                            <p className="text-gray-900">{new Date(selectedRoadsideInspection.inspectionDate).toLocaleDateString()}</p>
                          </div>
                          {selectedRoadsideInspection.inspectionTime && (
                            <div>
                              <span className="font-medium text-gray-700">Inspection Time:</span>
                              <p className="text-gray-900">{selectedRoadsideInspection.inspectionTime}</p>
                            </div>
                          )}
                          {selectedRoadsideInspection.inspectionLevel && (
                            <div>
                              <span className="font-medium text-gray-700">Inspection Level:</span>
                              <p className="text-gray-900">{selectedRoadsideInspection.inspectionLevel.replace('_', ' ')}</p>
                            </div>
                          )}
                          {selectedRoadsideInspection.overallResult && (
                            <div>
                              <span className="font-medium text-gray-700">Overall Result:</span>
                              <p className="text-gray-900">{selectedRoadsideInspection.overallResult.replace('_', ' ')}</p>
                            </div>
                          )}
                          <div>
                            <span className="font-medium text-gray-700">DVER Received:</span>
                            <p className="text-gray-900">{selectedRoadsideInspection.dverReceived ? 'Yes' : 'No'}</p>
                          </div>
                          {selectedRoadsideInspection.dverSource && (
                            <div>
                              <span className="font-medium text-gray-700">DVER Source:</span>
                              <p className="text-gray-900">{selectedRoadsideInspection.dverSource.replace('_', ' ')}</p>
                            </div>
                          )}
                          <div>
                            <span className="font-medium text-gray-700">Entry Method:</span>
                            <p className="text-gray-900">{selectedRoadsideInspection.entryMethod?.replace('_', ' ') || 'Manual Entry'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Location Information */}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Location Information</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="font-medium text-gray-700">Inspection Location:</span>
                            <p className="text-gray-900">{selectedRoadsideInspection.inspectionLocation}</p>
                          </div>
                          {selectedRoadsideInspection.facilityName && (
                            <div>
                              <span className="font-medium text-gray-700">Facility Name:</span>
                              <p className="text-gray-900">{selectedRoadsideInspection.facilityName}</p>
                            </div>
                          )}
                          {selectedRoadsideInspection.facilityAddress && (
                            <div>
                              <span className="font-medium text-gray-700">Facility Address:</span>
                              <p className="text-gray-900">{selectedRoadsideInspection.facilityAddress}</p>
                            </div>
                          )}
                          {(selectedRoadsideInspection.facilityCity || selectedRoadsideInspection.facilityState || selectedRoadsideInspection.facilityZip) && (
                            <div>
                              <span className="font-medium text-gray-700">Facility Location:</span>
                              <p className="text-gray-900">
                                {[selectedRoadsideInspection.facilityCity, selectedRoadsideInspection.facilityState, selectedRoadsideInspection.facilityZip]
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
                            {selectedRoadsideInspection.issue.party.person 
                              ? `${selectedRoadsideInspection.issue.party.person.firstName} ${selectedRoadsideInspection.issue.party.person.lastName}`
                              : 'Unknown Driver'
                            }
                          </p>
                        </div>
                      </div>

                      {/* Equipment Involved */}
                      {selectedRoadsideInspection.equipment.length > 0 && (
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-4">Equipment Involved</h3>
                          <div className="space-y-2">
                            {selectedRoadsideInspection.equipment.map((equipment, index) => (
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
                      {selectedRoadsideInspection.violations.length > 0 && (
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-4">Violations Found</h3>
                          <div className="space-y-2">
                            {selectedRoadsideInspection.violations.map((violation) => (
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

                      {/* Corrective Action Forms (CAFs) */}
                      {selectedRoadsideInspection.violations.length > 0 && (
                        <div>
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-900">Corrective Action Forms</h3>
                            <Button 
                              onClick={generateCAFs}
                              disabled={generatingCAFs}
                              size="sm"
                            >
                              {generatingCAFs ? 'Processing...' : cafs.length > 0 ? 'Recreate CAFs' : 'Create CAFs'}
                            </Button>
                          </div>
                          
                          {cafs.length === 0 ? (
                            <div className="text-center py-6 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                              <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                              <p>No CAFs generated yet</p>
                              <p className="text-sm">Generate corrective action forms for violations</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {cafs.map((caf) => (
                                <div key={caf.id} className="border rounded-lg p-3 hover:bg-gray-50">
                                  <div className="flex justify-between items-start mb-2">
                                    <div className="font-medium">{caf.cafNumber}</div>
                                    <div className="flex gap-2 items-center">
                                      <Badge 
                                        variant={
                                          caf.priority === 'CRITICAL' ? 'destructive' :
                                          caf.priority === 'HIGH' ? 'default' : 
                                          'secondary'
                                        }
                                      >
                                        {caf.priority}
                                      </Badge>
                                      <Badge 
                                        variant={
                                          caf.status === 'COMPLETED' ? 'default' :
                                          caf.status === 'IN_PROGRESS' ? 'secondary' :
                                          'outline'
                                        }
                                      >
                                        {caf.status.replace('_', ' ')}
                                      </Badge>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setSelectedCAF(caf)
                                          setShowCAFDetails(true)
                                        }}
                                      >
                                        <Eye className="h-3 w-3 mr-1" />
                                        View
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="text-sm text-gray-600 mb-1">{caf.title}</div>
                                  <div className="text-xs text-gray-500">
                                    Assigned to: {caf.assigned_staff?.party?.person ? 
                                      `${caf.assigned_staff.party.person.firstName} ${caf.assigned_staff.party.person.lastName}` : 
                                      'Unassigned'}
                                  </div>
                                  {caf.dueDate && (
                                    <div className="text-xs text-gray-500">
                                      Due: {new Date(caf.dueDate).toLocaleDateString()}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
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

    {/* CAF Details Dialog */}
    <Dialog open={showCAFDetails} onOpenChange={setShowCAFDetails}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Corrective Action Form Details</DialogTitle>
        </DialogHeader>
        {selectedCAF && (
          <div className="space-y-6">
            {/* CAF Header */}
            <div className="border-b pb-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold">{selectedCAF.cafNumber}</h3>
                <div className="flex gap-2">
                  <Badge 
                    variant={
                      selectedCAF.priority === 'CRITICAL' ? 'destructive' :
                      selectedCAF.priority === 'HIGH' ? 'default' : 
                      'secondary'
                    }
                  >
                    {selectedCAF.priority}
                  </Badge>
                  <Badge 
                    variant={
                      selectedCAF.status === 'COMPLETED' ? 'default' :
                      selectedCAF.status === 'IN_PROGRESS' ? 'secondary' :
                      'outline'
                    }
                  >
                    {selectedCAF.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
              <p className="text-gray-600">{selectedCAF.title}</p>
            </div>

            {/* CAF Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Driver</label>
                <p className="text-sm text-gray-600">
                  {selectedRoadsideInspection?.issue?.party?.person ? 
                    `${selectedRoadsideInspection.issue.party.person.firstName} ${selectedRoadsideInspection.issue.party.person.lastName}` : 
                    'Not specified'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Equipment</label>
                <p className="text-sm text-gray-600">
                  {selectedRoadsideInspection?.equipment && selectedRoadsideInspection.equipment.length > 0 ? 
                    `${selectedRoadsideInspection.equipment[0].make || ''} ${selectedRoadsideInspection.equipment[0].model || ''} (${selectedRoadsideInspection.equipment[0].year || ''})`.trim() : 
                    'Not specified'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <p className="text-sm text-gray-600">{selectedCAF.category?.replace('_', ' ')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <p className="text-sm text-gray-600">
                  {selectedCAF.dueDate ? new Date(selectedCAF.dueDate).toLocaleDateString() : 'Not set'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                <p className="text-sm text-gray-600">
                  {selectedCAF.assigned_staff?.party?.person ? 
                    `${selectedCAF.assigned_staff.party.person.firstName} ${selectedCAF.assigned_staff.party.person.lastName}` : 
                    'Unassigned'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                <p className="text-sm text-gray-600">
                  {new Date(selectedCAF.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <div className="bg-gray-50 p-3 rounded border">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedCAF.description}</p>
              </div>
            </div>

            {/* Related Violations */}
            {selectedRoadsideInspection?.violations && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Related Violations</label>
                <div className="space-y-2">
                  {selectedRoadsideInspection.violations
                    .filter(violation => {
                      // Show violations that match this CAF's category
                      const cafType = selectedCAF.category
                      const violationType = violation.violationType
                      
                      return (
                        (cafType === 'DRIVER_PERFORMANCE' && violationType === 'Driver_Performance') ||
                        (cafType === 'DRIVER_QUALIFICATION' && violationType === 'Driver_Qualification') ||
                        (cafType === 'EQUIPMENT_MAINTENANCE' && violationType === 'Equipment') ||
                        (cafType === 'COMPANY_OPERATIONS' && violationType === 'Company') ||
                        violation.id === selectedCAF.rinsViolationId // Always include the primary violation
                      )
                    })
                    .map(violation => (
                      <div key={violation.id} className="bg-gray-50 p-3 rounded border">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium">{violation.violationCode}</span>
                          <div className="flex gap-1">
                            {violation.outOfService && (
                              <Badge variant="destructive">OOS</Badge>
                            )}
                            <Badge variant="outline">{violation.severity}</Badge>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">{violation.description}</p>
                        {(violation as any).inspectorComments && (
                          <p className="text-xs text-gray-500 mt-1">Inspector: {(violation as any).inspectorComments}</p>
                        )}
                      </div>
                    ))
                  }
                </div>
              </div>
            )}

            {/* Corrective Actions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Corrective Actions</label>
              <div className="bg-gray-50 p-3 rounded border">
                {(() => {
                  try {
                    // Try to parse as JSON (new format with individual violations)
                    if (selectedCAF.correctiveActions) {
                      const violationActions = JSON.parse(selectedCAF.correctiveActions)
                      
                      // If it's an object with violation IDs as keys, display individual actions
                      if (typeof violationActions === 'object' && !Array.isArray(violationActions)) {
                        return Object.entries(violationActions).map(([violationId, action]) => {
                          // Find the violation details
                          const violation = selectedRoadsideInspection?.violations?.find(v => v.id === violationId)
                          return (
                            <div key={violationId} className="mb-3 last:mb-0">
                              <div className="font-medium text-sm text-gray-700 mb-1">
                                {violation?.violationCode || violationId}
                              </div>
                              <p className="text-sm text-gray-600 whitespace-pre-wrap">{action as string}</p>
                            </div>
                          )
                        })
                      }
                    }
                    
                    // Fallback to displaying as plain text (old format)
                    return (
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {selectedCAF.correctiveActions || 'No corrective actions specified'}
                      </p>
                    )
                  } catch (e) {
                    // If JSON parsing fails, display as plain text
                    return (
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {selectedCAF.correctiveActions || 'No corrective actions specified'}
                      </p>
                    )
                  }
                })()}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between pt-4 border-t">
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setEditingCAF(selectedCAF)
                    setShowEditCAF(true)
                    setShowCAFDetails(false)
                    // Initialize form data
                    setCafFormData({
                      assignedStaffId: selectedCAF.assignedStaffId || '',
                      correctiveActions: selectedCAF.correctiveActions || '',
                      notes: selectedCAF.notes || '',
                      dueDate: selectedCAF.dueDate ? new Date(selectedCAF.dueDate).toISOString().split('T')[0] : ''
                    })
                    // Initialize violation corrective actions
                    let initialCorrectiveActions = {}
                    try {
                      // Try to parse as JSON (new format)
                      if (selectedCAF.correctiveActions) {
                        initialCorrectiveActions = JSON.parse(selectedCAF.correctiveActions)
                      }
                    } catch (e) {
                      // If parsing fails, it's old format - leave empty for now
                      console.log('CAF has old format corrective actions')
                    }
                    setViolationCorrectiveActions(initialCorrectiveActions)
                    // Fetch staff for the organization
                    const orgId = selectedCAF.organizationId || contextOrganization?.id
                    if (orgId) {
                      console.log('Fetching staff for organization:', orgId)
                      fetchOrganizationStaff(orgId)
                    } else {
                      console.log('No organization ID found for staff fetching')
                    }
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit CAF
                </Button>
                {selectedCAF.status === 'PENDING' && (
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Assign Staff
                  </Button>
                )}
                {selectedCAF.status === 'IN_PROGRESS' && selectedCAF.assigned_staff && (
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Sign CAF
                  </Button>
                )}
                {selectedCAF.status === 'COMPLETED' && selectedCAF.requiresApproval && (
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    Approve CAF
                  </Button>
                )}
              </div>
              <Button variant="outline" onClick={() => setShowCAFDetails(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>

    {/* Edit CAF Dialog */}
    <Dialog open={showEditCAF} onOpenChange={setShowEditCAF}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Corrective Action Form</DialogTitle>
        </DialogHeader>
        {editingCAF && (
          <div className="space-y-6">
            {/* CAF Header (Read-only) */}
            <div className="border-b pb-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold">{editingCAF.cafNumber}</h3>
                <div className="flex gap-2">
                  <Badge variant="outline">{editingCAF.priority}</Badge>
                  <Badge variant="outline">{editingCAF.status.replace('_', ' ')}</Badge>
                </div>
              </div>
              <p className="text-gray-600">{editingCAF.title}</p>
            </div>

            {/* Related Violations for this CAF */}
            {selectedRoadsideInspection && editingCAF && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Violations Addressed by this CAF
                </label>
                <div className="space-y-3">
                  {selectedRoadsideInspection.violations
                    .filter(violation => {
                      // Filter violations that match the CAF type
                      const cafType = editingCAF.category
                      const violationType = violation.violationType
                      
                      return (
                        (cafType === 'DRIVER_PERFORMANCE' && violationType === 'Driver_Performance') ||
                        (cafType === 'DRIVER_QUALIFICATION' && violationType === 'Driver_Qualification') ||
                        (cafType === 'EQUIPMENT_MAINTENANCE' && violationType === 'Equipment') ||
                        (cafType === 'COMPANY_OPERATIONS' && violationType === 'Company') ||
                        violation.id === editingCAF.rinsViolationId // Always include the primary violation
                      )
                    })
                    .map((violation, index) => (
                      <div key={violation.id} className="bg-gray-50 p-4 rounded border">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium">{violation.violationCode}</span>
                          <div className="flex gap-1">
                            {violation.outOfService && (
                              <Badge variant="destructive">OOS</Badge>
                            )}
                            <Badge variant="outline">{violation.severity}</Badge>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{violation.description}</p>
                        
                        {/* Violation-specific corrective action field */}
                        <div>
                          <Label htmlFor={`corrective-action-${violation.id}`}>
                            Corrective Actions for {violation.violationCode} *
                          </Label>
                          <Textarea
                            id={`corrective-action-${violation.id}`}
                            placeholder="Enter specific corrective actions required for this violation..."
                            className="mt-1"
                            rows={3}
                            value={violationCorrectiveActions[violation.id] || ''}
                            onChange={(e) => setViolationCorrectiveActions(prev => ({
                              ...prev,
                              [violation.id]: e.target.value
                            }))}
                          />
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between pt-4 border-t">
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowEditCAF(false)}>
                  Cancel
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleUpdateCAF(true)}>
                  Save Draft
                </Button>
                <Button onClick={() => handleUpdateCAF(false)} disabled={savingCAF}>
                  {savingCAF ? 'Updating...' : 'Update & Generate PDF'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  </>
  )
} 