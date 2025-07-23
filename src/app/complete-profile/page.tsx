'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building, Users, MapPin, AlertCircle, CheckCircle } from 'lucide-react'

const roleConfig = {
  master: {
    title: 'Master Manager',
    description: 'Manage multiple organizations with full administrative control',
    icon: Building,
    color: 'bg-blue-100 text-blue-600'
  },
  organization: {
    title: 'Organization Manager', 
    description: 'Manage your organization, drivers, and equipment',
    icon: Users,
    color: 'bg-green-100 text-green-600'
  },
  location: {
    title: 'Location Manager',
    description: 'Manage drivers and equipment at your specific location',
    icon: MapPin,
    color: 'bg-orange-100 text-orange-600'
  }
}

function CompleteProfileForm() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    organizationName: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  
  const role = searchParams.get('role') || 'organization'
  const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.organization
  const IconComponent = config.icon

  useEffect(() => {
    if (isLoaded && user) {
      // Pre-fill from Clerk if available
      setFormData(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || ''
      }))
    }
  }, [isLoaded, user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/user/complete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          role,
          organizationName: formData.organizationName
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to complete profile')
      }

      // Note: User name is already set in Clerk from signup
      // Our database stores the authoritative profile information

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    router.push('/')
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${config.color} mx-auto mb-4`}>
            <IconComponent className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
          <CardDescription className="text-base">
            Finish setting up your account to get started
          </CardDescription>
          
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="font-medium text-sm">{config.title}</p>
            <p className="text-xs text-muted-foreground">{config.description}</p>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  required
                  placeholder="Enter first name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  required
                  placeholder="Enter last name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="organizationName">
                {role === 'master' ? 'Company Name' : role === 'organization' ? 'Organization Name' : 'Location Name'}
              </Label>
              <Input
                id="organizationName"
                value={formData.organizationName}
                onChange={(e) => setFormData(prev => ({ ...prev, organizationName: e.target.value }))}
                required
                placeholder={`Enter ${role === 'master' ? 'company' : role === 'organization' ? 'organization' : 'location'} name`}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Setting up...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete Setup
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function CompleteProfileContent() {
  return <CompleteProfileForm />
}

export default function CompleteProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <CompleteProfileContent />
    </Suspense>
  )
} 