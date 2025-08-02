'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Trash2, AlertTriangle, Truck, Zap, Calendar } from 'lucide-react'

// Types for the unified incident system
type IncidentType = 'ACCIDENT' | 'ROADSIDE_INSPECTION'

interface AccidentData {
  isFatality: boolean
  isReportable: boolean
  isInjury: boolean
  isTow: boolean
  isCitation: boolean
  needsReport: boolean
  needsDrugTest: boolean
  numberOfFatalities?: number
  numberOfVehicles?: number
  reportableNumber?: string
  specimenNumber?: string
}

interface RoadsideData {
  inspectionLevel?: string
  overallResult?: string
  facilityName?: string
  facilityAddress?: string
  facilityCity?: string
  facilityState?: string
  facilityZip?: string
  driverLicense?: string
  driverLicenseState?: string
  driverDOB?: string
  dvirReceived: boolean
  dvirSource?: string
  entryMethod: string
}

interface EquipmentInvolvement {
  unitNumber: number
  equipmentId?: string
  unitType?: string
  make?: string
  model?: string
  year?: number
  plateNumber?: string
  plateState?: string
  vin?: string
  cvsaSticker?: string
  oosSticker?: string
}

interface Violation {
  violationCode: string
  section?: string
  unitNumber?: number
  outOfService: boolean
  citationNumber?: string
  severity?: 'WARNING' | 'CITATION' | 'CRIMINAL'
  description: string
  inspectorComments?: string
  violationType?: 'DRIVER' | 'EQUIPMENT' | 'COMPANY'
}

// Unified schema that validates both incident types
const incidentSchema = z.object({
  incidentType: z.enum(['ACCIDENT', 'ROADSIDE_INSPECTION']),
  incidentDate: z.string(),
  incidentTime: z.string().optional(),
  officerName: z.string().min(1, 'Officer/Inspector name is required'),
  agencyName: z.string().optional(),
  officerBadge: z.string().optional(),
  reportNumber: z.string().optional(),
  locationAddress: z.string().optional(),
  locationCity: z.string().optional(),
  locationState: z.string().optional(),
  locationZip: z.string().optional(),
  equipment: z.array(z.any()).default([]),
  violations: z.array(z.any()).default([]),
  // Type-specific data
  accidentData: z.any().optional(),
  roadsideData: z.any().optional(),
})

interface UnifiedIncidentFormProps {
  incidentType: IncidentType
  onSubmit: (data: any) => void
  onCancel?: () => void
  initialData?: any
  partyId?: string
}

