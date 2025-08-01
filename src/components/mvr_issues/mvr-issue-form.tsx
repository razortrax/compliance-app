"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Loader2, CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface MvrIssueFormProps {
  partyId?: string
  mvrIssue?: any
  onSuccess?: (newMvr?: any) => void
  onCancel?: () => void
}

const MVR_TYPE_OPTIONS = [
  { value: 'PreHire_Check', label: 'Pre-Hire Check' },
  { value: 'Annual_Review', label: 'Annual Review' },
  { value: 'Drug_Testing_Clearinghouse', label: 'Drug Testing Clearinghouse' },
  { value: 'After_Accident', label: 'After Accident' },
  { value: 'Reasonable_Suspicion', label: 'Reasonable Suspicion' },
  { value: 'Endorsement_Update', label: 'Endorsement Update' },
  { value: 'Med_Cert_Update', label: 'Medical Certificate Update' },
]

const MVR_RESULT_OPTIONS = [
  { value: 'Pass', label: 'Pass' },
  { value: 'Fail', label: 'Fail' },
  { value: 'Scheduled', label: 'Scheduled' },
  { value: 'Old_Certificate', label: 'Old Certificate' },
  { value: 'Inactive', label: 'Inactive' }
]

const MVR_RESULT_DACH_OPTIONS = [
  { value: 'Pass', label: 'Pass' },
  { value: 'Fail', label: 'Fail' },
  { value: 'Not_Required', label: 'Not Required' }
]

const MVR_RESULT_STATUS_OPTIONS = [
  { value: 'Result_Meets', label: 'Result Meets Requirements' },
  { value: 'Result_Does_Not_Meet', label: 'Result Does Not Meet' },
  { value: 'Result_Disqualified', label: 'Result Disqualified' }
]

const MVR_CERTIFICATION_OPTIONS = [
  { value: 'NonExcepted_Interstate', label: 'Non-Excepted Interstate' },
  { value: 'Excepted_Interstate', label: 'Excepted Interstate' },
  { value: 'NonExcepted_Intrastate', label: 'Non-Excepted Intrastate' },
  { value: 'ExceptedIntrastate', label: 'Excepted Intrastate' },
  { value: 'None', label: 'None' },
]

const MVR_STATUS_OPTIONS = [
  { value: 'Not_Released', label: 'Not Released' },
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
  { value: 'Disqualified', label: 'Disqualified' },
  { value: 'Not_Driver', label: 'Not Driver' },
  { value: 'One_Time_Training', label: 'One Time Training' },
]

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
]

export default function MvrIssueForm({ partyId, mvrIssue, onSuccess, onCancel }: MvrIssueFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    state: mvrIssue?.state || '',
    violationsCount: mvrIssue?.violationsCount || 0,
    cleanRecord: mvrIssue?.cleanRecord ?? true,
    type: mvrIssue?.type || '',
    result: mvrIssue?.result || '',
    result_dach: mvrIssue?.result_dach || '',
    result_status: mvrIssue?.result_status || '',
    certification: mvrIssue?.certification || '',
    status: mvrIssue?.status || '',
    notes: mvrIssue?.notes || '',

    startDate: mvrIssue?.startDate ? new Date(mvrIssue.startDate) : null,
    expirationDate: mvrIssue?.expirationDate ? new Date(mvrIssue.expirationDate) : null,
    renewalDate: mvrIssue?.renewalDate ? new Date(mvrIssue.renewalDate) : null,
  })

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!formData.state || (!mvrIssue && !partyId)) {
      setError('State is required.')
      return
    }
    
    setIsLoading(true)
    
    try {
      const payload = {
        ...formData,
        title: `MVR Record - ${formData.state}`,
        violationsCount: Number(formData.violationsCount),
        cleanRecord: !!formData.cleanRecord,
        partyId: mvrIssue ? undefined : partyId,
        startDate: formData.startDate?.toISOString(),
        expirationDate: formData.expirationDate?.toISOString(),
        renewalDate: formData.renewalDate?.toISOString(),
      }
      
      let res
      if (mvrIssue) {
        res = await fetch(`/api/mvr_issues/${mvrIssue.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      } else {
        res = await fetch('/api/mvr_issues', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, partyId })
        })
      }
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save MVR record')
      }
      
      const savedMvr = await res.json()
      if (onSuccess) onSuccess(savedMvr)
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

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Essential MVR record details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="state">State *</Label>
              <Select value={formData.state} onValueChange={(value) => handleInputChange('state', value)}>
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">MVR Type</Label>
              <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select MVR type" />
                </SelectTrigger>
                <SelectContent>
                  {MVR_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="violationsCount">Violations Count</Label>
              <Input
                id="violationsCount"
                type="number"
                min="0"
                value={formData.violationsCount}
                onChange={(e) => handleInputChange('violationsCount', parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-3">
                              <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="cleanRecord" 
                      checked={formData.cleanRecord} 
                      onCheckedChange={(checked) => handleInputChange('cleanRecord', checked)} 
                    />
                    <Label htmlFor="cleanRecord">Clean Record</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Date Information Card */}
            <Card>
              <CardHeader>
                <CardTitle>Date Information</CardTitle>
                <CardDescription>MVR validity period and renewal dates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    <Label>Expiration Date</Label>
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

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>Results & Status</CardTitle>
          <CardDescription>MVR evaluation results and status information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="result">Result</Label>
              <Select value={formData.result} onValueChange={(value) => handleInputChange('result', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select result" />
                </SelectTrigger>
                <SelectContent>
                  {MVR_RESULT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="result_dach">DACH Result</Label>
              <Select value={formData.result_dach} onValueChange={(value) => handleInputChange('result_dach', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select DACH result" />
                </SelectTrigger>
                <SelectContent>
                  {MVR_RESULT_DACH_OPTIONS.map((option) => (
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
              <Label htmlFor="result_status">Result Status</Label>
              <Select value={formData.result_status} onValueChange={(value) => handleInputChange('result_status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select result status" />
                </SelectTrigger>
                <SelectContent>
                  {MVR_RESULT_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">MVR Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {MVR_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="certification">Certification</Label>
            <Select value={formData.certification} onValueChange={(value) => handleInputChange('certification', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select certification" />
              </SelectTrigger>
              <SelectContent>
                {MVR_CERTIFICATION_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
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
          {mvrIssue ? 'Update MVR' : 'Create MVR'}
        </Button>
      </div>
    </form>
  )
} 