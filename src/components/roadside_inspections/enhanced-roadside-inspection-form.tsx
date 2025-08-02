'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { X, Plus, AlertTriangle, Shield, Users, Truck, FileText } from 'lucide-react'
import { format } from 'date-fns'

// Types for form data
interface Driver {
  id: string
  firstName: string
  lastName: string
  licenseNumber?: string
  partyId: string
}

interface Equipment {
  id: string
  partyId: string
  vehicleType: string
  make?: string
  model?: string
  year?: number
  vinNumber?: string
  plateNumber?: string
}

interface Violation {
  id: string
  violationCode: string
  section?: string
  description: string
  severity: 'WARNING' | 'CITATION' | 'OUT_OF_SERVICE'
  violationType: 'Driver_Qualification' | 'Driver_Performance' | 'Equipment' | 'Company'
  outOfService: boolean
  unitNumber?: number
  inspectorComments: string
}

interface FormData {
  // Basic Inspection Info
  incidentDate: string
  incidentTime: string
  reportNumber: string
  
  // Inspector Information
  officerName: string
  agencyName: string
  officerBadge: string
  
  // Location Information
  locationAddress: string
  locationCity: string
  locationState: string
  locationZip: string
  
  // Inspection Details
  inspectionLevel: string
  overallResult: string
  dvirReceived: boolean
  dvirSource: string
  entryMethod: string
  
  // Driver Selection - Primary and Co-driver
  primaryDriverId: string
  coDriverId: string
  isCoDriverPresent: boolean
  
  // Equipment Selection
  selectedEquipmentIds: string[]
  
  // Violations
  violations: Violation[]
}

interface EnhancedRoadsideInspectionFormProps {
  onSubmit: (data: any) => void
  onCancel: () => void
  isSubmitting?: boolean
  initialData?: any
  // Context for pre-population
  preSelectedDriverId?: string
  preSelectedEquipmentIds?: string[]
  organizationId?: string
  masterOrgId?: string
}

