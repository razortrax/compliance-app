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
import { RinsLevel, RinsResult, DverSource, EntryMethod } from '@prisma/client'
import { searchViolations, ViolationCode } from '@/lib/violations'

interface RoadsideInspectionFormProps {
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
  // DVER Header Information
  reportNumber: string
  inspectionDate: string
  inspectionTime: string
  inspectorName: string
  inspectorBadge: string
  
  // Location Details
  inspectionLocation: string
  facilityName: string
  facilityAddress: string
  facilityCity: string
  facilityState: string
  facilityZip: string
  
  // Inspection Details
  inspectionLevel: RinsLevel | ''
  overallResult: RinsResult | ''
  
  // DVER Processing
  dverReceived: boolean
  dverSource: DverSource | ''
  entryMethod: EntryMethod
  
  // Drivers and Equipment selection
  selectedDriverId: string
  selectedEquipmentIds: string[]
  
  // Violations - manual entry with search
  hasViolations: boolean
  violationSearch: string
  selectedViolations: Array<{
    code: string
    description: string
    unitNumber?: number
    outOfService: boolean
    outOfServiceDate?: string
    backInServiceDate?: string
    inspectorComments: string
    severity: 'WARNING' | 'OUT_OF_SERVICE' | 'CITATION'
    violationType: 'DRIVER' | 'EQUIPMENT' | 'COMPANY'
    saved: boolean // New property to indicate if the violation is already saved
  }>
}

