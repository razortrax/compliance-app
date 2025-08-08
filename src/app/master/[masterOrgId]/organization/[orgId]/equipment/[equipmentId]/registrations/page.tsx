"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { AppLayout } from "@/components/layouts/app-layout";
import { buildStandardNavigation, getUserRole } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RegistrationForm } from "@/components/registrations/registration-form";
import { EmptyState } from "@/components/ui/empty-state";
import { ActivityLog } from "@/components/ui/activity-log";
import { UnifiedAddonDisplay } from "@/components/ui/unified-addon-display";
import { UnifiedAddonModal } from "@/components/ui/unified-addon-modal";
import { UNIFIED_ADDON_CONFIGURATIONS } from "@/hooks/use-unified-addons";
import {
  Clipboard,
  Plus,
  Calendar,
  MapPin,
  AlertCircle,
  CheckCircle,
  Clock,
  Edit,
  RotateCcw,
} from "lucide-react";
import { format } from "date-fns";

interface Registration {
  id: string;
  plateNumber: string;
  state: string;
  startDate: string;
  expirationDate: string;
  renewalDate?: string | null;
  status: "Active" | "Expired";
  notes?: string | null;
  issue: {
    id: string;
    title: string;
    description?: string | null;
    status: string;
    priority: string;
  };
}

interface Equipment {
  id: string;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  party: {
    id: string;
  };
}

interface Organization {
  id: string;
  name: string;
}

interface MasterOrg {
  id: string;
  name: string;
}

interface PageData {
  masterOrg: MasterOrg;
  organization: Organization;
  equipment: Equipment;
  registrations: Registration[];
}

