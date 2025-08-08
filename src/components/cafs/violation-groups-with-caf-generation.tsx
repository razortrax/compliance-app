'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Users, Truck, Building2, AlertTriangle, CheckCircle, FileText, Plus, Clock, ExternalLink } from 'lucide-react'
import { groupViolationsByType, createCAF, type ViolationGroup, type CAFGenerationRequest } from '@/lib/caf-utils'

interface ExistingCAF {
  id: string
  cafNumber: string
  violationType: string
  status: string
  createdAt: string
}

interface ViolationGroupsWithCAFGenerationProps {
  incident: any
  violations: any[]
  organizationId: string
  onCAFCreated?: (caf: any) => void
  onCAFClick?: (caf: ExistingCAF) => void // New prop for clicking existing CAFs
}

export default function ViolationGroupsWithCAFGeneration({ 
  incident, 
  violations, 
  organizationId, 
  onCAFCreated,
  onCAFClick 
}: ViolationGroupsWithCAFGenerationProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set<string>())
  const [generatingCAF, setGeneratingCAF] = useState<string | null>(null)
  const [showCAFDialog, setShowCAFDialog] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<ViolationGroup | null>(null)
  const [generatedCAFs, setGeneratedCAFs] = useState<Set<string>>(new Set<string>())
  const [existingCAFs, setExistingCAFs] = useState<ExistingCAF[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch existing CAFs for this incident
  useEffect(() => {
    async function fetchExistingCAFs() {
      try {
        const response = await fetch(`/api/corrective-action-forms?incidentId=${incident.id}`)
        if (response.ok) {
          const cafs = await response.json()
          setExistingCAFs(cafs)
          
          // Mark violation types that already have CAFs
          const existingTypes = new Set<string>(cafs.map((caf: any) => caf.violationType))
          setGeneratedCAFs(existingTypes)
        }
      } catch (error) {
        console.error('Error fetching existing CAFs:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchExistingCAFs()
  }, [incident.id])

  // Get existing CAF for a violation type
  function getExistingCAF(violationType: string): ExistingCAF | undefined {
    return existingCAFs.find(caf => {
      // Handle different violation type formats
      if (violationType === 'Driver') {
        return caf.violationType === 'Driver_Performance' || caf.violationType === 'Driver_Qualification'
      }
      return caf.violationType === violationType
    })
  }

  // Get CAF status badge
  function getCAFStatusBadge(caf: ExistingCAF) {
    switch (caf.status) {
      case 'ASSIGNED':
        return <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Assigned
        </Badge>
      case 'IN_PROGRESS':
        return <Badge variant="default" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          In Progress
        </Badge>
      case 'COMPLETED':
      case 'APPROVED':
        return <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3" />
          {caf.status === 'COMPLETED' ? 'Completed' : 'Approved'}
        </Badge>
      default:
        return <Badge variant="outline">{caf.status}</Badge>
    }
  }

  const violationGroups = groupViolationsByType(violations)

  const toggleGroup = (groupType: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupType)) {
      newExpanded.delete(groupType)
    } else {
      newExpanded.add(groupType)
    }
    setExpandedGroups(newExpanded)
  }

  const handleGenerateCAF = async (group: ViolationGroup) => {
    setGeneratingCAF(group.type)
    
    try {
      const violationCodes = group.violations.map(v => v.violationCode)
      
      const request: CAFGenerationRequest = {
        incidentId: incident.id,
        violationType: group.type,
        violationCodes,
        organizationId
      }

      const caf = await createCAF(request)
      
      // Mark this group as having a CAF generated
      setGeneratedCAFs((prev) => {
        const next = new Set<string>(prev)
        next.add(group.type)
        return next
      })
      
      if (onCAFCreated) {
        onCAFCreated(caf)
      }

      // Show success message
      alert(`${group.title} CAF created successfully!\nCAF Number: ${caf.cafNumber}`)
      
    } catch (error: any) {
      console.error('Error generating CAF:', error)
      alert(`Failed to generate CAF: ${error.message}`)
    } finally {
      setGeneratingCAF(null)
    }
  }

  const getGroupIcon = (iconName: string) => {
    switch (iconName) {
      case 'Users': return Users
      case 'Truck': return Truck  
      case 'Building2': return Building2
      default: return AlertTriangle
    }
  }

  const getGroupColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-50 border-blue-200 text-blue-700'
      case 'orange':
        return 'bg-orange-50 border-orange-200 text-orange-700'
      case 'purple':
        return 'bg-purple-50 border-purple-200 text-purple-700'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700'
    }
  }

  const hasCAFGenerated = (groupType: string) => generatedCAFs.has(groupType)

  if (violationGroups.length === 0) {
    return (
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          No violations found that require corrective action.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with Generate All CAFs button */}
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-900">
          Corrective Action Forms ({violationGroups.length} type{violationGroups.length > 1 ? 's' : ''})
        </h4>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            violationGroups.forEach(group => {
              if (!hasCAFGenerated(group.type)) {
                handleGenerateCAF(group)
              }
            })
          }}
          disabled={violationGroups.every(group => hasCAFGenerated(group.type)) || generatingCAF !== null}
        >
          <Plus className="h-4 w-4 mr-2" />
          Generate All CAFs
        </Button>
      </div>

      {/* Violation Groups */}
      {violationGroups.map((group) => {
        const Icon = getGroupIcon(group.icon)
        const isExpanded = expandedGroups.has(group.type)
        const isGenerating = generatingCAF === group.type
        const hasCAF = hasCAFGenerated(group.type)
        
        return (
          <Card key={group.type} className={`transition-all ${getGroupColorClasses(group.color)}`}>
            <CardHeader 
              className="cursor-pointer select-none"
              onClick={() => toggleGroup(group.type)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5" />
                  <div>
                    <h3 className="font-medium text-gray-900">{group.title}</h3>
                    <p className="text-sm text-gray-600">
                      {group.violations.length} violation{group.violations.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {(() => {
                    const existingCAF = getExistingCAF(group.type)
                    
                    if (existingCAF) {
                      // Show existing CAF status and click to view
                      return (
                        <div className="flex items-center gap-2">
                          {getCAFStatusBadge(existingCAF)}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              onCAFClick?.(existingCAF)
                            }}
                            className="flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            {existingCAF.cafNumber}
                          </Button>
                        </div>
                      )
                    } else {
                      // Show generate CAF button
                      return (
                        <Button
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation()
                            handleGenerateCAF(group)
                          }}
                          disabled={isGenerating || generatedCAFs.has(group.type)}
                        >
                          {isGenerating && generatingCAF === group.type ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                              Generating...
                            </>
                          ) : generatedCAFs.has(group.type) ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              CAF Created
                            </>
                          ) : (
                            <>
                              <Plus className="h-3 w-3 mr-1" />
                              Generate CAF
                            </>
                          )}
                        </Button>
                      )
                    }
                  })()}
                </div>
              </div>
            </CardHeader>
            
            {isExpanded && (
              <CardContent className="space-y-3">
                {group.violations.map((violation) => (
                  <div key={violation.id} className="bg-white/70 border border-white/50 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">{violation.violationCode}</span>
                          {violation.unitNumber && (
                            <span className="text-sm text-gray-500">• Unit {violation.unitNumber}</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">{violation.description}</p>
                      </div>
                      
                      <div className="flex flex-col gap-1 ml-4">
                        {violation.outOfService && (
                          <Badge variant="destructive" className="text-xs">OUT OF SERVICE</Badge>
                        )}
                        {violation.severity && (
                          <Badge variant="secondary" className="text-xs">{violation.severity}</Badge>
                        )}
                      </div>
                    </div>

                    {/* Inspector Comments */}
                    {violation.inspectorComments && (
                      <div className="border-t border-white/50 pt-2 mt-2">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Inspector Comments</span>
                        <p className="text-sm text-gray-700 mt-1">{violation.inspectorComments}</p>
                      </div>
                    )}

                    {/* Citation Number */}
                    {violation.citationNumber && (
                      <div className="border-t border-white/50 pt-2 mt-2">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Citation</span>
                        <p className="text-sm text-gray-700 mt-1">{violation.citationNumber}</p>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
} 