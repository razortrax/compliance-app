"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layouts/app-layout'
import { buildStandardDriverNavigation } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LicenseForm } from '@/components/licenses/license-form'
import { ActivityLog } from '@/components/ui/activity-log'
import { EmptyState } from '@/components/ui/empty-state'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
  Edit, Plus, FileText, IdCard, CheckCircle, AlertCircle, Clock
} from 'lucide-react'
import { format } from 'date-fns'

interface License {
  id: string
  licenseType: string
  licenseState: string
  licenseNumber: string
  certification: string
  startDate?: string | null
  expirationDate: string
  renewalDate?: string | null
  endorsements: any[]
  restrictions: any[]
  notes?: string | null
  issue: {
    id: string
    title: string
    description?: string | null
    status: string
    priority: string
  }
}

interface Organization {
  id: string
  name: string
}

interface Driver {
  id: string
  firstName: string
  lastName: string
  licenseNumber?: string
}

interface MasterOrg {
  id: string
  name: string
}

interface PageData {
  masterOrg: MasterOrg
  organization: Organization
  driver: Driver
  licenses: License[]
}

export default function MasterDriverLicensesPage() {
  const params = useParams()
  const router = useRouter()
  const masterOrgId = params.masterOrgId as string
  const orgId = params.orgId as string
  const driverId = params.driverId as string
  
  const [data, setData] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isRenewalDialogOpen, setIsRenewalDialogOpen] = useState(false)
  const [showAddAddonModal, setShowAddAddonModal] = useState(false)
  const [attachments, setAttachments] = useState<any[]>([])

  // Smart expiration status function - MVR Gold Standard
  const getExpirationStatus = (license: License) => {
    if (!license.expirationDate) {
      return {
        status: 'unknown',
        daysUntil: null,
        badge: <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          No Expiration
        </Badge>
      }
    }

    const expirationDate = new Date(license.expirationDate)
    const today = new Date()
    const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    const isExpired = daysUntilExpiration < 0
    
    // Check if this license has been renewed (has a newer license after it)
    const hasNewerLicense = data?.licenses.some(otherLicense => 
      otherLicense.id !== license.id && 
      otherLicense.licenseType === license.licenseType &&
      otherLicense.expirationDate && 
      license.expirationDate &&
      new Date(otherLicense.expirationDate) > new Date(license.expirationDate)
    ) || false

    // INACTIVE Licenses - Show status tags instead of expiration countdown
    if (hasNewerLicense) {
      // This license was renewed - show "Renewed" tag
      return {
        status: 'renewed',
        daysUntil: null,
        badge: <Badge className="flex items-center gap-1 bg-blue-100 text-blue-800 border-blue-200">
          <CheckCircle className="h-3 w-3" />
          Renewed
        </Badge>
      }
    } else if (isExpired) {
      // This license is expired and not renewed - show "Expired" tag
      return {
        status: 'expired',
        daysUntil: null,
        badge: <Badge variant="destructive" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Expired
        </Badge>
      }
    }

    // ACTIVE Licenses - Show expiration countdown with proper color coding
    if (daysUntilExpiration <= 30) {
      // Due within 30 days = Orange
      return {
        status: 'critical',
        daysUntil: daysUntilExpiration,
        badge: <Badge className="flex items-center gap-1 bg-orange-100 text-orange-800 border-orange-200">
          <Clock className="h-3 w-3" />
          {daysUntilExpiration}d
        </Badge>
      }
    } else if (daysUntilExpiration <= 60) {
      // Due within 60 days = Yellow
      return {
        status: 'warning',
        daysUntil: daysUntilExpiration,
        badge: <Badge className="flex items-center gap-1 bg-yellow-100 text-yellow-800 border-yellow-200">
          <Clock className="h-3 w-3" />
          {daysUntilExpiration}d
        </Badge>
      }
    } else {
      // Current and compliant = Green
      return {
        status: 'current',
        daysUntil: daysUntilExpiration,
        badge: <Badge className="flex items-center gap-1 bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="h-3 w-3" />
          Current
        </Badge>
      }
    }
  }

  useEffect(() => {
    fetchData()
    fetchOrganizations()
  }, [masterOrgId, orgId, driverId])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch page data using URL context - MVR Gold Standard pattern
      const response = await fetch(`/api/master/${masterOrgId}/organization/${orgId}/driver/${driverId}/licenses`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch driver license data')
      }
      
      const pageData = await response.json()
      setData(pageData)
      
      // Auto-select first license if available
      if (pageData.licenses?.length > 0) {
        setSelectedLicense(pageData.licenses[0])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations')
      if (response.ok) {
        const orgs = await response.json()
        setOrganizations(orgs)
      }
    } catch (error) {
      console.error('Error fetching organizations:', error)
    }
  }

  const handleOrganizationSelect = (org: Organization) => {
    console.log('Organization selected:', org.id)
  }

  const handleLicenseFormSuccess = (newLicense: any) => {
    console.log('License created successfully:', newLicense)
    // Refresh the license data
    setData(prev => {
      if (!prev) return prev
      return {
        ...prev,
        licenses: [...prev.licenses, newLicense]
      }
    })
    setIsAddDialogOpen(false)
    // Auto-select the new license
    if (newLicense) {
      setSelectedLicense(newLicense)
    }
  }

  const handleLicenseFormCancel = () => {
    setIsAddDialogOpen(false)
  }

  const handleEditSuccess = (updatedLicense: any) => {
    console.log('License updated successfully:', updatedLicense)
    // Update the license in the list
    setData(prev => {
      if (!prev) return prev
      return {
        ...prev,
        licenses: prev.licenses.map(license => 
          license.id === updatedLicense.id ? updatedLicense : license
        )
      }
    })
    setSelectedLicense(updatedLicense)
    setIsEditDialogOpen(false)
  }

  const handleRenewalSuccess = (renewedLicense: any) => {
    console.log('License renewed successfully:', renewedLicense)
    // Add the new renewed license to the list
    setData(prev => {
      if (!prev) return prev
      return {
        ...prev,
        licenses: [...prev.licenses, renewedLicense]
      }
    })
    setSelectedLicense(renewedLicense)
    setIsRenewalDialogOpen(false)
  }

  const refreshAttachments = async () => {
    if (selectedLicense?.issue.id) {
      try {
        const response = await fetch(`/api/attachments?issueId=${selectedLicense.issue.id}`)
        if (response.ok) {
          const data = await response.json()
          setAttachments(data)
        }
      } catch (error) {
        console.error('Error fetching attachments:', error)
      }
    }
  }

  useEffect(() => {
    if (selectedLicense?.issue.id) {
      refreshAttachments()
    } else {
      setAttachments([])
    }
  }, [selectedLicense])

  if (loading) {
    return (
      <AppLayout 
        name="Loading..."
        topNav={[]}
        className="p-6"
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AppLayout>
    )
  }

  if (error || !data) {
    return (
      <AppLayout 
        name="FleeTrax"
        topNav={[]}
        className="p-6"
      >
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Data</h2>
          <p className="text-gray-600">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      </AppLayout>
    )
  }

  // Build standard navigation with consistent Drivers | Equipment pattern
  const topNav = buildStandardDriverNavigation(
    { id: '', role: '' }, // User object - simplified for now
    data.masterOrg,
    data.organization,
    undefined, // No location context
    'drivers' // Current section is drivers
  )

  return (
      <AppLayout 
        name={data.masterOrg.name}
        topNav={topNav}
        organizations={organizations}
        onOrganizationSelect={handleOrganizationSelect}
        isSheetOpen={isSheetOpen}
        onSheetOpenChange={setIsSheetOpen}
        className="p-6"
      >
      <div className="max-w-7xl mx-auto h-full">
        {/* Driver and Licenses Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <p className="text-sm text-gray-600">{data.organization.name}</p>
            <h1 className="text-2xl font-bold text-gray-900">
              {data.driver.firstName} {data.driver.lastName} - Licenses
            </h1>
            {data.driver.licenseNumber && (
              <p className="text-sm text-gray-500">License: {data.driver.licenseNumber}</p>
            )}
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add License
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New License</DialogTitle>
              </DialogHeader>
              <div className="px-1">
                <LicenseForm
                  driverId={data.driver.id}
                  onSuccess={handleLicenseFormSuccess}
                  onCancel={handleLicenseFormCancel}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Split Pane Layout */}
        <div className="flex gap-6 h-[calc(100vh-200px)]">
          {/* Left Pane - License List */}
          <div className="w-[300px] flex-shrink-0">
            <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IdCard className="h-5 w-5" />
                Licenses ({data.licenses.length})
              </CardTitle>
              <CardDescription>
                License records for this driver
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
              {data.licenses.length === 0 ? (
                <EmptyState
                  icon={IdCard}
                  title="No licenses found"
                  description="This driver doesn't have any license records yet."
                />
              ) : (
                <div className="space-y-3">
                  {[...data.licenses]
                    .sort((a, b) => {
                      // First, sort by active status (expired licenses go to bottom)
                      const aExpired = a.expirationDate ? new Date(a.expirationDate) < new Date() : false
                      const bExpired = b.expirationDate ? new Date(b.expirationDate) < new Date() : false
                      
                      if (aExpired !== bExpired) {
                        return aExpired ? 1 : -1 // Active licenses first
                      }
                      
                      // Then sort by expiration date (newest first within each group)
                      const aDate = a.expirationDate ? new Date(a.expirationDate) : new Date(0)
                      const bDate = b.expirationDate ? new Date(b.expirationDate) : new Date(0)
                      return bDate.getTime() - aDate.getTime()
                    })
                    .map((license) => (
                    <div
                      key={license.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedLicense?.id === license.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedLicense(license)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{license.licenseType} - {license.licenseState}</h3>
                        {getExpirationStatus(license).badge}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Number: {license.licenseNumber}</p>
                        {license.renewalDate && (
                          <p>Renewal: {format(new Date(license.renewalDate), 'MMM d, yyyy')}</p>
                        )}
                        {license.expirationDate && (
                          <p>Expires: {format(new Date(license.expirationDate), 'MMM d, yyyy')}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            </Card>
          </div>

          {/* Right Pane - License Details */}
          <div className="flex-1">
            <Card className="h-full">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>License Details</CardTitle>
                  <CardDescription>
                    {selectedLicense ? 'Details for selected license' : 'Select a license to view details'}
                  </CardDescription>
                </div>
                {selectedLicense && (
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsEditDialogOpen(true)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => setIsRenewalDialogOpen(true)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Renew
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="overflow-y-auto max-h-[calc(100%-120px)]">
              {selectedLicense ? (
                <div className="space-y-6">
                  {/* License Information */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Type:</span>
                        <span className="ml-2">{selectedLicense.licenseType}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">State:</span>
                        <span className="ml-2">{selectedLicense.licenseState}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Number:</span>
                        <span className="ml-2">{selectedLicense.licenseNumber}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Certification:</span>
                        <span className="ml-2">{selectedLicense.certification}</span>
                      </div>
                      {selectedLicense.startDate && (
                        <div>
                          <span className="font-medium text-gray-700">Start Date:</span>
                          <span className="ml-2">{format(new Date(selectedLicense.startDate), 'MMM dd, yyyy')}</span>
                        </div>
                      )}
                      {selectedLicense.expirationDate && (
                        <div>
                          <span className="font-medium text-gray-700">Expiration Date:</span>
                          <span className="ml-2">{format(new Date(selectedLicense.expirationDate), 'MMM dd, yyyy')}</span>
                        </div>
                      )}
                      {selectedLicense.renewalDate && (
                        <div>
                          <span className="font-medium text-gray-700">Renewal Date:</span>
                          <span className="ml-2">{format(new Date(selectedLicense.renewalDate), 'MMM dd, yyyy')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Enhanced Activity Log */}
                  <ActivityLog 
                    issueId={selectedLicense.issue.id}
                    title="Activity Log"
                    allowedTypes={['note', 'communication', 'url', 'credential', 'attachment']}
                    compact={false}
                    maxHeight="400px"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <IdCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a license record</h3>
                    <p className="text-gray-600">Choose a license from the list to view its details</p>
                  </div>
                </div>
              )}
            </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit License Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit License</DialogTitle>
          </DialogHeader>
          <div className="px-1">
            <LicenseForm
              license={selectedLicense}
              onSuccess={handleEditSuccess}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Renewal License Dialog */}
      <Dialog open={isRenewalDialogOpen} onOpenChange={setIsRenewalDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Renew License</DialogTitle>
          </DialogHeader>
          <div className="px-1">
            <LicenseForm
              renewingLicense={selectedLicense}
              onSuccess={handleRenewalSuccess}
              onCancel={() => setIsRenewalDialogOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>


    </AppLayout>
  )
} 