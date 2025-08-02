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
import { CalendarIcon, Plus, Trash2 } from 'lucide-react'

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
  // Type-specific data
  accidentData: z.any().optional(),
  roadsideData: z.any().optional(),
})

interface IncidentFormProps {
  incidentType: IncidentType
  onSubmit: (data: any) => void
  initialData?: any
}

export function IncidentForm({ incidentType, onSubmit, initialData }: IncidentFormProps) {
  const [activeTab, setActiveTab] = useState('basic')
  
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

  // Render accident-specific fields
  const renderAccidentFields = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="accidentData.isFatality"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
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
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel>Reportable Accident</FormLabel>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="accidentData.isInjury"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel>Injury Involved</FormLabel>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="accidentData.needsDrugTest"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel>Drug Test Required</FormLabel>
            </FormItem>
          )}
        />
      </div>
      
      {form.watch('accidentData.isFatality') && (
        <FormField
          control={form.control}
          name="accidentData.numberOfFatalities"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Number of Fatalities</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  )

  // Render roadside inspection specific fields
  const renderRoadsideFields = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="roadsideData.inspectionLevel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Inspection Level</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Level_I">Level I - Full</SelectItem>
                  <SelectItem value="Level_II">Level II - Walk-Around</SelectItem>
                  <SelectItem value="Level_III">Level III - Driver Only</SelectItem>
                  <SelectItem value="Level_IV">Level IV - Special</SelectItem>
                  <SelectItem value="Level_V">Level V - Vehicle Only</SelectItem>
                  <SelectItem value="Level_VI">Level VI - Enhanced</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="roadsideData.overallResult"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Overall Result</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select result" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Pass">Pass</SelectItem>
                  <SelectItem value="Warning">Warning</SelectItem>
                  <SelectItem value="OOS">Out of Service</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      <FormField
        control={form.control}
        name="roadsideData.facilityName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Facility Name</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Company or facility name" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                <TabsTrigger value="equipment">Equipment</TabsTrigger>
                <TabsTrigger value="violations">Violations</TabsTrigger>
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
              </TabsContent>
              
              <TabsContent value="specific" className="space-y-4">
                {incidentType === 'ACCIDENT' ? renderAccidentFields() : renderRoadsideFields()}
              </TabsContent>
              
              <TabsContent value="equipment" className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Equipment involvement tracking (shared component)
                </div>
              </TabsContent>
              
              <TabsContent value="violations" className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Violations and CAF generation (shared component)
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline">
            Cancel
          </Button>
          <Button type="submit">
            Save {incidentType === 'ACCIDENT' ? 'Accident' : 'Inspection'}
          </Button>
        </div>
      </form>
    </Form>
  )
} 