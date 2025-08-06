'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Wrench, Clock, AlertTriangle, CheckCircle, User, Building2 } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { MaintenanceType, MaintenanceSourceType, MaintenanceStatus, MaintenanceResult, MaintenancePriority, MaintenanceInterval } from '@prisma/client'

interface MaintenanceIssue {
  id?: string
  issueId?: string
  maintenanceType: MaintenanceType
  sourceType: MaintenanceSourceType
  sourceId?: string
  dueDate: Date
  completedDate?: Date
  scheduledDate?: Date
  intervalDays?: number
  intervalMiles?: number
  abScheduleItemId?: string
  abScheduleCode?: string
  currentMileage?: number
  mileageAtDue?: number
  lastServiceDate?: Date
  lastServiceMiles?: number
  technicianName?: string
  technicianCert?: string
  facilityName?: string
  facilityAddress?: string
  workDescription: string
  partsUsed?: object
  laborHours?: number
  status?: MaintenanceStatus
  result?: MaintenanceResult
  priority?: MaintenancePriority
  dotCompliant?: boolean
  warrantyWork?: boolean
  costEstimate?: number
  actualCost?: number
  defectsFound?: object
  correctiveActions?: object
  followUpRequired?: boolean
  followUpDate?: Date
  notes?: string
  reminderSent?: boolean
  reminderDate?: Date
  title: string
  description?: string
}

interface MaintenanceIssueFormProps {
  maintenanceIssue?: MaintenanceIssue
  equipmentId?: string
  onSubmit: (data: MaintenanceIssue) => void
  onCancel: () => void
  isLoading?: boolean
}

interface ABScheduleItem {
  id: string
  itemCode: string
  itemDescription: string
  intervalDays?: number
  intervalMiles?: number
  category: string
  component: string
  estimatedHours?: number
  estimatedCost?: number
}

