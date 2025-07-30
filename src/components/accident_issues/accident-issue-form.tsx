"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { X, Plus, AlertTriangle } from 'lucide-react'
import { searchViolations, ViolationCode } from '@/lib/violations'

// Helper function to format violation types for display
const formatViolationType = (violationType: string, violationCode?: string): string => {
  // Handle Prisma enum values
  switch (violationType) {
    case 'Driver_Performance':
      return 'Driver'
    case 'Driver_Qualification':
      return 'Driver'
    case 'Equipment':
      return 'Equipment'
    case 'Company':
      return 'Company'
  }

  // Handle frontend string values
  switch (violationType?.toUpperCase()) {
    case 'DRIVER':
      return 'Driver'
    case 'EQUIPMENT':
      return 'Equipment'
    case 'COMPANY':
      return 'Company'
    default:
      // Fallback: infer from violation code if available
      if (violationCode) {
        if (violationCode.startsWith('391') || violationCode.startsWith('392')) {
          return 'Driver'
        } else if (violationCode.startsWith('393') || violationCode.startsWith('396')) {
          return 'Equipment'
        } else if (violationCode.startsWith('390')) {
          return 'Company'
        }
      }
      return violationType || 'Unknown'
  }
}

// Helper function to format severity for display
const formatSeverity = (severity: string): string => {
  switch (severity) {
    case 'OUT_OF_SERVICE':
    case 'Out_Of_Service':
      return 'Out of Service'
    case 'WARNING':
    case 'Warning':
      return 'Warning'
    case 'CITATION':
    case 'Citation':
      return 'Citation'
    default:
      return severity || 'Unknown'
  }
}

interface AccidentIssueFormProps {
  initialData?: any
  isEditing?: boolean
  onSubmit: (data: any) => void
  onCancel: () => void
  loading?: boolean
  organizationId?: string
  driverId?: string // Auto-select driver when coming from driver context
  onViolationSaved?: () => void // Callback when individual violation is saved
}

interface FormData {
  // Accident Basic Information
  accidentDate: string
  accidentTime: string
  
  // Officer/Agency Information
  officerName: string
  agencyName: string
  reportNumber: string
  
  // Accident Classifications
  isFatality: boolean
  isReportable: boolean
  isInjury: boolean
  isTow: boolean
  isCitation: boolean
  needsReport: boolean
  needsDrugTest: boolean
  
  // Additional Details (conditional)
  numberOfFatalities?: number
  numberOfVehicles?: number
  reportableNumber?: string
  specimenNumber?: string
  
  // Accident Location
  accidentAddress: string
  accidentCity: string
  accidentState: string
  accidentZip: string
  
  // Driver and Equipment selection
  selectedDriverId: string
  selectedEquipmentIds: string[]
  
  // Violations - manual entry with search
  hasViolations: boolean
  violationSearch: string
  selectedViolations: Array<{
    id?: string // Optional ID - exists for saved violations, generated for new ones
    code: string
    description: string
    unitNumber?: number
    outOfService: boolean
    outOfServiceDate?: string
    backInServiceDate?: string
    inspectorComments: string
    severity: 'WARNING' | 'OUT_OF_SERVICE' | 'CITATION'
    violationType: 'DRIVER' | 'EQUIPMENT' | 'COMPANY'
    saved: boolean
  }>
}

