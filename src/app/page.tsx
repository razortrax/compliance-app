import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SignUpButton, SignedIn, SignedOut } from "@clerk/nextjs"
import { SmartRedirect } from "@/components/routing/smart-redirect"
import Header from "@/components/layout/header"
import { Building, Users, Shield, Truck, CheckCircle, ArrowRight, LayoutDashboard } from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header with sign-in button */}
      <Header />
      
      {/* Smart redirect for signed-in users */}
      <SignedIn>
        <SmartRedirect />
      </SignedIn>
      
      <div className="container mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            Fleet Compliance Made Simple
          </Badge>
          <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
            DOT Compliance Made Simple with{' '}
            <img 
              src="/fleetrax-logo.png" 
              alt="Fleetrax" 
              className="inline-block h-12 sm:h-16 w-auto align-baseline"
            />
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Streamline your fleet's compliance tracking, automate expiration notifications, 
            and manage inspections and accidents with our intelligent platform.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100 text-blue-600 mb-4">
              <Shield className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">DOT Compliance</h3>
            <p className="text-muted-foreground">
              Stay ahead of regulations with automated tracking and alerts
            </p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-green-100 text-green-600 mb-4">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Driver Management</h3>
            <p className="text-muted-foreground">
              Track licenses, physicals, and training requirements
            </p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-orange-100 text-orange-600 mb-4">
              <Truck className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Fleet Tracking</h3>
            <p className="text-muted-foreground">
              Monitor vehicle inspections and maintenance schedules
            </p>
          </div>
        </div>

        {/* Role Selection Section - For Non-Authenticated Users */}
        <SignedOut>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Choose Your Management Level</h2>
              <p className="text-lg text-muted-foreground">
                Select the option that best describes your role and responsibilities
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
            {/* Master Manager Card */}
            <Card className="relative hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-200">
              <CardHeader className="text-center pb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mx-auto mb-4">
                  <Building className="h-8 w-8" />
                </div>
                <CardTitle className="text-2xl">Master Manager</CardTitle>
                <CardDescription className="text-base">
                  Perfect for consultants, parent companies, or multi-location operations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm">Manage multiple organizations</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm">Full administrative control</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm">Set user permissions</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm">Cross-company reporting</span>
                  </div>
                </div>
                <SignUpButton mode="modal" forceRedirectUrl="/complete-profile?role=master">
                  <Button className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
                    Get Started as Master
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </SignUpButton>
              </CardContent>
            </Card>

            {/* Organization Manager Card */}
            <Card className="relative hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-green-200">
              <CardHeader className="text-center pb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mx-auto mb-4">
                  <Users className="h-8 w-8" />
                </div>
                <CardTitle className="text-2xl">Organization Manager</CardTitle>
                <CardDescription className="text-base">
                  Ideal for single-company fleet managers and safety coordinators
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm">Manage your organization</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm">Track drivers and equipment</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm">Compliance monitoring</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm">Issue management</span>
                  </div>
                </div>
                                 <SignUpButton mode="modal" forceRedirectUrl="/complete-profile?role=organization">
                   <Button className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
                     Get Started as Manager
                     <ArrowRight className="ml-2 h-4 w-4" />
                   </Button>
                 </SignUpButton>
              </CardContent>
            </Card>

            {/* DOT Consultant Card */}
            <Card className="relative hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-purple-200">
              <CardHeader className="text-center pb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 text-purple-600 mx-auto mb-4">
                  <Shield className="h-8 w-8" />
                </div>
                <CardTitle className="text-2xl">DOT Consultant</CardTitle>
                <CardDescription className="text-base">
                  For compliance experts offering consulting services to fleets
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm">Manage multiple client companies</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm">Temporary data access with consent</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm">Audit preparation assistance</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm">Compliance consulting marketplace</span>
                  </div>
                </div>
                <SignUpButton mode="modal" forceRedirectUrl="/consultant/register">
                  <Button className="w-full mt-6 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
                    Join as Consultant
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </SignUpButton>
              </CardContent>
            </Card>
          </div>

            <div className="text-center mt-8">
              <p className="text-sm text-muted-foreground">
                Not sure which option is right for you? 
                <Button variant="link" className="p-0 ml-1 h-auto text-sm">
                  Contact us for guidance
                </Button>
              </p>
            </div>
          </div>
        </SignedOut>

        {/* Quick Access for Authenticated Users - Optional, Not Forced */}
        <SignedIn>
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <Badge variant="outline" className="mb-3 bg-green-50 text-green-700 border-green-200">
                ✅ You're signed in
              </Badge>
              <h2 className="text-2xl font-bold mb-2">Quick Access</h2>
              <p className="text-muted-foreground">
                Jump directly to your workspace, or continue browsing below
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Link href="/dashboard">
                <Card className="relative hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-200 h-full">
                  <CardHeader className="text-center pb-3">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 mx-auto mb-3">
                      <LayoutDashboard className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-lg">Master Dashboard</CardTitle>
                    <CardDescription className="text-sm">
                      Fleet overview and compliance metrics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700" size="sm">
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/organizations">
                <Card className="relative hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-green-200 h-full">
                  <CardHeader className="text-center pb-3">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600 mx-auto mb-3">
                      <Building className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-lg">Organizations</CardTitle>
                    <CardDescription className="text-sm">
                      Manage your organizations and fleet
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full bg-green-600 hover:bg-green-700" size="sm">
                      Manage Organizations
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </SignedIn>

        {/* Trust Section */}
        <div className="text-center mt-20 mb-8">
          <p className="text-sm text-muted-foreground">
            Trusted by fleet managers nationwide • SOC 2 Compliant • 99.9% Uptime
          </p>
        </div>
      </div>
    </div>
  )
}
