"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building, Users, MapPin, AlertCircle, CheckCircle } from "lucide-react";

const roleConfig = {
  master: {
    title: "Master Manager",
    description: "Manage multiple organizations with full administrative control",
    icon: Building,
    color: "bg-blue-100 text-blue-600",
  },
  organization: {
    title: "Organization Manager",
    description: "Manage your organization, drivers, and equipment",
    icon: Users,
    color: "bg-green-100 text-green-600",
  },
  location: {
    title: "Location Manager",
    description: "Manage drivers and equipment at your specific location",
    icon: MapPin,
    color: "bg-orange-100 text-orange-600",
  },
};

function CompleteProfileForm() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    organizationName: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [userHasIncompleteProfile, setUserHasIncompleteProfile] = useState(false);

  const role = searchParams.get("role") || "organization";
  const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.organization;
  const IconComponent = config.icon;

  useEffect(() => {
    const checkExistingProfile = async () => {
      try {
        const response = await fetch("/api/user/profile");
        if (response.ok) {
          const data = await response.json();
          console.log("User already has profile data:", data);

          // If user has complete profile with master organization, redirect
          if (data.person && data.masterOrganization?.id) {
            console.log("✅ Complete profile found, redirecting to master dashboard");
            router.push(`/master/${data.masterOrganization.id}`);
            return;
          }

          // If user has profile but missing master organization, they need to complete it
          if (data.person && !data.masterOrganization) {
            console.log("⚠️ User has profile but missing master organization - needs completion");
            setUserHasIncompleteProfile(true);
            // Don't redirect - let them complete the missing master organization
            return;
          }
        }
      } catch (error) {
        console.error("Error checking profile:", error);
      }
    };

    if (user) {
      checkExistingProfile();
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/user/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          role,
          organizationName: formData.organizationName,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        console.error("Profile completion failed:", data);
        throw new Error(data.error || "Failed to complete profile");
      }

      const result = await response.json();
      console.log("✅ Profile completed successfully:", result);

      // Note: User name is already set in Clerk from signup
      // Our database stores the authoritative profile information

      // Get the role parameter to redirect correctly
      const urlParams = new URLSearchParams(window.location.search);
      const roleParam = urlParams.get("role") || role;

      console.log("🔄 Redirecting after profile completion, role:", roleParam);

      // Direct redirect based on role instead of going through SmartRedirect
      const orgId = result?.data?.organizationId || result?.organization?.id;
      if (roleParam === "master" && orgId) {
        console.log("🔄 Direct redirect to master dashboard:", orgId);
        router.push(`/master/${orgId}`);
      } else {
        console.log("🔄 Fallback redirect to homepage for SmartRedirect handling");
        router.push("/");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    router.push("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div
            className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${config.color} mx-auto mb-4`}
          >
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
                  onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                  required
                  placeholder="Enter first name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                  required
                  placeholder="Enter last name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="organizationName">
                {role === "master"
                  ? "Company Name"
                  : role === "organization"
                    ? "Organization Name"
                    : "Location Name"}
              </Label>
              <Input
                id="organizationName"
                value={formData.organizationName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, organizationName: e.target.value }))
                }
                required
                placeholder={`Enter ${role === "master" ? "company" : role === "organization" ? "organization" : "location"} name`}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
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

            <Button
              type="button"
              variant="outline"
              className="w-full mt-2"
              onClick={() => {
                console.log("User chose to skip profile completion");
                // Navigate to master page with the URL parameter
                const urlParams = new URLSearchParams(window.location.search);
                const masterOrgId = urlParams.get("masterOrgId") || "y39self3k6mzqel7816n30yd";
                router.push(`/master/${masterOrgId}`);
              }}
            >
              Skip for Now
            </Button>

            <Button
              type="button"
              variant="secondary"
              className="w-full mt-2"
              onClick={() => {
                console.log("🚨 Emergency bypass - user stuck in loop");
                // Set flag to disable SmartRedirect for this navigation
                sessionStorage.setItem("manual_navigation_bypass", "true");
                // Emergency bypass for users stuck in complete-profile loop
                router.push("/master/y39self3k6mzqel7816n30yd");
              }}
            >
              🚨 Emergency Bypass (if stuck in loop)
            </Button>

            <Button
              type="button"
              variant="destructive"
              className="w-full mt-2"
              onClick={() => {
                console.log("🚨 NUCLEAR OPTION - Force redirect to dashboard");
                // Set flag to disable SmartRedirect
                sessionStorage.setItem("manual_navigation_bypass", "true");
                // Force redirect to dashboard page
                router.push("/master/y39self3k6mzqel7816n30yd");
              }}
            >
              🚨 NUCLEAR OPTION - Force Dashboard
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function CompleteProfileContent() {
  return <CompleteProfileForm />;
}

export default function CompleteProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <CompleteProfileContent />
    </Suspense>
  );
}
