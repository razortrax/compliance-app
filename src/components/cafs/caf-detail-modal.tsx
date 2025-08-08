'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { ActivityLog } from '@/components/ui/activity-log'
import DigitalSignature from '@/components/cafs/digital-signature'
import CAFAttachments from '@/components/cafs/caf-attachments'
import { downloadPDF } from '@/lib/pdf-generator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  User, 
  Calendar,
  Edit,
  Download,
  Upload,
  Send,
  ArrowRight,
  PenTool,
  Shield,
  Play,
  Check,
  ThumbsUp,
  ChevronDown
} from 'lucide-react'

interface CAF {
  id: string
  cafNumber: string
  incidentId: string
  violationType: string
  violationCodes: string[]
  violationSummary: string
  title?: string
  description?: string
  priority: string
  category: string
  status: string
  assignedStaffId?: string
  assignedBy?: string
  organizationId: string
  dueDate?: string
  completionNotes?: string
  completedAt?: string
  approvedAt?: string
  approvedBy?: string
  createdAt: string
  updatedAt: string
  assigned_staff?: {
    id: string
    position: string
    canSignCAFs?: boolean
    canApproveCAFs?: boolean
    party: {
      person: {
        firstName: string
        lastName: string
      }
    }
  }
  created_by_staff?: {
    id: string
    canApproveCAFs?: boolean
    party: {
      person: {
        firstName: string
        lastName: string
      }
    }
  }
  approved_by_staff?: {
    party: {
      person: {
        firstName: string
        lastName: string
      }
    }
  }
  organization?: {
    id: string
    name: string
  }
  signatures?: Array<{
    id: string
    signatureType: string
    signedAt: string
    staff: {
      party: {
        person: {
          firstName: string
          lastName: string
        }
      }
    }
  }>
  maintenanceIssueId?: string // Added for maintenance work order integration
}

interface CAFDetailModalProps {
  cafId?: string
  onClose: () => void
}

