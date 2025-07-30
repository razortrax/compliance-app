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
import { AccidentIssueForm } from '@/components/accident_issues/accident-issue-form'
import { useMasterOrg } from '@/hooks/use-master-org'
import { buildStandardDriverNavigation } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface Accident {
  id: string
  reportNumber?: string
  accidentDate: string
  accidentTime?: string
  officerName: string
  agencyName: string
  isFatality: boolean
  isReportable: boolean
  isInjury: boolean
  isTow: boolean
  isCitation: boolean
  needsReport: boolean
  needsDrugTest: boolean
  numberOfFatalities?: number
  numberOfVehicles?: number
  accidentAddress?: string
  accidentCity?: string
  accidentState?: string
  accidentZip?: string
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

export default function AccidentIssuesPage() {
  const searchParams = useSearchParams()
  const organizationId = searchParams.get('organizationId')
  const driverId = searchParams.get('driverId')
  
  const { masterOrg, loading: masterOrgLoading } = useMasterOrg()
  
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [accidents, setAccidents] = useState<Accident[]>([])
  const [selectedAccident, setSelectedAccident] = useState<Accident | null>(null)
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

  // Fetch accidents
  useEffect(() => {
    if (organizationId || (driverId && driver?.partyId)) {
      fetchAccidents()
    } else {
      setLoading(false) // Set loading to false if conditions aren't met
    }
  }, [organizationId, driverId, driver?.partyId])

  // Fetch attachments when accident is selected
  useEffect(() => {
    if (selectedAccident) {
      fetchAttachments()
      fetchCAFs()
    }
  }, [selectedAccident])

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

  const fetchAccidents = async () => {
    try {
      setLoading(true)
      let url = '/api/accident_issues?'
      if (organizationId) {
        url += `organizationId=${organizationId}`
      } else if (driverId && driver?.partyId) {
        // Use the driver's partyId, not the person ID
        url += `partyId=${driver.partyId}`
      }
      
      const response = await fetch(url)
      
      if (response.ok) {
        const data = await response.json()
        console.log('🔧 ACCIDENT - Fetched accidents:', data.length)
        console.log('🔧 ACCIDENT - First accident violations:', data[0]?.violations)
        
        setAccidents(data)
        
        // Auto-select first accident
        if (data.length > 0 && !selectedAccident) {
          setSelectedAccident(data[0])
        }
      } else {
        console.error('Accident fetch failed:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error fetching accidents:', error)
    } finally {
      setLoading(false)
    }
  }

  // Refresh the selected accident data after individual violation saves
  const refreshSelectedAccident = async () => {
    if (!selectedAccident?.id) {
      console.log('🔧 REFRESH - No selected accident to refresh')
      return
    }

    try {
      console.log('🔧 REFRESH - Starting refresh for accident:', selectedAccident.id)
      
      // Check that we have valid parameters before fetching
      if (!organizationId && (!driverId || !driver?.partyId)) {
        console.log('🔧 REFRESH - Missing required parameters, skipping refresh')
        return
      }
      
      // Simpler approach: refresh the entire list
      const selectedId = selectedAccident.id
      await fetchAccidents()
      
      // Re-select the same accident after refresh
      setTimeout(() => {
        setAccidents(prev => {
          const updatedAccident = prev.find(a => a.id === selectedId)
          if (updatedAccident) {
            console.log('🔧 REFRESH - Re-selected accident violations:', updatedAccident.violations?.length)
            setSelectedAccident(updatedAccident)
          } else {
            console.log('🔧 REFRESH - Accident not found after refresh, keeping current selection')
          }
          return prev
        })
      }, 100)
      
      // Also refresh CAFs
      fetchCAFs()
    } catch (error) {
      console.error('Error refreshing accident data:', error)
      // Don't throw - just log the error to prevent crashes
    }
  }

  const fetchAttachments = async () => {
    if (!selectedAccident) return
    
    try {
      const response = await fetch(`/api/attachments?issueId=${selectedAccident.issue.id}`)
      if (response.ok) {
        const data = await response.json()
        setAttachments(data)
      }
    } catch (error) {
      console.error('Error fetching attachments:', error)
    }
  }

  const handleCreateAccident = async (data: any) => {
    try {
      setFormLoading(true)
      const response = await fetch('/api/accident_issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        const newAccident = await response.json()
        setAccidents(prev => [newAccident, ...prev])
        setSelectedAccident(newAccident)
        setShowCreateModal(false)
      } else {
        const error = await response.json()
        alert(`Error creating accident: ${error.error}`)
      }
    } catch (error) {
      console.error('Error creating accident:', error)
      alert('Error creating accident')
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdateAccident = async (data: any) => {
    if (!selectedAccident) return

    try {
      console.log('🔧 CLIENT - Starting accident update for ID:', selectedAccident.id)
      console.log('🔧 CLIENT - Data being sent:', data)
      console.log('🔧 CLIENT - Violations details:', data.violations)
      
      setFormLoading(true)
      const response = await fetch(`/api/accident_issues/${selectedAccident.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      console.log('🔧 CLIENT - Response status:', response.status)
      console.log('🔧 CLIENT - Response headers:', response.headers)

      if (response.ok) {
        const updatedAccident = await response.json()
        console.log('🔧 CLIENT - Success:', updatedAccident)
        setAccidents(prev => 
          prev.map(accident => 
            accident.id === selectedAccident.id ? updatedAccident : accident
          )
        )
        setSelectedAccident(updatedAccident)
        setIsEditing(false)
      } else {
        const error = await response.json()
        console.error('🔧 CLIENT - Error updating accident:', error)
        alert(`Error updating accident: ${error.error}`)
      }
    } catch (error: any) {
      console.error('🔧 CLIENT - Exception during update:', error)
      console.error('🔧 CLIENT - Exception details:', {
        message: error?.message,
        stack: error?.stack
      })
      alert('Error updating accident')
    } finally {
      setFormLoading(false)
    }
  }

  // CAF management functions
  const fetchCAFs = async () => {
    if (!selectedAccident) return []
    
    try {
      // Fetch CAFs directly for this accident using the accidentId parameter
      const response = await fetch(`/api/cafs?accidentId=${selectedAccident.id}`)
      if (response.ok) {
        const accidentCAFs = await response.json()
        setCafs(accidentCAFs)
        return accidentCAFs
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
    if (!selectedAccident?.violations || selectedAccident.violations.length === 0) {
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
          `${existingCAFs.length} CAF(s) already exist for this accident.\n\n` +
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
      const response = await fetch(`/api/accident_issues/${selectedAccident.id}/generate-cafs?recreate=${hasExistingCAFs}`, {
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
    window.location.href = `/accident_issues?organizationId=${org.id}`
  }

  const handleDriverSelect = (driverId: string) => {
    window.location.href = `/accident_issues?driverId=${driverId}`
  }

  // Build contextual navigation
  // Get organization from driver's role if we have driver context
  const role = driver?.party?.role?.[0]
  const contextOrganization = role?.organization || organization
  
  // DisplayName should show who the user is (right of logo)
  let displayName = 'Accidents'
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
          <div className="text-gray-500">Loading accidents...</div>
        </div>
      </AppLayout>
    )
  }

  if (!organizationId && !driverId) {
    return (
      <AppLayout
        name="Accidents"
        topNav={[]}
        showOrgSelector={true}
        showDriverEquipmentSelector={false}
        sidebarMenu="organization"
        onOrganizationSelect={handleOrganizationSelect}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Please select an organization or driver to view accidents.</div>
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
          {/* Driver/Organization and Accidents Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-1">
              {masterOrg && contextOrganization && (
                <p className="text-sm text-gray-600">{contextOrganization.name}</p>
              )}
              <h1 className="text-2xl font-bold text-gray-900">
                {driverId && driver ? 
                  `${driver.firstName} ${driver.lastName} - Accidents` :
                  `${contextOrganization?.name || 'Organization'} - Accidents`
                }
              </h1>
              <p className="text-sm text-gray-600">
                {driverId ? 
                  'Track and manage accident records for this driver' :
                  'Track and manage accident records for this organization'
                }
              </p>
            </div>
            
            {/* Add Accident Button - only show if there are existing accidents */}
            {accidents.length > 0 && (
              <Button 
                onClick={() => {
                  setSelectedAccident(null)
                  setIsEditing(false)
                  setShowCreateModal(true)
                }}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Accident
              </Button>
            )}
          </div>

          {/* Split Pane Layout */}
          <div className="flex gap-6 h-[calc(100vh-300px)]">
            {/* Left Pane - Accidents List */}
            <div className="w-[300px] flex-shrink-0">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Accidents ({accidents.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {accidents.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No accidents yet</h3>
                      <p className="text-gray-600 mb-4">
                        {driverId ? 
                          `Add accidents for ${driver?.firstName} ${driver?.lastName}` :
                          `Add accidents for ${contextOrganization?.name}`
                        }
                      </p>
                      <Button 
                        onClick={() => {
                          setSelectedAccident(null)
                          setIsEditing(false)
                          setShowCreateModal(true)
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Accident
                      </Button>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {accidents.map((accident) => (
                        <div
                          key={accident.id}
                          className={`p-4 cursor-pointer hover:bg-gray-50 ${
                            selectedAccident?.id === accident.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                          }`}
                          onClick={() => {
                            setSelectedAccident(accident)
                          }}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="text-sm font-medium text-gray-900">
                              {new Date(accident.accidentDate).toLocaleDateString()}
                            </div>
                            <div className="flex gap-1">
                              {accident.isFatality && (
                                <Badge variant="destructive">FATALITY</Badge>
                              )}
                              {accident.isInjury && (
                                <Badge variant="secondary">INJURY</Badge>
                              )}
                              {accident.isTow && (
                                <Badge variant="outline">TOW</Badge>
                              )}
                              {accident.violations.some(v => v.outOfService) && (
                                <Badge variant="destructive">OOS</Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-sm text-gray-600 mb-1">
                            {accident.agencyName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {accident.issue.party.person 
                              ? `${accident.issue.party.person.firstName} ${accident.issue.party.person.lastName}`
                              : 'Driver'
                            }
                          </div>
                          {accident.violations.length > 0 && (
                            <div className="text-xs text-red-600 mt-1">
                              {accident.violations.length} violation{accident.violations.length !== 1 ? 's' : ''}
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
              {selectedAccident ? (
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>
                          Accident - {selectedAccident.agencyName}
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          {new Date(selectedAccident.accidentDate).toLocaleDateString()} 
                          {selectedAccident.accidentTime && ` at ${selectedAccident.accidentTime}`}
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
                      <AccidentIssueForm
                        initialData={selectedAccident}
                        isEditing={true}
                        onSubmit={handleUpdateAccident}
                        onCancel={() => setIsEditing(false)}
                        loading={formLoading}
                        organizationId={organizationId || contextOrganization?.id}
                        driverId={driverId || undefined}
                        onViolationSaved={refreshSelectedAccident}
                      />
                    ) : (
                      <div className="space-y-6">
                        {/* Accident Information */}
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-4">Accident Information</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="font-medium text-gray-700">Officer:</span>
                              <p className="text-gray-900">{selectedAccident.officerName}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Agency:</span>
                              <p className="text-gray-900">{selectedAccident.agencyName}</p>
                            </div>
                            {selectedAccident.reportNumber && (
                              <div>
                                <span className="font-medium text-gray-700">Report Number:</span>
                                <p className="text-gray-900">{selectedAccident.reportNumber}</p>
                              </div>
                            )}
                            <div>
                              <span className="font-medium text-gray-700">Accident Date:</span>
                              <p className="text-gray-900">{new Date(selectedAccident.accidentDate).toLocaleDateString()}</p>
                            </div>
                            {selectedAccident.accidentTime && (
                              <div>
                                <span className="font-medium text-gray-700">Accident Time:</span>
                                <p className="text-gray-900">{selectedAccident.accidentTime}</p>
                              </div>
                            )}
                            {selectedAccident.numberOfVehicles && (
                              <div>
                                <span className="font-medium text-gray-700">Vehicles Involved:</span>
                                <p className="text-gray-900">{selectedAccident.numberOfVehicles}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Accident Classifications */}
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-4">Classifications</h3>
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
                        {(selectedAccident.accidentAddress || selectedAccident.accidentCity || selectedAccident.accidentState) && (
                          <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Location Information</h3>
                            <div className="grid grid-cols-2 gap-4">
                              {selectedAccident.accidentAddress && (
                                <div>
                                  <span className="font-medium text-gray-700">Address:</span>
                                  <p className="text-gray-900">{selectedAccident.accidentAddress}</p>
                                </div>
                              )}
                              {(selectedAccident.accidentCity || selectedAccident.accidentState || selectedAccident.accidentZip) && (
                                <div>
                                  <span className="font-medium text-gray-700">Location:</span>
                                  <p className="text-gray-900">
                                    {[selectedAccident.accidentCity, selectedAccident.accidentState, selectedAccident.accidentZip]
                                      .filter(Boolean).join(', ')}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Driver Information */}
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-4">Driver Information</h3>
                          <div>
                            <span className="font-medium text-gray-700">Driver:</span>
                            <p className="text-gray-900">
                              {selectedAccident.issue.party.person 
                                ? `${selectedAccident.issue.party.person.firstName} ${selectedAccident.issue.party.person.lastName}`
                                : 'Unknown Driver'
                              }
                            </p>
                          </div>
                        </div>

                        {/* Equipment Involved */}
                        {selectedAccident.equipment.length > 0 && (
                          <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Equipment Involved</h3>
                            <div className="space-y-2">
                              {selectedAccident.equipment.map((equipment, index) => (
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
                        {selectedAccident.violations.length > 0 && (
                          <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Violations Found</h3>
                            <div className="space-y-2">
                              {selectedAccident.violations.map((violation) => (
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
                        {selectedAccident.violations.length > 0 && (
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
                              <p className="text-sm">Upload accident reports, photos, or add notes</p>
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
                      Select an accident to view details
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
            <DialogTitle>Add Accident</DialogTitle>
          </DialogHeader>
          <AccidentIssueForm
            onSubmit={handleCreateAccident}
            onCancel={() => setShowCreateModal(false)}
            loading={formLoading}
            organizationId={organizationId || contextOrganization?.id}
            driverId={driverId || undefined}
          />
        </DialogContent>
      </Dialog>

      {/* CAF Details Dialog - Same as RINS */}
      {/* CAF Edit Dialog - Same as RINS */}
    </>
  )
} 