export function UnifiedIncidentForm({ incidentType, onSubmit, onCancel, initialData, partyId }: UnifiedIncidentFormProps) {
  const [activeTab, setActiveTab] = useState('basic')
  const [isLoading, setIsLoading] = useState(false)
  
  const form = useForm({
    resolver: zodResolver(incidentSchema),
    defaultValues: {
      incidentType,
      incidentDate: new Date().toISOString().split('T')[0],
      incidentTime: '',
      officerName: '',
      agencyName: '',
      officerBadge: '',
      reportNumber: '',
      locationAddress: '',
      locationCity: '',
      locationState: '',
      locationZip: '',
      equipment: [],
      violations: [],
      accidentData: incidentType === 'ACCIDENT' ? {
        isFatality: false,
        isReportable: false,
        isInjury: false,
        isTow: false,
        isCitation: false,
        needsReport: false,
        needsDrugTest: false,
      } : undefined,
      roadsideData: incidentType === 'ROADSIDE_INSPECTION' ? {
        dvirReceived: false,
        entryMethod: 'Manual_Entry',
      } : undefined,
      ...initialData,
    },
  })

  const handleSubmit = async (data: any) => {
    setIsLoading(true)
    try {
      const payload = {
        ...data,
        partyId: partyId || initialData?.issue?.partyId
      }
      
      await onSubmit(payload)
    } catch (error) {
      console.error('Error submitting incident:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Equipment management
  const addEquipment = () => {
    const current = form.watch('equipment') || []
    form.setValue('equipment', [...current, {
      unitNumber: current.length + 1,
      unitType: '',
      make: '',
      model: '',
      year: undefined,
      plateNumber: '',
      vin: ''
    }])
  }

  const removeEquipment = (index: number) => {
    const current = form.watch('equipment') || []
    form.setValue('equipment', current.filter((_: any, i: number) => i !== index))
  }

  const updateEquipment = (index: number, field: string, value: any) => {
    const current = form.watch('equipment') || []
    const updated = current.map((eq: any, i: number) => 
      i === index ? { ...eq, [field]: value } : eq
    )
    form.setValue('equipment', updated)
  }

  // Violation management
  const addViolation = () => {
    const current = form.watch('violations') || []
    form.setValue('violations', [...current, {
      violationCode: '',
      description: '',
      outOfService: false,
      severity: 'WARNING'
    }])
  }

  const removeViolation = (index: number) => {
    const current = form.watch('violations') || []
    form.setValue('violations', current.filter((_: any, i: number) => i !== index))
  }

  const updateViolation = (index: number, field: string, value: any) => {
    const current = form.watch('violations') || []
    const updated = current.map((v: any, i: number) => 
      i === index ? { ...v, [field]: value } : v
    )
    form.setValue('violations', updated)
  }

  // Render accident-specific fields
  const renderAccidentFields = () => {
    const accidentData = form.watch('accidentData') || {}
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="accidentData.isFatality"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox 
                    checked={accidentData.isFatality || false} 
                    onCheckedChange={(checked) => 
                      form.setValue('accidentData', { ...accidentData, isFatality: checked })
                    } 
                  />
                </FormControl>
                <FormLabel>Fatality Involved</FormLabel>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="accidentData.isReportable"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox 
                    checked={accidentData.isReportable || false} 
                    onCheckedChange={(checked) => 
                      form.setValue('accidentData', { ...accidentData, isReportable: checked })
                    } 
                  />
                </FormControl>
                <FormLabel>Reportable Accident</FormLabel>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="accidentData.needsDrugTest"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox 
                    checked={accidentData.needsDrugTest || false} 
                    onCheckedChange={(checked) => 
                      form.setValue('accidentData', { ...accidentData, needsDrugTest: checked })
                    } 
                  />
                </FormControl>
                <FormLabel>Drug Test Required</FormLabel>
              </FormItem>
            )}
          />
        </div>
        
        {accidentData.isFatality && (
          <div>
            <FormLabel>Number of Fatalities</FormLabel>
            <Input
              type="number"
              value={accidentData.numberOfFatalities || ''}
              onChange={(e) => form.setValue('accidentData', { 
                ...accidentData, 
                numberOfFatalities: parseInt(e.target.value) || undefined 
              })}
            />
          </div>
        )}
      </div>
    )
  }

  // Render roadside inspection specific fields
  const renderRoadsideFields = () => {
    const roadsideData = form.watch('roadsideData') || {}
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormLabel>Inspection Level</FormLabel>
            <Select 
              value={roadsideData.inspectionLevel || ''} 
              onValueChange={(value) => form.setValue('roadsideData', { ...roadsideData, inspectionLevel: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Level_I">Level I - Full</SelectItem>
                <SelectItem value="Level_II">Level II - Walk-Around</SelectItem>
                <SelectItem value="Level_III">Level III - Driver Only</SelectItem>
                <SelectItem value="Level_IV">Level IV - Special</SelectItem>
                <SelectItem value="Level_V">Level V - Vehicle Only</SelectItem>
                <SelectItem value="Level_VI">Level VI - Enhanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <FormLabel>Overall Result</FormLabel>
            <Select 
              value={roadsideData.overallResult || ''} 
              onValueChange={(value) => form.setValue('roadsideData', { ...roadsideData, overallResult: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select result" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pass">Pass</SelectItem>
                <SelectItem value="Warning">Warning</SelectItem>
                <SelectItem value="OOS">Out of Service</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div>
          <FormLabel>Facility Name</FormLabel>
          <Input
            value={roadsideData.facilityName || ''}
            onChange={(e) => form.setValue('roadsideData', { ...roadsideData, facilityName: e.target.value })}
            placeholder="Company or facility name"
          />
        </div>
      </div>
    )
  }

  const equipment = form.watch('equipment') || []
  const violations = form.watch('violations') || []

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {incidentType === 'ACCIDENT' ? '🚗 Accident Report' : '🚛 Roadside Inspection'}
              <Badge variant="outline">
                {incidentType === 'ACCIDENT' ? 'Accident' : 'RSIN'}
              </Badge>
            </CardTitle>
            <CardDescription>
              {incidentType === 'ACCIDENT' 
                ? 'Document motor vehicle accident details and violations'
                : 'Record roadside inspection findings and violations'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="specific">
                  {incidentType === 'ACCIDENT' ? 'Accident Details' : 'Inspection Details'}
                </TabsTrigger>
                <TabsTrigger value="equipment">Equipment ({equipment.length})</TabsTrigger>
                <TabsTrigger value="violations">Violations ({violations.length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="incidentDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {incidentType === 'ACCIDENT' ? 'Accident Date' : 'Inspection Date'}
                        </FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="incidentTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {incidentType === 'ACCIDENT' ? 'Accident Time' : 'Inspection Time'}
                        </FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="officerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {incidentType === 'ACCIDENT' ? 'Officer Name' : 'Inspector Name'}
                        </FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="agencyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Agency Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Police dept, DOT, etc." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Location Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="locationAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Incident location" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="locationCity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="specific" className="space-y-4">
                {incidentType === 'ACCIDENT' ? renderAccidentFields() : renderRoadsideFields()}
              </TabsContent>
              
              <TabsContent value="equipment" className="space-y-4">
                <div className="space-y-4">
                  {equipment.map((eq: any, index: number) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium">Unit {eq.unitNumber}</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeEquipment(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <FormLabel>Make</FormLabel>
                          <Input
                            value={eq.make || ''}
                            onChange={(e) => updateEquipment(index, 'make', e.target.value)}
                            placeholder="Equipment make"
                          />
                        </div>
                        
                        <div>
                          <FormLabel>Model</FormLabel>
                          <Input
                            value={eq.model || ''}
                            onChange={(e) => updateEquipment(index, 'model', e.target.value)}
                            placeholder="Equipment model"
                          />
                        </div>
                        
                        <div>
                          <FormLabel>VIN</FormLabel>
                          <Input
                            value={eq.vin || ''}
                            onChange={(e) => updateEquipment(index, 'vin', e.target.value)}
                            placeholder="Vehicle identification number"
                          />
                        </div>
                        
                        <div>
                          <FormLabel>Plate Number</FormLabel>
                          <Input
                            value={eq.plateNumber || ''}
                            onChange={(e) => updateEquipment(index, 'plateNumber', e.target.value)}
                            placeholder="License plate"
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                  
                  <Button type="button" variant="outline" onClick={addEquipment} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Equipment
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="violations" className="space-y-4">
                <div className="space-y-4">
                  {violations.map((violation: any, index: number) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">Violation {index + 1}</h4>
                          {violation.outOfService && (
                            <Badge variant="destructive">OUT OF SERVICE</Badge>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeViolation(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <FormLabel>Violation Code</FormLabel>
                          <Input
                            value={violation.violationCode || ''}
                            onChange={(e) => updateViolation(index, 'violationCode', e.target.value)}
                            placeholder="392.2A(1)"
                          />
                        </div>
                        
                        <div>
                          <FormLabel>Severity</FormLabel>
                          <Select 
                            value={violation.severity || ''} 
                            onValueChange={(value) => updateViolation(index, 'severity', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select severity" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="WARNING">Warning</SelectItem>
                              <SelectItem value="CITATION">Citation</SelectItem>
                              <SelectItem value="CRIMINAL">Criminal</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="col-span-2">
                          <FormLabel>Description</FormLabel>
                          <Textarea
                            value={violation.description || ''}
                            onChange={(e) => updateViolation(index, 'description', e.target.value)}
                            placeholder="Detailed description of the violation"
                          />
                        </div>
                        
                        <div className="col-span-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              checked={violation.outOfService || false}
                              onCheckedChange={(checked) => updateViolation(index, 'outOfService', checked)}
                            />
                            <FormLabel>Out of Service</FormLabel>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                  
                  <Button type="button" variant="outline" onClick={addViolation} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Violation
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <div className="mr-2 h-4 w-4 animate-spin" />}
            Save {incidentType === 'ACCIDENT' ? 'Accident' : 'Inspection'}
          </Button>
        </div>
      </form>
    </Form>
  )
} 