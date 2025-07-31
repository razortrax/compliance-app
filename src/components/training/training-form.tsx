"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { CalendarIcon, Plus, X, Loader2 } from 'lucide-react'
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
}

interface TrainingFormProps {
  training?: Training | null
  renewingTraining?: Training | null
  driverId?: string
  onSuccess: (training: any) => void
  onCancel: () => void
}

// Training types with focus on DOT mandatory training
const TRAINING_TYPES = [
  // DOT Required Training
  'HazMat Annual',
  'HazMat Initial',
  'HazMat Security Threat Assessment',
  // Common Voluntary Training
  'Defensive Driving',
  'First Aid/CPR',
  'DOT Physical Compliance',
  'Vehicle Inspection',
  'Hours of Service',
  'Drug and Alcohol Awareness',
  'Safety Training',
  'Customer Service',
  'Other'
]

export function TrainingForm({ training, renewingTraining, driverId, onSuccess, onCancel }: TrainingFormProps) {
  const isEditing = !!training
  const isRenewal = !!renewingTraining
  const baseTraining = training || renewingTraining

  // Calculate default dates
  const getInitialDates = () => {
    const today = new Date()
    
    if (isRenewal && renewingTraining) {
      // For renewals, suggest completion today and expiration based on training type
      const expirationDate = new Date(today)
      
      // For HazMat training, add 2 years (DOT requirement)
      if (renewingTraining.trainingType.toLowerCase().includes('hazmat')) {
        expirationDate.setFullYear(today.getFullYear() + 2)
      } else {
        // Default to 1 year for other training
        expirationDate.setFullYear(today.getFullYear() + 1)
      }
      
      return {
        completionDate: today,
        expirationDate
      }
    } else {
      // For new training, default expiration depends on type
      const expirationDate = new Date(today)
      expirationDate.setFullYear(today.getFullYear() + 1) // Default 1 year
      
      return {
        completionDate: today,
        expirationDate
      }
    }
  }

  const initialDates = getInitialDates()

  const [formData, setFormData] = useState({
    trainingType: baseTraining?.trainingType || '',
    provider: baseTraining?.provider || '',
    instructor: baseTraining?.instructor || '',
    location: baseTraining?.location || '',
    startDate: baseTraining?.startDate ? new Date(baseTraining.startDate) : undefined as Date | undefined,
    completionDate: baseTraining?.completionDate ? new Date(baseTraining.completionDate) : initialDates.completionDate,
    expirationDate: baseTraining?.expirationDate ? new Date(baseTraining.expirationDate) : initialDates.expirationDate,
    certificateNumber: baseTraining?.certificateNumber || '',
    hours: baseTraining?.hours || 0,
    isRequired: baseTraining?.isRequired || false,
    partyId: baseTraining?.issue?.party?.id || driverId || ''
  })

  const [competencies, setCompetencies] = useState<string[]>(
    baseTraining?.competencies ? baseTraining.competencies.map(c => c.name || c) : []
  )
  const [newCompetency, setNewCompetency] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Update expiration date when training type changes (for new training)
  useEffect(() => {
    if (!isEditing && formData.trainingType) {
      const isHazmat = formData.trainingType.toLowerCase().includes('hazmat')
      const yearsToAdd = isHazmat ? 2 : 1 // HazMat = 2 years, others = 1 year
      
      const newExpiration = new Date(formData.completionDate)
      newExpiration.setFullYear(newExpiration.getFullYear() + yearsToAdd)
      
      setFormData(prev => ({
        ...prev,
        expirationDate: newExpiration
      }))
    }
  }, [formData.trainingType, formData.completionDate, isEditing])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.trainingType || !formData.completionDate || !formData.expirationDate || !formData.partyId) {
      alert('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    
    try {
      const requestData = {
        trainingType: formData.trainingType,
        provider: formData.provider,
        instructor: formData.instructor,
        location: formData.location,
        startDate: formData.startDate?.toISOString(),
        completionDate: formData.completionDate.toISOString(),
        expirationDate: formData.expirationDate.toISOString(),
        certificateNumber: formData.certificateNumber,
        hours: formData.hours || undefined,
        isRequired: formData.isRequired,
        competencies: competencies.map(c => ({ name: c })),
        partyId: formData.partyId,
        title: `${formData.trainingType} Training`,
        ...(isRenewal && { 
          previousTrainingId: renewingTraining?.id 
        })
      }
      
      // For renewals, use minimal renewal data
      const finalRequestData = isRenewal ? {
        previousTrainingId: renewingTraining?.id,
        startDate: formData.startDate?.toISOString(),
        completionDate: formData.completionDate.toISOString(),
        expirationDate: formData.expirationDate.toISOString(),
        certificateNumber: formData.certificateNumber,
        hours: formData.hours
      } : requestData

      const url = isRenewal 
        ? '/api/trainings/renew'
        : isEditing 
          ? `/api/trainings/${training?.id}`
          : '/api/trainings'
      
      const method = isEditing ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(finalRequestData),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to ${isRenewal ? 'renew' : isEditing ? 'update' : 'create'} training: ${errorText}`)
      }

      const result = await response.json()
      onSuccess(result)
    } catch (error) {
      console.error('Error submitting training:', error)
      alert(error instanceof Error ? error.message : 'An error occurred while saving the training')
    } finally {
      setIsSubmitting(false)
    }
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
                  {TRAINING_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                      {type.toLowerCase().includes('hazmat') && (
                        <Badge variant="destructive" className="ml-2 text-xs">DOT Required</Badge>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* DOT Required Checkbox */}
            <div className="space-y-2 flex items-center">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isRequired"
                  checked={formData.isRequired}
                  onCheckedChange={(checked) => setFormData({ ...formData, isRequired: !!checked })}
                />
                <Label htmlFor="isRequired" className="text-sm font-medium">
                  DOT Required Training
                </Label>
              </div>
            </div>
          </div>

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
              <Label>Start Date</Label>
              <Popover>
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
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.startDate}
                    onSelect={(date) => {
                      setFormData({ ...formData, startDate: date || undefined })
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Completion Date */}
            <div className="space-y-2">
              <Label>Completion Date <span className="text-red-500">*</span></Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.completionDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.completionDate ? format(formData.completionDate, "PPP") : "Pick completion date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.completionDate}
                    onSelect={(date) => {
                      if (date) setFormData({ ...formData, completionDate: date })
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Expiration Date */}
            <div className="space-y-2">
              <Label>Expiration Date <span className="text-red-500">*</span></Label>
              <Popover>
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
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.expirationDate}
                    onSelect={(date) => {
                      if (date) setFormData({ ...formData, expirationDate: date })
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
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