"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, X, Loader2 } from 'lucide-react'
import { format } from 'date-fns'

interface Training {
  id: string
  trainingType: string
  provider?: string
  instructor?: string
  location?: string
  startDate?: string
  completionDate: string
  expirationDate: string
  certificateNumber?: string
  hours?: number
  isRequired: boolean
  competencies?: any[]
  issue: {
    id: string
    title: string
    party: {
      id: string
    }
  }
  category: string
  expirationPeriodMonths?: number
}

interface TrainingFormProps {
  personId: string
  onSubmit: (data: any) => void
  onCancel: () => void
  isSubmitting?: boolean
  initialData?: any
  renewingTraining?: Training | null
}

// Training types organized by category
const TRAINING_TYPES = {
  MANDATORY_DOT: [
    'HazMat Annual',
    'HazMat Initial', 
    'HazMat Security Threat Assessment',
    'HazMat Endorsement Renewal',
    'Passenger Endorsement',
    'School Bus Endorsement'
  ],
  MANDATORY_ORG: [
    'Company Safety Orientation',
    'Equipment Training',
    'Route Familiarization',
    'Customer Service',
    'Load Securement',
    'Cargo Handling'
  ],
  VOLUNTARY: [
    'Defensive Driving',
    'First Aid/CPR',
    'DOT Physical Compliance',
    'Vehicle Inspection',
    'Hours of Service',
    'Drug and Alcohol Awareness',
    'Safety Training',
    'Professional Development',
    'Other'
  ]
}

// Auto-calculate expiration based on training type and category
const calculateExpiration = (trainingType: string, category: string, completionDate: Date, customMonths?: number) => {
  const expiration = new Date(completionDate)
  
  if (category === 'MANDATORY_DOT') {
    // DOT HazMat training has 2-year expiration
    if (trainingType.toLowerCase().includes('hazmat')) {
      expiration.setFullYear(completionDate.getFullYear() + 2)
    } else {
      // Other DOT training typically 1 year
      expiration.setFullYear(completionDate.getFullYear() + 1)
    }
  } else if (category === 'MANDATORY_ORG') {
    // Organization-defined training uses custom period
    if (customMonths) {
      expiration.setMonth(completionDate.getMonth() + customMonths)
    } else {
      // Default to 1 year if no custom period set
      expiration.setFullYear(completionDate.getFullYear() + 1)
    }
  } else if (category === 'VOLUNTARY') {
    // Voluntary training can have optional expiration
    // Return null for no expiration, or calculated date if specified
    return null // No expiration for voluntary by default
  }
  
  return expiration
}

