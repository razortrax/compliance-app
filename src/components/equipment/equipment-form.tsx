"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Loader2, X } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from "@/lib/utils"

interface Equipment {
  id: string
  vehicleType: string
  make?: string | null
  model?: string | null
  year?: number | null
  vinNumber?: string | null
  plateNumber?: string | null
  registrationExpiry?: Date | null
  locationId?: string | null
  location?: { id: string; name: string } | null
}

interface Location {
  id: string
  name: string
}

interface EquipmentFormProps {
  organizationId: string
  equipment?: Equipment
  onSuccess: () => void
  onCancel: () => void
}

const VEHICLE_TYPES = [
  { value: 'TRUCK', label: 'Truck' },
  { value: 'TRAILER', label: 'Trailer' },
  { value: 'VAN', label: 'Van' },
  { value: 'BUS', label: 'Bus' },
  { value: 'PICKUP', label: 'Pickup Truck' },
  { value: 'CAR', label: 'Car' },
  { value: 'MOTORCYCLE', label: 'Motorcycle' },
  { value: 'OTHER', label: 'Other' }
]

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 50 }, (_, i) => CURRENT_YEAR - i)

export function EquipmentForm({ organizationId, equipment, onSuccess, onCancel }: EquipmentFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [locations, setLocations] = useState<Location[]>([])
  const [registrationExpiry, setRegistrationExpiry] = useState<Date>()
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  
  const [formData, setFormData] = useState({
    vehicleType: equipment?.vehicleType || 'TRUCK',
    make: equipment?.make || '',
    model: equipment?.model || '',
    year: equipment?.year?.toString() || '',
    vinNumber: equipment?.vinNumber || '',
    plateNumber: equipment?.plateNumber || '',
    locationId: equipment?.locationId || 'none'
  })

  // Load locations for this organization
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch(`/api/organizations/${organizationId}/locations`)
        if (response.ok) {
          const data = await response.json()
          setLocations(data)
        }
      } catch (error) {
        console.error('Error fetching locations:', error)
      }
    }

    fetchLocations()

    // Set initial registration expiry if editing
    if (equipment?.registrationExpiry) {
      setRegistrationExpiry(new Date(equipment.registrationExpiry))
    }
  }, [organizationId, equipment])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const payload = {
        ...formData,
        year: formData.year ? parseInt(formData.year) : null,
        registrationExpiry: registrationExpiry?.toISOString(),
        organizationId,
        // Convert "none" to null for locationId
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
      {/* Vehicle Information */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Information</CardTitle>
          <CardDescription>
            Basic details about the vehicle or equipment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vehicleType">Vehicle Type *</Label>
              <Select value={formData.vehicleType} onValueChange={(value) => handleInputChange('vehicleType', value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle type" />
                </SelectTrigger>
                <SelectContent>
                  {VEHICLE_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

          <div className="grid grid-cols-2 gap-4">
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
          </div>
        </CardContent>
      </Card>

      {/* Registration Information */}
      <Card>
        <CardHeader>
          <CardTitle>Registration & Identification</CardTitle>
          <CardDescription>
            Legal registration and identification numbers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vinNumber">VIN Number</Label>
              <Input
                id="vinNumber"
                value={formData.vinNumber}
                onChange={(e) => handleInputChange('vinNumber', e.target.value)}
                placeholder="17-character VIN"
                maxLength={17}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plateNumber">License Plate</Label>
              <Input
                id="plateNumber"
                value={formData.plateNumber}
                onChange={(e) => handleInputChange('plateNumber', e.target.value)}
                placeholder="ABC-1234"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Registration Expiry</Label>
            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !registrationExpiry && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {registrationExpiry ? format(registrationExpiry, "PPP") : "Pick expiry date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={registrationExpiry}
                  onSelect={(date: Date | undefined) => {
                    setRegistrationExpiry(date)
                    setIsDatePickerOpen(false)
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
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