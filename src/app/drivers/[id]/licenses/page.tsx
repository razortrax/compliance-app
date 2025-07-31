"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layouts/app-layout'
import { useMasterOrg } from '@/hooks/use-master-org'
import { buildStandardDriverNavigation } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LicenseForm } from '@/components/licenses/license-form'
import { AddAddonModal } from '@/components/licenses/add-addon-modal'
import {
  Edit, Plus, FileText, IdCard, ArrowLeft, User, Eye, Truck, MapPin, Hash, Phone, Mail, CheckCircle, AlertCircle, Loader2, Clock
} from 'lucide-react'

interface Person {
  id: string
  firstName: string
  lastName: string
  party: {
    id: string
    role?: Array<{
      id: string
      roleType: string
      organizationId: string
      organization: {
        id: string
        name: string
      }
    }>
  }
}

interface Endorsement {
  code: string
  name: string
  expirationDate?: string | null
  renewalRequired?: boolean
  certificationNumber?: string
}

interface Restriction {
  code: string
  description: string
}

interface License {
  id: string
  licenseType: string
  licenseState: string
  licenseNumber: string
  certification: string
  startDate?: string | null
  expirationDate: string
  renewalDate?: string | null
  endorsements: Endorsement[]
  restrictions: Restriction[]
  notes?: string | null
  issue: {
    id: string
    title: string
    description?: string | null
    status: string
    priority: string
    party: {
      id: string
      person?: {
        id: string
        firstName: string
        lastName: string
      } | null
      organization?: {
        id: string
        name: string
      } | null
    }
  }
}

interface Organization {
  id: string
  name: string
  dotNumber?: string | null
}

