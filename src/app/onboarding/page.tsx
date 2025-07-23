'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Building, Users, Shield, CheckCircle } from 'lucide-react'

export default function OnboardingPage() {
  const { user } = useUser()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    roleType: '',
    organizationName: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.firstName || !formData.lastName || !formData.roleType) {
      return
    }
    
    // Validate organization name for non-consultant roles
    if (formData.roleType !== 'consultant' && !formData.organizationName) {
      alert('Please enter your organization name')
      return
    }

    setLoading(true)
    try {
      // Update Clerk user profile with first/last name
      if (user && (!user.firstName || !user.lastName)) {
        try {
          await user.update({
            firstName: formData.firstName,
            lastName: formData.lastName
          })
        } catch (clerkError) {
          console.log('Clerk profile update failed, continuing with our database:', clerkError)
          // Continue anyway - we'll store the name in our database
        }
      }

      // Call API to create user's party record and initial role
      const response = await fetch('/api/user/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        // Redirect to dashboard
        router.push('/dashboard')
        router.refresh()
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Onboarding failed:', errorData)
        alert(`Onboarding failed: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error during onboarding:', error)
    } finally {
      setLoading(false)
    }
  }

  const roleOptions = [
    {
      value: 'master',
      label: 'Master Manager',
      description: 'Manage multiple fleets and organizations',
      icon: <Building className="h-5 w-5" />,
      color: 'text-blue-600'
    },
    {
      value: 'organization',
      label: 'Fleet Manager',
      description: 'Manage a single fleet operation',
      icon: <Users className="h-5 w-5" />,
      color: 'text-green-600'
    },
    {
      value: 'consultant',
      label: 'DOT Consultant',
      description: 'Provide compliance consulting services',
      icon: <Shield className="h-5 w-5" />,
      color: 'text-purple-600'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Welcome to ComplianceApp</h1>
            <p className="text-lg text-muted-foreground">
              Let's set up your account to get started with fleet compliance management
            </p>
          </div>

          {/* Onboarding Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Account Setup
              </CardTitle>
              <CardDescription>
                Please provide some basic information to customize your experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="Enter your first name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Enter your last name"
                      required
                    />
                  </div>
                </div>

                {/* Role Selection */}
                <div>
                  <Label htmlFor="roleType">Your Role</Label>
                  <Select value={formData.roleType} onValueChange={(value) => setFormData(prev => ({ ...prev, roleType: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your primary role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          <div className="flex items-center gap-3">
                            <span className={role.color}>{role.icon}</span>
                            <div>
                              <div className="font-medium">{role.label}</div>
                              <div className="text-sm text-muted-foreground">{role.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Organization Name (if not consultant) */}
                {formData.roleType && formData.roleType !== 'consultant' && (
                  <div>
                    <Label htmlFor="organizationName">
                      {formData.roleType === 'master' ? 'Primary Organization Name' : 'Organization Name'}
                    </Label>
                    <Input
                      id="organizationName"
                      value={formData.organizationName}
                      onChange={(e) => setFormData(prev => ({ ...prev, organizationName: e.target.value }))}
                      placeholder="Enter your company/organization name"
                      required={formData.roleType !== 'consultant'}
                    />
                  </div>
                )}

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading || !formData.firstName || !formData.lastName || !formData.roleType || 
                    (formData.roleType !== 'consultant' && !formData.organizationName)}
                >
                  {loading ? 'Setting up your account...' : 'Complete Setup'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Help Text */}
          <div className="text-center mt-6 text-sm text-muted-foreground">
            <p>
              Don't worry, you can change these settings later in your account preferences.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 