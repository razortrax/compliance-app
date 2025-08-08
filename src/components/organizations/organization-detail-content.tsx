"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { AppLayout } from "@/components/layouts/app-layout";
import { useMasterOrg } from "@/hooks/use-master-org";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  Building2,
  MapPin,
  Users,
  Truck,
  Edit,
  Save,
  X,
  Plus,
  Phone,
  FileText,
  Building,
  AlertCircle,
  Package,
  Mail,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { OrganizationAddOns } from "./organization-add-ons";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { LocationForm } from "@/components/locations/location-form";
import { StaffForm } from "@/components/staff/staff-form";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ActivityLog } from "@/components/ui/activity-log";

interface ExtendedOrganization {
  id: string;
  name: string;
  dotNumber?: string | null;
  einNumber?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  party?: {
    id: string;
    status: string;
  };
}

interface Location {
  id: string;
  name: string;
  locationType: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone?: string | null;
  email?: string | null;
  isMainLocation?: boolean;
  _count?: {
    equipment: number;
    role: number;
  };
}

interface OrganizationDetailContentProps {
  organizationId: string;
  navigationContext: "direct" | "master";
  masterOrgId?: string;
}

export function OrganizationDetailContent({
  organizationId,
  navigationContext,
  masterOrgId,
}: OrganizationDetailContentProps) {
  const router = useRouter();
  const { user } = useUser();
  const { masterOrg } = useMasterOrg();

  const [organization, setOrganization] = useState<ExtendedOrganization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedOrg, setEditedOrg] = useState<ExtendedOrganization | null>(null);
  const [activeTab, setActiveTab] = useState("details");
  const [kpis, setKpis] = useState({
    driversCount: 0,
    equipmentCount: 0,
    expiringIssues: 0,
    roadsideInspections: 0,
    accidents: 0,
  });
  const [staff, setStaff] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);

  // Staff management state
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);

  // Location management state
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedLocationTab, setSelectedLocationTab] = useState("details");

  const fetchOrganization = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/organizations/${organizationId}`);
      if (response.ok) {
        const data = await response.json();
        setOrganization(data);
        setEditedOrg(data);

        // Fetch related data
        await Promise.all([
          fetchKPIs(organizationId),
          fetchStaff(organizationId),
          fetchLocations(),
          fetchEquipment(),
          fetchDrivers(),
        ]);
      }
    } catch (error) {
      console.error("Error fetching organization:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchKPIs = async (orgId: string) => {
    try {
      // KPIs will be updated by fetchDrivers and fetchEquipment
      // This function is kept for potential future direct API calls
    } catch (error) {
      console.error("Error fetching KPIs:", error);
    }
  };

  const fetchStaff = async (orgId: string) => {
    try {
      const response = await fetch(`/api/staff?organizationId=${orgId}`);
      if (response.ok) {
        const data = await response.json();
        setStaff(data);
      }
    } catch (error) {
      console.error("Error fetching staff:", error);
    }
  };

  const fetchLocations = async () => {
    try {
      setLocationsLoading(true);
      const response = await fetch(`/api/organizations/${organizationId}/locations`);
      if (response.ok) {
        const data = await response.json();
        setLocations(data);
      }
    } catch (error) {
      console.error("Error fetching locations:", error);
    } finally {
      setLocationsLoading(false);
    }
  };

  const fetchEquipment = async () => {
    try {
      const response = await fetch(`/api/equipment?organizationId=${organizationId}`);
      if (response.ok) {
        const data = await response.json();
        setEquipment(data);
      }
    } catch (error) {
      console.error("Error fetching equipment:", error);
    }
  };

  const fetchDrivers = async () => {
    try {
      const response = await fetch(`/api/persons?organizationId=${organizationId}&roleType=driver`);
      if (response.ok) {
        const data = await response.json();
        setDrivers(data);
      }
    } catch (error) {
      console.error("Error fetching drivers:", error);
    }
  };

  // Update KPIs whenever drivers or equipment arrays change
  useEffect(() => {
    setKpis({
      driversCount: drivers.length,
      equipmentCount: equipment.length,
      expiringIssues: 0,
      roadsideInspections: 0,
      accidents: 0,
    });
  }, [drivers.length, equipment.length]);

  useEffect(() => {
    fetchOrganization();
  }, [organizationId]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedOrg(organization);
  };

  const handleSave = async () => {
    if (!editedOrg) return;

    try {
      setIsSaving(true);
      const response = await fetch(`/api/organizations/${organizationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editedOrg),
      });

      if (response.ok) {
        const updated = await response.json();
        setOrganization(updated);
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error saving organization:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (navigationContext === "master" && masterOrgId) {
      router.push(`/master/${masterOrgId}`);
    } else {
      router.push("/organizations");
    }
  };

  const handleViewLocation = (location: Location) => {
    if (navigationContext === "master" && masterOrgId) {
      router.push(`/master/${masterOrgId}/organization/${organizationId}/locations/${location.id}`);
    } else {
      router.push(`/organizations/${organizationId}/locations/${location.id}`);
    }
  };

  const handleCloseLocationForm = () => {
    setShowLocationForm(false);
    setEditingLocation(null);
  };

  if (isLoading || !organization) {
    return (
      <AppLayout name={masterOrg?.name || "Loading..."}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading organization details...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const topNav =
    navigationContext === "master"
      ? [
          {
            label: "Master",
            href: masterOrg?.id ? `/master/${masterOrg.id}` : "/dashboard",
            isActive: false,
          },
          {
            label: "Organization",
            href: masterOrgId
              ? `/master/${masterOrgId}/organization/${organizationId}`
              : `/organizations/${organizationId}`,
            isActive: true,
          },
          {
            label: "Drivers",
            href: masterOrgId
              ? `/master/${masterOrgId}/organization/${organizationId}/drivers`
              : `/organizations/${organizationId}/drivers`,
            isActive: false,
          },
          {
            label: "Equipment",
            href: masterOrgId
              ? `/master/${masterOrgId}/organization/${organizationId}/equipment`
              : `/organizations/${organizationId}/equipment`,
            isActive: false,
          },
        ]
      : [
          {
            label: "Organizations",
            href: "/organizations",
            isActive: false,
          },
          {
            label: organization.name,
            href: `/organizations/${organizationId}`,
            isActive: true,
          },
        ];

  return (
    <AppLayout name={masterOrg?.name || "Fleetrax"} topNav={topNav} className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{organization.name}</h1>
              <p className="text-gray-600 mt-1">
                {organization.address && `${organization.address}, `}
                {organization.city && `${organization.city}, `}
                {organization.state} {organization.zipCode}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Edit Button */}
            {!isEditing ? (
              <Button onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="locations">
              Locations{" "}
              {locations.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-gray-200 rounded-full">
                  {locations.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="staff">
              Staff{" "}
              {staff.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-gray-200 rounded-full">
                  {staff.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="partners">
              Partners <span className="ml-1 px-1.5 py-0.5 text-xs bg-gray-200 rounded-full">0</span>
            </TabsTrigger>
            <TabsTrigger value="stuff">Stuff</TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-6">
            {/* KPIs Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Overview</CardTitle>
                <CardDescription>Key metrics and counts for {organization.name}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{kpis.driversCount}</div>
                    <div className="text-sm text-gray-600">Drivers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{kpis.equipmentCount}</div>
                    <div className="text-sm text-gray-600">Equipment</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{kpis.expiringIssues}</div>
                    <div className="text-sm text-gray-600">Expiring Issues</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {kpis.roadsideInspections}
                    </div>
                    <div className="text-sm text-gray-600">Roadside Issues</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{kpis.accidents}</div>
                    <div className="text-sm text-gray-600">Accidents</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Organization Details */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Organization Information</CardTitle>
                    <CardDescription>Basic details and contact information</CardDescription>
                  </div>
                  <StatusBadge status={(organization.party?.status as any) || "active"} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Organization Name</Label>
                    {isEditing ? (
                      <Input
                        value={editedOrg?.name || ""}
                        onChange={(e) =>
                          setEditedOrg((prev) => (prev ? { ...prev, name: e.target.value } : null))
                        }
                      />
                    ) : (
                      <p className="text-gray-900">{organization.name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>DOT Number</Label>
                    {isEditing ? (
                      <Input
                        value={editedOrg?.dotNumber || ""}
                        onChange={(e) =>
                          setEditedOrg((prev) =>
                            prev ? { ...prev, dotNumber: e.target.value } : null,
                          )
                        }
                      />
                    ) : (
                      <p className="text-gray-900">{organization.dotNumber}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>EIN Number</Label>
                    {isEditing ? (
                      <Input
                        value={editedOrg?.einNumber || ""}
                        onChange={(e) =>
                          setEditedOrg((prev) =>
                            prev ? { ...prev, einNumber: e.target.value } : null,
                          )
                        }
                      />
                    ) : (
                      <p className="text-gray-900">{organization.einNumber || "Not provided"}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Phone</Label>
                    {isEditing ? (
                      <Input
                        value={editedOrg?.phone || ""}
                        onChange={(e) =>
                          setEditedOrg((prev) => (prev ? { ...prev, phone: e.target.value } : null))
                        }
                      />
                    ) : (
                      <p className="text-gray-900">{organization.phone || "Not provided"}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Address</Label>
                    {isEditing ? (
                      <Textarea
                        value={
                          [
                            editedOrg?.address,
                            editedOrg?.city,
                            editedOrg?.state,
                            editedOrg?.zipCode,
                          ]
                            .filter(Boolean)
                            .join("\n") || ""
                        }
                        onChange={(e) => {
                          const lines = e.target.value.split("\n");
                          setEditedOrg((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  address: lines[0] || "",
                                  city: lines[1] || "",
                                  state: lines[2] || "",
                                  zipCode: lines[3] || "",
                                }
                              : null,
                          );
                        }}
                      />
                    ) : (
                      <div className="text-gray-900">
                        {organization.address && <div>{organization.address}</div>}
                        {(organization.city || organization.state || organization.zipCode) && (
                          <div>
                            {organization.city && `${organization.city}, `}
                            {organization.state} {organization.zipCode}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Locations Tab */}
          <TabsContent value="locations" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Locations</CardTitle>
                    <CardDescription>Manage organization locations and facilities</CardDescription>
                  </div>
                  <Button onClick={() => setShowLocationForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Location
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {locationsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading locations...</p>
                  </div>
                ) : locations.length > 0 ? (
                  <div className="space-y-4">
                    {locations.map((location) => (
                      <div
                        key={location.id}
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => handleViewLocation(location)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <MapPin className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{location.name}</h3>
                                {location.isMainLocation && (
                                  <Badge variant="secondary" className="text-xs">
                                    Main
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">{location.locationType}</p>
                              <p className="text-sm text-gray-500">
                                {location.address}, {location.city}, {location.state}{" "}
                                {location.zipCode}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500">
                              {location._count?.equipment || 0} Equipment
                            </div>
                            <div className="text-sm text-gray-500">
                              {location._count?.role || 0} Staff
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={MapPin}
                    title="No locations found"
                    description="Add your first location to get started"
                    action={{
                      label: "Add Location",
                      onClick: () => setShowLocationForm(true),
                    }}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Staff Tab */}
          <TabsContent value="staff" className="space-y-6">
            <div className="h-[600px] flex border rounded-lg bg-white overflow-hidden">
              {/* Left Sidebar - Staff List */}
              <div className="w-80 border-r border-gray-200 overflow-y-auto">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Staff Members</h3>
                    <Button onClick={() => setShowStaffForm(true)} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Staff
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600">
                    {staff.length} staff member{staff.length !== 1 ? "s" : ""}
                  </p>
                </div>

                <div className="p-4 space-y-2">
                  {staff.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500 text-sm">No staff members yet</p>
                      <Button onClick={() => setShowStaffForm(true)} className="mt-4" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Staff Member
                      </Button>
                    </div>
                  ) : (
                    staff.map((member) => (
                      <Card
                        key={member.id}
                        className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                          selectedStaff?.id === member.id ? "ring-2 ring-blue-500 bg-blue-50" : ""
                        }`}
                        onClick={() => setSelectedStaff(member)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {member.party?.person?.firstName} {member.party?.person?.lastName}
                              </h4>
                              {member.position && (
                                <p className="text-sm text-gray-600">{member.position}</p>
                              )}
                              {member.department && (
                                <p className="text-xs text-gray-500">{member.department}</p>
                              )}
                            </div>
                            <div className="flex flex-col gap-1">
                              {member.canSignCAFs && (
                                <Badge variant="default" className="text-xs">
                                  CAF Signer
                                </Badge>
                              )}
                              {member.canApproveCAFs && (
                                <Badge variant="secondary" className="text-xs">
                                  CAF Approver
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>

              {/* Right Content - Staff Details */}
              <div className="flex-1 overflow-y-auto">
                {selectedStaff ? (
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <div className="text-sm text-gray-500 mb-1">{organization?.name}</div>
                        <h1 className="text-2xl font-bold text-gray-900">
                          {selectedStaff.party?.person?.firstName}{" "}
                          {selectedStaff.party?.person?.lastName}
                        </h1>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setShowStaffForm(true)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                    </div>

                    {/* Staff Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Basic Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <label className="text-sm font-medium text-gray-500">Employee ID</label>
                            <p className="text-gray-900">
                              {selectedStaff.employeeId || "Not assigned"}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Position</label>
                            <p className="text-gray-900">
                              {selectedStaff.position || "Not specified"}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Department</label>
                            <p className="text-gray-900">
                              {selectedStaff.department || "Not specified"}
                            </p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Contact Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {selectedStaff.party?.person?.email && (
                            <div>
                              <label className="text-sm font-medium text-gray-500">Email</label>
                              <div className="flex items-center mt-1">
                                <Mail className="h-4 w-4 text-gray-400 mr-2" />
                                <p className="text-gray-900">{selectedStaff.party.person.email}</p>
                              </div>
                            </div>
                          )}
                          {selectedStaff.party?.person?.phone && (
                            <div>
                              <label className="text-sm font-medium text-gray-500">Phone</label>
                              <div className="flex items-center mt-1">
                                <Phone className="h-4 w-4 text-gray-400 mr-2" />
                                <p className="text-gray-900">{selectedStaff.party.person.phone}</p>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      <Card className="md:col-span-2">
                        <CardHeader>
                          <CardTitle className="text-lg">CAF Permissions</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center">
                              {selectedStaff.canSignCAFs ? (
                                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                              ) : (
                                <XCircle className="h-5 w-5 text-gray-300 mr-3" />
                              )}
                              <div>
                                <p className="font-medium text-gray-900">Can Sign CAFs</p>
                                <p className="text-sm text-gray-500">
                                  {selectedStaff.canSignCAFs
                                    ? "Authorized to sign corrective action forms"
                                    : "Not authorized to sign CAFs"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center">
                              {selectedStaff.canApproveCAFs ? (
                                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                              ) : (
                                <XCircle className="h-5 w-5 text-gray-300 mr-3" />
                              )}
                              <div>
                                <p className="font-medium text-gray-900">Can Approve CAFs</p>
                                <p className="text-sm text-gray-500">
                                  {selectedStaff.canApproveCAFs
                                    ? "Authorized to approve corrective action forms"
                                    : "Not authorized to approve CAFs"}
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Gold Standard Add Ons Section */}
                      <Card className="md:col-span-2">
                        <CardHeader>
                          <CardTitle className="text-lg">Add Ons</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ActivityLog
                            personId={selectedStaff.party?.person?.id}
                            title="Staff Add Ons"
                            showAddButton={true}
                          />
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Users className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500">Select a staff member to view details</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Partners Tab */}
          <TabsContent value="partners" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Partners</CardTitle>
                    <CardDescription>
                      External parties that work with {organization?.name}
                    </CardDescription>
                  </div>
                  <Button onClick={() => router.push(`/organizations/${organizationId}/partners`)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Partner
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Vendors */}
                  <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Vendors
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600 mb-1">0</div>
                      <p className="text-xs text-gray-600">Service providers</p>
                    </CardContent>
                  </Card>

                  {/* Agencies */}
                  <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Agencies
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600 mb-1">0</div>
                      <p className="text-xs text-gray-600">Regulatory bodies</p>
                    </CardContent>
                  </Card>

                  {/* Repair Shops */}
                  <Card className="border-l-4 border-l-orange-500">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        Repair Shops
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-600 mb-1">0</div>
                      <p className="text-xs text-gray-600">Maintenance providers</p>
                    </CardContent>
                  </Card>

                  {/* Inspectors */}
                  <Card className="border-l-4 border-l-purple-500">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Inspectors
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-purple-600 mb-1">0</div>
                      <p className="text-xs text-gray-600">DOT inspectors</p>
                    </CardContent>
                  </Card>

                  {/* Testing Labs */}
                  <Card className="border-l-4 border-l-red-500">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Testing Labs
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600 mb-1">0</div>
                      <p className="text-xs text-gray-600">Drug & alcohol testing</p>
                    </CardContent>
                  </Card>

                  {/* Collection Sites */}
                  <Card className="border-l-4 border-l-gray-500">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Collection Sites
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-600 mb-1">0</div>
                      <p className="text-xs text-gray-600">Sample collection</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Coming Soon Message */}
                <div className="mt-6">
                  <EmptyState
                    icon={Building}
                    title="Coming Soon"
                    description="External party management will be available here. Track vendors, agencies, repair shops, inspectors, testing labs, and collection sites."
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stuff Tab */}
          <TabsContent value="stuff" className="space-y-6">
            <OrganizationAddOns
              organizationId={organizationId}
              organizationName={organization.name}
            />
          </TabsContent>
        </Tabs>

        {/* Location Form Modal */}
        <Dialog open={showLocationForm} onOpenChange={handleCloseLocationForm}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{editingLocation ? "Edit Location" : "Add New Location"}</DialogTitle>
              <DialogDescription>
                {editingLocation
                  ? `Update details for ${editingLocation.name}`
                  : `Add a new location to ${organization.name}`}
              </DialogDescription>
            </DialogHeader>
            <LocationForm
              organizationId={organizationId}
              location={editingLocation}
              onSuccess={() => {
                handleCloseLocationForm();
                fetchLocations();
              }}
              onCancel={handleCloseLocationForm}
            />
          </DialogContent>
        </Dialog>

        {/* Staff Form Modal */}
        <Dialog open={showStaffForm} onOpenChange={setShowStaffForm}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingStaff ? "Edit Staff Member" : "Add New Staff Member"}
              </DialogTitle>
              <DialogDescription>
                {editingStaff
                  ? `Update details for ${editingStaff.person?.firstName} ${editingStaff.person?.lastName}`
                  : `Add a new staff member to ${organization.name}`}
              </DialogDescription>
            </DialogHeader>
            <StaffForm
              organizationId={organizationId}
              staff={editingStaff}
              onSuccess={() => {
                setShowStaffForm(false);
                setEditingStaff(null);
                fetchStaff(organizationId);
              }}
              onCancel={() => {
                setShowStaffForm(false);
                setEditingStaff(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
