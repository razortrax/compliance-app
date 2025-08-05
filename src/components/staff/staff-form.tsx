'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface StaffFormProps {
  organizationId: string
  staff?: any // Existing staff for editing
  onSuccess: () => void
  onCancel: () => void
}

interface FormData {
  selectedPersonId: string
  employeeId: string
  position: string
  department: string
  supervisorId: string
  canApproveCAFs: boolean
  canSignCAFs: boolean
}

interface NewPersonData {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zipCode: string
}

export const StaffForm: React.FC<StaffFormProps> = ({
  organizationId,
  staff,
  onSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState<FormData>({
    selectedPersonId: staff?.partyId || '',
    employeeId: staff?.employeeId || '',
    position: staff?.position || '',
    department: staff?.department || '',
    supervisorId: staff?.supervisorId || 'none',
    canApproveCAFs: staff?.canApproveCAFs || false,
    canSignCAFs: staff?.canSignCAFs || false,
  })

  const [newPersonData, setNewPersonData] = useState<NewPersonData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
  })
  
  const [personTab, setPersonTab] = useState<'existing' | 'new'>(staff ? 'existing' : 'new')
  const [availablePersons, setAvailablePersons] = useState<any[]>([])
  const [existingStaff, setExistingStaff] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchAvailablePersons()
    fetchExistingStaff()
  }, [organizationId])

  const fetchAvailablePersons = async () => {
    try {
      const response = await fetch(`/api/persons?organizationId=${organizationId}`)
      if (response.ok) {
        const data = await response.json()
        setAvailablePersons(data)
      }
    } catch (error) {
      console.error('Error fetching persons:', error)
    }
  }

  const fetchExistingStaff = async () => {
    try {
      const response = await fetch(`/api/staff?organizationId=${organizationId}`)
      if (response.ok) {
        const data = await response.json()
        setExistingStaff(data)
      }
    } catch (error) {
      console.error('Error fetching staff:', error)
    }
  }

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleNewPersonChange = (field: keyof NewPersonData, value: string) => {
    setNewPersonData(prev => ({ ...prev, [field]: value }))
  }

  const createNewPerson = async (): Promise<string> => {
    try {
      // First create the person
      const personResponse = await fetch('/api/persons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newPersonData,
          roleType: 'STAFF', // Required field for staff members
          organizationId,
        }),
      })

      if (!personResponse.ok) {
        const error = await personResponse.json()
        throw new Error(error.error || 'Failed to create person')
      }

      const person = await personResponse.json()
      if (!person.partyId) {
        throw new Error('Person created but no partyId returned')
      }
      return person.partyId
    } catch (error) {
      console.error('Error creating person:', error)
      throw error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (personTab === 'existing' && !formData.selectedPersonId) {
      alert('Please select a person')
      return
    }
    
    if (personTab === 'new') {
      if (!newPersonData.firstName || !newPersonData.lastName) {
        alert('Please enter first and last name for the new person')
        return
      }
    }

    setLoading(true)
    try {
      let partyId = formData.selectedPersonId

      // If creating a new person, create them first
      if (personTab === 'new') {
        partyId = await createNewPerson()
      }

      const url = staff ? `/api/staff/${staff.id}` : '/api/staff'
      const method = staff ? 'PUT' : 'POST'
      
      const requestData = {
        partyId,
        employeeId: formData.employeeId || undefined,
        position: formData.position || undefined,
        department: formData.department || undefined,
        supervisorId: formData.supervisorId === 'none' ? undefined : formData.supervisorId,
        canApproveCAFs: formData.canApproveCAFs,
        canSignCAFs: formData.canSignCAFs,
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      })

      if (response.ok) {
        onSuccess()
      } else {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        try {
          const error = await response.json()
          errorMessage = error.error || errorMessage
        } catch (jsonError) {
          // If JSON parsing fails, use the status text
          console.error('Failed to parse error response as JSON:', jsonError)
        }
        alert(`Error: ${errorMessage}`)
      }
    } catch (error) {
      console.error('Error saving staff:', error)
      alert(`Error saving staff member: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  // Filter out persons who already have staff records
  const availablePersonsForSelection = availablePersons.filter(person => 
    !existingStaff.some(staffMember => staffMember.partyId === person.partyId) ||
    person.partyId === staff?.partyId
  )

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Person Selection/Creation */}
        <div>
          <Label className="text-base font-medium">Staff Member</Label>
          <Tabs value={personTab} onValueChange={(value) => setPersonTab(value as 'existing' | 'new')} className="mt-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="existing">Select Existing</TabsTrigger>
              <TabsTrigger value="new" disabled={!!staff}>Create New</TabsTrigger>
            </TabsList>
            
            <TabsContent value="existing" className="mt-4">
              <Select 
                value={formData.selectedPersonId} 
                onValueChange={value => handleInputChange('selectedPersonId', value)}
                required={personTab === 'existing'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a person" />
                </SelectTrigger>
                <SelectContent>
                  {availablePersonsForSelection.map(person => (
                    <SelectItem key={person.partyId} value={person.partyId}>
                      {person.firstName} {person.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TabsContent>
            
            <TabsContent value="new" className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={newPersonData.firstName}
                    onChange={e => handleNewPersonChange('firstName', e.target.value)}
                    placeholder="John"
                    required={personTab === 'new'}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={newPersonData.lastName}
                    onChange={e => handleNewPersonChange('lastName', e.target.value)}
                    placeholder="Doe"
                    required={personTab === 'new'}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newPersonData.email}
                    onChange={e => handleNewPersonChange('email', e.target.value)}
                    placeholder="john.doe@company.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={newPersonData.phone}
                    onChange={e => handleNewPersonChange('phone', e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={newPersonData.address}
                  onChange={e => handleNewPersonChange('address', e.target.value)}
                  placeholder="123 Main St"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={newPersonData.city}
                    onChange={e => handleNewPersonChange('city', e.target.value)}
                    placeholder="Springfield"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={newPersonData.state}
                    onChange={e => handleNewPersonChange('state', e.target.value)}
                    placeholder="IL"
                    maxLength={2}
                  />
                </div>
                <div>
                  <Label htmlFor="zipCode">ZIP Code</Label>
                  <Input
                    id="zipCode"
                    value={newPersonData.zipCode}
                    onChange={e => handleNewPersonChange('zipCode', e.target.value)}
                    placeholder="62701"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="h-px bg-gray-200 my-4"></div>

        {/* Role & Department Information */}
        <div>
          <Label className="text-base font-medium">Role & Department</Label>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div>
              <Label htmlFor="employeeId">Employee ID (Optional)</Label>
              <Input
                id="employeeId"
                value={formData.employeeId}
                onChange={e => handleInputChange('employeeId', e.target.value)}
                placeholder="EMP001"
              />
            </div>
            <div>
              <Label htmlFor="position">Position/Job Title</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={e => handleInputChange('position', e.target.value)}
                placeholder="Safety Manager, Operations Manager, etc."
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={e => handleInputChange('department', e.target.value)}
                placeholder="Safety, Operations, Maintenance, etc."
              />
            </div>
            <div>
              <Label htmlFor="supervisor">Supervisor (Optional)</Label>
              <Select 
                value={formData.supervisorId} 
                onValueChange={value => handleInputChange('supervisorId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select supervisor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No supervisor</SelectItem>
                  {existingStaff
                    .filter(s => s.id !== staff?.id) // Don't allow self-supervision
                    .map(staffMember => (
                    <SelectItem key={staffMember.id} value={staffMember.id}>
                      {staffMember.party?.person?.firstName} {staffMember.party?.person?.lastName}
                      {staffMember.position && ` (${staffMember.position})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="h-px bg-gray-200 my-4"></div>

        {/* CAF Permissions */}
        <div>
          <Label className="text-base font-medium">CAF Permissions</Label>
          <div className="mt-3 space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="canSignCAFs"
                checked={formData.canSignCAFs}
                onCheckedChange={checked => handleInputChange('canSignCAFs', checked)}
              />
              <Label htmlFor="canSignCAFs" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Can sign Corrective Action Forms (CAFs)
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="canApproveCAFs"
                checked={formData.canApproveCAFs}
                onCheckedChange={checked => handleInputChange('canApproveCAFs', checked)}
              />
              <Label htmlFor="canApproveCAFs" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Can approve Corrective Action Forms (CAFs)
              </Label>
            </div>

            <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded">
              <strong>Note:</strong> CAF permissions are used for the corrective action workflow in roadside inspections and accidents. 
              Staff with signing permissions can complete assigned CAFs, while staff with approval permissions can review and approve completed CAFs.
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : staff ? 'Update Staff' : 'Add Staff'}
          </Button>
        </div>
      </form>
    </div>
  )
} 