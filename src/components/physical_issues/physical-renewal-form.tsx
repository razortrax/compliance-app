"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Loader2, CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface PhysicalRenewalFormProps {
  physicalIssue: any // The physical being renewed
  onSuccess?: (newPhysical?: any) => void
  onCancel?: () => void
}

export function PhysicalRenewalForm({ physicalIssue, onSuccess, onCancel }: PhysicalRenewalFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Calculate initial dates for physical renewal
  const getInitialDates = () => {
    const oldExpiry = physicalIssue?.expirationDate ? new Date(physicalIssue.expirationDate) : new Date()
    const startDate = oldExpiry // Physical renewal typically starts when old one expires
    const renewalDate = new Date() // Today
    
    // Physical expirations are typically 2 years for most types, 1 year for some
    const newExpirationDate = new Date(startDate)
    newExpirationDate.setFullYear(startDate.getFullYear() + 2) // Default to 2 years
    
    return { startDate, renewalDate, expirationDate: newExpirationDate }
  }

  const initialDates = getInitialDates()
  
  const [formData, setFormData] = useState({
    startDate: initialDates.startDate,
    expirationDate: initialDates.expirationDate,
    renewalDate: initialDates.renewalDate,
    title: `Physical - ${physicalIssue?.type || 'Examination'} (Renewed)`,
    description: `Renewed physical examination record for ${physicalIssue?.type || 'physical'}`,
    notes: '',
  })

  const handleInputChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const payload = {
        previousPhysicalId: physicalIssue.id,
        startDate: formData.startDate.toISOString(),
        expirationDate: formData.expirationDate.toISOString(),
        renewalDate: formData.renewalDate.toISOString(),
        title: formData.title,
        description: formData.description,
        notes: formData.notes
      }

      const res = await fetch('/api/physical_issues/renew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to renew physical')
      }

      const newPhysical = await res.json()
      if (onSuccess) onSuccess(newPhysical)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Current Physical Info */}
      <Card>
        <CardHeader>
          <CardTitle>Current Physical</CardTitle>
          <CardDescription>Renewing from existing physical examination</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Type:</span>
              <span className="ml-2">{physicalIssue?.type || 'Not specified'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Medical Examiner:</span>
              <span className="ml-2">{physicalIssue?.medicalExaminer || 'Not specified'}</span>
            </div>
            {physicalIssue?.expirationDate && (
              <div>
                <span className="font-medium text-gray-700">Current Expiration:</span>
                <span className="ml-2">{format(new Date(physicalIssue.expirationDate), 'MMM dd, yyyy')}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* New Physical Dates */}
      <Card>
        <CardHeader>
          <CardTitle>New Physical Dates</CardTitle>
          <CardDescription>Set the validity period for the renewed physical</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Start Date */}
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(formData.startDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.startDate}
                    onSelect={(date) => handleInputChange('startDate', date || new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Expiration Date */}
            <div className="space-y-2">
              <Label>Expiration Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(formData.expirationDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.expirationDate}
                    onSelect={(date) => handleInputChange('expirationDate', date || new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Renewal Date */}
            <div className="space-y-2">
              <Label>Renewal Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(formData.renewalDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.renewalDate}
                    onSelect={(date) => handleInputChange('renewalDate', date || new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* New Physical Details */}
      <Card>
        <CardHeader>
          <CardTitle>New Physical Details</CardTitle>
          <CardDescription>Update title and description for the renewed physical</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Physical title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Physical description"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes for the renewal"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded p-3">
          {error}
        </div>
      )}

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Renew Physical
        </Button>
      </div>
    </form>
  )
} 