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

interface MvrRenewalFormProps {
  mvrIssue: any // The MVR being renewed
  onSuccess?: (newMvr?: any) => void
  onCancel?: () => void
}

export function MvrRenewalForm({ mvrIssue, onSuccess, onCancel }: MvrRenewalFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Calculate initial dates for renewal
  const getInitialDates = () => {
    const oldExpiry = mvrIssue?.expirationDate ? new Date(mvrIssue.expirationDate) : new Date()
    const startDate = oldExpiry // Start date = old MVR expiration
    const renewalDate = new Date() // Renewal date = today
    const newExpirationDate = new Date(startDate)
    newExpirationDate.setFullYear(startDate.getFullYear() + 1) // Expiration = start + 1 year

    return {
      startDate,
      renewalDate,
      expirationDate: newExpirationDate,
    }
  }

  const initialDates = getInitialDates()

  const [formData, setFormData] = useState({
    startDate: initialDates.startDate,
    expirationDate: initialDates.expirationDate,
    renewalDate: initialDates.renewalDate,
    title: `MVR - ${mvrIssue?.state} (Renewed)`,
    description: `Renewed MVR record for ${mvrIssue?.state}`,
    notes: '',
  })

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!formData.expirationDate) {
      setError('Expiration date is required.')
      return
    }

    setIsLoading(true)
    try {
      const payload = {
        previousMvrId: mvrIssue.id,
        startDate: formData.startDate?.toISOString(),
        expirationDate: formData.expirationDate.toISOString(),
        renewalDate: formData.renewalDate?.toISOString(),
        title: formData.title,
        description: formData.description,
        notes: formData.notes || undefined,
      }

      const res = await fetch('/api/mvr_issues/renew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to renew MVR record')
      }

      const newMvr = await res.json()
      if (onSuccess) onSuccess(newMvr)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Current MVR Info */}
      <Card>
        <CardHeader>
          <CardTitle>Renewing MVR</CardTitle>
          <CardDescription>
            {mvrIssue?.issue?.title} - {mvrIssue?.state}
            {mvrIssue?.expirationDate && (
              <span className="block text-sm text-gray-600 mt-1">
                Current expiration: {format(new Date(mvrIssue.expirationDate), 'PPP')}
              </span>
            )}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* New MVR Dates */}
      <Card>
        <CardHeader>
          <CardTitle>New MVR Dates</CardTitle>
          <CardDescription>Set the start, expiration, and renewal dates for the new MVR</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Start Date *</Label>
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
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.startDate || undefined}
                    onSelect={(date) => handleInputChange('startDate', date || null)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label>Expiration Date *</Label>
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
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.expirationDate || undefined}
                    onSelect={(date) => handleInputChange('expirationDate', date || null)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label>Renewal Date</Label>
              <Popover>
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
                    onSelect={(date) => handleInputChange('renewalDate', date || null)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* New MVR Details */}
      <Card>
        <CardHeader>
          <CardTitle>New MVR Details</CardTitle>
          <CardDescription>Update title, description, and notes for the renewed MVR</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter MVR title"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter description..."
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Add any notes for the renewal..."
              rows={3}
            />
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
          Renew MVR
        </Button>
      </div>
    </form>
  )
} 