export function TrainingForm({ personId, onSubmit, onCancel, isSubmitting = false, initialData, renewingTraining }: TrainingFormProps) {
  const isEditing = !!initialData
  const isRenewal = !!renewingTraining
  const baseTraining = initialData || renewingTraining

  // Calculate default dates and expiration
  const getInitialDates = () => {
    const today = new Date()
    
    if (isRenewal && renewingTraining) {
      return {
        completionDate: today,
        expirationDate: null // Will be calculated based on category
      }
    } else {
      return {
        completionDate: today,
        expirationDate: null
      }
    }
  }

  const initialDates = getInitialDates()

  const [formData, setFormData] = useState({
    trainingType: baseTraining?.trainingType || '',
    category: baseTraining?.category || 'VOLUNTARY',
    provider: baseTraining?.provider || '',
    instructor: baseTraining?.instructor || '',
    location: baseTraining?.location || '',
    startDate: baseTraining?.startDate ? new Date(baseTraining.startDate) : undefined as Date | undefined,
    completionDate: baseTraining?.completionDate ? new Date(baseTraining.completionDate) : initialDates.completionDate,
    expirationDate: baseTraining?.expirationDate ? new Date(baseTraining.expirationDate) : undefined as Date | undefined,
    expirationPeriodMonths: baseTraining?.expirationPeriodMonths || null,
    certificateNumber: baseTraining?.certificateNumber || '',
    hours: baseTraining?.hours || 0,
    isRequired: baseTraining?.isRequired || false,
    hasExpiration: baseTraining?.expirationDate ? true : false,
    personId: personId || ''
  })

  // Auto-calculate expiration when completion date or category changes
  useEffect(() => {
    if (formData.completionDate && formData.category && formData.hasExpiration) {
      const calculatedExpiration = calculateExpiration(
        formData.trainingType, 
        formData.category, 
        formData.completionDate,
        formData.expirationPeriodMonths || undefined
      )
      
      if (calculatedExpiration) {
        setFormData(prev => ({
          ...prev,
          expirationDate: calculatedExpiration
        }))
      }
    }
  }, [formData.completionDate, formData.category, formData.trainingType, formData.expirationPeriodMonths, formData.hasExpiration])

  // Auto-set category when training type is selected
  useEffect(() => {
    if (formData.trainingType) {
      let detectedCategory = 'VOLUNTARY'
      
      // Check if it's DOT mandatory training
      if (TRAINING_TYPES.MANDATORY_DOT.includes(formData.trainingType)) {
        detectedCategory = 'MANDATORY_DOT'
      } else if (TRAINING_TYPES.MANDATORY_ORG.includes(formData.trainingType)) {
        detectedCategory = 'MANDATORY_ORG'
      }
      
      setFormData(prev => ({
        ...prev,
        category: detectedCategory,
        isRequired: detectedCategory !== 'VOLUNTARY'
      }))
    }
  }, [formData.trainingType])

  const [competencies, setCompetencies] = useState<string[]>(
    baseTraining?.competencies ? baseTraining.competencies.map((c: any) => c.name || c) : []
  )
  const [newCompetency, setNewCompetency] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.trainingType || !formData.completionDate || !formData.personId) {
      alert('Please fill in all required fields')
      return
    }

    // For mandatory training, expiration is required
    if ((formData.category === 'MANDATORY_DOT' || formData.category === 'MANDATORY_ORG') && !formData.expirationDate) {
      alert('Expiration date is required for mandatory training')
      return
    }
    
    const requestData = {
      trainingType: formData.trainingType,
      category: formData.category,
      provider: formData.provider,
      instructor: formData.instructor,
      location: formData.location,
      startDate: formData.startDate?.toISOString(),
      completionDate: formData.completionDate.toISOString(),
      expirationDate: formData.expirationDate?.toISOString() || undefined,
      expirationPeriodMonths: formData.expirationPeriodMonths,
      certificateNumber: formData.certificateNumber,
      hours: formData.hours || undefined,
      isRequired: formData.isRequired,
      competencies: competencies.map(c => ({ name: c })),
      personId: formData.personId, // Using personId for cleaner API
      title: `${formData.trainingType} Training`,
      ...(isRenewal && { 
        previousTrainingId: renewingTraining?.id 
      })
    }
    
    // Call parent's onSubmit function - parent handles the API call
    onSubmit(requestData)
  }

  const addCompetency = () => {
    if (newCompetency.trim() && !competencies.includes(newCompetency.trim())) {
      setCompetencies([...competencies, newCompetency.trim()])
      setNewCompetency('')
    }
  }

  const removeCompetency = (index: number) => {
    setCompetencies(competencies.filter((_, i) => i !== index))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Training Information</CardTitle>
          <CardDescription>
            {isRenewal ? 'Renew existing training record' : isEditing ? 'Edit training record' : 'Add new training record'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Training Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Training Category <span className="text-red-500">*</span></Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MANDATORY_DOT">
                    DOT Mandatory
                    <Badge variant="destructive" className="ml-2 text-xs">Required</Badge>
                  </SelectItem>
                  <SelectItem value="MANDATORY_ORG">
                    Organization Mandatory
                    <Badge variant="outline" className="ml-2 text-xs">Required</Badge>
                  </SelectItem>
                  <SelectItem value="VOLUNTARY">
                    Voluntary Training
                    <Badge variant="secondary" className="ml-2 text-xs">Optional</Badge>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Training Type */}
            <div className="space-y-2">
                              <Label htmlFor="trainingType">Training Type <span className="text-red-500">*</span></Label>
              <Select
                value={formData.trainingType}
                onValueChange={(value) => setFormData({ ...formData, trainingType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select training type" />
                </SelectTrigger>
                <SelectContent>
                  {TRAINING_TYPES[formData.category as keyof typeof TRAINING_TYPES]?.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                      {type.toLowerCase().includes('hazmat') && (
                        <Badge variant="destructive" className="ml-2 text-xs">2 yr</Badge>
                      )}
                    </SelectItem>
                  )) || []}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Custom Expiration Period for Org Mandatory */}
          {formData.category === 'MANDATORY_ORG' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expirationPeriodMonths">Custom Expiration Period (Months)</Label>
                <Input
                  id="expirationPeriodMonths"
                  type="number"
                  min="1"
                  max="60"
                  value={formData.expirationPeriodMonths || ''}
                  onChange={(e) => setFormData({ ...formData, expirationPeriodMonths: parseInt(e.target.value) || null })}
                  placeholder="e.g., 12 for 1 year"
                />
              </div>
              <div className="space-y-2 flex items-center">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasExpiration"
                    checked={formData.hasExpiration}
                    onCheckedChange={(checked) => setFormData({ ...formData, hasExpiration: !!checked })}
                  />
                  <Label htmlFor="hasExpiration" className="text-sm font-medium">
                    Has Expiration Date
                  </Label>
                </div>
              </div>
            </div>
          )}

          {/* Voluntary Training Expiration Option */}
          {formData.category === 'VOLUNTARY' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 flex items-center">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasExpiration"
                    checked={formData.hasExpiration}
                    onCheckedChange={(checked) => setFormData({ ...formData, hasExpiration: !!checked })}
                  />
                  <Label htmlFor="hasExpiration" className="text-sm font-medium">
                    Set Expiration Date (Optional)
                  </Label>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Provider */}
            <div className="space-y-2">
              <Label htmlFor="provider">Training Provider</Label>
              <Input
                id="provider"
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                placeholder="e.g., Smith Safety Training"
              />
            </div>

            {/* Instructor */}
            <div className="space-y-2">
              <Label htmlFor="instructor">Instructor</Label>
              <Input
                id="instructor"
                value={formData.instructor}
                onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                placeholder="Instructor name"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Training Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Company facility, Online"
              />
            </div>

            {/* Certificate Number */}
            <div className="space-y-2">
              <Label htmlFor="certificateNumber">Certificate Number</Label>
              <Input
                id="certificateNumber"
                value={formData.certificateNumber}
                onChange={(e) => setFormData({ ...formData, certificateNumber: e.target.value })}
                placeholder="Certificate or completion number"
              />
            </div>
          </div>

          {/* Training Hours */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hours">Training Hours</Label>
              <Input
                id="hours"
                type="number"
                step="0.5"
                min="0"
                value={formData.hours}
                onChange={(e) => setFormData({ ...formData, hours: parseFloat(e.target.value) || 0 })}
                placeholder="Hours completed"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dates Card */}
      <Card>
        <CardHeader>
          <CardTitle>Training Dates</CardTitle>
          <CardDescription>
            Set training completion and expiration dates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {/* Start Date */}
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate ? format(new Date(formData.startDate), 'yyyy-MM-dd') : ''}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : undefined
                  setFormData({ ...formData, startDate: date })
                }}
              />
            </div>

            {/* Completion Date */}
            <div className="space-y-2">
              <Label htmlFor="completionDate">Completion Date <span className="text-red-500">*</span></Label>
              <Input
                id="completionDate"
                type="date"
                value={formData.completionDate ? format(new Date(formData.completionDate), 'yyyy-MM-dd') : ''}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : undefined
                  setFormData({ ...formData, completionDate: date })
                }}
                required
              />
            </div>

            {/* Expiration Date - Conditional */}
            {(formData.category === 'MANDATORY_DOT' || formData.category === 'MANDATORY_ORG' || formData.hasExpiration) && (
              <div className="space-y-2">
                <Label>
                  Expiration Date 
                  {(formData.category === 'MANDATORY_DOT' || formData.category === 'MANDATORY_ORG') && (
                    <span className="text-red-500">*</span>
                  )}
                  {formData.category === 'MANDATORY_DOT' && formData.trainingType.toLowerCase().includes('hazmat') && (
                    <Badge variant="secondary" className="ml-2 text-xs">Auto: 2 years</Badge>
                  )}
                  {formData.category === 'MANDATORY_ORG' && formData.expirationPeriodMonths && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      Auto: {formData.expirationPeriodMonths} months
                    </Badge>
                  )}
                </Label>
                <Input
                  id="expirationDate"
                  type="date"
                  value={formData.expirationDate ? format(new Date(formData.expirationDate), 'yyyy-MM-dd') : ''}
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : undefined
                    setFormData({ ...formData, expirationDate: date })
                  }}
                />
              </div>
            )}

            {/* No Expiration Message for Voluntary */}
            {formData.category === 'VOLUNTARY' && !formData.hasExpiration && (
              <div className="space-y-2">
                <Label className="text-gray-500">Expiration Date</Label>
                <div className="p-3 bg-gray-50 rounded-md border-dashed border-2">
                  <p className="text-sm text-gray-600 text-center">
                    ✓ No expiration date set - this is voluntary training
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Competencies Card */}
      <Card>
        <CardHeader>
          <CardTitle>Competencies & Skills</CardTitle>
          <CardDescription>
            Track specific skills or topics covered in this training
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newCompetency}
              onChange={(e) => setNewCompetency(e.target.value)}
              placeholder="Add a competency or skill"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCompetency())}
            />
            <Button type="button" onClick={addCompetency} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          {competencies.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {competencies.map((competency, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {competency}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeCompetency(index)}
                  />
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isRenewal ? 'Renew Training' : isEditing ? 'Update Training' : 'Add Training'}
        </Button>
      </div>
    </form>
  )
} 