'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { AppLayout } from '@/components/layouts/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { UnifiedIncidentForm } from '@/components/incidents/unified-incident-form'
import { DVIRUploadModal } from '@/components/incidents/dvir-upload-modal'
import { createIncidentFromDVIR, type DVIRDocument } from '@/lib/dvir-automation'
import { Plus, FileText, Truck, Zap, Upload } from 'lucide-react'
import { format } from 'date-fns'

interface Incident {
  id: string
  incidentType: 'ACCIDENT' | 'ROADSIDE_INSPECTION'
  incidentDate: string
  incidentTime?: string
  officerName: string
  agencyName?: string
  reportNumber?: string
  locationAddress?: string
  locationCity?: string
  accidentData?: any
  roadsideData?: any
  equipment: Array<{
    id: string
    unitNumber: number
    make?: string
    model?: string
    plateNumber?: string
    unitType?: string
  }>
  violations: Array<{
    id: string
    violationCode: string
    description: string
    outOfService: boolean
    severity?: string
    corrective_action_forms: Array<{
      id: string
      cafNumber: string
      status: string
    }>
  }>
  issue: {
    id: string
    title: string
    status: string
    priority: string
    createdAt: string
  }
}

export default function RoadsideInspectionsPage() {
  const searchParams = useSearchParams()
  const partyId = searchParams.get('partyId')
  
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isDVIRModalOpen, setIsDVIRModalOpen] = useState(false)
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
      const [dvirPrefilledData, setDvirPrefilledData] = useState<any>(null)

  const fetchIncidents = async () => {
    if (!partyId) return
    
    try {
      const res = await fetch(`/api/incidents?partyId=${partyId}&incidentType=ROADSIDE_INSPECTION`)
      if (res.ok) {
        const data = await res.json()
        setIncidents(data)
      }
    } catch (error) {
      console.error('Error fetching roadside inspections:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchIncidents()
  }, [partyId])

  const handleCreateIncident = async (data: any) => {
    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          incidentType: 'ROADSIDE_INSPECTION',
          partyId
        })
      })
      
      if (res.ok) {
        setIsCreateModalOpen(false)
        setDvirPrefilledData(null) // Clear any prefilled data
        fetchIncidents()
      } else {
        const error = await res.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error creating roadside inspection:', error)
      alert('Error creating roadside inspection')
    }
  }

  const handleDVIRProcessed = async (dvir: DVIRDocument) => {
    try {
      // Convert DVIR to incident format and create automatically
      const incident = await createIncidentFromDVIR(dvir, '', partyId || '')
      
      // Refresh the incidents list
      fetchIncidents()
      
      // Show success message
      alert(`RSIN created successfully from DVIR! Found ${dvir.violations?.length || 0} violations.`)
    } catch (error) {
      console.error('Error creating incident from DVIR:', error)
      alert('Error creating incident from DVIR')
    }
  }

  const generateCAFs = async (incidentId: string) => {
    try {
      const res = await fetch(`/api/incidents/${incidentId}/generate-cafs`, {
        method: 'POST'
      })
      
      if (res.ok) {
        const result = await res.json()
        alert(`Generated ${result.cafs?.length || 0} CAFs for this inspection`)
        fetchIncidents() // Refresh to show new CAFs
      } else {
        const error = await res.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error generating CAFs:', error)
      alert('Error generating CAFs')
    }
  }

  const getResultBadgeVariant = (result?: string) => {
    switch (result) {
      case 'Pass': return 'default'
      case 'Warning': return 'secondary'
      case 'OOS': return 'destructive'
      default: return 'outline'
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6">Loading roadside inspections...</div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Roadside Inspections</h1>
            <p className="text-muted-foreground">
              DOT roadside inspections and violation management
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New RSIN
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Roadside Inspection Report</DialogTitle>
                </DialogHeader>
                <UnifiedIncidentForm
                  incidentType="ROADSIDE_INSPECTION"
                  onSubmit={handleCreateIncident}
                  partyId={partyId || undefined}
                  initialData={dvirPrefilledData}
                />
              </DialogContent>
            </Dialog>
            
                            <Button variant="outline" onClick={() => setIsDVIRModalOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
                              Upload DVIR
            </Button>
          </div>
        </div>

        {incidents.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No roadside inspections recorded"
            description="Get started by creating your first roadside inspection report."
            action={{
              label: "Create RSIN Report",
              onClick: () => setIsCreateModalOpen(true),
              icon: Plus
            }}
          />
        ) : (
          <div className="grid gap-6">
            {incidents.map((incident) => (
              <Card key={incident.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Truck className="h-5 w-5 text-blue-500" />
                      <div>
                        <CardTitle className="text-lg">
                          {incident.issue.title}
                        </CardTitle>
                        <CardDescription>
                          {format(new Date(incident.incidentDate), 'MMM d, yyyy')}
                          {incident.incidentTime && ` at ${incident.incidentTime}`}
                          {incident.locationCity && ` • ${incident.locationCity}`}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={incident.issue.status === 'active' ? 'default' : 'secondary'}>
                        {incident.issue.status}
                      </Badge>
                      {incident.roadsideData?.overallResult && (
                        <Badge variant={getResultBadgeVariant(incident.roadsideData.overallResult)}>
                          {incident.roadsideData.overallResult}
                        </Badge>
                      )}
                      {incident.violations.length > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => generateCAFs(incident.id)}
                        >
                          <Zap className="h-4 w-4 mr-1" />
                          Generate CAFs
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="font-medium text-sm mb-2">Inspector Information</h4>
                      <p className="text-sm text-muted-foreground">
                        {incident.officerName}
                        {incident.agencyName && ` (${incident.agencyName})`}
                      </p>
                      {incident.reportNumber && (
                        <p className="text-xs text-muted-foreground">
                          Report: {incident.reportNumber}
                        </p>
                      )}
                      {incident.roadsideData?.inspectionLevel && (
                        <p className="text-xs text-muted-foreground">
                          {incident.roadsideData.inspectionLevel.replace('_', ' ')}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm mb-2">
                        Equipment ({incident.equipment.length})
                      </h4>
                      {incident.equipment.length > 0 ? (
                        <div className="space-y-1">
                          {incident.equipment.slice(0, 2).map((eq) => (
                            <p key={eq.id} className="text-sm text-muted-foreground">
                              Unit {eq.unitNumber}: {eq.unitType} {eq.make} {eq.model}
                              {eq.plateNumber && ` (${eq.plateNumber})`}
                            </p>
                          ))}
                          {incident.equipment.length > 2 && (
                            <p className="text-xs text-muted-foreground">
                              +{incident.equipment.length - 2} more
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No equipment recorded</p>
                      )}
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm mb-2">
                        Violations ({incident.violations.length})
                      </h4>
                      {incident.violations.length > 0 ? (
                        <div className="space-y-1">
                          {incident.violations.slice(0, 2).map((violation) => (
                            <div key={violation.id} className="flex items-center gap-2">
                              <p className="text-sm text-muted-foreground">
                                {violation.violationCode}
                              </p>
                              {violation.outOfService && (
                                <Badge variant="destructive" className="text-xs">OOS</Badge>
                              )}
                              {violation.corrective_action_forms.length > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  {violation.corrective_action_forms.length} CAF(s)
                                </Badge>
                              )}
                            </div>
                          ))}
                          {incident.violations.length > 2 && (
                            <p className="text-xs text-muted-foreground">
                              +{incident.violations.length - 2} more
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No violations recorded</p>
                      )}
                    </div>
                  </div>
                  
                  {incident.roadsideData && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center gap-4 text-sm">
                        {incident.roadsideData.facilityName && (
                          <span className="text-muted-foreground">
                            Facility: {incident.roadsideData.facilityName}
                          </span>
                        )}
                        {incident.roadsideData.dverReceived && (
                          <Badge variant="outline">DVER Received</Badge>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        <DVIRUploadModal
          isOpen={isDVIRModalOpen}
          onClose={() => setIsDVIRModalOpen(false)}
          onDVIRProcessed={handleDVIRProcessed}
        />
      </div>
    </AppLayout>
  )
} 