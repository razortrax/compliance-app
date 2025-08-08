"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Users, Clock, DollarSign, CheckCircle, AlertCircle, Building } from "lucide-react";

interface Consultant {
  id: string;
  licenseNumber?: string;
  yearsExperience: number;
  hourlyRate: number;
  bio: string;
  specializations: string[];
  isActive: boolean;
  isVerified: boolean;
  consultations: Consultation[];
}

interface Consultation {
  id: string;
  title: string;
  consultationType: string;
  status: string;
  urgency: string;
  requestedAt: string;
  clientOrg: {
    name: string;
  };
  agreedRate?: number;
  estimatedHours?: number;
}

export default function ConsultantDashboard() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const [consultant, setConsultant] = useState<Consultant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isSignedIn) {
      fetchConsultantProfile();
    }
  }, [isSignedIn]);

  const fetchConsultantProfile = async () => {
    try {
      const response = await fetch("/api/consultants/register");
      if (response.ok) {
        const data = await response.json();
        setConsultant(data.consultant);
      } else {
        console.error("Failed to fetch consultant profile");
      }
    } catch (error) {
      console.error("Error fetching consultant profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "REQUESTED":
        return "bg-yellow-100 text-yellow-800";
      case "ACCEPTED":
        return "bg-blue-100 text-blue-800";
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "COMPLETED":
        return "bg-gray-100 text-gray-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "LOW":
        return "bg-green-100 text-green-800";
      case "NORMAL":
        return "bg-blue-100 text-blue-800";
      case "HIGH":
        return "bg-orange-100 text-orange-800";
      case "URGENT":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatSpecialization = (spec: string) => {
    return spec.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-purple-600 mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading consultant dashboard...</p>
        </div>
      </div>
    );
  }

  if (!consultant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <CardTitle>Profile Not Found</CardTitle>
            <CardDescription>
              It looks like you haven't completed your consultant registration yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => router.push("/consultant/register")}>
              Complete Registration
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pendingRequests = consultant.consultations.filter((c) => c.status === "REQUESTED");
  const activeConsultations = consultant.consultations.filter((c) => c.status === "ACTIVE");
  const completedConsultations = consultant.consultations.filter((c) => c.status === "COMPLETED");

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Consultant Dashboard</h1>
              <p className="text-muted-foreground">
                Manage your consulting practice and client engagements
              </p>
            </div>
            <div className="flex items-center gap-2">
              {consultant.isVerified ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                  <Clock className="h-3 w-3 mr-1" />
                  Pending Verification
                </Badge>
              )}
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                <Shield className="h-3 w-3 mr-1" />
                DOT Consultant
              </Badge>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pending Requests</p>
                    <p className="text-2xl font-bold">{pendingRequests.length}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
                    <p className="text-2xl font-bold">{activeConsultations.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Completed</p>
                    <p className="text-2xl font-bold">{completedConsultations.length}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Hourly Rate</p>
                    <p className="text-2xl font-bold">${consultant.hourlyRate}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="requests" className="space-y-6">
            <TabsList>
              <TabsTrigger value="requests">Consultation Requests</TabsTrigger>
              <TabsTrigger value="active">Active Projects</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
            </TabsList>

            {/* Consultation Requests */}
            <TabsContent value="requests" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Incoming Consultation Requests</CardTitle>
                  <CardDescription>
                    Review and respond to new consultation requests from fleet operators
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {pendingRequests.length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No pending consultation requests</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        New requests will appear here when companies need your expertise
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingRequests.map((consultation) => (
                        <div
                          key={consultation.id}
                          className="border rounded-lg p-4 hover:bg-gray-50"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-semibold">{consultation.title}</h3>
                              <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <Building className="h-4 w-4" />
                                {consultation.clientOrg.name}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Badge
                                className={getUrgencyColor(consultation.urgency)}
                                variant="outline"
                              >
                                {consultation.urgency}
                              </Badge>
                              <Badge
                                className={getStatusColor(consultation.status)}
                                variant="outline"
                              >
                                {consultation.status}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm mb-3">
                            Type: {formatSpecialization(consultation.consultationType)}
                          </p>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                              Requested {new Date(consultation.requestedAt).toLocaleDateString()}
                            </p>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                Decline
                              </Button>
                              <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                                Accept Request
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Active Projects */}
            <TabsContent value="active" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Active Consulting Projects</CardTitle>
                  <CardDescription>
                    Manage your ongoing client engagements and access their data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {activeConsultations.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No active consulting projects</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Accept consultation requests to start working with clients
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activeConsultations.map((consultation) => (
                        <div key={consultation.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-semibold">{consultation.title}</h3>
                              <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <Building className="h-4 w-4" />
                                {consultation.clientOrg.name}
                              </p>
                            </div>
                            <Badge
                              className={getStatusColor(consultation.status)}
                              variant="outline"
                            >
                              {consultation.status}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm">
                              Rate: ${consultation.agreedRate || consultant.hourlyRate}/hr
                              {consultation.estimatedHours &&
                                ` • Est. ${consultation.estimatedHours}h`}
                            </p>
                            <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                              Access Client Data
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Profile */}
            <TabsContent value="profile" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Professional Profile</CardTitle>
                      <CardDescription>Your consultant information and expertise</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Professional Bio</Label>
                        <p className="text-sm text-muted-foreground mt-1">{consultant.bio}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Years of Experience</Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            {consultant.yearsExperience} years
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Hourly Rate</Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            ${consultant.hourlyRate}/hour
                          </p>
                        </div>
                      </div>

                      {consultant.licenseNumber && (
                        <div>
                          <Label className="text-sm font-medium">License Number</Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            {consultant.licenseNumber}
                          </p>
                        </div>
                      )}

                      <div>
                        <Label className="text-sm font-medium">Specializations</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {consultant.specializations.map((spec) => (
                            <Badge
                              key={spec}
                              variant="outline"
                              className="bg-purple-50 text-purple-700 border-purple-200"
                            >
                              {formatSpecialization(spec)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle>Account Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Profile Status</span>
                        <Badge variant={consultant.isActive ? "default" : "secondary"}>
                          {consultant.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm">Verification</span>
                        <Badge variant={consultant.isVerified ? "default" : "outline"}>
                          {consultant.isVerified ? "Verified" : "Pending"}
                        </Badge>
                      </div>

                      <div className="pt-4">
                        <Button variant="outline" className="w-full">
                          Edit Profile
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function Label({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`text-sm font-medium ${className}`}>{children}</div>;
}
