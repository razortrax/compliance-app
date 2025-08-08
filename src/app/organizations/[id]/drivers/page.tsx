"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppLayout } from "@/components/layouts/app-layout";
import { useMasterOrg } from "@/hooks/use-master-org";
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
} from "lucide-react";

interface Person {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: Date | null;
  licenseNumber?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  party?: {
    role: Array<{
      id: string;
      roleType: string;
      organizationId: string;
      locationId?: string | null;
      location?: { id: string; name: string } | null;
    }>;
  };
}

interface Organization {
  id: string;
  name: string;
}

export default function DriversPage() {
  const params = useParams();
  const router = useRouter();
  const organizationId = params.id as string;
  const { masterOrg } = useMasterOrg();

  const [persons, setPersons] = useState<Person[]>([]);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Edit state
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  // Deactivation state
  const [showDeactivateSection, setShowDeactivateSection] = useState(false);
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [deactivationReason, setDeactivationReason] = useState("");
  const [isDeactivating, setIsDeactivating] = useState(false);

  // Fetch organization details
  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        const response = await fetch(`/api/organizations/${organizationId}`);
        if (response.ok) {
          const data = await response.json();
          setOrganization(data);
        }
      } catch (error) {
        console.error("Error fetching organization:", error);
      }
    };

    fetchOrganization();
  }, [organizationId]);

  // Fetch persons (drivers only)
  const fetchPersons = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/persons?organizationId=${organizationId}&roleType=driver`);
      if (response.ok) {
        const data = await response.json();
        setPersons(data);
      }
    } catch (error) {
      console.error("Error fetching persons:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch organizations for selector
  const fetchOrganizations = async () => {
    try {
      const response = await fetch("/api/organizations");
      if (response.ok) {
        const data = await response.json();
        setOrganizations(data);
      }
    } catch (error) {
      console.error("Error fetching organizations:", error);
    }
  };

  useEffect(() => {
    fetchPersons();
    fetchOrganizations();
  }, [organizationId]);

  const handleOrganizationSelect = (selectedOrg: Organization) => {
    setIsSheetOpen(false);
    router.push(`/organizations/${selectedOrg.id}/drivers`);
  };

  const handleEditPerson = (person: Person) => {
    setSelectedPerson(person);
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

      // Find the active role for this person in this organization
      const activeRole = selectedPerson.party?.role?.find(
        (role) => role.organizationId === organizationId && role.roleType !== "master",
      );

      if (!activeRole) {
        alert("No active role found for this person");
        return;
      }

      const response = await fetch(`/api/persons/${selectedPerson.id}/deactivate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleId: activeRole.id,
          endDate: endDate.toISOString(),
          reason: deactivationReason,
        }),
      });

      if (response.ok) {
        handleCloseEditModal();
        fetchPersons(); // Refresh the list
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

  if (!organization) {
    return (
      <AppLayout
        name={masterOrg?.name || "Master"}
        topNav={[
          {
            label: "Master",
            href: masterOrg?.id ? `/master/${masterOrg.id}` : "/dashboard",
            isActive: false,
          },
        ]}
        className="p-6"
      >
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        </div>
      </AppLayout>
    );
  }

  const masterName = masterOrg?.name || "Master";
  const topNav = [
    {
      label: "Master",
      href: masterOrg?.id ? `/master/${masterOrg.id}` : "/dashboard",
      isActive: false,
    },
    { label: "Organization", href: `/organizations/${organizationId}`, isActive: false },
    { label: "Drivers", href: `/organizations/${organizationId}/drivers`, isActive: true },
    { label: "Equipment", href: `/organizations/${organizationId}/equipment`, isActive: false },
  ];

  return (
    <AppLayout name={masterName} topNav={topNav} className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Organization Name */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">{organization.name}</h1>
        </div>

        {/* Page Header */}
        <SectionHeader
          title="Drivers"
          description={`Manage drivers for ${organization.name}`}
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
                    fetchPersons();
                  }}
                  onCancel={() => setShowAddForm(false)}
                />
              </DialogContent>
            </Dialog>
          }
        />

        {/* Persons List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          </div>
        ) : persons.length > 0 ? (
          <div className="grid gap-4">
            {persons.map((person) => {
              const role = person.party?.role?.[0];
              return (
                <Card key={person.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3 flex-1">
                        {/* Name and Role */}
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold">
                            {person.firstName} {person.lastName}
                          </h3>
                          {role && (
                            <Badge className={getRoleBadgeColor(role.roleType)}>
                              {getRoleLabel(role.roleType)}
                            </Badge>
                          )}
                          {role?.location && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {role.location.name}
                            </Badge>
                          )}
                        </div>

                        {/* Contact Information */}
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          {person.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-4 w-4" />
                              {person.phone}
                            </div>
                          )}
                          {person.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-4 w-4" />
                              {person.email}
                            </div>
                          )}
                          {person.licenseNumber && (
                            <div className="flex items-center gap-1">
                              <IdCard className="h-4 w-4" />
                              License: {person.licenseNumber}
                            </div>
                          )}
                          {person.dateOfBirth && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              DOB: {new Date(person.dateOfBirth).toLocaleDateString()}
                            </div>
                          )}
                        </div>

                        {/* Address */}
                        {(person.address || person.city || person.state) && (
                          <div className="text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {[person.address, person.city, person.state, person.zipCode]
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
                              `/master/${masterOrg?.id}/organization/${organizationId}/driver/${person.id}`,
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
              );
            })}
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
                fetchPersons();
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