export function MaintenanceIssueForm({ 
  maintenanceIssue, 
  equipmentId, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: MaintenanceIssueFormProps) {
  const [formData, setFormData] = useState<MaintenanceIssue>({
    maintenanceType: 'CORRECTIVE',
    sourceType: 'ROUTINE',
    dueDate: new Date(),
    workDescription: '',
    title: '',
    status: 'SCHEDULED',
    priority: 'ROUTINE',
    dotCompliant: false,
    warrantyWork: false,
    followUpRequired: false,
    reminderSent: false,
    ...maintenanceIssue
  })

  const [abScheduleItems, setAbScheduleItems] = useState<ABScheduleItem[]>([])
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false)

  // Fetch A&B schedule items
  useEffect(() => {
    if (equipmentId && (formData.maintenanceType === 'A_SCHEDULE' || formData.maintenanceType === 'B_SCHEDULE')) {
      fetchABScheduleItems()
    }
  }, [equipmentId, formData.maintenanceType])

  const fetchABScheduleItems = async () => {
    setIsLoadingSchedule(true)
    try {
      const response = await fetch(`/api/equipment/${equipmentId}/ab-schedule?type=${formData.maintenanceType}`)
      if (response.ok) {
        const items = await response.json()
        setAbScheduleItems(items)
      }
    } catch (error) {
      console.error('Error fetching A&B schedule items:', error)
    } finally {
      setIsLoadingSchedule(false)
    }
  }

  const handleInputChange = (field: keyof MaintenanceIssue, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleDateChange = (field: keyof MaintenanceIssue, date: Date | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: date
    }))
  }

  const handleABScheduleItemSelect = (item: ABScheduleItem) => {
    setFormData(prev => ({
      ...prev,
      abScheduleItemId: item.id,
      abScheduleCode: item.itemCode,
      workDescription: item.itemDescription,
      intervalDays: item.intervalDays,
      intervalMiles: item.intervalMiles,
      laborHours: item.estimatedHours,
      costEstimate: item.estimatedCost,
      title: `${formData.maintenanceType} - ${item.itemDescription}`
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation
    if (!formData.title || !formData.workDescription || !formData.dueDate) {
      alert('Please fill in all required fields')
      return
    }

    onSubmit(formData)
  }

  const getMaintenanceTypeIcon = (type: MaintenanceType) => {
    switch (type) {
      case 'A_SCHEDULE':
      case 'B_SCHEDULE':
        return <Clock className="h-4 w-4" />
      case 'CORRECTIVE':
        return <AlertTriangle className="h-4 w-4" />
      case 'PREVENTIVE':
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Wrench className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: MaintenanceStatus) => {
    switch (status) {
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800'
      case 'OVERDUE': return 'bg-red-100 text-red-800'
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800'
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'PARTIAL': return 'bg-orange-100 text-orange-800'
      case 'DEFERRED': return 'bg-purple-100 text-purple-800'
      case 'CANCELLED': return 'bg-gray-100 text-gray-800'
      case 'ON_HOLD': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            {getMaintenanceTypeIcon(formData.maintenanceType)}
            <CardTitle>
              {maintenanceIssue ? 'Edit Maintenance Issue' : 'New Maintenance Issue'}
            </CardTitle>
            {formData.status && (
              <Badge className={getStatusColor(formData.status)}>
                {formData.status.replace('_', ' ')}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Title and Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title<span className="text-red-500">*</span></Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Brief description of maintenance"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value as MaintenancePriority)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="ROUTINE">Routine</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Maintenance Type and Source */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maintenanceType">Maintenance Type<span className="text-red-500">*</span></Label>
              <Select value={formData.maintenanceType} onValueChange={(value) => handleInputChange('maintenanceType', value as MaintenanceType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A_SCHEDULE">A Schedule</SelectItem>
                  <SelectItem value="B_SCHEDULE">B Schedule</SelectItem>
                  <SelectItem value="CORRECTIVE">Corrective</SelectItem>
                  <SelectItem value="PREVENTIVE">Preventive</SelectItem>
                  <SelectItem value="REPAIR">Repair</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sourceType">Source Type</Label>
              <Select value={formData.sourceType} onValueChange={(value) => handleInputChange('sourceType', value as MaintenanceSourceType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ANNUAL_INSPECTION">Annual Inspection</SelectItem>
                  <SelectItem value="ROADSIDE_INSPECTION">Roadside Inspection</SelectItem>
                  <SelectItem value="ROUTINE">Routine</SelectItem>
                  <SelectItem value="ACCIDENT">Accident</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* A&B Schedule Items (only for A/B schedule types) */}
          {(formData.maintenanceType === 'A_SCHEDULE' || formData.maintenanceType === 'B_SCHEDULE') && (
            <div className="space-y-2">
              <Label>A&B Schedule Items</Label>
              {isLoadingSchedule ? (
                <div className="text-sm text-gray-500">Loading schedule items...</div>
              ) : abScheduleItems.length > 0 ? (
                <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto border rounded p-2">
                  {abScheduleItems.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        "p-2 border rounded cursor-pointer hover:bg-gray-50",
                        formData.abScheduleItemId === item.id && "bg-blue-50 border-blue-200"
                      )}
                      onClick={() => handleABScheduleItemSelect(item)}
                    >
                      <div className="font-medium">{item.itemCode}: {item.itemDescription}</div>
                      <div className="text-sm text-gray-500">
                        Category: {item.category} | Component: {item.component}
                        {item.intervalDays && ` | ${item.intervalDays} days`}
                        {item.intervalMiles && ` | ${item.intervalMiles} miles`}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500">No schedule items available</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Work Description */}
      <Card>
        <CardHeader>
          <CardTitle>Work Description</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workDescription">Description<span className="text-red-500">*</span></Label>
            <Textarea
              id="workDescription"
              value={formData.workDescription}
              onChange={(e) => handleInputChange('workDescription', e.target.value)}
              placeholder="Detailed description of work to be performed"
              rows={3}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Any additional notes or special instructions"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Scheduling */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Scheduling</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Due Date */}
            <div className="space-y-2">
              <Label>Due Date<span className="text-red-500">*</span></Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.dueDate ? format(formData.dueDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.dueDate}
                    onSelect={(date) => handleDateChange('dueDate', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Scheduled Date */}
            <div className="space-y-2">
              <Label>Scheduled Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.scheduledDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.scheduledDate ? format(formData.scheduledDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.scheduledDate}
                    onSelect={(date) => handleDateChange('scheduledDate', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Completed Date */}
            <div className="space-y-2">
              <Label>Completed Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.completedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.completedDate ? format(formData.completedDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.completedDate}
                    onSelect={(date) => handleDateChange('completedDate', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Intervals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="intervalDays">Interval (Days)</Label>
              <Input
                id="intervalDays"
                type="number"
                value={formData.intervalDays || ''}
                onChange={(e) => handleInputChange('intervalDays', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="e.g., 90"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="intervalMiles">Interval (Miles)</Label>
              <Input
                id="intervalMiles"
                type="number"
                value={formData.intervalMiles || ''}
                onChange={(e) => handleInputChange('intervalMiles', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="e.g., 25000"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technician and Facility */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Technician & Facility</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="technicianName">Technician Name</Label>
              <Input
                id="technicianName"
                value={formData.technicianName || ''}
                onChange={(e) => handleInputChange('technicianName', e.target.value)}
                placeholder="Technician performing work"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="technicianCert">Technician Certification</Label>
              <Input
                id="technicianCert"
                value={formData.technicianCert || ''}
                onChange={(e) => handleInputChange('technicianCert', e.target.value)}
                placeholder="Certification number or type"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="facilityName">Facility Name</Label>
              <Input
                id="facilityName"
                value={formData.facilityName || ''}
                onChange={(e) => handleInputChange('facilityName', e.target.value)}
                placeholder="Service facility or shop"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="facilityAddress">Facility Address</Label>
              <Input
                id="facilityAddress"
                value={formData.facilityAddress || ''}
                onChange={(e) => handleInputChange('facilityAddress', e.target.value)}
                placeholder="Address where work performed"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status and Results */}
      <Card>
        <CardHeader>
          <CardTitle>Status & Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value as MaintenanceStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                  <SelectItem value="OVERDUE">Overdue</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="PARTIAL">Partial</SelectItem>
                  <SelectItem value="DEFERRED">Deferred</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="ON_HOLD">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="result">Result</Label>
              <Select value={formData.result || ''} onValueChange={(value) => handleInputChange('result', value as MaintenanceResult)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select result" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PASS">Pass</SelectItem>
                  <SelectItem value="FAIL">Fail</SelectItem>
                  <SelectItem value="CONDITIONAL_PASS">Conditional Pass</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Checkboxes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="dotCompliant"
                checked={formData.dotCompliant}
                onCheckedChange={(checked) => handleInputChange('dotCompliant', checked)}
              />
              <Label htmlFor="dotCompliant">DOT Compliant</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="warrantyWork"
                checked={formData.warrantyWork}
                onCheckedChange={(checked) => handleInputChange('warrantyWork', checked)}
              />
              <Label htmlFor="warrantyWork">Warranty Work</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="followUpRequired"
                checked={formData.followUpRequired}
                onCheckedChange={(checked) => handleInputChange('followUpRequired', checked)}
              />
              <Label htmlFor="followUpRequired">Follow-up Required</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost and Labor */}
      <Card>
        <CardHeader>
          <CardTitle>Cost & Labor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="laborHours">Labor Hours</Label>
              <Input
                id="laborHours"
                type="number"
                step="0.5"
                value={formData.laborHours || ''}
                onChange={(e) => handleInputChange('laborHours', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="e.g., 2.5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="costEstimate">Cost Estimate</Label>
              <Input
                id="costEstimate"
                type="number"
                step="0.01"
                value={formData.costEstimate || ''}
                onChange={(e) => handleInputChange('costEstimate', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="e.g., 150.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="actualCost">Actual Cost</Label>
              <Input
                id="actualCost"
                type="number"
                step="0.01"
                value={formData.actualCost || ''}
                onChange={(e) => handleInputChange('actualCost', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="e.g., 165.50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : maintenanceIssue ? 'Update' : 'Create'} Maintenance Issue
        </Button>
      </div>
    </form>
  )
} 