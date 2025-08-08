import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SignUpButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { SmartRedirect } from "@/components/routing/smart-redirect";
import { DashboardQuickAccess } from "@/components/dashboard/dashboard-quick-access";
import Header from "@/components/layout/header";
import {
  Building,
  Users,
  Shield,
  Truck,
  CheckCircle,
  ArrowRight,
  LayoutDashboard,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

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
            DOT Compliance Made Simple with{" "}
            <Image
              src="/fleetrax-logo.png"
              alt="Fleetrax"
              width={180}
              height={48}
              className="inline-block h-12 sm:h-16 w-auto align-baseline"
              priority
            />
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Streamline your fleet's compliance tracking, automate expiration notifications, and
            manage inspections and accidents with our intelligent platform.
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
              <Truck className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Equipment Management</h3>
            <p className="text-muted-foreground">
              Track registrations, inspections, and maintenance schedules
            </p>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-purple-100 text-purple-600 mb-4">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Driver Records</h3>
            <p className="text-muted-foreground">
              Manage licenses, training, physicals, and safety records
            </p>
          </div>
        </div>

        {/* Sign Up Section for New Users */}
        <SignedOut>
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Choose your role to get personalized onboarding experience
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Master Organization Card */}
              <Card className="relative hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-200">
                <CardHeader className="text-center pb-3">
                  <div className="absolute top-3 right-3">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                      Popular
                    </Badge>
                  </div>
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 mx-auto mb-3">
                    <Building className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg">Fleet Owner/Manager</CardTitle>
                  <CardDescription className="text-sm">
                    Complete fleet management platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                      Master organization dashboard
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                      Manage multiple organizations
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                      Full compliance oversight
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                      Advanced reporting & analytics
                    </li>
                  </ul>

                  <SignUpButton mode="modal" forceRedirectUrl="/complete-profile?role=master">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700" size="sm">
                      Start as Fleet Manager
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </SignUpButton>
                </CardContent>
              </Card>

              {/* Organization Card */}
              <Card className="relative hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-green-200">
                <CardHeader className="text-center pb-3">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600 mx-auto mb-3">
                    <Users className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg">Organization Admin</CardTitle>
                  <CardDescription className="text-sm">
                    Single organization management
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                      Organization dashboard
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                      Driver & equipment management
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                      Compliance tracking
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                      Standard reporting
                    </li>
                  </ul>

                  <SignUpButton mode="modal" forceRedirectUrl="/complete-profile?role=organization">
                    <Button className="w-full bg-green-600 hover:bg-green-700" size="sm">
                      Start as Organization
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </SignUpButton>
                </CardContent>
              </Card>

              {/* Consultant Card */}
              <Card className="relative hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-purple-200">
                <CardHeader className="text-center pb-3">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 text-purple-600 mx-auto mb-3">
                    <Shield className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg">Compliance Consultant</CardTitle>
                  <CardDescription className="text-sm">Serve multiple clients</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                      Client management dashboard
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                      Multi-client oversight
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                      Compliance services
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                      Consultant tools
                    </li>
                  </ul>

                  <SignUpButton mode="modal" forceRedirectUrl="/complete-profile?role=consultant">
                    <Button className="w-full bg-purple-600 hover:bg-purple-700" size="sm">
                      Start as Consultant
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </SignUpButton>
                </CardContent>
              </Card>
            </div>

            <div className="text-center mt-8">
              <p className="text-sm text-muted-foreground">
                Not sure which option is right for you?
                <span className="ml-1 text-blue-600 underline cursor-pointer text-sm">
                  Contact us for guidance
                </span>
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

            <DashboardQuickAccess />
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
  );
}