export function RoadsideInspectionForm({
  initialData,
  isEditing = false,
  onSubmit,
  onCancel,
  loading = false,
  organizationId,
  driverId,
  onViolationSaved
}: RoadsideInspectionFormProps) {
  const [formData, setFormData] = useState<FormData>({
    reportNumber: '',
    inspectionDate: '',
    inspectionTime: '',
    inspectorName: '',
    inspectorBadge: '',
    inspectionLocation: '',
    facilityName: '',
    facilityAddress: '',
    facilityCity: '',
    facilityState: '',
    facilityZip: '',
    inspectionLevel: '',
    overallResult: '',
    dverReceived: false,
    dverSource: '',
    entryMethod: 'Manual_Entry',
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
        reportNumber: initialData.reportNumber || '',
        inspectionDate: initialData.inspectionDate ? initialData.inspectionDate.split('T')[0] : '',
        inspectionTime: initialData.inspectionTime || '',
        inspectorName: initialData.inspectorName || '',
        inspectorBadge: initialData.inspectorBadge || '',
        inspectionLocation: initialData.inspectionLocation || '',
        facilityName: initialData.facilityName || '',
        facilityAddress: initialData.facilityAddress || '',
        facilityCity: initialData.facilityCity || '',
        facilityState: initialData.facilityState || '',
        facilityZip: initialData.facilityZip || '',
        inspectionLevel: initialData.inspectionLevel || '',
        overallResult: initialData.overallResult || '',
        dverReceived: initialData.dverReceived || false,
        dverSource: initialData.dverSource || '',
        entryMethod: initialData.entryMethod || 'Manual_Entry',
        selectedDriverId: initialData.issue?.partyId || driverId || '',
        selectedEquipmentIds: initialData.equipment?.map((eq: any) => eq.equipmentId).filter(Boolean) || [],
        hasViolations: initialData.violations?.length > 0 || false,
        violationSearch: '',
        selectedViolations: initialData.violations?.map((v: any) => ({
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

  const handleSelectViolationFromSearch = (violation: ViolationCode) => {
    const newViolation = {
      code: violation.code,
      description: violation.description,
      unitNumber: undefined,
      outOfService: violation.severity === 'OUT_OF_SERVICE',
      outOfServiceDate: violation.severity === 'OUT_OF_SERVICE' ? new Date().toISOString().split('T')[0] : undefined,
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

  const handleRemoveViolation = (index: number) => {
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
      alert('Individual violation saves are only available when editing an existing roadside inspection. Create the RINS first, then edit to add violations individually.')
      return
    }
    
    // Validate required fields
    if (!violation.inspectorComments?.trim()) {
      alert('Inspector comments are required before saving')
      return
    }

    if (violation.outOfService && !violation.outOfServiceDate) {
      alert('Out of Service date is required when marking as OOS')
      return
    }

    try {
      setSavingViolationIndex(index)
      
      // Create a minimal RINS payload with just this violation
      const violationData = {
        rinsId: initialData?.id, // Only for updates
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
        alert('Violation saved successfully!')
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

    if (!formData.inspectionDate || !formData.inspectorName || !formData.inspectionLocation) {
      alert('Please fill in all required fields')
      return
    }

    // Validate violations if present
    if (formData.hasViolations && formData.selectedViolations.length > 0) {
      const missingComments = formData.selectedViolations.find(v => !v.inspectorComments.trim())
      if (missingComments) {
        alert(`Please add inspector comments for violation ${missingComments.code}`)
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
      title: `Roadside Inspection - ${formData.inspectionLocation}`,
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
      {/* DVER Header */}
      <Card>
        <CardHeader>
          <CardTitle>DVER Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="reportNumber">Report Number</Label>
              <Input
                id="reportNumber"
                value={formData.reportNumber}
                onChange={(e) => handleInputChange('reportNumber', e.target.value)}
                placeholder="USP070000063"
              />
            </div>
            <div>
              <Label htmlFor="inspectionDate">Inspection Date *</Label>
              <Input
                id="inspectionDate"
                type="date"
                value={formData.inspectionDate}
                onChange={(e) => handleInputChange('inspectionDate', e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="inspectionTime">Inspection Time</Label>
              <Input
                id="inspectionTime"
                value={formData.inspectionTime}
                onChange={(e) => handleInputChange('inspectionTime', e.target.value)}
                placeholder="12:37 PM EST"
              />
            </div>
            <div>
              <Label htmlFor="inspectorName">Inspector Name *</Label>
              <Input
                id="inspectorName"
                value={formData.inspectorName}
                onChange={(e) => handleInputChange('inspectorName', e.target.value)}
                placeholder="Morin, Alvin Ray"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="inspectorBadge">Inspector Badge</Label>
              <Input
                id="inspectorBadge"
                value={formData.inspectorBadge}
                onChange={(e) => handleInputChange('inspectorBadge', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="inspectionLevel">Inspection Level</Label>
              <Select
                value={formData.inspectionLevel}
                onValueChange={(value) => handleInputChange('inspectionLevel', value as RinsLevel)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Level_I">Level I - Comprehensive</SelectItem>
                  <SelectItem value="Level_II">Level II - Walk-around</SelectItem>
                  <SelectItem value="Level_III">Level III - Driver/credential</SelectItem>
                  <SelectItem value="Level_IV">Level IV - Special investigation</SelectItem>
                  <SelectItem value="Level_V">Level V - Vehicle-only</SelectItem>
                  <SelectItem value="Level_VI">Level VI - Enhanced NAS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location Information */}
      <Card>
        <CardHeader>
          <CardTitle>Location Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="inspectionLocation">Inspection Location *</Label>
            <Input
              id="inspectionLocation"
              value={formData.inspectionLocation}
              onChange={(e) => handleInputChange('inspectionLocation', e.target.value)}
              placeholder="NEWBERRY SC"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="facilityName">Facility Name</Label>
            <Input
              id="facilityName"
              value={formData.facilityName}
              onChange={(e) => handleInputChange('facilityName', e.target.value)}
              placeholder="WATER TECH TRANSPORTATION LLC"
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <Label htmlFor="facilityAddress">Facility Address</Label>
              <Input
                id="facilityAddress"
                value={formData.facilityAddress}
                onChange={(e) => handleInputChange('facilityAddress', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="facilityCity">City</Label>
              <Input
                id="facilityCity"
                value={formData.facilityCity}
                onChange={(e) => handleInputChange('facilityCity', e.target.value)}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="facilityState">State</Label>
              <Input
                id="facilityState"
                value={formData.facilityState}
                onChange={(e) => handleInputChange('facilityState', e.target.value)}
                placeholder="SC"
              />
            </div>
            <div>
              <Label htmlFor="facilityZip">ZIP Code</Label>
              <Input
                id="facilityZip"
                value={formData.facilityZip}
                onChange={(e) => handleInputChange('facilityZip', e.target.value)}
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

      {/* Results & Processing */}
      <Card>
        <CardHeader>
          <CardTitle>Results & Processing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="overallResult">Overall Result</Label>
              <Select
                value={formData.overallResult}
                onValueChange={(value) => handleInputChange('overallResult', value as RinsResult)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select result" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pass">Pass</SelectItem>
                  <SelectItem value="Warning">Warning</SelectItem>
                  <SelectItem value="Out_Of_Service">Out of Service</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="dverSource">DVER Source</Label>
              <Select
                value={formData.dverSource}
                onValueChange={(value) => handleInputChange('dverSource', value as DverSource)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Driver_Reported">Driver Reported</SelectItem>
                  <SelectItem value="FMCSA_Portal_Check">FMCSA Portal Check</SelectItem>
                  <SelectItem value="Third_Party_Report">Third Party Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="dverReceived"
              checked={formData.dverReceived}
              onCheckedChange={(checked) => handleInputChange('dverReceived', checked)}
            />
            <Label htmlFor="dverReceived">DVER Form Received</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasViolations"
              checked={formData.hasViolations}
              onCheckedChange={(checked) => handleInputChange('hasViolations', checked)}
            />
            <Label htmlFor="hasViolations">Has Violations</Label>
          </div>
          
          {formData.hasViolations && (
            <div>
              <Label>Enter Violation Codes from DVER</Label>
              <div className="space-y-2 mt-2">
                <Input
                  placeholder="Search violations by code or description (e.g., 392.2, brake, lighting)"
                  value={formData.violationSearch}
                  onChange={(e) => handleViolationSearch(e.target.value)}
                />
                
                {/* Live Search Results */}
                {searchResults.length > 0 && (
                  <div className="border rounded-md bg-white shadow-sm max-h-48 overflow-y-auto">
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
                                {violation.severity}
                              </Badge>
                              <Badge variant="secondary">{violation.violationType}</Badge>
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
                                {violation.severity}
                              </Badge>
                              <Badge variant="secondary">{violation.violationType}</Badge>
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
                          {/* Inspector Comments - Required */}
                          <div>
                            <Label htmlFor={`comments-${index}`}>Inspector Comments *</Label>
                            <Textarea
                              id={`comments-${index}`}
                              placeholder="Required: Enter inspector's comments about this violation..."
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
                            
                            {!violation.saved && isEditing && initialData?.id && (
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
          {loading ? 'Saving...' : (isEditing ? 'Update' : 'Create')} Roadside Inspection
        </Button>
      </div>
    </form>
  )
} 