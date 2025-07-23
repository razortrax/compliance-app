"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Rocket, FileSpreadsheet, Eye, ChevronRight, Building, Users, Truck } from "lucide-react"

interface OnboardingWizardProps {
  userRole: 'master' | 'organization'
  onComplete: () => void
}

export function OnboardingWizard({ userRole, onComplete }: OnboardingWizardProps) {
  const [selectedPath, setSelectedPath] = useState<string | null>(null)

  const handlePathSelection = (path: string) => {
    setSelectedPath(path)
    // For now, just complete the wizard
    // Later we'll implement the actual flows
    setTimeout(() => {
      onComplete()
    }, 500)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mx-auto mb-6">
          <Rocket className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-bold mb-4">🎉 Welcome to ComplianceApp!</h1>
        <p className="text-lg text-muted-foreground mb-2">
          {userRole === 'master' 
            ? "Let's get your fleet management operation set up."
            : "Let's get your organization's compliance tracking started."
          }
        </p>
        <Badge variant="outline" className="mb-8">
          {userRole === 'master' ? "Master Manager" : "Organization Manager"} Setup
        </Badge>
      </div>

      <div className="grid gap-6 mb-8">
        <h2 className="text-xl font-semibold text-center">Choose your setup approach:</h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          {/* Quick Start */}
          <Card 
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedPath === 'quick-start' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:border-blue-200'
            }`}
            onClick={() => handlePathSelection('quick-start')}
          >
            <CardHeader className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-green-100 text-green-600 mx-auto mb-3">
                <Rocket className="h-6 w-6" />
              </div>
              <CardTitle className="text-lg">🚀 Quick Start</CardTitle>
              <CardDescription>
                Perfect for getting started quickly with manual entry
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  <span>Create your first organization</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>Add 2-3 sample drivers</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  <span>Register 1-2 vehicles</span>
                </div>
              </div>
              <div className="mt-4 text-center">
                <Badge variant="secondary">~10 minutes</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Import Data */}
          <Card 
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedPath === 'import-data' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:border-orange-200'
            }`}
            onClick={() => handlePathSelection('import-data')}
          >
            <CardHeader className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-orange-100 text-orange-600 mx-auto mb-3">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <CardTitle className="text-lg">📊 Import Data</CardTitle>
              <CardDescription>
                Have existing data? Let's help you import it
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span>• Download our Excel templates</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>• Fill in your existing data</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>• Upload and validate</span>
                </div>
              </div>
              <div className="mt-4 text-center">
                <Badge variant="outline">Coming Soon</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Take a Tour */}
          <Card 
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedPath === 'demo-tour' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:border-purple-200'
            }`}
            onClick={() => handlePathSelection('demo-tour')}
          >
            <CardHeader className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-purple-100 text-purple-600 mx-auto mb-3">
                <Eye className="h-6 w-6" />
              </div>
              <CardTitle className="text-lg">👀 Take a Tour</CardTitle>
              <CardDescription>
                Explore the platform with sample data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span>• Pre-loaded demo data</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>• Interactive guided tour</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>• See all features in action</span>
                </div>
              </div>
              <div className="mt-4 text-center">
                <Badge variant="outline">Demo Mode</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="text-center space-y-4">
        {selectedPath && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-center gap-2 text-blue-700 mb-2">
              <ChevronRight className="h-4 w-4" />
              <span className="font-medium">
                {selectedPath === 'quick-start' && "Let's create your first organization"}
                {selectedPath === 'import-data' && "Import feature will be available soon"}
                {selectedPath === 'demo-tour' && "Demo tour will start shortly"}
              </span>
            </div>
            {selectedPath === 'quick-start' && (
              <p className="text-sm text-blue-600">
                You'll be guided through creating an organization and adding your first drivers and vehicles.
              </p>
            )}
          </div>
        )}
        
        <div className="flex gap-4 justify-center">
          <Button variant="outline" onClick={() => window.location.href = '/'}>
            Back to Home
          </Button>
          {selectedPath === 'import-data' && (
            <Button disabled>
              Contact Us for Import
            </Button>
          )}
        </div>
      </div>

      {/* Help Section */}
      <div className="mt-12 text-center">
        <p className="text-sm text-muted-foreground">
          Need help deciding? 
          <Button variant="link" className="p-0 ml-1 h-auto text-sm">
            Contact our support team
          </Button>
        </p>
      </div>
    </div>
  )
} 