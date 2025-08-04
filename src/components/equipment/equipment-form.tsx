"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, X } from 'lucide-react'

interface Equipment {
  id: string
  make?: string | null
  model?: string | null
  year?: number | null
  vin?: string | null
  
  // Status and classification
  statusId?: string | null
  status?: { id: string; label: string } | null
  
  // Weight specifications
  eqpWeightGross?: number | null
  eqpWeightGrossRating?: number | null
  eqpWeightGrossTagged?: number | null
  
  // Fuel and engine information
  fuelTypeId?: string | null
  fuelType?: { id: string; label: string } | null
  engineModel?: string | null
  engineDisplacement?: string | null
  driveType?: string | null
  dateOfManufacture?: string | null
  countCylinders?: number | null
  
  // Physical characteristics
  countAxles?: number | null
  colorId?: string | null
  color?: { id: string; label: string } | null
  tireSize?: string | null
  
  // Usage tracking
  startMileage?: number | null
  startDate?: string | null
  retireMileage?: number | null
  retireDate?: string | null
  
  // Vehicle classification
  vehicleTypeId?: string | null
  vehicleType?: { id: string; label: string } | null
  
  // Ownership information
  ownershipTypeId?: string | null
  ownershipType?: { id: string; label: string } | null
  
  // Category
  categoryId?: string | null
  category?: { id: string; label: string } | null
  
  // Location assignment
  locationId?: string | null
  location?: { id: string; name: string } | null
}

interface Location {
  id: string
  name: string
}

interface EnumOption {
  id: string
  code: string
  label: string
}

interface EquipmentFormProps {
  organizationId: string
  equipment?: Equipment
  onSuccess: () => void
  onCancel: () => void
}

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 50 }, (_, i) => CURRENT_YEAR - i)

