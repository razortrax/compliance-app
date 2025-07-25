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
import {
  Plus,
  Edit,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  IdCard,
  Calendar,
  User,
  FileText
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
  const [attachments, setAttachments] = useState<any[]>([])
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set())
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [isSheetOpen, setIsSheetOpen] = useState(false)

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

  const getExpirationStatus = (expirationDate: string) => {
    const expiry = new Date(expirationDate)
    const today = new Date()
    const daysUntil = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntil < 0) {
      return { status: 'expired', daysUntil, color: 'text-red-600', bgColor: 'bg-red-100' }
    } else if (daysUntil <= 30) {
      return { status: 'expiring', daysUntil, color: 'text-orange-600', bgColor: 'bg-orange-100' }
    } else {
      return { status: 'current', daysUntil, color: 'text-green-600', bgColor: 'bg-green-100' }
    }
  }

  if (isLoading) {
    return (
      <AppLayout
        name={masterOrg?.name || 'Master'}
        sidebarMenu="driver"
        driverId={driverId}
        className="p-6"
      >
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading licenses...</p>
        </div>
      </AppLayout>
    )
  }

  if (!driver) {
    return (
      <AppLayout
        name={masterOrg?.name || 'Master'}
        sidebarMenu="driver"
        driverId={driverId}
        className="p-6"
      >
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Driver Not Found</h3>
          <p className="text-gray-600">The requested driver could not be found.</p>
          <Button onClick={() => router.push('/dashboard')} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </AppLayout>
    )
  }

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
    <AppLayout
      name={masterName}
      topNav={topNav}
      showOrgSelector={true}
      showDriverEquipmentSelector={true}
      sidebarMenu="driver"
      driverId={driverId}
      className="p-6"
      organizations={organizations}
      currentOrgId={organization?.id}
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
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-300px)]">
          {/* Left Pane - Licenses List */}
          <div className="col-span-5">
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
                    {licenses.map((license) => {
                      const expirationStatus = getExpirationStatus(license.expirationDate)
                      const isSelected = selectedLicense?.id === license.id
                      
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
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{license.issue.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">{license.licenseType} - {license.licenseState}</p>
                              <p className="text-sm text-gray-500 mt-1">#{license.licenseNumber}</p>
                            </div>
                            <Badge 
                              variant={expirationStatus.status === 'expired' ? 'destructive' : 
                                      expirationStatus.status === 'expiring' ? 'secondary' : 'default'}
                              className="text-xs"
                            >
                              {expirationStatus.status === 'expired' 
                                ? `Expired`
                                : expirationStatus.status === 'expiring'
                                ? `${expirationStatus.daysUntil}d`
                                : `${expirationStatus.daysUntil}d`
                              }
                            </Badge>
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
          <div className="col-span-7">
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
                        setSelectedLicense(null)
                        fetchLicenses()
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
              ) : selectedLicense ? (
                <>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{selectedLicense.issue.title}</CardTitle>
                        <CardDescription>{selectedLicense.issue.description}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => handleRenewLicense(selectedLicense)}
                        >
                          Renew License
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="overflow-y-auto max-h-[calc(100%-120px)]">
                    <div className="grid grid-cols-2 gap-6">
                      {/* License Information */}
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">License Information</h4>
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

                        {/* Dates */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Important Dates</h4>
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

                        {/* Endorsements & Restrictions */}
                        {(selectedLicense.endorsements?.length > 0 || selectedLicense.restrictions?.length > 0) && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Endorsements & Restrictions</h4>
                            {selectedLicense.endorsements?.length > 0 && (
                              <div className="mb-2">
                                <span className="text-sm text-gray-600">Endorsements:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
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
                                <span className="text-sm text-gray-600">Restrictions:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {selectedLicense.restrictions.map((restriction: any, idx: number) => (
                                    <Badge key={idx} variant="secondary" className="text-xs">
                                      {restriction.code}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Attachments Section */}
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">License Photos</h4>
                          
                          {/* License Front */}
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Front of License</p>
                              {(() => {
                                const frontPhoto = attachments.find(a => a.attachmentType === 'license_front')
                                const isUploading = uploadingFiles.has(`${selectedLicense.issue.id}-license_front`)
                                
                                return frontPhoto ? (
                                  <div className="relative">
                                    <img 
                                      src={frontPhoto.url} 
                                      alt="License Front"
                                      className="w-full max-w-sm rounded-lg border"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">{frontPhoto.fileName}</p>
                                  </div>
                                ) : (
                                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors cursor-pointer">
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      id="license-front-upload"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file && selectedLicense) {
                                          handleFileUpload(file, 'license_front', selectedLicense.issue.id)
                                        }
                                      }}
                                      disabled={isUploading}
                                    />
                                    <label htmlFor="license-front-upload" className="cursor-pointer">
                                      {isUploading ? (
                                        <>
                                          <div className="animate-spin h-8 w-8 mx-auto mb-2 border-2 border-gray-300 border-t-blue-500 rounded-full"></div>
                                          <p className="text-sm text-gray-600">Uploading...</p>
                                        </>
                                      ) : (
                                        <>
                                          <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                          <p className="text-sm text-gray-600">Click to upload front photo</p>
                                          <p className="text-xs text-gray-400">PNG, JPG up to 10MB</p>
                                        </>
                                      )}
                                    </label>
                                  </div>
                                )
                              })()}
                            </div>
                            
                            {/* License Back */}
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Back of License</p>
                              {(() => {
                                const backPhoto = attachments.find(a => a.attachmentType === 'license_back')
                                const isUploading = uploadingFiles.has(`${selectedLicense.issue.id}-license_back`)
                                
                                return backPhoto ? (
                                  <div className="relative">
                                    <img 
                                      src={backPhoto.url} 
                                      alt="License Back"
                                      className="w-full max-w-sm rounded-lg border"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">{backPhoto.fileName}</p>
                                  </div>
                                ) : (
                                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors cursor-pointer">
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      id="license-back-upload"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file && selectedLicense) {
                                          handleFileUpload(file, 'license_back', selectedLicense.issue.id)
                                        }
                                      }}
                                      disabled={isUploading}
                                    />
                                    <label htmlFor="license-back-upload" className="cursor-pointer">
                                      {isUploading ? (
                                        <>
                                          <div className="animate-spin h-8 w-8 mx-auto mb-2 border-2 border-gray-300 border-t-blue-500 rounded-full"></div>
                                          <p className="text-sm text-gray-600">Uploading...</p>
                                        </>
                                      ) : (
                                        <>
                                          <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                          <p className="text-sm text-gray-600">Click to upload back photo</p>
                                          <p className="text-xs text-gray-400">PNG, JPG up to 10MB</p>
                                        </>
                                      )}
                                    </label>
                                  </div>
                                )
                              })()}
                            </div>
                          </div>

                          {/* Additional Documents */}
                          <div className="mt-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">Additional Documents</p>
                            
                            {/* Show existing additional documents */}
                            {attachments.filter(a => a.attachmentType === 'additional_document').map((doc, index) => (
                              <div key={doc.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded mb-2">
                                <FileText className="h-4 w-4 text-gray-600" />
                                <span className="text-sm text-gray-700 flex-1">{doc.fileName}</span>
                                <a 
                                  href={doc.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 text-sm"
                                >
                                  View
                                </a>
                              </div>
                            ))}
                            
                            {/* Upload new documents */}
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors cursor-pointer">
                              <input
                                type="file"
                                accept="image/*,.pdf,.doc,.docx"
                                multiple
                                className="hidden"
                                id="additional-docs-upload"
                                onChange={(e) => {
                                  const files = Array.from(e.target.files || [])
                                  if (files.length > 0 && selectedLicense) {
                                    files.forEach(file => {
                                      handleFileUpload(file, 'additional_document', selectedLicense.issue.id)
                                    })
                                  }
                                }}
                              />
                              <label htmlFor="additional-docs-upload" className="cursor-pointer">
                                <Plus className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                <p className="text-sm text-gray-600">Upload endorsement paperwork, etc.</p>
                                <p className="text-xs text-gray-400">Multiple files supported</p>
                              </label>
                            </div>
                          </div>
                        </div>

                        {selectedLicense.notes && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                              {selectedLicense.notes}
                            </div>
                          </div>
                        )}
                      </div>
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
  )
} 