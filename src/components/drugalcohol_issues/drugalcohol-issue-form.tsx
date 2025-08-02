"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'

interface DrugAlcoholIssueFormProps {
  partyId?: string
  drugAlcoholIssue?: any
  onSuccess?: (newDrugAlcohol?: any) => void
  onCancel?: () => void
}

const RESULT_OPTIONS = [
  { value: 'Negative', label: 'Negative' },
  { value: 'Positive', label: 'Positive' },
  { value: 'Negative_Dilute', label: 'Negative Dilute' }
]

const REASON_OPTIONS = [
  { value: 'PreEmployment', label: 'Pre-Employment' },
  { value: 'Random', label: 'Random' },
  { value: 'Reasonable_Suspicion', label: 'Reasonable Suspicion' },
  { value: 'Post_Accident', label: 'Post Accident' },
  { value: 'Return_to_Duty', label: 'Return to Duty' },
  { value: 'FollowUp', label: 'Follow-Up' },
  { value: 'Other', label: 'Other' }
]

const AGENCY_OPTIONS = [
  { value: 'FMCSA', label: 'FMCSA' },
  { value: 'PHMSA', label: 'PHMSA' },
  { value: 'Non_DOT', label: 'Non-DOT' },
  { value: 'Drug_Testing_Clearinghouse', label: 'Drug Testing Clearinghouse' },
  { value: 'Water_Tech_Energy', label: 'Water Tech Energy' }
]

export default function DrugAlcoholIssueForm({ partyId, drugAlcoholIssue, onSuccess, onCancel }: DrugAlcoholIssueFormProps) {
  const [formData, setFormData] = useState({
    result: drugAlcoholIssue?.result || '',
    substance: drugAlcoholIssue?.substance || '',
    lab: drugAlcoholIssue?.lab || '',
    accreditedBy: drugAlcoholIssue?.accreditedBy || '',
    reason: drugAlcoholIssue?.reason || '',
    agency: drugAlcoholIssue?.agency || '',
    specimenNumber: drugAlcoholIssue?.specimenNumber || '',
    isDrug: drugAlcoholIssue?.isDrug || false,
    isAlcohol: drugAlcoholIssue?.isAlcohol || false,
    clinic: drugAlcoholIssue?.clinic || '',
    title: drugAlcoholIssue?.issue?.title || '',
    // Add Gold Standard date fields
    testDate: drugAlcoholIssue?.testDate ? new Date(drugAlcoholIssue.testDate) : undefined,
    resultDate: drugAlcoholIssue?.resultDate ? new Date(drugAlcoholIssue.resultDate) : undefined,
    notificationDate: drugAlcoholIssue?.notificationDate ? new Date(drugAlcoholIssue.notificationDate) : undefined
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const url = drugAlcoholIssue 
        ? `/api/drugalcohol_issues/${drugAlcoholIssue.id}`
        : '/api/drugalcohol_issues'
      
      const method = drugAlcoholIssue ? 'PUT' : 'POST'
      
      const payload = {
        ...formData,
        ...(partyId && { partyId })
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to save drug alcohol issue')
      }

      const savedDrugAlcohol = await res.json()
      if (onSuccess) onSuccess(savedDrugAlcohol)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Test title"
              />
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Test Information */}
      <Card>
        <CardHeader>
          <CardTitle>Test Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Test Type Checkboxes */}
            <div className="space-y-2">
              <Label>Test Type</Label>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isDrug"
                    checked={formData.isDrug}
                    onCheckedChange={(checked) => handleInputChange('isDrug', checked)}
                  />
                  <Label htmlFor="isDrug">Drug Test</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isAlcohol"
                    checked={formData.isAlcohol}
                    onCheckedChange={(checked) => handleInputChange('isAlcohol', checked)}
                  />
                  <Label htmlFor="isAlcohol">Alcohol Test</Label>
                </div>
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label>Reason for Test</Label>
              <Select value={formData.reason} onValueChange={(value) => handleInputChange('reason', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  {REASON_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Agency */}
            <div className="space-y-2">
              <Label>Agency</Label>
              <Select value={formData.agency} onValueChange={(value) => handleInputChange('agency', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select agency" />
                </SelectTrigger>
                <SelectContent>
                  {AGENCY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Result */}
            <div className="space-y-2">
              <Label>Test Result</Label>
              <Select value={formData.result} onValueChange={(value) => handleInputChange('result', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select result" />
                </SelectTrigger>
                <SelectContent>
                  {RESULT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="substance">Substance Tested For</Label>
              <Input
                id="substance"
                value={formData.substance}
                onChange={(e) => handleInputChange('substance', e.target.value)}
                placeholder="e.g., Marijuana, Cocaine, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="specimenNumber">Specimen Number</Label>
              <Input
                id="specimenNumber"
                value={formData.specimenNumber}
                onChange={(e) => handleInputChange('specimenNumber', e.target.value)}
                placeholder="Specimen tracking number"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Laboratory Information */}
      <Card>
        <CardHeader>
          <CardTitle>Laboratory Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lab">Testing Laboratory</Label>
              <Input
                id="lab"
                value={formData.lab}
                onChange={(e) => handleInputChange('lab', e.target.value)}
                placeholder="Laboratory name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accreditedBy">Accredited By</Label>
              <Input
                id="accreditedBy"
                value={formData.accreditedBy}
                onChange={(e) => handleInputChange('accreditedBy', e.target.value)}
                placeholder="Accrediting body"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="clinic">Clinic Information</Label>
            <Input
              id="clinic"
              value={formData.clinic}
              onChange={(e) => handleInputChange('clinic', e.target.value)}
              placeholder="Collection clinic details"
            />
          </div>
        </CardContent>
      </Card>

      {/* Dates Card - Gold Standard HTML5 Date Pickers */}
      <Card>
        <CardHeader>
          <CardTitle>Testing Dates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Notification Date */}
            <div className="space-y-2">
              <Label htmlFor="notificationDate">Notification Date</Label>
              <Input
                id="notificationDate"
                type="date"
                value={formData.notificationDate ? format(formData.notificationDate, 'yyyy-MM-dd') : ''}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : undefined
                  handleInputChange('notificationDate', date)
                }}
              />
            </div>

            {/* Test Date */}
            <div className="space-y-2">
              <Label htmlFor="testDate">Test Date <span className="text-red-500">*</span></Label>
              <Input
                id="testDate"
                type="date"
                value={formData.testDate ? format(formData.testDate, 'yyyy-MM-dd') : ''}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : undefined
                  handleInputChange('testDate', date)
                }}
                required
              />
            </div>

            {/* Result Date */}
            <div className="space-y-2">
              <Label htmlFor="resultDate">Result Date</Label>
              <Input
                id="resultDate"
                type="date"
                value={formData.resultDate ? format(formData.resultDate, 'yyyy-MM-dd') : ''}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : undefined
                  handleInputChange('resultDate', date)
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-end space-x-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : drugAlcoholIssue ? 'Update Test' : 'Create Test'}
        </Button>
      </div>
    </form>
  )
} 