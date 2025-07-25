"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { CalendarIcon, Plus, X, Loader2 } from 'lucide-react'
import { format } from 'date-fns'

interface Endorsement {
  code: string
  name: string
  expirationDate?: string | null
  renewalRequired?: boolean
  certificationNumber?: string
}

interface Restriction {
  code: string
  description: string
}

interface License {
  id: string
  licenseType: string
  licenseState: string
  licenseNumber: string
  certification: string
  startDate?: string | null
  expirationDate: string
  renewalDate?: string | null
  endorsements: Endorsement[]
  restrictions: Restriction[]
  notes?: string | null
  issue: {
    id: string
    title: string
    description?: string | null
    status: string
    priority: string
    party: {
      id: string
      person?: {
        firstName: string
        lastName: string
      } | null
      organization?: {
        name: string
      } | null
    }
  }
}

interface Organization {
  id: string
  name: string
  party: {
    id: string
  }
}

interface Person {
  id: string
  firstName: string
  lastName: string
  party: {
    id: string
  }
}

interface LicenseFormProps {
  license?: License
  driverId?: string // Auto-assign to this driver if provided
  organizationId?: string // Auto-assign to this organization if provided
  renewingLicense?: License // License being renewed (triggers renewal logic)
  onSuccess: () => void
  onCancel: () => void
}

const LICENSE_TYPES = [
  { value: 'CDL_A', label: 'CDL Class A' },
  { value: 'CDL_B', label: 'CDL Class B' },
  { value: 'CDL_C', label: 'CDL Class C' },
  { value: 'NON_CDL', label: 'Non-CDL License' },
  { value: 'CDL_PERMIT', label: 'CDL Permit' },
  { value: 'DOT_PHYSICAL', label: 'DOT Physical' },
  { value: 'LIABILITY_INSURANCE', label: 'Liability Insurance' },
  { value: 'DOT_REGISTRATION', label: 'DOT Registration' },
  { value: 'MC_AUTHORITY', label: 'Motor Carrier Authority' }
]

const CERTIFICATIONS = [
  { value: 'NonExcepted Interstate', label: 'Non-Excepted Interstate' },
  { value: 'Excepted Interstate', label: 'Excepted Interstate' },
  { value: 'NonExcepted IntraState', label: 'Non-Excepted Intrastate' },
  { value: 'Excepted Intrastate', label: 'Excepted Intrastate' },
  { value: 'Non', label: 'Non' }
]

const AVAILABLE_ENDORSEMENTS = [
  { code: 'H', name: 'Hazardous Materials', requiresExpiration: true },
  { code: 'P', name: 'Passengers', requiresExpiration: false },
  { code: 'S', name: 'School Bus', requiresExpiration: false },
  { code: 'N', name: 'Tanker', requiresExpiration: false },
  { code: 'T', name: 'Double/Triple Trailers', requiresExpiration: false },
  { code: 'X', name: 'Hazmat + Tanker', requiresExpiration: true },
  { code: 'M', name: 'Motorcycle', requiresExpiration: false }
]

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
]