export function AccidentIssueForm({
  initialData,
  isEditing = false,
  onSubmit,
  onCancel,
  loading = false,
  organizationId,
  driverId,
  onViolationSaved
}: AccidentIssueFormProps) {
  const [formData, setFormData] = useState<FormData>({
    accidentDate: '',
    accidentTime: '',
    officerName: '',
    agencyName: '',
    reportNumber: '',
    isFatality: false,
    isReportable: false,
    isInjury: false,
    isTow: false,
    isCitation: false,
    needsReport: false,
    needsDrugTest: false,
    numberOfFatalities: undefined,
    numberOfVehicles: undefined,
    reportableNumber: '',
    specimenNumber: '',
    accidentAddress: '',
    accidentCity: '',
    accidentState: '',
    accidentZip: '',
    selectedDriverId: driverId || '', // Auto-select driver if provided
    selectedEquipmentIds: [],
    hasViolations: false,
    violationSearch: '',
    selectedViolations: []
  })

  const [drivers, setDrivers] = useState<any[]>([])
  const [equipment, setEquipment] = useState<any[]>([])
  const [savingViolationIndex, setSavingViolationIndex] = useState<number | null>(null)

  // Load initial data
  useEffect(() => {
    if (initialData) {
      setFormData({
        accidentDate: initialData.accidentDate ? initialData.accidentDate.split('T')[0] : '',
        accidentTime: initialData.accidentTime || '',
        officerName: initialData.officerName || '',
        agencyName: initialData.agencyName || '',
        reportNumber: initialData.reportNumber || '',
        isFatality: initialData.isFatality || false,
        isReportable: initialData.isReportable || false,
        isInjury: initialData.isInjury || false,
        isTow: initialData.isTow || false,
        isCitation: initialData.isCitation || false,
        needsReport: initialData.needsReport || false,
        needsDrugTest: initialData.needsDrugTest || false,
        numberOfFatalities: initialData.numberOfFatalities,
        numberOfVehicles: initialData.numberOfVehicles,
        reportableNumber: initialData.reportableNumber || '',
        specimenNumber: initialData.specimenNumber || '',
        accidentAddress: initialData.accidentAddress || '',
        accidentCity: initialData.accidentCity || '',
        accidentState: initialData.accidentState || '',
        accidentZip: initialData.accidentZip || '',
        selectedDriverId: initialData.issue?.partyId || driverId || '',
        selectedEquipmentIds: initialData.equipment?.map((eq: any) => eq.equipmentId).filter(Boolean) || [],
        hasViolations: initialData.violations?.length > 0 || false,
        violationSearch: '',
        selectedViolations: initialData.violations?.map((v: any) => ({
          id: v.id, // Preserve database ID for existing violations
          code: v.violationCode,
          description: v.description,
          unitNumber: v.unitNumber,
          outOfService: v.outOfService || false,
          outOfServiceDate: v.outOfServiceDate ? new Date(v.outOfServiceDate).toISOString().split('T')[0] : undefined,
          backInServiceDate: v.backInServiceDate ? new Date(v.backInServiceDate).toISOString().split('T')[0] : undefined,
          inspectorComments: v.inspectorComments || '',
          severity: v.severity || 'WARNING',
          violationType: v.violationType || 'DRIVER',
          saved: true // Existing violations are already saved
        })) || []
      })
    } else if (driverId) {
      // Auto-select driver for new form
      setFormData(prev => ({ ...prev, selectedDriverId: driverId }))
    }
  }, [initialData, driverId])

  // Fetch drivers and equipment for organization
  useEffect(() => {
    if (organizationId) {
      fetchDriversAndEquipment()
    }
  }, [organizationId])

  const fetchDriversAndEquipment = async () => {
    try {
      // Fetch drivers - use roleType filter for efficiency
      const driversResponse = await fetch(`/api/persons?organizationId=${organizationId}&roleType=DRIVER`)
      if (driversResponse.ok) {
        const driversData = await driversResponse.json()
        console.log('Drivers raw data:', driversData) // Debug log
        console.log('Driver ID to auto-select:', driverId) // Debug log
        
        setDrivers(driversData) // No need to filter since API already filters by roleType
        
        // Auto-select driver if driverId matches a person in the list (for new forms)
        if (driverId && !initialData) {
          const matchingDriver = driversData.find((person: any) => person.id === driverId)
          if (matchingDriver) {
            console.log('Auto-selecting driver:', matchingDriver.firstName, matchingDriver.lastName, 'PartyId:', matchingDriver.partyId)
            setFormData(prev => ({ ...prev, selectedDriverId: matchingDriver.partyId }))
          } else {
            console.warn('Driver ID not found in drivers list:', driverId)
          }
        }
        
        // For edit forms, ensure the driver is selected after drivers are loaded
        if (initialData && initialData.issue?.partyId) {
          const existingDriverPartyId = initialData.issue.partyId
          const matchingDriver = driversData.find((person: any) => person.partyId === existingDriverPartyId)
          if (matchingDriver) {
            console.log('Re-selecting driver for edit:', matchingDriver.firstName, matchingDriver.lastName, 'PartyId:', matchingDriver.partyId)
            setFormData(prev => ({ ...prev, selectedDriverId: matchingDriver.partyId }))
          }
        }
      } else {
        console.error('Failed to fetch drivers:', driversResponse.status)
      }

      // Fetch equipment  
      const equipmentResponse = await fetch(`/api/equipment?organizationId=${organizationId}`)
      if (equipmentResponse.ok) {
        const equipmentData = await equipmentResponse.json()
        console.log('Equipment data:', equipmentData) // Debug log
        setEquipment(equipmentData)
      } else {
        console.error('Failed to fetch equipment:', equipmentResponse.status)
      }
    } catch (error) {
      console.error('Error fetching drivers and equipment:', error)
    }
  }

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const [searchResults, setSearchResults] = useState<ViolationCode[]>([])
  const [selectedViolationForDetails, setSelectedViolationForDetails] = useState<number | null>(null)

  const handleViolationSearch = async (query: string) => {
    setFormData(prev => ({ ...prev, violationSearch: query }))
    
    if (query.length >= 2) {
      try {
        const response = await fetch(`/api/violations/search?q=${encodeURIComponent(query)}`)
        if (response.ok) {
          const results = await response.json()
          setSearchResults(results)
        } else {
          console.error('Violation search API failed:', response.statusText)
          setSearchResults([])
        }
      } catch (error) {
        console.error('Violation search failed:', error)
        setSearchResults([])
      }
    } else {
      setSearchResults([])
    }
  }

  const handleSelectViolationFromSearch = (violation: any) => {
    const newViolation = {
      id: `temp_${Date.now()}_${Math.random()}`, // Temporary ID for new violations
      code: violation.code,
      description: violation.description,
      unitNumber: undefined,
      outOfService: false,
      outOfServiceDate: undefined,
      backInServiceDate: undefined,
      inspectorComments: '',
      severity: violation.severity,
      violationType: violation.violationType,
      saved: false // New violations are not saved yet
    }
    
    setFormData(prev => ({
      ...prev,
      selectedViolations: [...prev.selectedViolations, newViolation],
      violationSearch: ''
    }))
    setSearchResults([])
  }

  const handleUpdateViolation = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      selectedViolations: prev.selectedViolations.map((violation, i) => 
        i === index ? { ...violation, [field]: value } : violation
      )
    }))
  }

  const handleRemoveViolation = async (index: number) => {
    const violation = formData.selectedViolations[index]
    
    // If this is a saved violation, delete it from the database
    if (violation.saved && isEditing && initialData?.id && violation.id && !violation.id.startsWith('temp_')) {
      const confirmDelete = window.confirm(
        `Are you sure you want to delete violation ${violation.code}? This action cannot be undone.`
      )
      
      if (!confirmDelete) return
      
      try {
        // Delete the saved violation from the database
        const response = await fetch(`/api/violations/delete`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accidentId: initialData.id,
            violationId: violation.id // Use the specific violation ID
          })
        })
        
        if (!response.ok) {
          const error = await response.json()
          alert(`Failed to delete violation: ${error.error}`)
          return
        }
        
        // Violation deleted successfully - removed alert dialog
        
        // Simple solution: reload the page to refresh all data
        window.location.reload()
      } catch (error) {
        console.error('Error deleting violation:', error)
        alert('Failed to delete violation')
        return
      }
    }
    
    // Remove from UI state (for both saved and unsaved violations)
    setFormData(prev => ({
      ...prev,
      selectedViolations: prev.selectedViolations.filter((_, i) => i !== index)
    }))
  }

  const handleAddEquipment = (equipmentId: string) => {
    if (!equipmentId || formData.selectedEquipmentIds.includes(equipmentId)) return
    
    setFormData(prev => ({
      ...prev,
      selectedEquipmentIds: [...prev.selectedEquipmentIds, equipmentId]
    }))
  }

  const handleRemoveEquipment = (equipmentId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedEquipmentIds: prev.selectedEquipmentIds.filter(id => id !== equipmentId)
    }))
  }

  const getEquipmentName = (equipmentId: string) => {
    const eq = equipment.find(e => e.id === equipmentId)
    if (!eq) return 'Unknown Equipment'
    return `${eq.year} ${eq.make} ${eq.model} - ${eq.vinNumber || eq.plateNumber}`
  }

  // Save an individual violation to the database
  const handleSaveViolation = async (index: number) => {
    const violation = formData.selectedViolations[index]
    
    // Only allow individual saves in edit mode
    if (!isEditing || !initialData?.id) {
      alert('Individual violation saves are only available when editing an existing accident. Create the accident first, then edit to add violations individually.')
      return
    }
    
    // Validate required fields
    if (!violation.inspectorComments?.trim()) {
      alert('Officer comments are required before saving')
      return
    }

    if (violation.outOfService && !violation.outOfServiceDate) {
      alert('Out of Service date is required when marking as OOS')
      return
    }

    try {
      setSavingViolationIndex(index)
      
      // Create a minimal accident payload with just this violation
      const violationData = {
        accidentId: initialData?.id, // Only for updates
        violation: {
          violationCode: violation.code,
          description: violation.description,
          unitNumber: violation.unitNumber,
          outOfService: violation.outOfService,
          outOfServiceDate: violation.outOfServiceDate,
          backInServiceDate: violation.backInServiceDate,
          inspectorComments: violation.inspectorComments,
          violationType: violation.violationType,
          severity: violation.severity
        }
      }

      // Save to database (call API to save single violation)
      const response = await fetch('/api/violations/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(violationData)
      })

      if (response.ok) {
        // Mark violation as saved in local state
        setFormData(prev => ({
          ...prev,
          selectedViolations: prev.selectedViolations.map((v, i) => 
            i === index ? { ...v, saved: true } : v
          )
        }))
        // Violation saved successfully - removed alert dialog
        onViolationSaved?.() // Call the callback
      } else {
        const error = await response.json()
        alert(`Failed to save violation: ${error.error}`)
      }
    } catch (error) {
      console.error('Error saving violation:', error)
      alert('Failed to save violation')
    } finally {
      setSavingViolationIndex(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.selectedDriverId) {
      alert('Please select a driver')
      return
    }

    if (formData.selectedEquipmentIds.length === 0) {
      alert('Please select at least one piece of equipment')
      return
    }

    if (!formData.accidentDate || !formData.officerName || !formData.agencyName) {
      alert('Please fill in all required fields')
      return
    }

    // Validate conditional fields
    if (formData.isFatality && !formData.numberOfFatalities) {
      alert('Number of fatalities is required when fatality is checked')
      return
    }

    if (formData.isReportable && !formData.reportableNumber) {
      alert('Reportable number is required when reportable is checked')
      return
    }

    if (formData.needsDrugTest && !formData.specimenNumber) {
      alert('Specimen number is required when drug test is needed')
      return
    }

    // Validate violations if present
    if (formData.hasViolations && formData.selectedViolations.length > 0) {
      const missingComments = formData.selectedViolations.find(v => !v.inspectorComments.trim())
      if (missingComments) {
        alert(`Please add officer comments for violation ${missingComments.code}`)
        return
      }

      const missingOOSDate = formData.selectedViolations.find(v => v.outOfService && !v.outOfServiceDate)
      if (missingOOSDate) {
        alert(`Please set out-of-service date for violation ${missingOOSDate.code}`)
        return
      }
    }

    // Prepare submission data
    const submissionData = {
      ...formData,
      partyId: formData.selectedDriverId, // Link to the driver
      title: `Accident - ${formData.agencyName}`,
      // Include equipment info
      equipment: formData.selectedEquipmentIds.map((id, index) => ({
        unitNumber: index + 1,
        equipmentId: id
      })),
      // Include violations with full details (only unsaved ones for new/bulk updates)
      violations: formData.selectedViolations
        .filter(violation => !violation.saved) // Only include violations that haven't been saved individually
        .map(violation => ({
          violationCode: violation.code,
          description: violation.description,
          unitNumber: violation.unitNumber,
          outOfService: violation.outOfService,
          outOfServiceDate: violation.outOfServiceDate ? new Date(violation.outOfServiceDate) : null,
          backInServiceDate: violation.backInServiceDate ? new Date(violation.backInServiceDate) : null,
          inspectorComments: violation.inspectorComments,
          severity: violation.severity,
          violationType: violation.violationType
        }))
    }

    onSubmit(submissionData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Accident Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Accident Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="accidentDate">Accident Date *</Label>
              <Input
                id="accidentDate"
                type="date"
                value={formData.accidentDate}
                onChange={(e) => handleInputChange('accidentDate', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="accidentTime">Accident Time</Label>
              <Input
                id="accidentTime"
                value={formData.accidentTime}
                onChange={(e) => handleInputChange('accidentTime', e.target.value)}
                placeholder="12:37 PM EST"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="officerName">Officer Name *</Label>
              <Input
                id="officerName"
                value={formData.officerName}
                onChange={(e) => handleInputChange('officerName', e.target.value)}
                placeholder="Smith, John"
                required
              />
            </div>
            <div>
              <Label htmlFor="agencyName">Agency Name *</Label>
              <Input
                id="agencyName"
                value={formData.agencyName}
                onChange={(e) => handleInputChange('agencyName', e.target.value)}
                placeholder="State Highway Patrol"
                required
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="reportNumber">Police Report Number</Label>
            <Input
              id="reportNumber"
              value={formData.reportNumber}
              onChange={(e) => handleInputChange('reportNumber', e.target.value)}
              placeholder="2024-001234"
            />
          </div>
        </CardContent>
      </Card>

      {/* Accident Classifications */}
      <Card>
        <CardHeader>
          <CardTitle>Accident Classifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isFatality"
                checked={formData.isFatality}
                onCheckedChange={(checked) => handleInputChange('isFatality', checked)}
              />
              <Label htmlFor="isFatality">Fatality</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isReportable"
                checked={formData.isReportable}
                onCheckedChange={(checked) => handleInputChange('isReportable', checked)}
              />
              <Label htmlFor="isReportable">Reportable</Label>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isInjury"
                checked={formData.isInjury}
                onCheckedChange={(checked) => handleInputChange('isInjury', checked)}
              />
              <Label htmlFor="isInjury">Injury</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isTow"
                checked={formData.isTow}
                onCheckedChange={(checked) => handleInputChange('isTow', checked)}
              />
              <Label htmlFor="isTow">Vehicle Towed</Label>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isCitation"
                checked={formData.isCitation}
                onCheckedChange={(checked) => handleInputChange('isCitation', checked)}
              />
              <Label htmlFor="isCitation">Citations Issued</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="needsReport"
                checked={formData.needsReport}
                onCheckedChange={(checked) => handleInputChange('needsReport', checked)}
              />
              <Label htmlFor="needsReport">Needs Report</Label>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="needsDrugTest"
              checked={formData.needsDrugTest}
              onCheckedChange={(checked) => handleInputChange('needsDrugTest', checked)}
            />
            <Label htmlFor="needsDrugTest">Drug Test Required</Label>
          </div>
          
          {/* Conditional Fields */}
          {formData.isFatality && (
            <div>
              <Label htmlFor="numberOfFatalities">Number of Fatalities *</Label>
              <Input
                id="numberOfFatalities"
                type="number"
                min="1"
                value={formData.numberOfFatalities || ''}
                onChange={(e) => handleInputChange('numberOfFatalities', parseInt(e.target.value) || undefined)}
                required={formData.isFatality}
              />
            </div>
          )}
          
          {formData.isReportable && (
            <div>
              <Label htmlFor="reportableNumber">Reportable Number *</Label>
              <Input
                id="reportableNumber"
                value={formData.reportableNumber || ''}
                onChange={(e) => handleInputChange('reportableNumber', e.target.value)}
                placeholder="DOT-2024-001"
                required={formData.isReportable}
              />
            </div>
          )}
          
          {formData.needsDrugTest && (
            <div>
              <Label htmlFor="specimenNumber">Specimen Number *</Label>
              <Input
                id="specimenNumber"
                value={formData.specimenNumber || ''}
                onChange={(e) => handleInputChange('specimenNumber', e.target.value)}
                placeholder="SP-2024-001"
                required={formData.needsDrugTest}
              />
            </div>
          )}
          
          <div>
            <Label htmlFor="numberOfVehicles">Number of Vehicles Involved</Label>
            <Input
              id="numberOfVehicles"
              type="number"
              min="1"
              value={formData.numberOfVehicles || ''}
              onChange={(e) => handleInputChange('numberOfVehicles', parseInt(e.target.value) || undefined)}
              placeholder="2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Accident Location */}
      <Card>
        <CardHeader>
          <CardTitle>Accident Location</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="accidentAddress">Address</Label>
            <Input
              id="accidentAddress"
              value={formData.accidentAddress}
              onChange={(e) => handleInputChange('accidentAddress', e.target.value)}
              placeholder="1234 Main Street"
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="accidentCity">City</Label>
              <Input
                id="accidentCity"
                value={formData.accidentCity}
                onChange={(e) => handleInputChange('accidentCity', e.target.value)}
                placeholder="Springfield"
              />
            </div>
            <div>
              <Label htmlFor="accidentState">State</Label>
              <Input
                id="accidentState"
                value={formData.accidentState}
                onChange={(e) => handleInputChange('accidentState', e.target.value)}
                placeholder="IL"
              />
            </div>
            <div>
              <Label htmlFor="accidentZip">ZIP Code</Label>
              <Input
                id="accidentZip"
                value={formData.accidentZip}
                onChange={(e) => handleInputChange('accidentZip', e.target.value)}
                placeholder="62701"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Driver Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Driver Selection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="selectedDriverId">Driver *</Label>
            <Select
              value={formData.selectedDriverId}
              onValueChange={(value) => handleInputChange('selectedDriverId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={drivers.length === 0 ? "Loading drivers..." : "Select driver"} />
              </SelectTrigger>
              <SelectContent>
                {drivers.map((driver) => (
                  <SelectItem key={driver.party.id} value={driver.party.id}>
                    {driver.firstName} {driver.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {drivers.length === 0 && organizationId && (
              <p className="text-sm text-red-600">No drivers found for this organization</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Equipment Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Equipment Involved *</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Add Equipment</Label>
            <Select onValueChange={handleAddEquipment}>
              <SelectTrigger>
                <SelectValue placeholder={equipment.length === 0 ? "Loading equipment..." : "Select equipment to add"} />
              </SelectTrigger>
              <SelectContent>
                {equipment
                  .filter(eq => !formData.selectedEquipmentIds.includes(eq.id))
                  .map((eq) => (
                    <SelectItem key={eq.id} value={eq.id}>
                      {eq.year} {eq.make} {eq.model} - {eq.vinNumber || eq.plateNumber}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Selected Equipment */}
          {formData.selectedEquipmentIds.length > 0 && (
            <div>
              <Label>Selected Equipment ({formData.selectedEquipmentIds.length})</Label>
              <div className="space-y-2 mt-2">
                {formData.selectedEquipmentIds.map((equipmentId, index) => (
                  <div key={equipmentId} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                    <span className="text-sm">
                      Unit {index + 1}: {getEquipmentName(equipmentId)}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveEquipment(equipmentId)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {equipment.length === 0 && organizationId && (
            <p className="text-sm text-red-600">No equipment found for this organization</p>
          )}
        </CardContent>
      </Card>

      {/* Violations & Citations */}
      <Card>
        <CardHeader>
          <CardTitle>Violations & Citations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasViolations"
              checked={formData.hasViolations}
              onCheckedChange={(checked) => handleInputChange('hasViolations', checked)}
            />
            <Label htmlFor="hasViolations">Has Violations/Citations</Label>
          </div>
          
          {formData.hasViolations && (
            <div>
              <Label>Enter Violation Codes from Citations</Label>
              <div className="space-y-2 mt-2 relative">
                <Input
                  placeholder="Search violations by code or description (e.g., 392.2, brake, lighting)"
                  value={formData.violationSearch}
                  onChange={(e) => handleViolationSearch(e.target.value)}
                />
                
                {/* Live Search Results */}
                {searchResults.length > 0 && (
                  <div className="absolute z-50 w-full border rounded-md bg-white shadow-lg max-h-64 overflow-y-auto mb-2 bottom-full">
                    {searchResults.map((violation) => (
                      <div
                        key={violation.code}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                        onClick={() => handleSelectViolationFromSearch(violation)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{violation.code}</span>
                              <Badge variant={violation.severity === 'OUT_OF_SERVICE' ? 'destructive' : 'outline'}>
                                {formatSeverity(violation.severity)}
                              </Badge>
                              <Badge variant="secondary">{formatViolationType(violation.violationType, violation.code)}</Badge>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{violation.description}</p>
                            <p className="text-xs text-gray-500">{violation.section}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Selected Violations */}
              {formData.selectedViolations.length > 0 && (
                <div className="mt-4">
                  <Label>Violations ({formData.selectedViolations.length})</Label>
                  <div className="space-y-4 mt-2">
                    {formData.selectedViolations.map((violation, index) => (
                      <Card key={index} className="border-red-200">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{violation.code}</span>
                              <Badge variant={violation.severity === 'OUT_OF_SERVICE' ? 'destructive' : 'outline'}>
                                {formatSeverity(violation.severity)}
                              </Badge>
                              <Badge variant="secondary">{formatViolationType(violation.violationType, violation.code)}</Badge>
                              {violation.outOfService && (
                                <Badge variant="destructive">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  OOS
                                </Badge>
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveViolation(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-sm text-gray-600">{violation.description}</p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Officer Comments - Required */}
                          <div>
                            <Label htmlFor={`comments-${index}`}>Officer Comments *</Label>
                            <Textarea
                              id={`comments-${index}`}
                              placeholder="Required: Enter officer's comments about this violation..."
                              value={violation.inspectorComments}
                              onChange={(e) => handleUpdateViolation(index, 'inspectorComments', e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          
                          {/* Out of Service Toggle */}
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`oos-${index}`}
                              checked={violation.outOfService}
                              onCheckedChange={(checked) => {
                                handleUpdateViolation(index, 'outOfService', checked)
                                if (checked && !violation.outOfServiceDate) {
                                  handleUpdateViolation(index, 'outOfServiceDate', new Date().toISOString().split('T')[0])
                                }
                              }}
                            />
                            <Label htmlFor={`oos-${index}`}>Place Out of Service</Label>
                          </div>
                          
                          {/* Out of Service Dates - Only show if OOS is checked */}
                          {violation.outOfService && (
                            <div className="grid grid-cols-2 gap-4 p-3 bg-red-50 rounded-md">
                              <div>
                                <Label htmlFor={`oos-date-${index}`}>Out of Service Date *</Label>
                                <Input
                                  id={`oos-date-${index}`}
                                  type="date"
                                  value={violation.outOfServiceDate || ''}
                                  onChange={(e) => handleUpdateViolation(index, 'outOfServiceDate', e.target.value)}
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label htmlFor={`bis-date-${index}`}>Back in Service Date</Label>
                                <Input
                                  id={`bis-date-${index}`}
                                  type="date"
                                  value={violation.backInServiceDate || ''}
                                  onChange={(e) => handleUpdateViolation(index, 'backInServiceDate', e.target.value)}
                                  className="mt-1"
                                />
                              </div>
                            </div>
                          )}
                          
                          {/* Unit Number Assignment */}
                          <div>
                            <Label htmlFor={`unit-${index}`}>Unit Number (if equipment violation)</Label>
                            <Select 
                              value={violation.unitNumber?.toString() || 'none'} 
                              onValueChange={(value) => handleUpdateViolation(index, 'unitNumber', value === 'none' ? undefined : parseInt(value))}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select unit or leave blank for driver violation" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No unit assignment</SelectItem>
                                {formData.selectedEquipmentIds.map((_, idx) => (
                                  <SelectItem key={idx + 1} value={(idx + 1).toString()}>
                                    Unit {idx + 1}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Save Violation Button */}
                          {isEditing && initialData?.id && (
                            <div className="flex items-center justify-between pt-4 border-t">
                              {violation.saved ? (
                                <div className="flex items-center gap-2 text-green-600">
                                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                                  <span className="text-sm font-medium">Violation Saved</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-amber-600">
                                  <div className="w-2 h-2 bg-amber-600 rounded-full"></div>
                                  <span className="text-sm">Not saved yet</span>
                                </div>
                              )}
                              
                              {!violation.saved && (
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => handleSaveViolation(index)}
                                  disabled={savingViolationIndex === index}
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  {savingViolationIndex === index ? 'Saving...' : 'Save Violation'}
                                </Button>
                              )}
                            </div>
                          )}
                          
                          {/* For new accidents, show helpful message */}
                          {!isEditing && (
                            <div className="pt-4 border-t">
                              <div className="flex items-center gap-2 text-blue-600">
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                <span className="text-sm">Will be saved with accident</span>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : (isEditing ? 'Update' : 'Create')} Accident
        </Button>
      </div>
    </form>
  )
} 