export default function EnhancedRoadsideInspectionForm({
  onSubmit,
  onCancel,
  isSubmitting = false,
  initialData,
  preSelectedDriverId,
  preSelectedEquipmentIds = [],
  organizationId,
  masterOrgId
}: EnhancedRoadsideInspectionFormProps) {
  const [formData, setFormData] = useState<FormData>({
    incidentDate: new Date().toISOString().split('T')[0], // Default to today
    incidentTime: '',
    reportNumber: '',
    officerName: '',
    agencyName: '',
    officerBadge: '',
    locationAddress: '',
    locationCity: '',
    locationState: '',
    locationZip: '',
    inspectionLevel: '',
    overallResult: '',
    dvirReceived: false,
    dvirSource: '',
    entryMethod: 'Manual_Entry',
    primaryDriverId: preSelectedDriverId || '', // Pre-populate from context
    coDriverId: '',
    isCoDriverPresent: false,
    selectedEquipmentIds: preSelectedEquipmentIds, // Pre-populate from context
    violations: []
  })

  // Debug the pre-selected driver
  useEffect(() => {
    console.log('Form initialized with preSelectedDriverId:', preSelectedDriverId)
    if (preSelectedDriverId && preSelectedDriverId !== formData.primaryDriverId) {
      console.log('Updating primaryDriverId in form data')
      setFormData(prev => ({
        ...prev,
        primaryDriverId: preSelectedDriverId
      }))
    }
  }, [preSelectedDriverId])

  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([])
  const [availableEquipment, setAvailableEquipment] = useState<Equipment[]>([])
  const [violationSearch, setViolationSearch] = useState('')
  const [driverSearch, setDriverSearch] = useState('')
  const [equipmentSearch, setEquipmentSearch] = useState('')
  const [availableViolations, setAvailableViolations] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('basic')

  // Load drivers and equipment on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch drivers and equipment using URL-driven API
        if (masterOrgId && organizationId) {
          const [driversResponse, equipmentResponse] = await Promise.allSettled([
            fetch(`/api/master/${masterOrgId}/organization/${organizationId}/drivers`),
            fetch(`/api/master/${masterOrgId}/organization/${organizationId}/equipment`)
          ])

          // Handle drivers data
          if (driversResponse.status === 'fulfilled' && driversResponse.value.ok) {
            const driversData = await driversResponse.value.json()
                      // Transform drivers data to expected format
          const drivers = driversData.drivers?.map((driver: any) => ({
            id: driver.id,
            firstName: driver.firstName,
            lastName: driver.lastName,
            licenseNumber: driver.licenseNumber,
            partyId: driver.partyId
          })) || []
          setAvailableDrivers(drivers)
          
          // Set the preselected driver if provided and not already set
          if (preSelectedDriverId && formData.primaryDriverId !== preSelectedDriverId) {
            console.log('Setting preselected driver:', preSelectedDriverId)
            setFormData(prev => ({
              ...prev,
              primaryDriverId: preSelectedDriverId
            }))
          }
          }

          // Handle equipment data
          if (equipmentResponse.status === 'fulfilled' && equipmentResponse.value.ok) {
            const equipmentData = await equipmentResponse.value.json()
            // Transform equipment data to expected format
            const equipment = equipmentData.equipment?.map((equip: any) => ({
              id: equip.id,
              partyId: equip.partyId,
              vehicleType: equip.vehicleType || 'Unknown',
              make: equip.make,
              model: equip.model,
              year: equip.year,
              vinNumber: equip.vinNumber,
              plateNumber: equip.plateNumber
            })) || []
            setAvailableEquipment(equipment)
          }
        }
      } catch (error) {
        console.error('Error fetching form data:', error)
      }
    }

    fetchData()
  }, [masterOrgId, organizationId])

  // Search violations using real API
  useEffect(() => {
    const searchViolations = async () => {
      if (violationSearch.length >= 2) {
        try {
          const response = await fetch(`/api/violations/search?q=${encodeURIComponent(violationSearch)}`)
          if (response.ok) {
            const violations = await response.json()
            setAvailableViolations(violations)
          } else {
            console.error('Failed to search violations')
            setAvailableViolations([])
          }
        } catch (error) {
          console.error('Error searching violations:', error)
          setAvailableViolations([])
        }
      } else {
        setAvailableViolations([])
      }
    }

    const timeoutId = setTimeout(searchViolations, 300) // Debounce search
    return () => clearTimeout(timeoutId)
  }, [violationSearch])

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addViolation = (violationCode: any) => {
    const newViolation: Violation = {
      id: `temp_${Date.now()}`,
      violationCode: violationCode.code,
      section: violationCode.section || `49 CFR ${violationCode.code}`,
      description: violationCode.description,
      severity: violationCode.severity as any,
      violationType: violationCode.type as any,
      outOfService: violationCode.severity === 'OUT_OF_SERVICE',
      inspectorComments: ''
    }

    setFormData(prev => ({
      ...prev,
      violations: [newViolation, ...prev.violations]
    }))
    setViolationSearch('')
    setAvailableViolations([])
  }

  const removeViolation = (violationId: string) => {
    setFormData(prev => ({
      ...prev,
      violations: prev.violations.filter(v => v.id !== violationId)
    }))
  }

  const updateViolation = (violationId: string, field: keyof Violation, value: any) => {
    setFormData(prev => ({
      ...prev,
      violations: prev.violations.map(v => 
        v.id === violationId ? { ...v, [field]: value } : v
      )
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Debug form data
    console.log('Form validation - current formData:', formData)
    
    // Validation
    const missingFields = []
    if (!formData.incidentDate) missingFields.push('Inspection Date')
    if (!formData.primaryDriverId) missingFields.push('Primary Driver')
    if (!formData.officerName) missingFields.push('Inspector Name')
    
    if (missingFields.length > 0) {
      console.log('Missing fields:', missingFields)
      alert(`Please fill in the following required fields:\n• ${missingFields.join('\n• ')}`)
      return
    }

    // Prepare submission data
    const submissionData = {
      incidentType: 'ROADSIDE_INSPECTION',
      incidentDate: formData.incidentDate,
      incidentTime: formData.incidentTime,
      officerName: formData.officerName,
      agencyName: formData.agencyName,
      officerBadge: formData.officerBadge,
      reportNumber: formData.reportNumber,
      locationAddress: formData.locationAddress,
      locationCity: formData.locationCity,
      locationState: formData.locationState,
      locationZip: formData.locationZip,
      
      // Roadside-specific data
      roadsideData: {
        inspectionLevel: formData.inspectionLevel,
        overallResult: formData.overallResult,
        dvirReceived: formData.dvirReceived,
        dvirSource: formData.dvirSource,
        entryMethod: formData.entryMethod
      },
      
      // Related entities
      selectedDriverId: formData.primaryDriverId,
      coDriverId: formData.isCoDriverPresent ? formData.coDriverId : null,
      selectedEquipmentIds: formData.selectedEquipmentIds,
      violations: formData.violations
    }
    
    onSubmit(submissionData)
  }

  // Get driver name by ID
  const getDriverName = (driverId: string) => {
    const driver = availableDrivers.find(d => d.id === driverId)
    return driver ? `${driver.firstName} ${driver.lastName}` : 'Unknown Driver'
  }

  // Get equipment name by ID
  const getEquipmentName = (equipmentId: string) => {
    const equipment = availableEquipment.find(e => e.id === equipmentId)
    return equipment ? `${equipment.make} ${equipment.model} (${equipment.year})` : 'Unknown Equipment'
  }

  return (
    <form onSubmit={handleSubmit} className="h-full flex flex-col">
      {/* Fixed Tab Headers */}
      <div className="flex-shrink-0 px-6 py-4 bg-white border-b">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Basic Info
            </TabsTrigger>
            <TabsTrigger value="parties" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Drivers & Equipment
            </TabsTrigger>
            <TabsTrigger value="violations" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Violations
            </TabsTrigger>
            <TabsTrigger value="review" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Review
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Tab 1: Basic Information */}
          <TabsContent value="basic" className="h-full">
            <div className="p-6 space-y-6">
          {/* Inspection Information */}
          <Card>
            <CardHeader>
              <CardTitle>Inspection Information</CardTitle>
              <CardDescription>Basic details about the roadside inspection</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="incidentDate">Inspection Date <span className="text-red-500">*</span></Label>
                <Input
                  id="incidentDate"
                  type="date"
                  value={formData.incidentDate}
                  onChange={(e) => handleInputChange('incidentDate', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="incidentTime">Inspection Time</Label>
                <Input
                  id="incidentTime"
                  type="time"
                  value={formData.incidentTime}
                  onChange={(e) => handleInputChange('incidentTime', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="reportNumber">Report Number</Label>
                <Input
                  id="reportNumber"
                  value={formData.reportNumber}
                  onChange={(e) => handleInputChange('reportNumber', e.target.value)}
                  placeholder="USP-12345"
                />
              </div>
              <div>
                <Label htmlFor="inspectionLevel">Inspection Level</Label>
                <Select
                  value={formData.inspectionLevel}
                  onValueChange={(value) => handleInputChange('inspectionLevel', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Level_I">Level I - Full Inspection</SelectItem>
                    <SelectItem value="Level_II">Level II - Walk-Around</SelectItem>
                    <SelectItem value="Level_III">Level III - Driver/Credentials</SelectItem>
                    <SelectItem value="Level_IV">Level IV - Special</SelectItem>
                    <SelectItem value="Level_V">Level V - Vehicle Only</SelectItem>
                    <SelectItem value="Level_VI">Level VI - Enhanced NAS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Inspector Information */}
          <Card>
            <CardHeader>
              <CardTitle>Inspector Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="officerName">Inspector Name <span className="text-red-500">*</span></Label>
                <Input
                  id="officerName"
                  value={formData.officerName}
                  onChange={(e) => handleInputChange('officerName', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="agencyName">Agency Name</Label>
                <Input
                  id="agencyName"
                  value={formData.agencyName}
                  onChange={(e) => handleInputChange('agencyName', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="officerBadge">Badge Number</Label>
                <Input
                  id="officerBadge"
                  value={formData.officerBadge}
                  onChange={(e) => handleInputChange('officerBadge', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Location Information */}
          <Card>
            <CardHeader>
              <CardTitle>Inspection Location</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="locationAddress">Address</Label>
                <Input
                  id="locationAddress"
                  value={formData.locationAddress}
                  onChange={(e) => handleInputChange('locationAddress', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="locationCity">City</Label>
                <Input
                  id="locationCity"
                  value={formData.locationCity}
                  onChange={(e) => handleInputChange('locationCity', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="locationState">State</Label>
                <Input
                  id="locationState"
                  value={formData.locationState}
                  onChange={(e) => handleInputChange('locationState', e.target.value)}
                  maxLength={2}
                  placeholder="TX"
                />
              </div>
            </CardContent>
          </Card>
          
          {/* Basic Info Buttons */}
          <div className="flex justify-between pt-6 border-t mt-6">
            <div>
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
            <div>
              <Button
                type="button"
                onClick={() => setActiveTab('parties')}
                className="flex items-center gap-2"
              >
                Next: Drivers & Equipment
                <Users className="h-4 w-4" />
              </Button>
            </div>
          </div>
          </div>
        </TabsContent>

        {/* Tab 2: Drivers & Equipment */}
        <TabsContent value="parties" className="h-full">
          <div className="p-6 space-y-6">
          {/* Driver Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Driver Selection</CardTitle>
              <CardDescription>Select primary driver and optional co-driver</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="primaryDriverId">Primary Driver <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="Search drivers..."
                  value={driverSearch}
                  onChange={(e) => setDriverSearch(e.target.value)}
                  className="mb-2"
                />
                <Select
                  value={formData.primaryDriverId}
                  onValueChange={(value) => handleInputChange('primaryDriverId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select primary driver" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDrivers
                      .filter(driver => 
                        driverSearch === '' || 
                        `${driver.firstName} ${driver.lastName}`.toLowerCase().includes(driverSearch.toLowerCase()) ||
                        driver.licenseNumber?.toLowerCase().includes(driverSearch.toLowerCase())
                      )
                      .map((driver) => (
                        <SelectItem key={driver.id} value={driver.id}>
                          {driver.firstName} {driver.lastName}
                          {driver.licenseNumber && ` - ${driver.licenseNumber}`}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isCoDriverPresent"
                  checked={formData.isCoDriverPresent}
                  onCheckedChange={(checked) => handleInputChange('isCoDriverPresent', checked)}
                />
                <Label htmlFor="isCoDriverPresent">Co-driver was present</Label>
              </div>
              
              {formData.isCoDriverPresent && (
                <div>
                  <Label htmlFor="coDriverId">Co-driver</Label>
                  <Select
                    value={formData.coDriverId}
                    onValueChange={(value) => handleInputChange('coDriverId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select co-driver" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDrivers
                        .filter(driver => 
                          driver.id !== formData.primaryDriverId &&
                          (driverSearch === '' || 
                           `${driver.firstName} ${driver.lastName}`.toLowerCase().includes(driverSearch.toLowerCase()) ||
                           driver.licenseNumber?.toLowerCase().includes(driverSearch.toLowerCase()))
                        )
                        .map((driver) => (
                          <SelectItem key={driver.id} value={driver.id}>
                            {driver.firstName} {driver.lastName}
                            {driver.licenseNumber && ` - ${driver.licenseNumber}`}
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Equipment Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Equipment Selection</CardTitle>
              <CardDescription>Select all equipment involved in the inspection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Available Equipment</Label>
                <Input
                  placeholder="Search equipment..."
                  value={equipmentSearch}
                  onChange={(e) => setEquipmentSearch(e.target.value)}
                  className="mb-2"
                />
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {availableEquipment
                    .filter(equipment =>
                      equipmentSearch === '' ||
                      `${equipment.make} ${equipment.model}`.toLowerCase().includes(equipmentSearch.toLowerCase()) ||
                      equipment.plateNumber?.toLowerCase().includes(equipmentSearch.toLowerCase()) ||
                      equipment.vinNumber?.toLowerCase().includes(equipmentSearch.toLowerCase())
                    )
                    .map((equipment) => (
                      <div key={equipment.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`equipment-${equipment.id}`}
                          checked={formData.selectedEquipmentIds.includes(equipment.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              handleInputChange('selectedEquipmentIds', [...formData.selectedEquipmentIds, equipment.id])
                            } else {
                              handleInputChange('selectedEquipmentIds', formData.selectedEquipmentIds.filter(id => id !== equipment.id))
                            }
                          }}
                        />
                        <Label htmlFor={`equipment-${equipment.id}`} className="text-sm">
                          {equipment.make} {equipment.model} ({equipment.year}) - {equipment.plateNumber}
                        </Label>
                      </div>
                    ))}
                </div>
              </div>
              
              {formData.selectedEquipmentIds.length > 0 && (
                <div>
                  <Label>Selected Equipment:</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.selectedEquipmentIds.map((equipmentId, index) => (
                      <Badge key={equipmentId} variant="secondary">
                        Unit {index + 1}: {getEquipmentName(equipmentId)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Drivers & Equipment Buttons */}
          <div className="flex justify-between pt-6 border-t mt-6">
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveTab('basic')}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Back: Basic Info
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
            <div>
              <Button
                type="button"
                onClick={() => setActiveTab('violations')}
                className="flex items-center gap-2"
              >
                Next: Violations
                <AlertTriangle className="h-4 w-4" />
              </Button>
            </div>
          </div>
          </div>
        </TabsContent>

        {/* Tab 3: Violations */}
        <TabsContent value="violations" className="h-full">
          <div className="p-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Violation Search & Entry</CardTitle>
              <CardDescription>Search and add violations found during inspection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="violationSearch">Search Violations</Label>
                <Input
                  id="violationSearch"
                  placeholder="Search by code (392.2) or description (brake)"
                  value={violationSearch}
                  onChange={(e) => setViolationSearch(e.target.value)}
                />
              </div>
              
              {availableViolations.length > 0 && (
                <div className="space-y-2">
                  {availableViolations.map((violation) => (
                    <div
                      key={violation.code}
                      className="flex items-center justify-between p-3 border rounded cursor-pointer hover:bg-gray-50"
                      onClick={() => addViolation(violation)}
                    >
                      <div>
                        <div className="font-medium">{violation.code}</div>
                        <div className="text-sm text-gray-600">{violation.description}</div>
                      </div>
                      <Badge variant={violation.severity === 'OUT_OF_SERVICE' ? 'destructive' : 'secondary'}>
                        {violation.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              {/* Selected Violations */}
              {formData.violations.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium">Selected Violations:</h4>
                  {formData.violations.map((violation) => (
                    <Card key={violation.id}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="font-medium">{violation.violationCode}</div>
                            <div className="text-sm text-gray-600">{violation.description}</div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeViolation(violation.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor={`comments-${violation.id}`}>Inspector Comments <span className="text-red-500">*</span></Label>
                            <Textarea
                              id={`comments-${violation.id}`}
                              placeholder="Required comments from inspector..."
                              value={violation.inspectorComments}
                              onChange={(e) => updateViolation(violation.id, 'inspectorComments', e.target.value)}
                              rows={2}
                            />
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`oos-${violation.id}`}
                              checked={violation.outOfService}
                              onCheckedChange={(checked) => updateViolation(violation.id, 'outOfService', checked)}
                            />
                            <Label htmlFor={`oos-${violation.id}`}>Out of Service</Label>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Violations Buttons */}
          <div className="flex justify-between pt-6 border-t mt-6">
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveTab('parties')}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Back: Drivers & Equipment
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
            <div>
              <Button
                type="button"
                onClick={() => setActiveTab('review')}
                className="flex items-center gap-2"
              >
                Next: Review
                <Shield className="h-4 w-4" />
              </Button>
            </div>
          </div>
          </div>
        </TabsContent>

        {/* Tab 4: Review */}
        <TabsContent value="review" className="h-full">
          <div className="p-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Inspection Summary</CardTitle>
              <CardDescription>Review all information before submission</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Inspection Date:</span>
                  <p>{formData.incidentDate ? format(new Date(formData.incidentDate), 'MMMM d, yyyy') : 'Not set'}</p>
                </div>
                <div>
                  <span className="font-medium">Inspector:</span>
                  <p>{formData.officerName || 'Not set'}</p>
                </div>
                <div>
                  <span className="font-medium">Primary Driver:</span>
                  <p>{formData.primaryDriverId ? getDriverName(formData.primaryDriverId) : 'Not selected'}</p>
                </div>
                <div>
                  <span className="font-medium">Co-driver:</span>
                  <p>{formData.isCoDriverPresent && formData.coDriverId ? getDriverName(formData.coDriverId) : 'None'}</p>
                </div>
              </div>
              
              <div>
                <span className="font-medium">Equipment ({formData.selectedEquipmentIds.length}):</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {formData.selectedEquipmentIds.map((equipmentId, index) => (
                    <Badge key={equipmentId} variant="outline">
                      Unit {index + 1}: {getEquipmentName(equipmentId)}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <span className="font-medium">Violations ({formData.violations.length}):</span>
                {formData.violations.length > 0 ? (
                  <div className="space-y-2 mt-2">
                    {formData.violations.map((violation) => (
                      <div key={violation.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{violation.violationCode} - {violation.description}</span>
                        {violation.outOfService && <Badge variant="destructive">OOS</Badge>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 mt-1">No violations recorded</p>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Review Buttons */}
          <div className="flex justify-between pt-6 border-t mt-6">
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveTab('violations')}
                className="flex items-center gap-2"
              >
                <AlertTriangle className="h-4 w-4" />
                Back: Violations
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
            <div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating Inspection...' : 'Create Inspection'}
              </Button>
            </div>
          </div>
          </div>
        </TabsContent>
        </Tabs>
      </div>

      
    </form>
  )
} 