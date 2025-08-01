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
  notes?: string
  issue: {
    id: string
    title: string
    description?: string
    status: string
    priority: string
    party: {
      id: string
      person?: {
        firstName: string
        lastName: string
      }
      organization?: {
        name: string
      }
    }
  }
}

interface TrainingFormProps {
  training?: Training
  driverId?: string // Auto-assign to this driver if provided
  renewingTraining?: Training // Training being renewed (triggers renewal logic)
  onSuccess: () => void
  onCancel: () => void
}

const TRAINING_TYPES = [
  { value: 'HazMat Annual', label: 'HazMat Annual Training' },
  { value: 'Defensive Driving', label: 'Defensive Driving' },
  { value: 'Passenger Safety', label: 'Passenger Safety Training' },
  { value: 'School Bus Safety', label: 'School Bus Safety' },
  { value: 'DOT Safety', label: 'DOT Safety Training' },
  { value: 'Cargo Handling', label: 'Cargo Handling' },
  { value: 'Vehicle Inspection', label: 'Vehicle Inspection Training' },
  { value: 'Emergency Response', label: 'Emergency Response' },
  { value: 'Customer Service', label: 'Customer Service' },
  { value: 'Other', label: 'Other Training' }
]

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' }
]

export function TrainingForm({ training, driverId, renewingTraining, onSuccess, onCancel }: TrainingFormProps) {
  const isRenewal = !!renewingTraining
  const baseTraining = training || renewingTraining

  // Helper function to calculate initial dates for renewals
  const getInitialDates = () => {
    if (isRenewal && renewingTraining) {
      const today = new Date()
      const oldExpiry = new Date(renewingTraining.expirationDate)
      const oneYearFromToday = new Date(today)
      oneYearFromToday.setFullYear(oneYearFromToday.getFullYear() + 1)
      
      return {
        completionDate: today,
        expirationDate: oneYearFromToday
      }
    }
    return {
      completionDate: new Date(),
      expirationDate: (() => {
        const date = new Date()
        date.setFullYear(date.getFullYear() + 1)
        return date
      })()
    }
  }

  const initialDates = getInitialDates()

  const [formData, setFormData] = useState({
    trainingType: baseTraining?.trainingType || '',
    provider: baseTraining?.provider || '',
    instructor: baseTraining?.instructor || '',
    location: baseTraining?.location || '',
    startDate: baseTraining?.startDate ? new Date(baseTraining.startDate) : initialDates.completionDate,
    completionDate: baseTraining?.completionDate ? new Date(baseTraining.completionDate) : initialDates.completionDate,
    expirationDate: baseTraining?.expirationDate ? new Date(baseTraining.expirationDate) : initialDates.expirationDate,
    certificateNumber: baseTraining?.certificateNumber || '',
    hours: baseTraining?.hours || 0,
    isRequired: baseTraining?.isRequired || false,
    partyId: baseTraining?.issue?.party?.id || ''
  })

  const [competencies, setCompetencies] = useState<string[]>(
    baseTraining?.competencies?.map((c: any) => c.name || c) || []
  )
  const [newCompetency, setNewCompetency] = useState('')
  const [isStartOpen, setIsStartOpen] = useState(false)
  const [isCompletionOpen, setIsCompletionOpen] = useState(false)
  const [isExpirationOpen, setIsExpirationOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Auto-fetch driver data when driverId is provided for new trainings
  useEffect(() => {
    if (driverId && !training && !renewingTraining) {
      fetchDriverData()
    }
  }, [driverId, training, renewingTraining])

  const fetchDriverData = async () => {
    try {
      const response = await fetch(`/api/persons/${driverId}`)
      if (response.ok) {
        const driver = await response.json()
        setFormData(prev => ({
          ...prev,
          partyId: driver.party.id,
          title: `${prev.trainingType} Training - ${driver.firstName} ${driver.lastName}`,
          description: `Training record for ${driver.firstName} ${driver.lastName}`
        }))
      }
    } catch (error) {
      console.error('Error fetching driver data:', error)
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

  const handleSubmit = async () => {
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
      
      // For renewals, only send the minimal renewal data
      const finalRequestData = isRenewal ? {
        previousTrainingId: renewingTraining?.id,
        startDate: formData.startDate?.toISOString(),
        completionDate: formData.completionDate.toISOString(),
        expirationDate: formData.expirationDate.toISOString(),
        certificateNumber: formData.certificateNumber,
        hours: formData.hours
      } : requestData
      
      let url, method
      if (isRenewal) {
        // For renewals, use the renewal endpoint
        url = '/api/trainings/renew'
        method = 'POST'
      } else if (training) {
        // For edits, use PUT to existing training
        url = `/api/trainings/${training.id}`
        method = 'PUT'
      } else {
        // For new trainings, use POST
        url = '/api/trainings'
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
        alert(`Error: ${error.error || 'Failed to save training'}`)
      }
    } catch (error) {
      console.error('Error saving training:', error)
      alert('Failed to save training. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Training Type & Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Training Information</CardTitle>
          <CardDescription>
            {isRenewal ? 'Renew this training with updated completion and expiration dates' : 
             training ? 'Update training information' : 'Enter training details'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="trainingType">Training Type *</Label>
              <Select 
                value={formData.trainingType} 
                onValueChange={(value) => setFormData({ ...formData, trainingType: value })}
                disabled={isRenewal}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select training type" />
                </SelectTrigger>
                <SelectContent>
                  {TRAINING_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider">Training Provider</Label>
              <Input
                id="provider"
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                placeholder="e.g., SafetyFirst Training"
                disabled={isRenewal}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="instructor">Instructor</Label>
              <Input
                id="instructor"
                value={formData.instructor}
                onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                placeholder="Instructor name"
                disabled={isRenewal}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Training location"
                disabled={isRenewal}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dates & Completion */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Training Dates</CardTitle>
          <CardDescription>When was the training completed and when does it expire?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
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
                    selected={formData.startDate}
                    onSelect={(date) => {
                      if (date) {
                        setFormData({ ...formData, startDate: date })
                        setIsStartOpen(false)
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Completion Date *</Label>
              <Popover open={isCompletionOpen} onOpenChange={setIsCompletionOpen}>
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
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.completionDate}
                    onSelect={(date) => {
                      if (date) {
                        setFormData({ ...formData, completionDate: date })
                        setIsCompletionOpen(false)
                      }
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
                    selected={formData.expirationDate}
                    onSelect={(date) => {
                      if (date) {
                        setFormData({ ...formData, expirationDate: date })
                        setIsExpirationOpen(false)
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="certificateNumber">Certificate Number</Label>
              <Input
                id="certificateNumber"
                value={formData.certificateNumber}
                onChange={(e) => setFormData({ ...formData, certificateNumber: e.target.value })}
                placeholder="Certificate or completion number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hours">Training Hours</Label>
              <Input
                id="hours"
                type="number"
                min="0"
                step="0.5"
                value={formData.hours}
                onChange={(e) => setFormData({ ...formData, hours: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isRequired"
              checked={formData.isRequired}
              onCheckedChange={(checked) => setFormData({ ...formData, isRequired: !!checked })}
              disabled={isRenewal}
            />
            <Label htmlFor="isRequired">This is a required training</Label>
          </div>
        </CardContent>
      </Card>

      {/* Competencies */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Competencies</CardTitle>
          <CardDescription>Skills or topics covered in this training</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newCompetency}
              onChange={(e) => setNewCompetency(e.target.value)}
              placeholder="Add a competency (e.g., 'Vehicle Inspection', 'Emergency Procedures')"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addCompetency()
                }
              }}
              disabled={isRenewal}
            />
            <Button type="button" onClick={addCompetency} disabled={isRenewal}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {competencies.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {competencies.map((competency, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {competency}
                  {!isRenewal && (
                    <button
                      type="button"
                      onClick={() => removeCompetency(index)}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Additional Information</CardTitle>
          <CardDescription>Notes and administrative details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Training record title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes about this training..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isRenewal ? 'Renew Training' : training ? 'Update Training' : 'Create Training'}
        </Button>
      </div>
    </div>
  )
} 