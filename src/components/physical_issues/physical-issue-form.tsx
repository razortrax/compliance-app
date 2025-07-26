"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface PhysicalIssueFormProps {
  partyId?: string
  physicalIssue?: any
  onSuccess?: (newPhysical?: any) => void
  onCancel?: () => void
}

const PHYSICAL_TYPE_OPTIONS = [
  { value: 'Annual', label: 'Annual' },
  { value: 'Bi_Annual', label: 'Bi-Annual' },
  { value: 'Return_to_Duty', label: 'Return to Duty' },
  { value: 'Post_Accident', label: 'Post Accident' },
  { value: 'One_Month', label: '1 Month' },
  { value: 'Three_Month', label: '3 Month' },
  { value: 'Six_Month', label: '6 Month' },
  { value: 'Pre_Hire', label: 'Pre-Hire' },
  { value: 'No_Physical_Issue', label: 'No Physical Issue' }
]

export default function PhysicalIssueForm({ partyId, physicalIssue, onSuccess, onCancel }: PhysicalIssueFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    type: physicalIssue?.type || '',
    medicalExaminer: physicalIssue?.medicalExaminer || '',
    selfCertified: physicalIssue?.selfCertified || false,
    nationalRegistry: physicalIssue?.nationalRegistry || false,
    startDate: physicalIssue?.startDate ? new Date(physicalIssue.startDate) : null,
    expirationDate: physicalIssue?.expirationDate ? new Date(physicalIssue.expirationDate) : null,
    renewalDate: physicalIssue?.renewalDate ? new Date(physicalIssue.renewalDate) : null,
    title: physicalIssue?.issue?.title || '',
    description: physicalIssue?.issue?.description || ''
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
        ...formData,
        partyId: partyId || physicalIssue?.issue?.partyId,
        startDate: formData.startDate ? formData.startDate.toISOString() : undefined,
        expirationDate: formData.expirationDate ? formData.expirationDate.toISOString() : undefined,
        renewalDate: formData.renewalDate ? formData.renewalDate.toISOString() : undefined,
      }

      const url = physicalIssue 
        ? `/api/physical_issues/${physicalIssue.id}`
        : '/api/physical_issues'
      
      const method = physicalIssue ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save physical record')
      }
      
      const savedPhysical = await res.json()
      if (onSuccess) onSuccess(savedPhysical)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Physical examination details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Physical examination title"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Physical Type</Label>
              <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select physical type" />
                </SelectTrigger>
                <SelectContent>
                  {PHYSICAL_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="medicalExaminer">Medical Examiner</Label>
              <Input
                id="medicalExaminer"
                value={formData.medicalExaminer}
                onChange={(e) => handleInputChange('medicalExaminer', e.target.value)}
                placeholder="Name of medical examiner"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="selfCertified"
                checked={formData.selfCertified}
                onCheckedChange={(checked) => handleInputChange('selfCertified', checked)}
              />
              <Label htmlFor="selfCertified">Self Certified</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="nationalRegistry"
                checked={formData.nationalRegistry}
                onCheckedChange={(checked) => handleInputChange('nationalRegistry', checked)}
              />
              <Label htmlFor="nationalRegistry">National Registry</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Additional notes about the physical examination"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Date Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Date Information</CardTitle>
          <CardDescription>Physical validity period and renewal dates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Start Date - Simple Input */}
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate ? format(formData.startDate, "yyyy-MM-dd") : ""}
                onChange={(e) => {
                  if (e.target.value) {
                    // Create date without timezone adjustment
                    const [year, month, day] = e.target.value.split('-')
                    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
                    handleInputChange('startDate', date)
                  } else {
                    handleInputChange('startDate', null)
                  }
                }}
                className="w-full"
              />
            </div>

            {/* Expiration Date - Simple Input */}
            <div className="space-y-2">
              <Label htmlFor="expirationDate">Expiration Date</Label>
              <Input
                id="expirationDate"
                type="date"
                value={formData.expirationDate ? format(formData.expirationDate, "yyyy-MM-dd") : ""}
                onChange={(e) => {
                  if (e.target.value) {
                    // Create date without timezone adjustment
                    const [year, month, day] = e.target.value.split('-')
                    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
                    handleInputChange('expirationDate', date)
                  } else {
                    handleInputChange('expirationDate', null)
                  }
                }}
                className="w-full"
              />
            </div>

            {/* Renewal Date - Simple Input */}
            <div className="space-y-2">
              <Label htmlFor="renewalDate">Renewal Date</Label>
              <Input
                id="renewalDate"
                type="date"
                value={formData.renewalDate ? format(formData.renewalDate, "yyyy-MM-dd") : ""}
                onChange={(e) => {
                  if (e.target.value) {
                    // Create date without timezone adjustment
                    const [year, month, day] = e.target.value.split('-')
                    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
                    handleInputChange('renewalDate', date)
                  } else {
                    handleInputChange('renewalDate', null)
                  }
                }}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {physicalIssue ? 'Update' : 'Create'} Physical
        </Button>
      </div>
    </form>
  )
} 