export function EquipmentForm({ organizationId, equipment, onSuccess, onCancel }: EquipmentFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [locations, setLocations] = useState<Location[]>([])
  
  // Enum options
  const [statusOptions, setStatusOptions] = useState<EnumOption[]>([])
  const [fuelTypeOptions, setFuelTypeOptions] = useState<EnumOption[]>([])
  const [vehicleTypeOptions, setVehicleTypeOptions] = useState<EnumOption[]>([])
  const [colorOptions, setColorOptions] = useState<EnumOption[]>([])
  const [ownershipTypeOptions, setOwnershipTypeOptions] = useState<EnumOption[]>([])
  const [categoryOptions, setCategoryOptions] = useState<EnumOption[]>([])
  
  const [formData, setFormData] = useState({
    // Basic Information
    make: equipment?.make || '',
    model: equipment?.model || '',
    year: equipment?.year?.toString() || '',
    vin: equipment?.vin || '',
    
    // Status and Classification
    statusId: equipment?.statusId || '',
    categoryId: equipment?.categoryId || '',
    vehicleTypeId: equipment?.vehicleTypeId || '',
    ownershipTypeId: equipment?.ownershipTypeId || '',
    
    // Weight Specifications (in pounds)
    eqpWeightGross: equipment?.eqpWeightGross?.toString() || '',
    eqpWeightGrossRating: equipment?.eqpWeightGrossRating?.toString() || '',
    eqpWeightGrossTagged: equipment?.eqpWeightGrossTagged?.toString() || '',
    
    // Engine and Fuel
    fuelTypeId: equipment?.fuelTypeId || '',
    engineModel: equipment?.engineModel || '',
    engineDisplacement: equipment?.engineDisplacement || '',
    driveType: equipment?.driveType || '',
    countCylinders: equipment?.countCylinders?.toString() || '',
    dateOfManufacture: equipment?.dateOfManufacture ? equipment.dateOfManufacture.split('T')[0] : '',
    
    // Physical Characteristics
    countAxles: equipment?.countAxles?.toString() || '',
    colorId: equipment?.colorId || '',
    tireSize: equipment?.tireSize || '',
    
    // Usage Tracking
    startMileage: equipment?.startMileage?.toString() || '',
    startDate: equipment?.startDate ? equipment.startDate.split('T')[0] : '',
    retireMileage: equipment?.retireMileage?.toString() || '',
    retireDate: equipment?.retireDate ? equipment.retireDate.split('T')[0] : '',
    
    // Location Assignment
    locationId: equipment?.locationId || 'none'
  })

  // Load all options
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch locations
        const locationsResponse = await fetch(`/api/organizations/${organizationId}/locations`)
        if (locationsResponse.ok) {
          const locationsData = await locationsResponse.json()
          setLocations(locationsData)
        }

        // Fetch enum options (system defaults + org-specific)
        const enumPromises = [
          fetch('/api/equipment/enums/status').then(r => r.json()),
          fetch('/api/equipment/enums/fuel-types').then(r => r.json()),
          fetch('/api/equipment/enums/vehicle-types').then(r => r.json()),
          fetch('/api/equipment/enums/colors').then(r => r.json()),
          fetch('/api/equipment/enums/ownership-types').then(r => r.json()),
          fetch('/api/equipment/enums/categories').then(r => r.json())
        ]

        const [statuses, fuelTypes, vehicleTypes, colors, ownershipTypes, categories] = await Promise.all(enumPromises)
        
        setStatusOptions(statuses)
        setFuelTypeOptions(fuelTypes)
        setVehicleTypeOptions(vehicleTypes)
        setColorOptions(colors)
        setOwnershipTypeOptions(ownershipTypes)
        setCategoryOptions(categories)
      } catch (error) {
        console.error('Error fetching form data:', error)
      }
    }

    fetchData()
  }, [organizationId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const payload = {
        // Basic Information
        make: formData.make || null,
        model: formData.model || null,
        year: formData.year ? parseInt(formData.year) : null,
        vin: formData.vin || null,
        
        // Status and Classification
        statusId: formData.statusId || null,
        categoryId: formData.categoryId || null,
        vehicleTypeId: formData.vehicleTypeId || null,
        ownershipTypeId: formData.ownershipTypeId || null,
        
        // Weight Specifications
        eqpWeightGross: formData.eqpWeightGross ? parseInt(formData.eqpWeightGross) : null,
        eqpWeightGrossRating: formData.eqpWeightGrossRating ? parseInt(formData.eqpWeightGrossRating) : null,
        eqpWeightGrossTagged: formData.eqpWeightGrossTagged ? parseInt(formData.eqpWeightGrossTagged) : null,
        
        // Engine and Fuel
        fuelTypeId: formData.fuelTypeId || null,
        engineModel: formData.engineModel || null,
        engineDisplacement: formData.engineDisplacement || null,
        driveType: formData.driveType || null,
        countCylinders: formData.countCylinders ? parseInt(formData.countCylinders) : null,
        dateOfManufacture: formData.dateOfManufacture || null,
        
        // Physical Characteristics
        countAxles: formData.countAxles ? parseInt(formData.countAxles) : null,
        colorId: formData.colorId || null,
        tireSize: formData.tireSize || null,
        
        // Usage Tracking
        startMileage: formData.startMileage ? parseInt(formData.startMileage) : null,
        startDate: formData.startDate || null,
        retireMileage: formData.retireMileage ? parseInt(formData.retireMileage) : null,
        retireDate: formData.retireDate || null,
        
        // Organization and Location
        organizationId,
        locationId: formData.locationId === 'none' ? null : formData.locationId
      }

      const url = equipment ? `/api/equipment/${equipment.id}` : '/api/equipment'
      const method = equipment ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        onSuccess()
      } else {
        const error = await response.json()
        console.error('Error saving equipment:', error)
        alert(`Error: ${error.error || 'Failed to save equipment'}`)
      }
    } catch (error) {
      console.error('Error saving equipment:', error)
      alert('An error occurred while saving. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Essential equipment identification details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="make">Make</Label>
              <Input
                id="make"
                value={formData.make}
                onChange={(e) => handleInputChange('make', e.target.value)}
                placeholder="Ford, Freightliner, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => handleInputChange('model', e.target.value)}
                placeholder="F-150, Cascadia, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Select value={formData.year} onValueChange={(value) => handleInputChange('year', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vin">VIN Number</Label>
            <Input
              id="vin"
              value={formData.vin}
              onChange={(e) => handleInputChange('vin', e.target.value)}
              placeholder="17-character VIN"
              maxLength={17}
            />
          </div>
        </CardContent>
      </Card>

      {/* Status and Classification */}
      <Card>
        <CardHeader>
          <CardTitle>Status & Classification</CardTitle>
          <CardDescription>
            Equipment status, category, and type information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="statusId">Status</Label>
              <Select value={formData.statusId} onValueChange={(value) => handleInputChange('statusId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(status => (
                    <SelectItem key={status.id} value={status.id}>{status.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryId">Category</Label>
              <Select value={formData.categoryId} onValueChange={(value) => handleInputChange('categoryId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map(category => (
                    <SelectItem key={category.id} value={category.id}>{category.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vehicleTypeId">Vehicle Type</Label>
              <Select value={formData.vehicleTypeId} onValueChange={(value) => handleInputChange('vehicleTypeId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle type" />
                </SelectTrigger>
                <SelectContent>
                  {vehicleTypeOptions.map(type => (
                    <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownershipTypeId">Ownership Type</Label>
              <Select value={formData.ownershipTypeId} onValueChange={(value) => handleInputChange('ownershipTypeId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select ownership type" />
                </SelectTrigger>
                <SelectContent>
                  {ownershipTypeOptions.map(ownership => (
                    <SelectItem key={ownership.id} value={ownership.id}>{ownership.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weight Specifications */}
      <Card>
        <CardHeader>
          <CardTitle>Weight Specifications</CardTitle>
          <CardDescription>
            Equipment weight ratings (in pounds)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="eqpWeightGross">Gross Weight</Label>
              <Input
                id="eqpWeightGross"
                type="number"
                value={formData.eqpWeightGross}
                onChange={(e) => handleInputChange('eqpWeightGross', e.target.value)}
                placeholder="Weight in pounds"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eqpWeightGrossRating">Gross Weight Rating</Label>
              <Input
                id="eqpWeightGrossRating"
                type="number"
                value={formData.eqpWeightGrossRating}
                onChange={(e) => handleInputChange('eqpWeightGrossRating', e.target.value)}
                placeholder="Rating in pounds"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eqpWeightGrossTagged">Gross Weight Tagged</Label>
              <Input
                id="eqpWeightGrossTagged"
                type="number"
                value={formData.eqpWeightGrossTagged}
                onChange={(e) => handleInputChange('eqpWeightGrossTagged', e.target.value)}
                placeholder="Tagged weight in pounds"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Engine & Fuel Information */}
      <Card>
        <CardHeader>
          <CardTitle>Engine & Fuel Information</CardTitle>
          <CardDescription>
            Engine specifications and fuel details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fuelTypeId">Fuel Type</Label>
              <Select value={formData.fuelTypeId} onValueChange={(value) => handleInputChange('fuelTypeId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select fuel type" />
                </SelectTrigger>
                <SelectContent>
                  {fuelTypeOptions.map(fuel => (
                    <SelectItem key={fuel.id} value={fuel.id}>{fuel.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="engineModel">Engine Model</Label>
              <Input
                id="engineModel"
                value={formData.engineModel}
                onChange={(e) => handleInputChange('engineModel', e.target.value)}
                placeholder="Engine model/series"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="engineDisplacement">Engine Displacement</Label>
              <Input
                id="engineDisplacement"
                value={formData.engineDisplacement}
                onChange={(e) => handleInputChange('engineDisplacement', e.target.value)}
                placeholder="e.g., 6.7L, 455 cu in"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="countCylinders">Number of Cylinders</Label>
              <Input
                id="countCylinders"
                type="number"
                value={formData.countCylinders}
                onChange={(e) => handleInputChange('countCylinders', e.target.value)}
                placeholder="e.g., 6, 8"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="driveType">Drive Type</Label>
              <Input
                id="driveType"
                value={formData.driveType}
                onChange={(e) => handleInputChange('driveType', e.target.value)}
                placeholder="AWD, FWD, RWD, 4WD"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateOfManufacture">Date of Manufacture</Label>
            <Input
              id="dateOfManufacture"
              type="date"
              value={formData.dateOfManufacture}
              onChange={(e) => handleInputChange('dateOfManufacture', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Physical Characteristics */}
      <Card>
        <CardHeader>
          <CardTitle>Physical Characteristics</CardTitle>
          <CardDescription>
            Physical attributes and specifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="colorId">Color</Label>
              <Select value={formData.colorId} onValueChange={(value) => handleInputChange('colorId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select color" />
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map(color => (
                    <SelectItem key={color.id} value={color.id}>{color.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="countAxles">Number of Axles</Label>
              <Input
                id="countAxles"
                type="number"
                value={formData.countAxles}
                onChange={(e) => handleInputChange('countAxles', e.target.value)}
                placeholder="e.g., 2, 3, 5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tireSize">Tire Size</Label>
              <Input
                id="tireSize"
                value={formData.tireSize}
                onChange={(e) => handleInputChange('tireSize', e.target.value)}
                placeholder="e.g., 225/70R19.5"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Tracking */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Tracking</CardTitle>
          <CardDescription>
            Service dates and mileage information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startMileage">Start Mileage</Label>
              <Input
                id="startMileage"
                type="number"
                value={formData.startMileage}
                onChange={(e) => handleInputChange('startMileage', e.target.value)}
                placeholder="Starting odometer reading"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="retireDate">Retire Date</Label>
              <Input
                id="retireDate"
                type="date"
                value={formData.retireDate}
                onChange={(e) => handleInputChange('retireDate', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="retireMileage">Retire Mileage</Label>
              <Input
                id="retireMileage"
                type="number"
                value={formData.retireMileage}
                onChange={(e) => handleInputChange('retireMileage', e.target.value)}
                placeholder="Final odometer reading"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location Assignment */}
      <Card>
        <CardHeader>
          <CardTitle>Location Assignment</CardTitle>
          <CardDescription>
            Assign equipment to a specific location
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="locationId">Assigned Location</Label>
            <Select value={formData.locationId} onValueChange={(value) => handleInputChange('locationId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select location (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No specific location</SelectItem>
                {locations.map(location => (
                  <SelectItem key={location.id} value={location.id}>{location.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex items-center justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {equipment ? 'Updating...' : 'Adding...'}
            </>
          ) : (
            <>
              {equipment ? 'Update Equipment' : 'Add Equipment'}
            </>
          )}
        </Button>
      </div>
    </form>
  )
} 