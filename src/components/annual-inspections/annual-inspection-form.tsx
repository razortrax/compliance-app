"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, X } from 'lucide-react'
import { addYears } from 'date-fns'

interface AnnualInspection {
  id: string
  inspectorName: string
  inspectionDate: string
  expirationDate: string
  result: 'Pending' | 'Pass' | 'Fail'
  status: 'Scheduled' | 'Active' | 'Inactive'
  notes?: string | null
  issue: {
    id: string
    title: string
    description?: string | null
    status: string
    priority: string
    party: {
      id: string
      equipment?: {
        make?: string | null
        model?: string | null
        year?: number | null
      } | null
      organization?: {
        name: string
      } | null
    }
  }
}

interface Equipment {
  id: string
  make?: string | null
  model?: string | null
  year?: number | null
  party: {
    id: string
  }
}

interface AnnualInspectionFormProps {
  annualInspection?: AnnualInspection | null
  equipmentId?: string // Auto-assign to this equipment if provided
  renewingInspection?: AnnualInspection | null // Inspection being renewed (triggers renewal logic)
  onSuccess: (inspection: any) => void
  onCancel: () => void
}

export function AnnualInspectionForm({ 
  annualInspection, 
  equipmentId, 
  renewingInspection,
  onSuccess, 
  onCancel 
}: AnnualInspectionFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [equipment, setEquipment] = useState<Equipment | null>(null)
  
  // Form state
  const [inspectorName, setInspectorName] = useState(
    annualInspection?.inspectorName || renewingInspection?.inspectorName || ''
  )
  const [schedulingType, setSchedulingType] = useState<'scheduled_at_shop' | 'drop_in' | 'inspector_visits' | 'in_house_inspector'>(
    'scheduled_at_shop'
  )
  const [inspectionDate, setInspectionDate] = useState(
    annualInspection?.inspectionDate ? new Date(annualInspection.inspectionDate).toISOString().split('T')[0] : 
    renewingInspection ? new Date().toISOString().split('T')[0] : // For renewals, start with today
    new Date().toISOString().split('T')[0] // Default to today for new inspections
  )
  const [expirationDate, setExpirationDate] = useState(
    annualInspection?.expirationDate ? new Date(annualInspection.expirationDate).toISOString().split('T')[0] : 
    renewingInspection ? addYears(new Date(), 1).toISOString().split('T')[0] : // Pre-calculate for renewals
    ''
  )
  const [result, setResult] = useState<'Pending' | 'Pass' | 'Fail'>(annualInspection?.result || 'Pending')
  const [status, setStatus] = useState<'Scheduled' | 'Active' | 'Inactive'>(annualInspection?.status || 'Scheduled')
  const [notes, setNotes] = useState(annualInspection?.notes || '')

  // Auto-calculate expiration date (1 year after inspection date)
  useEffect(() => {
    if (inspectionDate) {
      const inspection = new Date(inspectionDate)
      const expiration = addYears(inspection, 1)
      setExpirationDate(expiration.toISOString().split('T')[0])
    }
  }, [inspectionDate])

  // Load equipment if equipmentId provided
  useEffect(() => {
    if (equipmentId) {
      const fetchEquipment = async () => {
        try {
          const response = await fetch(`/api/equipment/${equipmentId}`)
          if (response.ok) {
            const data = await response.json()
            setEquipment(data)
          }
        } catch (error) {
          console.error('Error fetching equipment:', error)
        }
      }
      fetchEquipment()
    }
  }, [equipmentId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!inspectorName || !inspectionDate || !expirationDate) {
      alert('Please fill in all required fields')
      return
    }

    setIsLoading(true)

    try {
      const partyId = equipment?.party.id || annualInspection?.issue.party.id
      if (!partyId) {
        throw new Error('No equipment party ID found')
      }

      const inspectionData = {
        inspectorName: inspectorName.trim(),
        inspectionDate: new Date(inspectionDate).toISOString(),
        expirationDate: new Date(expirationDate).toISOString(),
        result,
        status,
        notes: notes.trim() || null,
        partyId,
        title: `Annual Inspection: ${equipment?.make || 'Equipment'} ${equipment?.model || ''} - ${result}`,
        description: `Annual inspection for ${equipment?.make || 'Equipment'} ${equipment?.model || ''} ${equipment?.year || ''} by ${inspectorName}`.trim(),
        priority: result === 'Fail' ? 'high' : 'medium'
      }

      const url = annualInspection ? `/api/annual-inspections/${annualInspection.id}` : '/api/annual-inspections'
      const method = annualInspection ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inspectionData)
      })

      if (response.ok) {
        const result = await response.json()
        
        // If this is a renewal, update the old inspection status
        if (renewingInspection) {
          await fetch(`/api/annual-inspections/${renewingInspection.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...renewingInspection,
              status: 'Inactive' // Mark old inspection as inactive
            })
          })
        }
        
        onSuccess(result)
      } else {
        const error = await response.json()
        console.error('Annual inspection save error:', error)
        alert(`Error: ${error.error || 'Failed to save annual inspection'}`)
      }
    } catch (error) {
      console.error('Error submitting annual inspection:', error)
      alert('An error occurred while saving. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const getFormTitle = () => {
    if (renewingInspection) return 'Renew Annual Inspection'
    if (annualInspection) return 'Edit Annual Inspection'
    return 'Add New Annual Inspection'
  }

  const getFormDescription = () => {
    if (renewingInspection) return 'Create a new annual inspection for continued compliance'
    if (annualInspection) return 'Update annual inspection information'
    return 'Record annual equipment inspection results'
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getFormTitle()}
            {renewingInspection && <Badge variant="outline" className="bg-blue-50">Renewal</Badge>}
          </CardTitle>
          <CardDescription>{getFormDescription()}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Inspector Information */}
          <div className="space-y-2">
            <Label htmlFor="inspectorName">Inspector Name *</Label>
            <Input
              id="inspectorName"
              value={inspectorName}
              onChange={(e) => setInspectorName(e.target.value)}
              placeholder="Inspector name (full selection coming soon)"
              required
            />
            <p className="text-xs text-gray-500">Full inspector selection will be available once the Org {'>'}  Others tab is implemented</p>
          </div>

          {/* Scheduling Type */}
          <div className="space-y-2">
            <Label htmlFor="schedulingType">Scheduling Type</Label>
            <Select value={schedulingType} onValueChange={(value: 'scheduled_at_shop' | 'drop_in' | 'inspector_visits' | 'in_house_inspector') => setSchedulingType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled_at_shop">Scheduled at Shop (with time)</SelectItem>
                <SelectItem value="drop_in">Drop-in at Shop (no time needed)</SelectItem>
                <SelectItem value="inspector_visits">Inspector Visits Shop</SelectItem>
                <SelectItem value="in_house_inspector">In-House Certified Inspector</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              {schedulingType === 'scheduled_at_shop' && 'Requires specific appointment time'}
              {schedulingType === 'drop_in' && 'No appointment needed, flexible timing'}
              {schedulingType === 'inspector_visits' && 'Inspector comes to your location'}
              {schedulingType === 'in_house_inspector' && 'Company has certified inspector on staff'}
            </p>
          </div>

          {/* Date Fields - HTML5 Gold Standard */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inspectionDate">Inspection Date *</Label>
              <Input
                id="inspectionDate"
                type="date"
                value={inspectionDate}
                onChange={(e) => setInspectionDate(e.target.value)}
                required
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expirationDate">Expiration Date *</Label>
              <Input
                id="expirationDate"
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                required
                className="w-full bg-gray-50"
                disabled
              />
              <p className="text-xs text-gray-500">Auto-calculated: inspection date + 1 year</p>
            </div>
          </div>

          {/* Result and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="result">Inspection Result *</Label>
              <Select value={result} onValueChange={(value: 'Pending' | 'Pass' | 'Fail') => setResult(value)} required>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Pass">Pass</SelectItem>
                  <SelectItem value="Fail">Fail</SelectItem>
                </SelectContent>
              </Select>
              {result === 'Pending' && (
                <p className="text-xs text-blue-600">Inspection scheduled but not yet performed</p>
              )}
              {result === 'Fail' && (
                <p className="text-xs text-orange-600">Failed inspection: equipment remains compliant until current inspection expires</p>
              )}
              {result === 'Pass' && (
                <p className="text-xs text-green-600">Inspection passed: equipment compliant for one year</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(value: 'Scheduled' | 'Active' | 'Inactive') => setStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Scheduled">Scheduled</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes about this inspection..."
              rows={3}
            />
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
              {renewingInspection ? 'Renewing...' : annualInspection ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            <>
              {renewingInspection ? 'Renew Inspection' : annualInspection ? 'Update Inspection' : 'Create Inspection'}
            </>
          )}
        </Button>
      </div>
    </form>
  )
} 