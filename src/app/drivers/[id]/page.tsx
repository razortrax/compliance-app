"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layouts/app-layout'
import { useMasterOrg } from '@/hooks/use-master-org'
import { buildStandardDriverNavigation } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SectionHeader } from '@/components/ui/section-header'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { PersonForm } from '@/components/persons/person-form'
import { LicenseForm } from '@/components/licenses/license-form'
import { 
  MapPin, 
  Phone, 
  Mail, 
  IdCard, 
  Calendar,
  Edit,
  User,
  FileText,
  AlertCircle,
  CheckCircle,
  Plus,
  ArrowLeft,
  X,
  Save
} from 'lucide-react'

interface Person {
  id: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  dateOfBirth?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  licenseNumber?: string
  licenseExpirationDate?: string
  medicalCertExpirationDate?: string
  party?: {
    id: string
    role?: Array<{
      id: string
      roleType: string
      organizationId: string
      location?: {
        id: string
        name: string
      }
      organization?: {
        id: string
        name: string
      }
    }>
  }
}

interface Organization {
  id: string
  name: string
}

export default function DriverDetailPage() {
  const params = useParams()
  const router = useRouter()
  const driverId = params.id as string
  const { masterOrg } = useMasterOrg()
  
  const [driver, setDriver] = useState<Person | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showLicenseForm, setShowLicenseForm] = useState(false)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  useEffect(() => {
    if (driverId) {
      fetchDriver()
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
    // Navigate to the selected organization's drivers page
    router.push(`/organizations/${selectedOrg.id}/drivers`)
  }

  const getRoleLabel = (roleType: string) => {
    switch (roleType) {
      case 'DRIVER': return 'Driver'
      case 'STAFF': return 'Staff'
      case 'MECHANIC': return 'Mechanic'
      case 'DISPATCHER': return 'Dispatcher'
      case 'SAFETY_MANAGER': return 'Safety Manager'
      default: return roleType
    }
  }

  const getRoleBadgeColor = (roleType: string) => {
    switch (roleType) {
      case 'DRIVER': return 'bg-blue-100 text-blue-700'
      case 'STAFF': return 'bg-green-100 text-green-700'
      case 'MECHANIC': return 'bg-orange-100 text-orange-700'
      case 'DISPATCHER': return 'bg-purple-100 text-purple-700'
      case 'SAFETY_MANAGER': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getExpirationStatus = (expirationDate?: string) => {
    if (!expirationDate) return { status: 'unknown', daysUntil: null, color: 'text-gray-500' }
    
    const expiry = new Date(expirationDate)
    const today = new Date()
    const daysUntil = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntil < 0) {
      return { status: 'expired', daysUntil, color: 'text-red-600' }
    } else if (daysUntil <= 30) {
      return { status: 'expiring', daysUntil, color: 'text-orange-600' }
    } else {
      return { status: 'current', daysUntil, color: 'text-green-600' }
    }
  }

  if (isLoading) {
    return (
      <AppLayout
        name={masterOrg?.name || 'Master'}
        sidebarMenu="driver"
        className="p-6"
      >
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading driver details...</p>
        </div>
      </AppLayout>
    )
  }

  if (!driver) {
    return (
      <AppLayout
        name={masterOrg?.name || 'Master'}
        sidebarMenu="driver"
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
    masterOrg?.id || '',
    organization?.id || '',
    driverId,
    role?.roleType // Assuming roleType is the user's role
  )

  const licenseStatus = getExpirationStatus(driver.licenseExpirationDate)
  const medicalStatus = getExpirationStatus(driver.medicalCertExpirationDate)

  return (
    <AppLayout 
      name={masterName}
      topNav={topNav}
      sidebarMenu="driver"
      driverId={driverId}
      masterOrgId={masterOrg?.id}
      currentOrgId={organization?.id}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Organization and Driver Name Row */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            {/* Only show organization name for Master users */}
            {masterOrg && organization && (
              <p className="text-sm text-gray-600">{organization.name}</p>
            )}
            <h1 className="text-2xl font-bold text-gray-900">
              {driver.firstName} {driver.lastName}
            </h1>
            {role && (
              <p className="text-sm text-gray-600">
                {getRoleLabel(role.roleType)}
                {role.location && ` • ${role.location.name}`}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
              <DialogTrigger asChild>
                <Button>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Driver
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit {driver.firstName} {driver.lastName}</DialogTitle>
                  <DialogDescription>
                    Update driver details and information
                  </DialogDescription>
                </DialogHeader>
                <PersonForm
                  organizationId={role?.organizationId || ''}
                  person={driver as any}
                  onSuccess={() => {
                    setShowEditForm(false)
                    fetchDriver()
                  }}
                  onCancel={() => setShowEditForm(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Full Name</label>
                  <p className="text-sm font-medium">{driver.firstName} {driver.lastName}</p>
                </div>
                
                {driver.dateOfBirth && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                    <p className="text-sm">{new Date(driver.dateOfBirth).toLocaleDateString()}</p>
                  </div>
                )}

                {role && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Role</label>
                    <div>
                      <Badge className={getRoleBadgeColor(role.roleType)}>
                        {getRoleLabel(role.roleType)}
                      </Badge>
                    </div>
                  </div>
                )}

                {role?.location && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Location</label>
                    <p className="text-sm flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {role.location.name}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {driver.phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    <p className="text-sm flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {driver.phone}
                    </p>
                  </div>
                )}

                {driver.email && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-sm flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {driver.email}
                    </p>
                  </div>
                )}

                {(driver.address || driver.city || driver.state) && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Address</label>
                    <p className="text-sm flex items-start gap-1">
                      <MapPin className="h-4 w-4 mt-0.5" />
                      <span>
                        {[driver.address, driver.city, driver.state, driver.zipCode]
                          .filter(Boolean)
                          .join(', ')}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* License & Compliance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IdCard className="h-5 w-5" />
                License & Compliance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {driver.licenseNumber && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">License Number</label>
                    <p className="text-sm">{driver.licenseNumber}</p>
                  </div>
                )}

                {driver.licenseExpirationDate && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">License Expiration</label>
                    <div className="flex items-center gap-2">
                      <p className="text-sm">
                        {new Date(driver.licenseExpirationDate).toLocaleDateString()}
                      </p>
                      {licenseStatus.status === 'current' && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                      {licenseStatus.status === 'expiring' && (
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                      )}
                      {licenseStatus.status === 'expired' && (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <p className={`text-xs ${licenseStatus.color}`}>
                      {licenseStatus.status === 'expired' 
                        ? `Expired ${Math.abs(licenseStatus.daysUntil!)} days ago`
                        : licenseStatus.status === 'expiring'
                        ? `Expires in ${licenseStatus.daysUntil} days`
                        : `${licenseStatus.daysUntil} days remaining`
                      }
                    </p>
                  </div>
                )}

                {driver.medicalCertExpirationDate && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Medical Cert Expiration</label>
                    <div className="flex items-center gap-2">
                      <p className="text-sm">
                        {new Date(driver.medicalCertExpirationDate).toLocaleDateString()}
                      </p>
                      {medicalStatus.status === 'current' && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                      {medicalStatus.status === 'expiring' && (
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                      )}
                      {medicalStatus.status === 'expired' && (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <p className={`text-xs ${medicalStatus.color}`}>
                      {medicalStatus.status === 'expired' 
                        ? `Expired ${Math.abs(medicalStatus.daysUntil!)} days ago`
                        : medicalStatus.status === 'expiring'
                        ? `Expires in ${medicalStatus.daysUntil} days`
                        : `${medicalStatus.daysUntil} days remaining`
                      }
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Compliance Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Licenses</p>
                  <p className="text-2xl font-bold">2</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Medical</p>
                  <p className="text-2xl font-bold">1</p>
                </div>
                <IdCard className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Training</p>
                  <p className="text-2xl font-bold">3</p>
                </div>
                <FileText className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Incidents</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
                <AlertCircle className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Licenses Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <IdCard className="h-5 w-5" />
                  Licenses & Certifications
                </CardTitle>
              </div>
              <Dialog open={showLicenseForm} onOpenChange={setShowLicenseForm}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add License
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add License for {driver?.firstName} {driver?.lastName}</DialogTitle>
                    <DialogDescription>
                      Create a new license or certification record for this driver
                    </DialogDescription>
                  </DialogHeader>
                  <LicenseForm
                    driverId={driverId}
                    onSuccess={() => {
                      setShowLicenseForm(false)
                      // Refresh driver data if needed
                      fetchDriver()
                    }}
                    onCancel={() => setShowLicenseForm(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <IdCard className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-lg font-medium mb-2">No licenses yet</p>
              <p className="text-sm">Add licenses and certifications for this driver</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
} 