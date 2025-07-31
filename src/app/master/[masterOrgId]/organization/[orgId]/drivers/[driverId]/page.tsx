"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layouts/app-layout'
import { useMasterOrg } from '@/hooks/use-master-org'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SectionHeader } from '@/components/ui/section-header'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { PersonForm } from '@/components/persons/person-form'
import { 
  MapPin, 
  Phone, 
  Mail, 
  IdCard, 
  Calendar,
  Edit,
  User
} from 'lucide-react'

interface DriverPerson {
  id: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  dateOfBirth?: Date | null
  address?: string
  city?: string
  state?: string
  zipCode?: string
  licenseNumber?: string
}

interface Organization {
  id: string
  name: string
}

export default function DriverDetailPage() {
  const params = useParams()
  const router = useRouter()
  
  const masterOrgId = params.masterOrgId as string
  const organizationId = params.orgId as string
  const driverId = params.driverId as string
  
  const [person, setPerson] = useState<DriverPerson | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  
  // Get master organization data
  const { masterOrg } = useMasterOrg()

  useEffect(() => {
    const fetchData = async () => {
      if (!driverId || !organizationId) return

      try {
        // Fetch person details
        const personResponse = await fetch(`/api/persons/${driverId}`)
        if (personResponse.ok) {
          const personData = await personResponse.json()
          setPerson(personData)
        }

        // Fetch organization details
        const orgResponse = await fetch(`/api/organizations/${organizationId}`)
        if (orgResponse.ok) {
          const orgData = await orgResponse.json()
          setOrganization(orgData)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [driverId, organizationId])

  const handlePersonUpdate = () => {
    // Refresh person data
    window.location.reload()
  }

  if (loading) {
    return (
      <AppLayout 
        name={masterOrg?.name || 'Master'}
        topNav={[
          { label: 'Master', href: `/master/${masterOrgId}`, isActive: false },
          { label: 'Organization', href: `/master/${masterOrgId}/organization/${organizationId}`, isActive: false },
          { label: 'Drivers', href: `/master/${masterOrgId}/organization/${organizationId}/drivers`, isActive: true },
          { label: 'Equipment', href: `/master/${masterOrgId}/organization/${organizationId}/equipment`, isActive: false }
        ]}
        showOrgSelector={true}
        showDriverEquipmentSelector={true}
        sidebarMenu="driver"
        masterOrgId={masterOrgId}
        currentOrgId={organizationId}
        driverId={driverId}
        className="p-6"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading driver details...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!person) {
    return (
      <AppLayout 
        name={masterOrg?.name || 'Master'}
        topNav={[
          { label: 'Master', href: `/master/${masterOrgId}`, isActive: false },
          { label: 'Organization', href: `/master/${masterOrgId}/organization/${organizationId}`, isActive: false },
          { label: 'Drivers', href: `/master/${masterOrgId}/organization/${organizationId}/drivers`, isActive: true },
          { label: 'Equipment', href: `/master/${masterOrgId}/organization/${organizationId}/equipment`, isActive: false }
        ]}
        showOrgSelector={true}
        showDriverEquipmentSelector={true}
        sidebarMenu="driver"
        masterOrgId={masterOrgId}
        currentOrgId={organizationId}
        driverId={driverId}
        className="p-6"
      >
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold text-gray-900">Driver Not Found</h2>
          <p className="text-gray-600 mt-2">The requested driver could not be found.</p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout 
      name={masterOrg?.name || 'Master'}
      topNav={[
        { label: 'Master', href: `/master/${masterOrgId}`, isActive: false },
        { label: 'Organization', href: `/master/${masterOrgId}/organization/${organizationId}`, isActive: false },
        { label: 'Driver', href: `/master/${masterOrgId}/organization/${organizationId}/driver/${driverId}`, isActive: true },
        { label: 'Equipment', href: `/master/${masterOrgId}/organization/${organizationId}/equipment`, isActive: false }
      ]}
      showOrgSelector={true}
      showDriverEquipmentSelector={true}
      sidebarMenu="driver"
      masterOrgId={masterOrgId}
      currentOrgId={organizationId}
      driverId={driverId}
      className="p-6"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {person.firstName} {person.lastName}
              </h1>
              <p className="text-gray-600">Driver Details</p>
              {organization && (
                <Badge variant="secondary" className="mt-2">
                  {organization.name}
                </Badge>
              )}
            </div>
            
            <Dialog open={editMode} onOpenChange={setEditMode}>
              <DialogTrigger asChild>
                <Button>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Driver
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Edit Driver</DialogTitle>
                  <DialogDescription>
                    Update driver information
                  </DialogDescription>
                </DialogHeader>
                <PersonForm
                  person={person as any}
                  organizationId={organizationId}
                  onSuccess={() => {
                    setEditMode(false)
                    handlePersonUpdate()
                  }}
                  onCancel={() => setEditMode(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">First Name</label>
                  <p className="text-gray-900">{person.firstName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Name</label>
                  <p className="text-gray-900">{person.lastName}</p>
                </div>
              </div>
              
              {person.dateOfBirth && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                  <p className="text-gray-900 flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    {new Date(person.dateOfBirth).toLocaleDateString()}
                  </p>
                </div>
              )}
              
              {person.licenseNumber && (
                <div>
                  <label className="text-sm font-medium text-gray-500">License Number</label>
                  <p className="text-gray-900 flex items-center">
                    <IdCard className="h-4 w-4 mr-2" />
                    {person.licenseNumber}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {person.phone && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-gray-900 flex items-center">
                    <Phone className="h-4 w-4 mr-2" />
                    {person.phone}
                  </p>
                </div>
              )}
              
              {person.email && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-900 flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    {person.email}
                  </p>
                </div>
              )}
              
              {(person.address || person.city || person.state || person.zipCode) && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Address</label>
                  <p className="text-gray-900 flex items-start">
                    <MapPin className="h-4 w-4 mr-2 mt-0.5" />
                    <span>
                      {person.address && <>{person.address}<br /></>}
                      {person.city && person.state && person.zipCode && 
                        `${person.city}, ${person.state} ${person.zipCode}`
                      }
                    </span>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <SectionHeader 
            title="Driver Issues"
            description="View and manage driver compliance issues"
          />
          <div className="mt-4 text-center py-8 text-gray-500">
            <p>Driver issue tracking will be displayed here.</p>
            <p className="text-sm">Use the sidebar to navigate to specific issue types.</p>
          </div>
        </div>
      </div>
    </AppLayout>
  )
} 