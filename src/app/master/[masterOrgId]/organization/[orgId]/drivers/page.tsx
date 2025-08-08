"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppLayout } from "@/components/layouts/app-layout";
import { buildStandardNavigation, getUserRole } from "@/lib/utils";
import { PersonForm } from "@/components/persons/person-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import { DataTable } from "@/components/ui/data-table";
import {
  Users,
  Plus,
  Edit,
  Phone,
  Mail,
  MapPin,
  Calendar,
  IdCard,
  CalendarIcon,
  User,
  AlertCircle,
} from "lucide-react";

interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  licenseNumber?: string | null;
  dateOfBirth?: Date | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  roleStartDate: Date;
  roleStatus: string;
  compliance: {
    totalActiveIssues: number;
    expiringIssues: number;
    licenseCount: number;
    mvrCount: number;
    trainingCount: number;
    physicalCount: number;
    status: "warning" | "compliant";
  };
}

interface Organization {
  id: string;
  name: string;
  dotNumber?: string | null;
}

interface DriversResponse {
  organization: Organization;
  drivers: Driver[];
  summary: {
    totalDrivers: number;
    driversWithIssues: number;
    complianceRate: number;
    totalActiveIssues: number;
    totalExpiringIssues: number;
  };
}

export default function DriversPage() {
  const params = useParams();
  const router = useRouter();
  const masterOrgId = params.masterOrgId as string;
  const organizationId = params.orgId as string;

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [summary, setSummary] = useState<DriversResponse["summary"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [masterOrgName, setMasterOrgName] = useState<string>("Loading...");

  // Edit state
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Driver | null>(null);

  // Deactivation state
  const [showDeactivateSection, setShowDeactivateSection] = useState(false);
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [deactivationReason, setDeactivationReason] = useState("");
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all data using the new URL-driven API - single optimized call! 🚀
  useEffect(() => {
    const fetchAllData = async () => {
      console.log("🚀 Fetching drivers data using URL-driven API for org:", organizationId);

      try {
        setIsLoading(true);
        setError(null);

        // Fetch user role and master org data first
        const [roleResult, userRoleResult] = await Promise.allSettled([
          fetch(`/api/master/${masterOrgId}/organization/${organizationId}/drivers`),
          getUserRole(),
        ]);

        // Set user role
        if (userRoleResult.status === "fulfilled") {
          setUserRole(userRoleResult.value);
        }

        // Handle drivers data (primary)
        if (roleResult.status === "fulfilled" && roleResult.value.ok) {
          const data: DriversResponse = await roleResult.value.json();

          setOrganization(data.organization);
          setDrivers(data.drivers);
          setSummary(data.summary);

          // Get master org name from the API response
          const masterOrgResponse = await fetch(`/api/organizations/${masterOrgId}`);
          if (masterOrgResponse.ok) {
            const masterOrgData = await masterOrgResponse.json();
            setMasterOrgName(masterOrgData.name || "Master");
          } else {
            setMasterOrgName("Master");
          }

          console.log("✅ URL-driven API success!");
          console.log(
            `📊 Loaded ${data.summary.totalDrivers} drivers with ${data.summary.complianceRate}% compliance`,
          );
          console.log(`⚠️ ${data.summary.driversWithIssues} drivers have expiring issues`);
        } else {
          const errorMsg =
            roleResult.status === "fulfilled"
              ? `Access denied or organization not found (${roleResult.value.status})`
              : "Failed to fetch drivers data";
          setError(errorMsg);
          console.error("❌ URL-driven API failed:", errorMsg);
        }
      } catch (error) {
        console.error("🔥 Unexpected error in URL-driven fetch:", error);
        setError("Unexpected error occurred while loading data");
        setDrivers([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (masterOrgId && organizationId) {
      fetchAllData();
    }
  }, [masterOrgId, organizationId]);

  // Refetch drivers after updates using the new URL-driven API
  const fetchDrivers = async () => {
    try {
      console.log("🔄 Refreshing drivers list using URL-driven API");
      const response = await fetch(
        `/api/master/${masterOrgId}/organization/${organizationId}/drivers`,
      );
      if (response.ok) {
        const data: DriversResponse = await response.json();
        setDrivers(data.drivers);
        setSummary(data.summary);
        console.log("✅ Drivers refreshed:", data.summary.totalDrivers, "drivers");
      } else {
        console.error("❌ Failed to refresh drivers:", response.status);
      }
    } catch (error) {
      console.error("🔥 Error refreshing drivers:", error);
    }
  };

  const handleOrganizationSelect = (selectedOrg: Organization) => {
    setIsSheetOpen(false);
    router.push(`/master/${masterOrgId}/organization/${selectedOrg.id}/drivers`);
  };

  const handleEditPerson = (driver: Driver) => {
    setSelectedPerson(driver);
    setEndDate(new Date()); // Default to today
    setDeactivationReason("");
    setShowDeactivateSection(false);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setShowDeactivateSection(false); // Also close deactivate section
  };

  const handleConfirmDeactivation = async () => {
    if (!selectedPerson) return;

    try {
      setIsDeactivating(true);

      // Note: Deactivation logic needs to be updated to work with new API structure
      // For now, we'll use the existing person API endpoint
      const response = await fetch(`/api/persons/${selectedPerson.id}/deactivate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endDate: endDate.toISOString(),
          reason: deactivationReason,
        }),
      });

      if (response.ok) {
        handleCloseEditModal();
        fetchDrivers(); // Refresh using the new URL-driven API
      } else {
        const error = await response.json();
        alert(`Error deactivating person: ${error.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error deactivating person:", error);
      alert("An error occurred while deactivating. Please try again.");
    } finally {
      setIsDeactivating(false);
    }
  };

  const getRoleLabel = (roleType: string) => {
    switch (roleType) {
      case "DRIVER":
        return "Driver";
      case "STAFF":
        return "Staff";
      case "MECHANIC":
        return "Mechanic";
      case "DISPATCHER":
        return "Dispatcher";
      case "SAFETY_MANAGER":
        return "Safety Manager";
      default:
        return roleType;
    }
  };

  const getRoleBadgeColor = (roleType: string) => {
    switch (roleType) {
      case "DRIVER":
        return "bg-blue-100 text-blue-700";
      case "STAFF":
        return "bg-green-100 text-green-700";
      case "MECHANIC":
        return "bg-orange-100 text-orange-700";
      case "DISPATCHER":
        return "bg-purple-100 text-purple-700";
      case "SAFETY_MANAGER":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (error) {
    return (
      <AppLayout
        name={masterOrgName}
        topNav={buildStandardNavigation(masterOrgId, organizationId, userRole || undefined)}
        className="p-6"
      >
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold mb-2">Failed to Load Drivers</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => router.refresh()}>Try Again</Button>
        </div>
      </AppLayout>
    );
  }

  if (!organization) {
    return (
      <AppLayout
        name={masterOrgName}
        topNav={buildStandardNavigation(masterOrgId, organizationId, userRole || undefined)}
        className="p-6"
      >
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading drivers...</p>
        </div>
      </AppLayout>
    );
  }

  const masterName = masterOrgName || "Master";
  const topNav = [
    { label: "Master", href: `/master/${masterOrgId}`, isActive: false },
    {
      label: "Organization",
      href: `/master/${masterOrgId}/organization/${organizationId}`,
      isActive: false,
    },
    {
      label: "Drivers",
      href: `/master/${masterOrgId}/organization/${organizationId}/drivers`,
      isActive: true,
    },
    {
      label: "Equipment",
      href: `/master/${masterOrgId}/organization/${organizationId}/equipment`,
      isActive: false,
    },
  ];

  return (
    <AppLayout
      name={masterOrgName}
      topNav={buildStandardNavigation(masterOrgId, organizationId, userRole || undefined)}
      sidebarMenu="organization"
      masterOrgId={masterOrgId}
      currentOrgId={organizationId}
      className="p-6"
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Organization Name */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">{organization?.name || "Loading..."}</h1>
        </div>

        {/* Page Header */}
        <SectionHeader
          title="Drivers"
          description={`Manage drivers for ${organization?.name || "this organization"}`}
          actions={
            <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Driver
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Driver</DialogTitle>
                  <DialogDescription>Add a new driver to {organization.name}</DialogDescription>
                </DialogHeader>
                <PersonForm
                  organizationId={organizationId}
                  onSuccess={() => {
                    setShowAddForm(false);
                    fetchDrivers();
                  }}
                  onCancel={() => setShowAddForm(false)}
                />
              </DialogContent>
            </Dialog>
          }
        />

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Loading Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                  <p className="mt-2">
                    <button
                      onClick={() => router.refresh()}
                      className="font-medium underline hover:no-underline"
                    >
                      Try refreshing the page
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Drivers List with Enhanced Compliance Data */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading drivers...</p>
          </div>
        ) : drivers.length > 0 ? (
          <div className="space-y-4">
            {/* Summary Statistics */}
            {summary && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{summary.totalDrivers}</div>
                      <div className="text-sm text-blue-700">Total Drivers</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {summary.complianceRate}%
                      </div>
                      <div className="text-sm text-green-700">Compliance Rate</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-600">
                        {summary.driversWithIssues}
                      </div>
                      <div className="text-sm text-orange-700">With Issues</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600">
                        {summary.totalExpiringIssues}
                      </div>
                      <div className="text-sm text-red-700">Expiring Soon</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Drivers Grid */}
            <div className="grid gap-4">
              {drivers.map((driver) => (
                <Card key={driver.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3 flex-1">
                        {/* Name and Compliance Status */}
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold">
                            {driver.firstName} {driver.lastName}
                          </h3>
                          <Badge className="bg-blue-100 text-blue-700">Driver</Badge>
                          <Badge
                            className={
                              driver.compliance.status === "warning"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-green-100 text-green-700"
                            }
                          >
                            {driver.compliance.status === "warning"
                              ? "Has Expiring Issues"
                              : "Compliant"}
                          </Badge>
                        </div>

                        {/* Compliance Summary */}
                        <div className="flex flex-wrap gap-4 text-sm">
                          <div className="text-gray-600">
                            <span className="font-medium">Issues:</span>{" "}
                            {driver.compliance.totalActiveIssues}
                          </div>
                          <div
                            className={
                              driver.compliance.expiringIssues > 0
                                ? "text-orange-600"
                                : "text-gray-600"
                            }
                          >
                            <span className="font-medium">Expiring:</span>{" "}
                            {driver.compliance.expiringIssues}
                          </div>
                          <div className="text-gray-600">
                            <span className="font-medium">Licenses:</span>{" "}
                            {driver.compliance.licenseCount}
                          </div>
                          <div className="text-gray-600">
                            <span className="font-medium">MVRs:</span> {driver.compliance.mvrCount}
                          </div>
                          <div className="text-gray-600">
                            <span className="font-medium">Training:</span>{" "}
                            {driver.compliance.trainingCount}
                          </div>
                        </div>

                        {/* Contact Information */}
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          {driver.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-4 w-4" />
                              {driver.phone}
                            </div>
                          )}
                          {driver.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-4 w-4" />
                              {driver.email}
                            </div>
                          )}
                          {driver.licenseNumber && (
                            <div className="flex items-center gap-1">
                              <IdCard className="h-4 w-4" />
                              License: {driver.licenseNumber}
                            </div>
                          )}
                          {driver.dateOfBirth && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              DOB: {new Date(driver.dateOfBirth).toLocaleDateString()}
                            </div>
                          )}
                        </div>

                        {/* Address */}
                        {(driver.address || driver.city || driver.state) && (
                          <div className="text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {[driver.address, driver.city, driver.state, driver.zipCode]
                                .filter(Boolean)
                                .join(", ")}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            router.push(
                              `/master/${masterOrgId}/organization/${organizationId}/driver/${driver.id}`,
                            )
                          }
                        >
                          <User className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState
            icon={Users}
            title="No drivers yet"
            description="Add drivers to track licenses, medical certificates, and training"
            action={{
              label: "Add First Driver",
              onClick: () => setShowAddForm(true),
            }}
          />
        )}
      </div>

      {/* Edit Person Modal */}
      <Dialog open={showEditModal} onOpenChange={handleCloseEditModal}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Edit {selectedPerson?.firstName} {selectedPerson?.lastName}
            </DialogTitle>
            <DialogDescription>Update person details or manage their status</DialogDescription>
          </DialogHeader>

          {selectedPerson && (
            <PersonForm
              organizationId={organizationId}
              person={selectedPerson}
              onSuccess={() => {
                handleCloseEditModal();
                fetchDrivers();
              }}
              onCancel={handleCloseEditModal}
              onDeactivate={() => setShowDeactivateSection(true)}
            />
          )}

          {/* Deactivate Modal */}
          {showDeactivateSection && selectedPerson && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <h3 className="text-lg font-medium text-red-700 mb-4">
                  Deactivate {selectedPerson.firstName} {selectedPerson.lastName}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Set the end date for this person's role. They will no longer appear in the active
                  drivers list.
                </p>

                <div className="space-y-4">
                  {/* End Date Picker */}
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !endDate && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={endDate}
                          onSelect={(date: Date | undefined) => {
                            if (date) {
                              setEndDate(date);
                              setIsDatePickerOpen(false);
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Reason (Optional) */}
                  <div className="space-y-2">
                    <Label>Reason (Optional)</Label>
                    <Input
                      placeholder="e.g., Terminated, Resigned, Transferred..."
                      value={deactivationReason}
                      onChange={(e) => setDeactivationReason(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowDeactivateSection(false)}
                      disabled={isDeactivating}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleConfirmDeactivation}
                      disabled={isDeactivating}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {isDeactivating ? "Deactivating..." : "Deactivate Person"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
