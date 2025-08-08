"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building, Users, MapPin, Save, AlertCircle, CheckCircle } from "lucide-react";

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

interface UserProfile {
  firstName?: string;
  lastName?: string;
  role?: string;
  organizationName?: string;
}

export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  const [profile, setProfile] = useState<UserProfile>({});
  const [organizationName, setOrganizationName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded) {
      fetchProfile();
    }
  }, [isLoaded]);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        // Get organization name from the organizations array
        if (data.organizations && data.organizations.length > 0) {
          setOrganizationName(data.organizations[0].name);
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOrganization = async () => {
    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch("/api/user/update-organization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationName }),
      });

      if (response.ok) {
        setMessage({ type: "success", text: "Organization name updated successfully!" });
        fetchProfile(); // Refresh profile
      } else {
        const data = await response.json();
        setMessage({ type: "error", text: data.error || "Failed to update organization name" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "An error occurred while updating" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const config = roleConfig[profile.role as keyof typeof roleConfig] || roleConfig.organization;
  const IconComponent = config.icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Account Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account and organization information
          </p>
        </div>

        {/* User Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Information
            </CardTitle>
            <CardDescription>
              Your personal information is managed through your account settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>First Name</Label>
                <div className="p-2 bg-gray-50 rounded text-sm text-muted-foreground">
                  {profile.firstName || "Not set"}
                </div>
              </div>
              <div>
                <Label>Last Name</Label>
                <div className="p-2 bg-gray-50 rounded text-sm text-muted-foreground">
                  {profile.lastName || "Not set"}
                </div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              To update your name or email, use the "Manage Account" option in the account menu
              above.
            </div>
          </CardContent>
        </Card>

        {/* Role Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconComponent className="h-5 w-5" />
              Management Role
            </CardTitle>
            <CardDescription>Your management level and permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div
                className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${config.color}`}
              >
                <IconComponent className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{config.title}</p>
                  <Badge variant="secondary" className="text-xs">
                    Permanent
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{config.description}</p>
              </div>
            </div>
            <div className="mt-3 text-sm text-muted-foreground">
              Management roles cannot be changed after account creation for security reasons.
            </div>
          </CardContent>
        </Card>

        {/* Organization Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              {profile.role === "master" ? "Company Information" : "Organization Information"}
            </CardTitle>
            <CardDescription>
              Update your {profile.role === "master" ? "company" : "organization"} details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="organizationName">
                {profile.role === "master" ? "Company Name" : "Organization Name"}
              </Label>
              <Input
                id="organizationName"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder={`Enter ${profile.role === "master" ? "company" : "organization"} name`}
              />
            </div>

            {message && (
              <div
                className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                  message.type === "success"
                    ? "bg-green-50 border border-green-200 text-green-600"
                    : "bg-red-50 border border-red-200 text-red-600"
                }`}
              >
                {message.type === "success" ? (
                  <CheckCircle className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                )}
                {message.text}
              </div>
            )}

            <Button
              onClick={handleSaveOrganization}
              disabled={isSubmitting || !organizationName.trim()}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