export default function DriverLicensesPage() {
  const params = useParams()
  const router = useRouter()
  const driverId = params.id as string
  const { masterOrg } = useMasterOrg()
  
  const [driver, setDriver] = useState<Person | null>(null)
  const [licenses, setLicenses] = useState<License[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showRenewalForm, setShowRenewalForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showAddAddonModal, setShowAddAddonModal] = useState(false)
  const [attachments, setAttachments] = useState<any[]>([])
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set())
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [isSheetOpen, setIsSheetOpen] = useState(false)

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
    const hasNewerLicense = licenses.some(otherLicense => 
      otherLicense.id !== license.id && 
      otherLicense.licenseType === license.licenseType &&
      otherLicense.expirationDate && 
      license.expirationDate &&
      new Date(otherLicense.expirationDate) > new Date(license.expirationDate)
    )

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
    if (driverId) {
      fetchDriver()
      fetchLicenses()
      fetchOrganizations()
    }
  }, [driverId])

  const fetchDriver = async () => {
    try {
      const response = await fetch(`/api/persons/${driverId}`)
      if (response.ok) {
        const data = await response.json()
        setDriver(data)
      } else {
        console.error('Failed to fetch driver')
      }
    } catch (error) {
      console.error('Error fetching driver:', error)
    }
  }

  const fetchLicenses = async () => {
    try {
      const response = await fetch('/api/licenses')
      if (response.ok) {
        const data = await response.json()
        console.log('📋 All licenses from API:', data)
        console.log('🔍 Looking for driver ID:', driverId)
        
        // Filter licenses for this specific driver
        const driverLicenses = data.filter((license: any) => {
          const personId = license.issue?.party?.person?.id
          console.log('🧪 License party person ID:', personId, 'matches driver?', personId === driverId)
          return personId === driverId
        })
        
        console.log('✅ Filtered licenses for driver:', driverLicenses)
        setLicenses(driverLicenses)
      } else {
        console.error('Failed to fetch licenses')
      }
    } catch (error) {
      console.error('Error fetching licenses:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations')
      if (response.ok) {
        const data = await response.json()
        setOrganizations(data)
      }
    } catch (error) {
      console.error('Error fetching organizations:', error)
    }
  }

  const handleOrganizationSelect = (selectedOrg: Organization) => {
    setIsSheetOpen(false)
    window.location.href = `/organizations/${selectedOrg.id}/drivers`
  }

  const handleRenewLicense = (license: License) => {
    setSelectedLicense(license)
    setShowRenewalForm(true)
    setShowAddForm(false)
  }

  const fetchAttachments = async (issueId: string) => {
    try {
      const response = await fetch(`/api/attachments?issueId=${issueId}`)
      if (response.ok) {
        const data = await response.json()
        setAttachments(data)
      }
    } catch (error) {
      console.error('Error fetching attachments:', error)
    }
  }

  const handleFileUpload = async (file: File, attachmentType: string, issueId: string) => {
    const uploadKey = `${issueId}-${attachmentType}`
    
    try {
      setUploadingFiles(prev => new Set(prev).add(uploadKey))
      
      const formData = new FormData()
      formData.append('file', file)
      formData.append('issueId', issueId)
      formData.append('attachmentType', attachmentType)
      
      const response = await fetch('/api/attachments', {
        method: 'POST',
        body: formData
      })
      
      if (response.ok) {
        // Refresh attachments after successful upload
        await fetchAttachments(issueId)
        alert('File uploaded successfully!')
      } else {
        const error = await response.json()
        alert(`Upload failed: ${error.error}`)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setUploadingFiles(prev => {
        const newSet = new Set(prev)
        newSet.delete(uploadKey)
        return newSet
      })
    }
  }

  // Fetch attachments when selected license changes
  useEffect(() => {
    if (selectedLicense?.issue.id) {
      fetchAttachments(selectedLicense.issue.id)
    }
  }, [selectedLicense])

  const handleAddAddonSuccess = () => {
    if (selectedLicense) {
      fetchAttachments(selectedLicense.issue.id)
    }
  }

  const refreshSelectedLicenseAfterEdit = async () => {
    if (!selectedLicense) return
    
    const licenseId = selectedLicense.id
    
    // Refresh the licenses list
    await fetchLicenses()
    
    // Fetch the specific updated license to get fresh data
    try {
      const response = await fetch(`/api/licenses/${licenseId}`)
      if (response.ok) {
        const updatedLicense = await response.json()
        setSelectedLicense(updatedLicense)
      }
    } catch (error) {
      console.error('Error fetching updated license:', error)
      // Fallback: try to find it in the refreshed list
      setTimeout(() => {
        setLicenses(currentLicenses => {
          const foundLicense = currentLicenses.find(l => l.id === licenseId)
          if (foundLicense) {
            setSelectedLicense(foundLicense)
          }
          return currentLicenses
        })
      }, 100)
    }
  }

  if (isLoading) {
    return (
      <AppLayout 
        sidebarMenu="driver" 
        driverId={driverId}
        masterOrgId={masterOrg?.id}
        topNav={[]}
        organizations={organizations}
        onOrganizationSelect={handleOrganizationSelect}
      >
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AppLayout>
    )
  }

  if (!driver) {
    return (
      <AppLayout 
        sidebarMenu="driver" 
        driverId={driverId}
        masterOrgId={masterOrg?.id}
        topNav={[]}
        organizations={organizations}
        onOrganizationSelect={handleOrganizationSelect}
      >
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900">Driver not found</h2>
            <p className="text-gray-600 mt-2">The driver you're looking for doesn't exist or you don't have permission to view it.</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  // Calculate and display navigation - ONLY after we know driver is not null
  const role = driver.party?.role?.[0]
  const organization = role?.organization
  const masterName = masterOrg?.name || 'Master'
  
  // Build standardized top navigation
  const topNav = buildStandardDriverNavigation(
    { id: '', role: '' }, // User object - simplified for now
    masterOrg,
    organization,
    undefined, // No location context in this view
    'drivers'
  )
  
  return (
    <>
      <AppLayout
        name={masterName}
        topNav={topNav}
        showOrgSelector={true}
        showDriverEquipmentSelector={true}
        sidebarMenu="driver"
        driverId={driverId}
        masterOrgId={masterOrg?.id}
        currentOrgId={organization?.id}
        className="p-6"
        organizations={organizations}
        isSheetOpen={isSheetOpen}
        onSheetOpenChange={setIsSheetOpen}
        onOrganizationSelect={handleOrganizationSelect}
      >
        <div className="max-w-7xl mx-auto h-full">
          {/* Driver and Licenses Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-1">
              {/* Only show organization name for Master users */}
              {masterOrg && organization && (
                <p className="text-sm text-gray-600">{organization.name}</p>
              )}
              <h1 className="text-2xl font-bold text-gray-900">
                {driver.firstName} {driver.lastName} - Licenses
              </h1>
              <p className="text-sm text-gray-600">
                Manage licenses and certifications for this driver
              </p>
            </div>
            
            {/* Add License Button - only show if there are existing licenses */}
            {licenses.length > 0 && (
              <Button 
                onClick={() => {
                  setSelectedLicense(null)
                  setShowAddForm(true)
                }}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add License
              </Button>
            )}
          </div>

          {/* Split Pane Layout */}
          <div className="flex gap-6 h-[calc(100vh-300px)]">
            {/* Left Pane - Licenses List (Increased Width) */}
            <div className="w-[300px] flex-shrink-0">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IdCard className="h-5 w-5" />
                    Licenses ({licenses.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {licenses.length === 0 ? (
                    <div className="text-center py-12">
                      <IdCard className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No licenses yet</h3>
                      <p className="text-gray-600 mb-4">Add licenses and certifications for {driver.firstName} {driver.lastName}</p>
                      <Button 
                        onClick={() => {
                          setSelectedLicense(null)
                          setShowAddForm(true)
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add First License
                      </Button>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200 max-h-full overflow-y-auto">
                      {[...licenses]
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
                        .map((license) => {
                        const expirationStatus = getExpirationStatus(license)
                        const isSelected = selectedLicense?.id === license.id
                        const isActive = license.issue.status === 'active'
                        
                        // Parse endorsements safely
                        let endorsements: any[] = []
                        try {
                          // Handle both string and array cases
                          if (typeof license.endorsements === 'string') {
                            endorsements = license.endorsements ? JSON.parse(license.endorsements) : []
                          } else if (Array.isArray(license.endorsements)) {
                            endorsements = license.endorsements
                          } else {
                            endorsements = []
                          }
                        } catch (e) {
                          endorsements = []
                        }
                        
                        // Function to get endorsement expiry info
                        const getEndorsementExpiry = (endorsements: any[]) => {
                          const hazmatEndorsement = endorsements.find(e => e.code === 'H' && e.expirationDate)
                          if (hazmatEndorsement) {
                            const expiry = new Date(hazmatEndorsement.expirationDate)
                            const today = new Date()
                            const daysUntil = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                            return { type: 'HazMat', daysUntil, expired: daysUntil < 0 }
                          }
                          return null
                        }
                        
                        const endorsementExpiry = getEndorsementExpiry(endorsements)
                        
                        return (
                          <div
                            key={license.id}
                            onClick={() => {
                              setSelectedLicense(license)
                              setShowAddForm(false)
                            }}
                            className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                              isSelected ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                            }`}
                          >
                            <div className="space-y-2">
                              {/* First Row: Type, State, Number + Active Badge */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-gray-900 text-sm">
                                    {license.licenseType} - {license.licenseState} #{license.licenseNumber}
                                  </h4>
                                  {isActive && (
                                    <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                                      Active
                                    </Badge>
                                  )}
                                </div>
                                {expirationStatus.badge}
                              </div>
                              
                              {/* Second Row: Endorsements + Endorsement Expiry */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1 flex-wrap">
                                  {endorsements.length > 0 ? (
                                    endorsements.map((endorsement, idx) => (
                                      <Badge 
                                        key={idx} 
                                        variant="outline" 
                                        className="text-xs px-1 py-0.5"
                                      >
                                        {endorsement.code}
                                      </Badge>
                                    ))
                                  ) : (
                                    <span className="text-xs text-gray-400">No endorsements</span>
                                  )}
                                </div>
                                
                                {endorsementExpiry && (
                                  <Badge 
                                    variant={endorsementExpiry.expired ? 'destructive' : 'secondary'}
                                    className="text-xs"
                                  >
                                    {endorsementExpiry.type} {endorsementExpiry.expired ? 'Exp' : `${endorsementExpiry.daysUntil}d`}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Pane - License Details or Add Form */}
            <div className="flex-1">
              <Card className="h-full">
                {showRenewalForm ? (
                  <>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Renew License</CardTitle>
                          <CardDescription>
                            Renewing {selectedLicense?.issue.title} for {driver.firstName} {driver.lastName}
                          </CardDescription>
                        </div>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setShowRenewalForm(false)
                            setSelectedLicense(null)
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="overflow-y-auto max-h-[calc(100%-120px)]">
                      <LicenseForm
                        driverId={driverId}
                        renewingLicense={selectedLicense || undefined}
                        onSuccess={() => {
                          setShowRenewalForm(false)
                          fetchLicenses()
                          // Keep license selected - user can see the renewal result
                        }}
                        onCancel={() => {
                          setShowRenewalForm(false)
                          setSelectedLicense(null)
                        }}
                      />
                    </CardContent>
                  </>
                ) : showAddForm ? (
                  <>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Add New License</CardTitle>
                          <CardDescription>Create a new license for {driver.firstName} {driver.lastName}</CardDescription>
                        </div>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setShowAddForm(false)
                            setSelectedLicense(null)
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="overflow-y-auto max-h-[calc(100%-120px)]">
                      <LicenseForm
                        driverId={driverId}
                        onSuccess={() => {
                          setShowAddForm(false)
                          fetchLicenses()
                        }}
                        onCancel={() => {
                          setShowAddForm(false)
                          setSelectedLicense(null)
                        }}
                      />
                    </CardContent>
                  </>
                ) : showEditForm ? (
                  <>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Edit License</CardTitle>
                          <CardDescription>
                            Edit details for {selectedLicense?.issue.title} for {driver.firstName} {driver.lastName}
                          </CardDescription>
                        </div>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setShowEditForm(false)
                            setSelectedLicense(null)
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="overflow-y-auto max-h-[calc(100%-120px)]">
                      <LicenseForm
                        driverId={driverId}
                        license={selectedLicense || undefined}
                        onSuccess={async () => {
                          setShowEditForm(false)
                          // Refresh the licenses list and update the selected license with fresh data
                          await refreshSelectedLicenseAfterEdit()
                        }}
                        onCancel={() => {
                          setShowEditForm(false)
                          setSelectedLicense(null)
                        }}
                      />
                    </CardContent>
                  </>
                ) : selectedLicense ? (
                  <>
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
                              onClick={() => {
                                setShowEditForm(true)
                                setShowAddForm(false)
                                setShowRenewalForm(false)
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                            <Button 
                              variant="outline"
                              size="sm"
                              onClick={() => handleRenewLicense(selectedLicense)}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Renew
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="overflow-y-auto max-h-[calc(100%-120px)]">
                      <div className="space-y-6">
                        {/* License Information - Full Width at Top */}
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-3">License Information</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Type:</span>
                                <span className="font-medium">{selectedLicense.licenseType}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">State:</span>
                                <span className="font-medium">{selectedLicense.licenseState}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Number:</span>
                                <span className="font-medium">{selectedLicense.licenseNumber}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Certification:</span>
                                <span className="font-medium">{selectedLicense.certification}</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-medium text-gray-900 mb-3">Important Dates</h4>
                            <div className="space-y-2 text-sm">
                              {selectedLicense.startDate && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Start:</span>
                                  <span className="font-medium">
                                    {new Date(selectedLicense.startDate).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span className="text-gray-600">Expiration:</span>
                                <span className="font-medium">
                                  {new Date(selectedLicense.expirationDate).toLocaleDateString()}
                                </span>
                              </div>
                              {selectedLicense.renewalDate && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Renewal:</span>
                                  <span className="font-medium">
                                    {new Date(selectedLicense.renewalDate).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Endorsements & Restrictions */}
                        {(selectedLicense.endorsements?.length > 0 || selectedLicense.restrictions?.length > 0) && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-3">Endorsements & Restrictions</h4>
                            <div className="grid grid-cols-2 gap-4">
                              {selectedLicense.endorsements?.length > 0 && (
                                <div>
                                  <span className="text-sm text-gray-600 block mb-2">Endorsements:</span>
                                  <div className="flex flex-wrap gap-1">
                                    {selectedLicense.endorsements.map((endorsement: any, idx: number) => (
                                      <Badge key={idx} variant="outline" className="text-xs">
                                        {endorsement.code}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {selectedLicense.restrictions?.length > 0 && (
                                <div>
                                  <span className="text-sm text-gray-600 block mb-2">Restrictions:</span>
                                  <div className="flex flex-wrap gap-1">
                                    {selectedLicense.restrictions.map((restriction: any, idx: number) => (
                                      <Badge key={idx} variant="secondary" className="text-xs">
                                        {restriction.code}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* License Photos - Side by Side */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">License Photos</h4>
                          <div className="grid grid-cols-2 gap-4">
                            {/* Front Photo */}
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Front</p>
                              {(() => {
                                const frontPhoto = attachments.find(a => a.attachmentType === 'license_front')
                                
                                return frontPhoto ? (
                                  <div className="relative">
                                    <img 
                                      src={frontPhoto.url} 
                                      alt="License Front"
                                      className="w-full rounded-lg border aspect-[3/2] object-cover"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">{frontPhoto.fileName}</p>
                                  </div>
                                ) : (
                                  <div className="w-full h-32 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                                    <div className="w-full h-full flex items-center justify-center opacity-50">
                                      <div className="text-center text-gray-400">
                                        <FileText className="h-6 w-6 mx-auto mb-1" />
                                        <p className="text-xs">Photo upload disabled</p>
                                        <p className="text-xs text-gray-400 mt-1">Temporarily unavailable</p>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })()}
                            </div>

                            {/* Back Photo */}
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Back</p>
                              {(() => {
                                const backPhoto = attachments.find(a => a.attachmentType === 'license_back')
                                
                                return backPhoto ? (
                                  <div className="relative">
                                    <img 
                                      src={backPhoto.url} 
                                      alt="License Back"
                                      className="w-full rounded-lg border aspect-[3/2] object-cover"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">{backPhoto.fileName}</p>
                                  </div>
                                ) : (
                                  <div className="w-full h-32 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                                    <div className="w-full h-full flex items-center justify-center opacity-50">
                                      <div className="text-center text-gray-400">
                                        <FileText className="h-6 w-6 mx-auto mb-1" />
                                        <p className="text-xs">Photo upload disabled</p>
                                        <p className="text-xs text-gray-400 mt-1">Temporarily unavailable</p>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })()}
                            </div>
                          </div>
                        </div>

                        {/* Addons Section */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-gray-900">Addons</h4>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setShowAddAddonModal(true)}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add
                            </Button>
                          </div>
                          
                          {/* List of Addons */}
                          <div className="space-y-2">
                            {attachments
                              .filter(a => !['license_front', 'license_back'].includes(a.attachmentType))
                              .map((addon) => (
                                <div key={addon.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                  <div className="flex-shrink-0">
                                    {addon.attachmentType === 'note' || addon.noteContent ? (
                                      <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center">
                                        <FileText className="h-5 w-5 text-blue-600" />
                                      </div>
                                    ) : addon.fileType?.startsWith('image/') ? (
                                      <div className="w-10 h-10 rounded border overflow-hidden">
                                        <img 
                                          src={addon.url} 
                                          alt={addon.fileName}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    ) : addon.fileType?.startsWith('video/') ? (
                                      <div className="w-10 h-10 bg-purple-100 rounded flex items-center justify-center">
                                        <FileText className="h-5 w-5 text-purple-600" />
                                      </div>
                                    ) : (
                                      <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                                        <FileText className="h-5 w-5 text-gray-600" />
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {addon.fileName || 'Untitled'}
                                    </p>
                                    {addon.description && (
                                      <p className="text-xs text-gray-600 truncate">{addon.description}</p>
                                    )}
                                    {addon.noteContent && (
                                      <p className="text-xs text-gray-600 truncate italic">
                                        "{addon.noteContent.substring(0, 50)}..."
                                      </p>
                                    )}
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge variant="outline" className="text-xs">
                                        {addon.attachmentType === 'note' ? 'Note' : 
                                         addon.noteContent ? 'File + Note' : 'File'}
                                      </Badge>
                                      <span className="text-xs text-gray-500">
                                        {new Date(addon.createdAt).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1">
                                    {addon.attachmentType === 'note' || addon.noteContent ? (
                                      <Button size="sm" variant="ghost">
                                        View
                                      </Button>
                                    ) : (
                                      <Button size="sm" variant="ghost" asChild>
                                        <a 
                                          href={addon.url} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                        >
                                          View
                                        </a>
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            
                            {attachments.filter(a => !['license_front', 'license_back'].includes(a.attachmentType)).length === 0 && (
                              <div className="text-center py-6 text-gray-500">
                                <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                <p className="text-sm">No addons yet</p>
                                <p className="text-xs">Add notes, documents, or other files related to this license</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Notes Section - if any */}
                        {selectedLicense.notes && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">License Notes</h4>
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-gray-700">
                              {selectedLicense.notes}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </>
                ) : (
                  <CardContent className="flex items-center justify-center h-full text-center">
                    <div>
                      <IdCard className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Select a License</h3>
                      <p className="text-gray-600">Choose a license from the list to view details</p>
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>
          </div>
        </div>
      </AppLayout>

      {/* Add Addon Modal */}
      <AddAddonModal
        isOpen={showAddAddonModal}
        onClose={() => setShowAddAddonModal(false)}
        onSuccess={() => {
          fetchAttachments(selectedLicense?.issue.id || '')
          setShowAddAddonModal(false)
        }}
        issueId={selectedLicense?.issue.id || ''}
      />
    </>
  )
} 