export default function EquipmentRegistrationsPage() {
  const params = useParams();
  const masterOrgId = params.masterOrgId as string;
  const orgId = params.orgId as string;
  const equipmentId = params.equipmentId as string;

  const [data, setData] = useState<PageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Modal states
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showRenewalForm, setShowRenewalForm] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [showAddAddonModal, setShowAddAddonModal] = useState(false);

  useEffect(() => {
    if (equipmentId) {
      fetchData();
      fetchUserRole();
    }
  }, [equipmentId, masterOrgId, orgId]);

  const fetchUserRole = async () => {
    try {
      const role = await getUserRole();
      setUserRole(role);
    } catch (error) {
      console.error("Error fetching user role:", error);
    }
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/master/${masterOrgId}/organization/${orgId}/equipment/${equipmentId}/registrations`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch registration data");
      }

      const pageData = await response.json();
      setData(pageData);
    } catch (error) {
      console.error("Error fetching registrations:", error);
      setError(error instanceof Error ? error.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSuccess = (registration: any) => {
    // Refresh data after successful create/update
    fetchData();

    // Auto-select the new/updated registration in the detail view
    setTimeout(() => {
      setSelectedRegistration(registration);
    }, 100); // Small delay to ensure data is refreshed

    // Close all modals
    setShowAddForm(false);
    setShowEditForm(false);
    setShowRenewalForm(false);
  };

  const handleEditRegistration = (registration: Registration) => {
    setSelectedRegistration(registration);
    setShowEditForm(true);
  };

  const handleRenewRegistration = (registration: Registration) => {
    setSelectedRegistration(registration);
    setShowRenewalForm(true);
  };

  const getExpirationStatus = (expirationDate: string) => {
    const expiry = new Date(expirationDate);
    const today = new Date();
    const daysUntil = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) {
      return {
        status: "expired",
        daysUntil,
        color: "text-red-600",
        bgColor: "bg-red-50",
        badgeColor: "destructive",
      };
    } else if (daysUntil <= 30) {
      return {
        status: "expiring",
        daysUntil,
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        badgeColor: "secondary",
      };
    } else {
      return {
        status: "current",
        daysUntil,
        color: "text-green-600",
        bgColor: "bg-green-50",
        badgeColor: "default",
      };
    }
  };

  if (isLoading) {
    return (
      <AppLayout
        name={data?.masterOrg?.name || "Loading..."}
        topNav={buildStandardNavigation(masterOrgId, orgId, userRole || undefined)}
        sidebarMenu="equipment"
        equipmentId={equipmentId}
        masterOrgId={masterOrgId}
        currentOrgId={orgId}
        className="p-6"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Clipboard className="h-8 w-8 animate-pulse mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Loading registrations...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !data) {
    return (
      <AppLayout
        name="Error"
        topNav={buildStandardNavigation(masterOrgId, orgId, userRole || undefined)}
        sidebarMenu="equipment"
        equipmentId={equipmentId}
        masterOrgId={masterOrgId}
        currentOrgId={orgId}
        className="p-6"
      >
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold mb-2">Failed to Load Registrations</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchData}>Try Again</Button>
        </div>
      </AppLayout>
    );
  }

  const equipmentName =
    `${data.equipment.make || "Equipment"} ${data.equipment.model || ""} ${data.equipment.year || ""}`.trim();

  return (
    <AppLayout
      name={data?.masterOrg.name || "Fleetrax"}
      topNav={buildStandardNavigation(masterOrgId, orgId, userRole || undefined)}
      sidebarMenu="equipment"
      equipmentId={equipmentId}
      masterOrgId={masterOrgId}
      currentOrgId={orgId}
      className="p-6"
    >
      {/* ⚠️ CRITICAL: EXACT GOLD STANDARD LAYOUT STRUCTURE */}
      <div className="max-w-7xl mx-auto h-full">
        <div className="space-y-6">
          {/* Header Section - EXACT STRUCTURE */}
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-1">
              <p className="text-sm text-gray-600">{data?.organization.name}</p>
              <h1 className="text-2xl font-bold text-gray-900">
                {data?.equipment.make} {data?.equipment.model} - Registrations
              </h1>
              <p className="text-sm text-gray-500">Equipment registration records</p>
            </div>

            {/* Button Group - RIGHT ALIGNED */}
            <div className="flex items-center gap-3">
              <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Registration
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Registration</DialogTitle>
                    <DialogDescription>
                      Create a new registration record for this equipment.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="px-1">
                    <RegistrationForm
                      equipmentId={equipmentId}
                      onSuccess={handleFormSuccess}
                      onCancel={() => setShowAddForm(false)}
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Split Pane Layout - EXACT STRUCTURE */}
          <div className="flex gap-6 h-[calc(100vh-200px)]">
            {/* Left Pane - EXACT STRUCTURE */}
            <div className="w-[300px] flex-shrink-0">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clipboard className="h-5 w-5" />
                    Registrations ({data?.registrations.length || 0})
                  </CardTitle>
                  <CardDescription>Vehicle registration records</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto">
                  {data?.registrations && data.registrations.length > 0 ? (
                    <div className="space-y-3">
                      {data.registrations.map((registration) => (
                        <div
                          key={registration.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedRegistration?.id === registration.id
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                          }`}
                          onClick={() => setSelectedRegistration(registration)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">
                                {registration.plateNumber} - {registration.state}
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                Expires:{" "}
                                {format(new Date(registration.expirationDate), "MMM dd, yyyy")}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <Badge
                                variant={
                                  registration.status === "Active" ? "default" : "destructive"
                                }
                                className="text-xs"
                              >
                                {registration.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={Clipboard}
                      title="No Registrations"
                      description="No registration records found for this equipment."
                    />
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Pane - EXACT STRUCTURE */}
            <div className="flex-1">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Registration Details</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto">
                  {selectedRegistration ? (
                    <div className="space-y-6">
                      {/* Registration Summary */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Plate Number
                          </label>
                          <div className="mt-1 text-lg font-semibold">
                            {selectedRegistration.plateNumber}
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            State
                          </label>
                          <div className="mt-1 text-lg font-semibold">
                            {selectedRegistration.state}
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Start Date
                          </label>
                          <div className="mt-1 flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span>
                              {format(new Date(selectedRegistration.startDate), "MMMM dd, yyyy")}
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Expiration Date
                          </label>
                          <div className="mt-1 flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span>
                              {format(
                                new Date(selectedRegistration.expirationDate),
                                "MMMM dd, yyyy",
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status */}
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Status
                        </label>
                        <div className="mt-2">
                          <Badge
                            variant={
                              selectedRegistration.status === "Active" ? "default" : "destructive"
                            }
                          >
                            {selectedRegistration.status === "Active" ? (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" /> Active
                              </>
                            ) : (
                              <>
                                <AlertCircle className="h-3 w-3 mr-1" /> Expired
                              </>
                            )}
                          </Badge>
                        </div>
                      </div>

                      {/* Renewal Information */}
                      {selectedRegistration.renewalDate && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Renewal Date
                          </label>
                          <div className="mt-1 flex items-center gap-2">
                            <RotateCcw className="h-4 w-4 text-gray-400" />
                            <span>
                              {format(new Date(selectedRegistration.renewalDate), "MMMM dd, yyyy")}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      {selectedRegistration.notes && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Notes
                          </label>
                          <div className="mt-2 p-3 bg-gray-50 rounded">
                            <p className="text-sm text-gray-700">{selectedRegistration.notes}</p>
                          </div>
                        </div>
                      )}

                      {/* Add-Ons */}
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900">Add-Ons</h4>
                          {selectedRegistration?.issue?.id && (
                            <Button size="sm" variant="outline" onClick={() => setShowAddAddonModal(true)}>
                              <Plus className="h-4 w-4 mr-1" /> Add Add-On
                            </Button>
                          )}
                        </div>
                        <UnifiedAddonDisplay
                          items={attachments}
                          availableTypes={UNIFIED_ADDON_CONFIGURATIONS.registration.modal.availableTypes}
                          config={{ allowCreate: false, showTypeFilter: false, showSearch: false }}
                          onDownloadClick={(item) => window.open(`/api/attachments/${item.id}/download`, "_blank")}
                        />
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-4 border-t">
                        <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Edit Registration</DialogTitle>
                            </DialogHeader>
                            <div className="px-1">
                              <RegistrationForm
                                equipmentId={equipmentId}
                                registration={selectedRegistration as any}
                                onSuccess={handleFormSuccess}
                                onCancel={() => setShowEditForm(false)}
                              />
                            </div>
                          </DialogContent>
                        </Dialog>

                        {selectedRegistration.status === "Active" && (
                          <Dialog open={showRenewalForm} onOpenChange={setShowRenewalForm}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Renew
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Renew Registration</DialogTitle>
                              </DialogHeader>
                              <div className="px-1">
                                <RegistrationForm
                                  equipmentId={equipmentId}
                                  renewingRegistration={selectedRegistration as any}
                                  onSuccess={handleFormSuccess}
                                  onCancel={() => setShowRenewalForm(false)}
                                />
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </div>
                  ) : (
                    <EmptyState
                      icon={Clipboard}
                      title="No Registration Selected"
                      description="Select a registration from the list to view details."
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      {/* Unified Add-On Modal */}
      <UnifiedAddonModal
        isOpen={showAddAddonModal}
        onClose={() => setShowAddAddonModal(false)}
        onSuccess={async () => {
          if (!selectedRegistration?.issue?.id) return;
          try {
            const res = await fetch(`/api/attachments?issueId=${selectedRegistration.issue.id}`);
            if (res.ok) setAttachments(await res.json());
          } catch (e) {
            console.error(e);
          }
        }}
        issueId={selectedRegistration?.issue?.id || ""}
        issueType="registration"
        availableTypes={UNIFIED_ADDON_CONFIGURATIONS.registration.modal.availableTypes}
        modalTitle={UNIFIED_ADDON_CONFIGURATIONS.registration.modal.modalTitle}
        modalDescription={UNIFIED_ADDON_CONFIGURATIONS.registration.modal.modalDescription}
        allowFileUpload
      />
    </AppLayout>
  );
}