export function LicenseForm({ license, driverId, organizationId, renewingLicense, onSuccess, onCancel }: LicenseFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  
  // Determine if this is a renewal workflow
  const isRenewal = !!renewingLicense
  const baseLicense = license || renewingLicense
  
  // For renewals: auto-populate dates based on renewal logic
  const getInitialDates = () => {
    if (isRenewal && renewingLicense) {
      const expirationDate = new Date(renewingLicense.expirationDate)
      const startDate = expirationDate // Start date = old license expiration
      const renewalDate = new Date() // Renewal date = today
      const newExpirationDate = new Date(startDate)
      newExpirationDate.setFullYear(startDate.getFullYear() + 1) // Expiration = start + 1 year
      
      return {
        startDate,
        renewalDate,
        expirationDate: newExpirationDate
      }
    }
    
    return {
      startDate: baseLicense?.startDate ? new Date(baseLicense.startDate) : null,
      renewalDate: baseLicense?.renewalDate ? new Date(baseLicense.renewalDate) : null,
      expirationDate: baseLicense?.expirationDate ? new Date(baseLicense.expirationDate) : null
    }
  }
  
  const initialDates = getInitialDates()
  
  // Form state
  const [formData, setFormData] = useState({
    licenseType: baseLicense?.licenseType || '',
    licenseState: baseLicense?.licenseState || '',
    licenseNumber: baseLicense?.licenseNumber || '',
    certification: baseLicense?.certification || '',
    startDate: initialDates.startDate as Date | null,
    expirationDate: initialDates.expirationDate as Date | null,
    renewalDate: initialDates.renewalDate as Date | null,
    notes: baseLicense?.notes || '',
    partyId: baseLicense?.issue.party.id || '',
    title: baseLicense?.issue.title || '',
    description: baseLicense?.issue.description || '',
    priority: baseLicense?.issue.priority || 'medium'
  })
  
  const [endorsements, setEndorsements] = useState<Endorsement[]>(baseLicense?.endorsements || [])
  const [selectedEndorsement, setSelectedEndorsement] = useState('')
  const [endorsementExpiration, setEndorsementExpiration] = useState<Date | null>(null)
  
  // Popover states
  const [isStartOpen, setIsStartOpen] = useState(false)
  const [isExpirationOpen, setIsExpirationOpen] = useState(false)
  const [isRenewalOpen, setIsRenewalOpen] = useState(false)
  const [isEndorsementExpirationOpen, setIsEndorsementExpirationOpen] = useState(false)

  useEffect(() => {
    fetchOrganizations()
  }, [])

  // Auto-assign to driver when driverId is provided
  useEffect(() => {
    if (driverId && !license) {
      fetchDriverAndAssign()
    }
  }, [driverId, license])

  const fetchDriverAndAssign = async () => {
    try {
      const response = await fetch(`/api/persons/${driverId}`)
      if (response.ok) {
        const driver = await response.json()
        setFormData(prev => ({
          ...prev,
          partyId: driver.party.id,
          title: `${driver.firstName} ${driver.lastName} License`,
          description: `License assigned to ${driver.firstName} ${driver.lastName}`
        }))
      }
    } catch (error) {
      console.error('Error fetching driver:', error)
    }
  }

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

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addEndorsement = () => {
    if (!selectedEndorsement) return
    
    const endorsementData = AVAILABLE_ENDORSEMENTS.find(e => e.code === selectedEndorsement)
    if (!endorsementData) return
    
    // Check if endorsement already exists
    if (endorsements.some(e => e.code === selectedEndorsement)) {
      alert('Endorsement already added')
      return
    }
    
    const newEndorsement: Endorsement = {
      code: selectedEndorsement,
      name: endorsementData.name,
      expirationDate: endorsementData.requiresExpiration && endorsementExpiration 
        ? endorsementExpiration.toISOString()
        : null,
      renewalRequired: endorsementData.requiresExpiration
    }
    
    setEndorsements(prev => [...prev, newEndorsement])
    setSelectedEndorsement('')
    setEndorsementExpiration(null)
  }

  const removeEndorsement = (code: string) => {
    setEndorsements(prev => prev.filter(e => e.code !== code))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.licenseType || !formData.licenseState || !formData.licenseNumber || 
        !formData.certification || !formData.expirationDate || !formData.partyId) {
      alert('Please fill in all required fields')
      return
    }
    
    setIsLoading(true)
    
    try {
      const requestData = {
        licenseType: formData.licenseType,
        licenseState: formData.licenseState,
        licenseNumber: formData.licenseNumber,
        certification: formData.certification,
        startDate: formData.startDate?.toISOString(),
        expirationDate: formData.expirationDate.toISOString(),
        renewalDate: formData.renewalDate?.toISOString(),
        endorsements,
        restrictions: [], // For now, keeping empty
        notes: formData.notes,
        partyId: formData.partyId,
        title: formData.title || `${formData.licenseType} - ${formData.licenseNumber}`,
        description: formData.description,
        priority: formData.priority,
        ...(isRenewal && { 
          // For renewals, only send minimal data - API will duplicate everything else
          previousLicenseId: renewingLicense?.id,
          startDate: formData.startDate?.toISOString(),
          expirationDate: formData.expirationDate.toISOString(),
          renewalDate: formData.renewalDate?.toISOString(),
          notes: formData.notes,
          title: formData.title,
          description: formData.description
        })
      }
      
      // For renewals, only send the minimal renewal data
      const finalRequestData = isRenewal ? {
        previousLicenseId: renewingLicense?.id,
        startDate: formData.startDate?.toISOString(),
        expirationDate: formData.expirationDate.toISOString(),
        renewalDate: formData.renewalDate?.toISOString(),
        notes: formData.notes,
        title: formData.title,
        description: formData.description
      } : requestData
      
      let url, method
      if (isRenewal) {
        // For renewals, use the renewal endpoint
        url = '/api/licenses/renew'
        method = 'POST'
      } else if (license) {
        // For edits, use PUT to existing license
        url = `/api/licenses/${license.id}`
        method = 'PUT'
      } else {
        // For new licenses, use POST
        url = '/api/licenses'
        method = 'POST'
      }
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalRequestData)
      })
      
      if (response.ok) {
        onSuccess()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error || 'Failed to save license'}`)
      }
    } catch (error) {
      console.error('Error saving license:', error)
      alert('An error occurred while saving. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Enter the core license details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="licenseType">License Type *</Label>
              <Select value={formData.licenseType} onValueChange={(value) => handleInputChange('licenseType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select license type" />
                </SelectTrigger>
                <SelectContent>
                  {LICENSE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="certification">Certification Type *</Label>
              <Select value={formData.certification} onValueChange={(value) => handleInputChange('certification', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select certification type" />
                </SelectTrigger>
                <SelectContent>
                  {CERTIFICATIONS.map((cert) => (
                    <SelectItem key={cert.value} value={cert.value}>
                      {cert.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="licenseState">Issuing State *</Label>
              <Select value={formData.licenseState} onValueChange={(value) => handleInputChange('licenseState', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="licenseNumber">License Number *</Label>
              <Input
                id="licenseNumber"
                value={formData.licenseNumber}
                onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                placeholder="Enter license number"
              />
            </div>
          </div>
          
        </CardContent>
      </Card>

      {/* Dates */}
      <Card>
        <CardHeader>
          <CardTitle>Important Dates</CardTitle>
          <CardDescription>Set start, expiration and renewal dates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover open={isStartOpen} onOpenChange={setIsStartOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.startDate ? format(formData.startDate, "PPP") : "Pick start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.startDate || undefined}
                    onSelect={(date) => {
                      handleInputChange('startDate', date || null)
                      setIsStartOpen(false)
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label>Expiration Date *</Label>
              <Popover open={isExpirationOpen} onOpenChange={setIsExpirationOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.expirationDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.expirationDate ? format(formData.expirationDate, "PPP") : "Pick expiration date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.expirationDate || undefined}
                    onSelect={(date) => {
                      handleInputChange('expirationDate', date || null)
                      setIsExpirationOpen(false)
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label>Renewal Date</Label>
              <Popover open={isRenewalOpen} onOpenChange={setIsRenewalOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.renewalDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.renewalDate ? format(formData.renewalDate, "PPP") : "Pick renewal date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.renewalDate || undefined}
                    onSelect={(date) => {
                      handleInputChange('renewalDate', date || null)
                      setIsRenewalOpen(false)
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Endorsements */}
      <Card>
        <CardHeader>
          <CardTitle>Endorsements</CardTitle>
          <CardDescription>Add license endorsements (H, P, S, etc.)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Endorsement */}
          <div className="flex gap-2">
            <Select value={selectedEndorsement} onValueChange={setSelectedEndorsement}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select endorsement" />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_ENDORSEMENTS.map((endorsement) => (
                  <SelectItem key={endorsement.code} value={endorsement.code}>
                    {endorsement.code} - {endorsement.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedEndorsement && AVAILABLE_ENDORSEMENTS.find(e => e.code === selectedEndorsement)?.requiresExpiration && (
              <Popover open={isEndorsementExpirationOpen} onOpenChange={setIsEndorsementExpirationOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-40">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endorsementExpiration ? format(endorsementExpiration, "MMM dd") : "Expiry"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endorsementExpiration || undefined}
                    onSelect={(date) => {
                      setEndorsementExpiration(date || null)
                      setIsEndorsementExpirationOpen(false)
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            )}
            
            <Button type="button" onClick={addEndorsement} disabled={!selectedEndorsement}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Current Endorsements */}
          {endorsements.length > 0 && (
            <div className="space-y-2">
              <Label>Current Endorsements</Label>
              <div className="flex flex-wrap gap-2">
                {endorsements.map((endorsement, index) => (
                  <Badge key={index} variant="outline" className="flex items-center gap-2">
                    {endorsement.code} - {endorsement.name}
                    {endorsement.expirationDate && (
                      <span className="text-xs">
                        (Exp: {format(new Date(endorsement.expirationDate), 'MMM yyyy')})
                      </span>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-red-100"
                      onClick={() => removeEndorsement(endorsement.code)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
          <CardDescription>Optional notes and details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="e.g., John Doe CDL License"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Optional description or additional details"
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes about this license"
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex items-center justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {license ? 'Update License' : 'Create License'}
        </Button>
      </div>
    </form>
  )
} 