export default function CAFDetailModal({ cafId, onClose }: CAFDetailModalProps) {
  const [caf, setCAF] = useState<CAF | null>(null)
  const [activeTab, setActiveTab] = useState('details')
  const [isEditing, setIsEditing] = useState(false)
  const [editNotes, setEditNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [completionNotes, setCompletionNotes] = useState('')
  const [showSignatureModal, setShowSignatureModal] = useState(false)
  const [signatureType, setSignatureType] = useState<'COMPLETION' | 'APPROVAL'>('COMPLETION')

  // Fetch CAF data
  useEffect(() => {
    if (cafId) {
      fetchCAF()
      fetchCurrentUser()
    }
  }, [cafId])

  const fetchCAF = async () => {
    try {
      const response = await fetch(`/api/corrective-action-forms/${cafId}`)
      if (response.ok) {
        const data = await response.json()
        setCAF(data)
        setCompletionNotes(data.completionNotes || '')
      }
    } catch (error) {
      console.error('Error fetching CAF:', error)
    }
  }

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/user/caf-permissions')
      if (response.ok) {
        const data = await response.json()
        setCurrentUser(data)
      }
    } catch (error) {
      console.error('Error fetching user permissions:', error)
    }
  }

  // Handle status transitions
  const handleStatusChange = async (newStatus: string, notes?: string) => {
    if (!caf || !currentUser) return

    setIsSubmitting(true)
    try {
      const payload: any = {
        status: newStatus
      }

      if (newStatus === 'COMPLETED' && notes) {
        payload.completionNotes = notes
        payload.completedAt = new Date().toISOString()
      }

      if (newStatus === 'APPROVED') {
        payload.approvedAt = new Date().toISOString()
        payload.approvedBy = currentUser.staff?.id || currentUser.id
      }

      const response = await fetch(`/api/corrective-action-forms/${caf.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        await fetchCAF() // Refresh data
      } else {
        console.error('Failed to update CAF status')
      }
    } catch (error) {
      console.error('Error updating CAF status:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Open signature modal
  const openSignatureModal = (type: 'COMPLETION' | 'APPROVAL') => {
    setSignatureType(type)
    setShowSignatureModal(true)
  }

  // Handle digital signature completion
  const handleSignatureComplete = async (signatureData: {
    digitalSignature: string
    signedBy: string
    notes?: string
  }) => {
    if (!caf || !currentUser) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/corrective-action-forms/${caf.id}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signatureType,
          staffId: currentUser.staff?.id || currentUser.id,
          digitalSignature: signatureData.digitalSignature,
          notes: signatureData.notes
        })
      })

      if (response.ok) {
        await fetchCAF() // Refresh data
        setShowSignatureModal(false)
        
        // Auto-advance status if appropriate
        if (signatureType === 'COMPLETION' && caf.status === 'IN_PROGRESS') {
          await handleStatusChange('COMPLETED')
        }
      } else {
        console.error('Failed to sign CAF')
      }
    } catch (error) {
      console.error('Error signing CAF:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle PDF export
  const handleExportPDF = async (format: 'fillable' | 'completed' = 'fillable') => {
    if (!caf) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/corrective-action-forms/${caf.id}/pdf?format=${format}&download=true`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        
        // Get filename from Content-Disposition header
        const contentDisposition = response.headers.get('Content-Disposition')
        const filename = contentDisposition 
          ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
          : `CAF_${caf.cafNumber}_${format}_${new Date().toISOString().split('T')[0]}.pdf`
        
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      } else {
        console.error('Failed to generate PDF')
        alert('Failed to generate PDF. Please try again.')
      }
    } catch (error) {
      console.error('Error exporting PDF:', error)
      alert('Error generating PDF. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle maintenance work order creation
  const handleCreateMaintenanceWorkOrder = async () => {
    if (!caf) return

    setIsSubmitting(true)
    try {
      // Create maintenance work order linked to this CAF
      const workOrderData = {
        cafId: caf.id,
        equipmentId: caf.incidentId, // Assuming incidentId contains equipment reference
        issueType: 'CORRECTIVE_ACTION',
        priority: caf.priority,
        description: `Maintenance required for CAF ${caf.cafNumber}: ${caf.violationSummary}`,
        violationCodes: caf.violationCodes,
        dueDate: caf.dueDate,
        assignedStaffId: caf.assignedStaffId
      }

      const response = await fetch('/api/maintenance-issues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(workOrderData)
      })

      if (response.ok) {
        const maintenanceIssue = await response.json()
        
        // Update CAF to link to maintenance issue
        const updateResponse = await fetch(`/api/corrective-action-forms/${caf.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            maintenanceIssueId: maintenanceIssue.id,
            requiresMaintenance: true
          })
        })

        if (updateResponse.ok) {
          // Refresh CAF data
          await fetchCAF()
          alert('Maintenance work order created successfully!')
        } else {
          console.error('Failed to link CAF to maintenance issue')
          alert('Work order created but failed to link to CAF.')
        }
      } else {
        const error = await response.json()
        console.error('Failed to create maintenance work order:', error)
        alert(`Failed to create work order: ${error.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error creating maintenance work order:', error)
      alert('Error creating work order. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Check user permissions
  const canStartWork = () => {
    if (!caf || !currentUser) return false
    return caf.assignedStaffId === (currentUser.staff?.id || currentUser.id) && caf.status === 'ASSIGNED'
  }

  const canComplete = () => {
    if (!caf || !currentUser) return false
    return caf.assignedStaffId === (currentUser.staff?.id || currentUser.id) && caf.status === 'IN_PROGRESS'
  }

  const canSign = () => {
    if (!caf || !currentUser) return false
    const hasSignature = caf.signatures?.some(sig => 
      sig.signatureType === 'COMPLETION' && sig.staff.party.person.firstName === currentUser.staff?.party?.person?.firstName
    )
    return caf.status === 'COMPLETED' && !hasSignature && 
           (currentUser.staff?.canSignCAFs || currentUser.canSignCAFs)
  }

  const canApprove = () => {
    if (!caf || !currentUser) return false
    const hasCompletionSignature = caf.signatures?.some(sig => sig.signatureType === 'COMPLETION')
    return caf.status === 'COMPLETED' && hasCompletionSignature && 
           (currentUser.staff?.canApproveCAFs || currentUser.canApproveCAFs || currentUser.userType === 'master')
  }

  // Get status info for styling
  function getStatusInfo(status: string) {
    switch (status) {
      case 'ASSIGNED':
        return { variant: 'secondary' as const, icon: Clock, label: 'Assigned', color: 'text-yellow-600' }
      case 'IN_PROGRESS':
        return { variant: 'default' as const, icon: AlertTriangle, label: 'In Progress', color: 'text-orange-600' }
      case 'COMPLETED':
        return { variant: 'default' as const, icon: CheckCircle, label: 'Completed', color: 'text-green-600' }
      case 'APPROVED':
        return { variant: 'default' as const, icon: CheckCircle, label: 'Approved', color: 'text-green-600' }
      case 'REJECTED':
        return { variant: 'destructive' as const, icon: XCircle, label: 'Rejected', color: 'text-red-600' }
      default:
        return { variant: 'secondary' as const, icon: Clock, label: status, color: 'text-gray-600' }
    }
  }

  // Get priority styling
  function getPriorityColor(priority: string) {
    switch (priority) {
      case 'HIGH': return 'text-red-600 bg-red-50 border-red-200'
      case 'MEDIUM': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'LOW': return 'text-green-600 bg-green-50 border-green-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  // Get staff display name
  const getStaffDisplayName = () => {
    if (!currentUser?.staff?.party?.person) return 'Unknown User'
    return `${currentUser.staff.party.person.firstName} ${currentUser.staff.party.person.lastName}`
  }

  if (!caf) return null

  const statusInfo = getStatusInfo(caf.status)
  const StatusIcon = statusInfo.icon

  return (
    <>
      <Dialog open={!!cafId} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
            <div className="flex items-center justify-between pr-10">
              <div className="flex items-center gap-4">
                <DialogTitle className="text-xl font-semibold">
                  {caf.cafNumber}
                </DialogTitle>
                <Badge variant={statusInfo.variant} className="flex items-center gap-1">
                  <StatusIcon className="h-3 w-3" />
                  {statusInfo.label}
                </Badge>
                <Badge variant="outline" className={getPriorityColor(caf.priority)}>
                  {caf.priority} Priority
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Export PDF
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleExportPDF('fillable')}>
                      <Download className="h-4 w-4 mr-2" />
                      Export Fillable PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExportPDF('completed')}>
                      <Download className="h-4 w-4 mr-2" />
                      Export Completed PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
                  <Edit className="h-4 w-4 mr-1" />
                  {isEditing ? 'Cancel' : 'Edit'}
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="mx-6 mt-4 grid w-full grid-cols-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="progress">Progress</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-auto p-6">
                <TabsContent value="details" className="mt-0 space-y-6">
                  {/* Assignment & Organization Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Assignment Details</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Assigned To:</span>
                            <span className="font-medium">
                              {caf.assigned_staff?.party?.person?.firstName} {caf.assigned_staff?.party?.person?.lastName}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Position:</span>
                            <span className="font-medium">{caf.assigned_staff?.position || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Organization:</span>
                            <span className="font-medium">{caf.organization?.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Created By:</span>
                            <span className="font-medium">
                              {caf.created_by_staff?.party?.person?.firstName} {caf.created_by_staff?.party?.person?.lastName}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Timeline</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Created:</span>
                            <span className="font-medium">{new Date(caf.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Due Date:</span>
                            <span className="font-medium">
                              {caf.dueDate ? new Date(caf.dueDate).toLocaleDateString() : 'Not set'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Last Updated:</span>
                            <span className="font-medium">{new Date(caf.updatedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Violation Summary</h4>
                    <div className="bg-gray-50 p-3 rounded border">
                      <p className="text-sm">{caf.violationSummary}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Violation Codes</h4>
                    <div className="flex flex-wrap gap-2">
                      {caf.violationCodes.map((code, index) => (
                        <Badge key={index} variant="outline">{code}</Badge>
                      ))}
                    </div>
                  </div>

                  {caf.description && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                      <div className="bg-gray-50 p-3 rounded border">
                        <p className="text-sm">{caf.description}</p>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="progress" className="mt-0 space-y-6">
                  {/* Status Progress Bar */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Workflow Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between mb-6">
                        {['ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'APPROVED'].map((status, index) => {
                          const isActive = caf.status === status
                          const isCompleted = ['ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'APPROVED'].indexOf(caf.status) > index
                          
                          return (
                            <div key={status} className="flex items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                isActive 
                                  ? 'bg-blue-600 text-white' 
                                  : isCompleted 
                                    ? 'bg-green-600 text-white' 
                                    : 'bg-gray-200 text-gray-600'
                              }`}>
                                {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
                              </div>
                              <span className={`ml-2 text-sm ${isActive ? 'font-medium' : ''}`}>
                                {status.replace('_', ' ')}
                              </span>
                              {index < 3 && (
                                <ArrowRight className={`mx-4 h-4 w-4 ${
                                  isCompleted ? 'text-green-600' : 'text-gray-300'
                                }`} />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Action Buttons */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Available Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {canStartWork() && (
                          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-blue-900">Ready to Start Work</h4>
                                <p className="text-sm text-blue-700">Begin working on this corrective action.</p>
                              </div>
                              <Button 
                                onClick={() => handleStatusChange('IN_PROGRESS')}
                                disabled={isSubmitting}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                <Play className="h-4 w-4 mr-2" />
                                Start Work
                              </Button>
                            </div>
                          </div>
                        )}

                        {canComplete() && (
                          <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                            <div className="space-y-3">
                              <div>
                                <h4 className="font-medium text-orange-900">Mark as Completed</h4>
                                <p className="text-sm text-orange-700">Add completion notes and mark work as done.</p>
                              </div>
                              <Textarea
                                placeholder="Describe what was completed and any relevant details..."
                                value={completionNotes}
                                onChange={(e) => setCompletionNotes(e.target.value)}
                                className="min-h-[80px]"
                              />
                              <Button 
                                onClick={() => handleStatusChange('COMPLETED', completionNotes)}
                                disabled={isSubmitting || !completionNotes.trim()}
                                className="bg-orange-600 hover:bg-orange-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Mark Complete
                              </Button>
                            </div>
                          </div>
                        )}

                        {canSign() && (
                          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-green-900">Supervisor Signature Required</h4>
                                <p className="text-sm text-green-700">Review and digitally sign to confirm completion.</p>
                              </div>
                              <Button 
                                onClick={() => openSignatureModal('COMPLETION')}
                                disabled={isSubmitting}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <PenTool className="h-4 w-4 mr-2" />
                                Sign CAF
                              </Button>
                            </div>
                          </div>
                        )}

                        {canApprove() && (
                          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-purple-900">Final Approval</h4>
                                <p className="text-sm text-purple-700">Review signed CAF and give final approval.</p>
                              </div>
                              <Button 
                                onClick={() => handleStatusChange('APPROVED')}
                                disabled={isSubmitting}
                                className="bg-purple-600 hover:bg-purple-700"
                              >
                                <Shield className="h-4 w-4 mr-2" />
                                Approve
                              </Button>
                            </div>
                          </div>
                        )}

                        {caf.status === 'APPROVED' && (
                          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center">
                              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                              <div>
                                <h4 className="font-medium text-green-900">CAF Completed</h4>
                                <p className="text-sm text-green-700">
                                  This corrective action has been completed and approved.
                                  {caf.approvedAt && ` Approved on ${new Date(caf.approvedAt).toLocaleDateString()}.`}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Signatures */}
                  {caf.signatures && caf.signatures.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Digital Signatures</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {caf.signatures.map((signature) => (
                            <div key={signature.id} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                              <div className="flex items-center gap-3">
                                <PenTool className="h-4 w-4 text-gray-600" />
                                <div>
                                  <p className="font-medium">
                                    {signature.staff.party.person.firstName} {signature.staff.party.person.lastName}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {signature.signatureType === 'COMPLETION' ? 'Supervisor Signature' : 'Approval Signature'}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium">{new Date(signature.signedAt).toLocaleDateString()}</p>
                                <p className="text-xs text-gray-600">{new Date(signature.signedAt).toLocaleTimeString()}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Completion Notes */}
                  {caf.completionNotes && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Completion Notes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-gray-50 p-3 rounded border">
                          <p className="text-sm">{caf.completionNotes}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Maintenance Work Order Integration - Only for Equipment CAFs */}
                  {(caf.category === 'EQUIPMENT_MAINTENANCE' || caf.violationType === 'Equipment') && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">Maintenance Work Orders</h4>
                        {caf.status !== 'APPROVED' && caf.status !== 'CANCELLED' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCreateMaintenanceWorkOrder()}
                            disabled={isSubmitting}
                          >
                            <ArrowRight className="h-4 w-4 mr-1" />
                            Create Work Order
                          </Button>
                        )}
                      </div>
                      {caf.maintenanceIssueId ? (
                        <div className="bg-blue-50 border border-blue-200 p-3 rounded">
                          <div className="flex items-center gap-2 mb-2">
                            <Shield className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-800">
                              Maintenance Work Order Created
                            </span>
                          </div>
                          <p className="text-xs text-blue-700">
                            This CAF is linked to a maintenance work order. 
                            <button 
                              className="ml-1 underline hover:no-underline"
                              onClick={() => window.open(`/maintenance-issues/${caf.maintenanceIssueId}`, '_blank')}
                            >
                              View Work Order →
                            </button>
                          </p>
                        </div>
                      ) : (
                        <div className="bg-gray-50 p-3 rounded border">
                          <p className="text-sm text-gray-600">
                            No maintenance work order created yet. Equipment-related violations typically require maintenance actions.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="documents" className="mt-0">
                  <CAFAttachments
                    cafId={caf.id}
                    cafStatus={caf.status}
                    isReadOnly={caf.status === 'APPROVED' || caf.status === 'CANCELLED'}
                    onAttachmentAdded={() => {
                      // Refresh CAF data to update any counts or status
                      fetchCAF()
                    }}
                  />
                </TabsContent>

                <TabsContent value="activity" className="mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle>Activity Log</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ActivityLog 
                        cafId={caf.id}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* Digital Signature Modal */}
      <Dialog open={showSignatureModal} onOpenChange={setShowSignatureModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Digital Signature Required</DialogTitle>
          </DialogHeader>
          <DigitalSignature
            cafId={caf?.id || ''}
            signatureType={signatureType}
            staffId={currentUser?.staff?.id || currentUser?.id || ''}
            staffName={getStaffDisplayName()}
            onSignatureComplete={handleSignatureComplete}
            onCancel={() => setShowSignatureModal(false)}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>
    </>
  )
} 