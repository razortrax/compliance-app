"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useUser } from '@clerk/nextjs'
import { AppLayout } from '@/components/layouts/app-layout'
import { useMasterOrg } from '@/hooks/use-master-org'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { 
  Building2, 
  MapPin, 
  Users, 
  Truck,
  ArrowLeft,
  Edit,
  Save,
  X,
  Plus,
  Phone,
  FileText,
  Building,
  AlertCircle,
  ChevronRight
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { EmptyState } from "@/components/ui/empty-state"
import { PageHeader } from "@/components/ui/page-header"
import { SectionHeader } from "@/components/ui/section-header"
import { StatusBadge } from "@/components/ui/status-badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { LocationForm } from "@/components/locations/location-form"

interface Organization {
  id: string
  name: string
  dotNumber?: string | null
  einNumber?: string | null
  phone?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  zipCode?: string | null
  party?: {
    status: string
    userId?: string | null
  }
}

interface Location {
  id: string
  name: string
  locationType: string
  address: string
  city: string
  state: string
  zipCode: string
  phone?: string | null
  email?: string | null
  isMainLocation?: boolean
  _count?: {
    equipment: number
    role: number
  }
}

export default function OrganizationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useUser()
  const { masterOrg } = useMasterOrg()
  const organizationId = params.id as string

  const [organization, setOrganization] = useState<Organization | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editedOrg, setEditedOrg] = useState<Organization | null>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [locations, setLocations] = useState<Location[]>([])
  const [showLocationForm, setShowLocationForm] = useState(false)

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

  const fetchLocations = async () => {
    if (!organizationId) return
    
    try {
      const response = await fetch(`/api/organizations/${organizationId}/locations`)
      if (response.ok) {
        const data = await response.json()
        setLocations(data)
      } else {
        console.error('Failed to fetch locations - Status:', response.status)
        const errorText = await response.text()
        console.error('Error response:', errorText)
      }
    } catch (error) {
      console.error('Error fetching locations:', error)
    }
  }



  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        const response = await fetch(`/api/organizations/${organizationId}`)
        console.log('API Response status:', response.status)
        
        if (response.ok) {
          const data = await response.json()
          console.log('API Response data:', data)
          setOrganization(data)
          setEditedOrg(data)
        } else {
          console.error('Failed to fetch organization - Status:', response.status)
          const errorText = await response.text()
          console.error('Error response:', errorText)
        }
      } catch (error) {
        console.error('Error fetching organization:', error)
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



    if (organizationId) {
      fetchOrganization()
      fetchOrganizations()
      fetchLocations()
    }
  }, [organizationId])

  const handleEdit = () => {
    setIsEditing(true)
    setEditedOrg(organization)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditedOrg(organization)
  }

  const handleSave = async () => {
    if (!editedOrg) return
    
    setIsSaving(true)
    try {
      const response = await fetch(`/api/organizations/${organizationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedOrg),
      })

      if (response.ok) {
        const updatedOrg = await response.json()
        setOrganization(updatedOrg)
        setIsEditing(false)
      } else {
        console.error('Failed to save organization')
      }
    } catch (error) {
      console.error('Error saving organization:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleOrganizationSelect = (selectedOrg: Organization) => {
    setIsSheetOpen(false)
    router.push(`/organizations/${selectedOrg.id}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Organization not found</h2>
            <Button onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Get master organization name for header
  const masterName = masterOrg?.name || 'Master'
  
  // Top navigation per pagesContentOutline specification
  const topNav = [
    { 
      label: 'Master', 
      href: '/dashboard',
      isActive: false
    },
    { 
      label: 'Organization', 
      href: `/organizations/${organizationId}`,
      isActive: true  // Current page
    },
    { 
      label: 'Drivers', 
      href: `/organizations/${organizationId}/drivers`,
      isActive: false
    },
    { 
      label: 'Equipment', 
      href: `/organizations/${organizationId}/equipment`,
      isActive: false
    }
  ]

  return (
    <AppLayout
      name={masterName}
      topNav={topNav}
      showOrgSelector={true}
      showDriverEquipmentSelector={true}
      sidebarMenu="organization"
      className="p-6"
      // Pass organization selector props
      organizations={organizations}
      currentOrgId={organizationId}
      isSheetOpen={isSheetOpen}
      onSheetOpenChange={setIsSheetOpen}
      onOrganizationSelect={handleOrganizationSelect}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Name row per pagesContentOutline: Organization name + Edit/Reports buttons */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{organization.name}</h1>
          
          <div className="flex items-center gap-2">
            {/* Reports Button */}
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Reports
            </Button>
            
            {/* Edit Button */}
            {!isEditing ? (
              <Button onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Organization Details - Overview content from tabs */}
        <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Organization Information</CardTitle>
                    <CardDescription>
                      Basic details and contact information
                    </CardDescription>
                  </div>
                  <StatusBadge 
                    status={organization.party?.status as any || 'active'} 
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Organization Name</Label>
                    {isEditing ? (
                      <Input
                        value={editedOrg?.name || ''}
                        onChange={(e) => setEditedOrg(prev => prev ? {...prev, name: e.target.value} : null)}
                      />
                    ) : (
                      <p className="text-gray-900">{organization.name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>DOT Number</Label>
                    {isEditing ? (
                      <Input
                        value={editedOrg?.dotNumber || ''}
                        onChange={(e) => setEditedOrg(prev => prev ? {...prev, dotNumber: e.target.value} : null)}
                      />
                    ) : (
                      <p className="text-gray-900">
                        {organization.dotNumber === 'NO_DOT' 
                          ? 'No DOT Number' 
                          : organization.dotNumber || 'Not provided'}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>EIN Number</Label>
                    {isEditing ? (
                      <Input
                        value={editedOrg?.einNumber || ''}
                        onChange={(e) => setEditedOrg(prev => prev ? {...prev, einNumber: e.target.value} : null)}
                        placeholder="XX-XXXXXXX"
                      />
                    ) : (
                      <p className="text-gray-900">{organization.einNumber || 'Not provided'}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Phone</Label>
                    {isEditing ? (
                      <Input
                        value={editedOrg?.phone || ''}
                        onChange={(e) => setEditedOrg(prev => prev ? {...prev, phone: e.target.value} : null)}
                      />
                    ) : (
                      <p className="text-gray-900">{organization.phone || 'Not provided'}</p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Address</Label>
                    {isEditing ? (
                      <Textarea
                        value={editedOrg?.address || ''}
                        onChange={(e) => setEditedOrg(prev => prev ? {...prev, address: e.target.value} : null)}
                        rows={2}
                      />
                    ) : (
                      <p className="text-gray-900">{organization.address || 'Not provided'}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>City</Label>
                    {isEditing ? (
                      <Input
                        value={editedOrg?.city || ''}
                        onChange={(e) => setEditedOrg(prev => prev ? {...prev, city: e.target.value} : null)}
                      />
                    ) : (
                      <p className="text-gray-900">{organization.city || 'Not provided'}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>State</Label>
                    {isEditing ? (
                      <Input
                        value={editedOrg?.state || ''}
                        onChange={(e) => setEditedOrg(prev => prev ? {...prev, state: e.target.value} : null)}
                      />
                    ) : (
                      <p className="text-gray-900">{organization.state || 'Not provided'}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Zip Code</Label>
                    {isEditing ? (
                      <Input
                        value={editedOrg?.zipCode || ''}
                        onChange={(e) => setEditedOrg(prev => prev ? {...prev, zipCode: e.target.value} : null)}
                      />
                    ) : (
                      <p className="text-gray-900">{organization.zipCode || 'Not provided'}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
        </div>
      </div>
    </AppLayout>
  )
} 