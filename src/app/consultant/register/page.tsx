'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Shield, CheckCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const specializations = [
  { value: 'DOT_AUDIT', label: 'DOT Audit Preparation' },
  { value: 'SAFETY', label: 'Safety Management' },
  { value: 'HOURS_OF_SERVICE', label: 'Hours of Service Compliance' },
  { value: 'DRIVER_QUALIFICATION', label: 'Driver Qualification Files' },
  { value: 'VEHICLE_MAINTENANCE', label: 'Vehicle Maintenance Records' },
  { value: 'DRUG_ALCOHOL', label: 'Drug & Alcohol Testing' },
  { value: 'HAZMAT', label: 'Hazmat Transportation' },
  { value: 'GENERAL', label: 'General DOT Compliance' }
]

export default function ConsultantRegisterPage() {
  const { isSignedIn } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    licenseNumber: '',
    yearsExperience: '',
    hourlyRate: '',
    bio: '',
    specializations: [] as string[]
  })

  const handleSpecializationToggle = (value: string) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(value)
        ? prev.specializations.filter(s => s !== value)
        : [...prev.specializations, value]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/consultants/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        router.push('/consultant/dashboard')
      } else {
        throw new Error('Registration failed')
      }
    } catch (error) {
      console.error('Registration error:', error)
      alert('Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 text-purple-600 mx-auto mb-4" />
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              Please sign in to register as a DOT consultant
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 text-purple-600 mb-4">
              <Shield className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Join as DOT Consultant</h1>
            <p className="text-lg text-muted-foreground">
              Connect with fleet operators who need your expertise
            </p>
          </div>

          {/* Benefits */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Consultant Benefits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">📊 Access to Real Data</p>
                  <p className="text-xs text-muted-foreground">Review client compliance data with their consent</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">🎯 Targeted Opportunities</p>
                  <p className="text-xs text-muted-foreground">Receive consultation requests matching your expertise</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">⏰ Flexible Engagement</p>
                  <p className="text-xs text-muted-foreground">Accept projects that fit your schedule</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">💰 Built-in Billing</p>
                  <p className="text-xs text-muted-foreground">Integrated payment processing for your services</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Registration Form */}
          <Card>
            <CardHeader>
              <CardTitle>Consultant Profile</CardTitle>
              <CardDescription>
                Tell us about your DOT compliance expertise and experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* License Number */}
                <div className="space-y-2">
                  <Label htmlFor="licenseNumber">DOT License/Certification Number (Optional)</Label>
                  <Input
                    id="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, licenseNumber: e.target.value }))}
                    placeholder="e.g., DOT-12345"
                  />
                </div>

                {/* Years of Experience */}
                <div className="space-y-2">
                  <Label htmlFor="yearsExperience">Years of DOT Compliance Experience</Label>
                  <Input
                    id="yearsExperience"
                    type="number"
                    min="0"
                    max="50"
                    value={formData.yearsExperience}
                    onChange={(e) => setFormData(prev => ({ ...prev, yearsExperience: e.target.value }))}
                    placeholder="e.g., 10"
                    required
                  />
                </div>

                {/* Hourly Rate */}
                <div className="space-y-2">
                  <Label htmlFor="hourlyRate">Hourly Rate (USD)</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    min="25"
                    max="500"
                    step="5"
                    value={formData.hourlyRate}
                    onChange={(e) => setFormData(prev => ({ ...prev, hourlyRate: e.target.value }))}
                    placeholder="e.g., 150"
                    required
                  />
                </div>

                {/* Specializations */}
                <div className="space-y-3">
                  <Label>Areas of Expertise</Label>
                  <p className="text-sm text-muted-foreground">Select all areas where you provide consulting services</p>
                  <div className="grid grid-cols-2 gap-2">
                    {specializations.map((spec) => (
                      <div
                        key={spec.value}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          formData.specializations.includes(spec.value)
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleSpecializationToggle(spec.value)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{spec.label}</span>
                          {formData.specializations.includes(spec.value) && (
                            <CheckCircle className="h-4 w-4 text-purple-600" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {formData.specializations.length === 0 && (
                    <p className="text-sm text-red-500">Please select at least one specialization</p>
                  )}
                </div>

                {/* Bio */}
                <div className="space-y-2">
                  <Label htmlFor="bio">Professional Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Describe your background, certifications, and what makes you a great DOT consultant..."
                    rows={4}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    This will be shown to potential clients. Highlight your experience and qualifications.
                  </p>
                </div>

                {/* Submit */}
                <div className="flex gap-4">
                  <Link href="/" className="flex-1">
                    <Button type="button" variant="outline" className="w-full">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Home
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    disabled={loading || formData.specializations.length === 0}
                    className="flex-2 bg-purple-600 hover:bg-purple-700"
                  >
                    {loading ? 'Creating Profile...' : 'Complete Registration'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 