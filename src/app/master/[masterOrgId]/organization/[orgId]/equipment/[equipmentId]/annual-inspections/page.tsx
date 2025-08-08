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
import { AnnualInspectionForm } from "@/components/annual-inspections/annual-inspection-form";
import { EmptyState } from "@/components/ui/empty-state";
import { ActivityLog } from "@/components/ui/activity-log";
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
  Shield,
} from "lucide-react";
import { format } from "date-fns";
import { UnifiedAddonDisplay } from "@/components/ui/unified-addon-display";
import { UnifiedAddonModal } from "@/components/ui/unified-addon-modal";
import { UNIFIED_ADDON_CONFIGURATIONS } from "@/hooks/use-unified-addons";

interface AnnualInspection {
  id: string;
  inspectorName: string;
  inspectionDate: string;
  expirationDate: string;
  result: "Pending" | "Pass" | "Fail";
  status: "Scheduled" | "Active" | "Inactive";
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
  inspections: AnnualInspection[];
  equipment: Equipment;
  organization: Organization;
  masterOrg: MasterOrg;
}

export default function EquipmentAnnualInspectionsPage() {
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
  const [selectedInspection, setSelectedInspection] = useState<AnnualInspection | null>(null);
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
        `/api/master/${masterOrgId}/organization/${orgId}/equipment/${equipmentId}/annual-inspections`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch annual inspection data");
      }

      const pageData = await response.json();
      setData(pageData);

      // Auto-select the first inspection if available and none selected
      if (pageData.inspections.length > 0 && !selectedInspection) {
        setSelectedInspection(pageData.inspections[0]);
      }
    } catch (error) {
      console.error("Error fetching annual inspections:", error);
      setError(error instanceof Error ? error.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAttachments = async () => {
    if (!selectedInspection?.issue?.id) return;
    try {
      const res = await fetch(`/api/attachments?issueId=${selectedInspection.issue.id}`);
      if (res.ok) {
        setAttachments(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFormSuccess = (inspection: any) => {
    // Refresh data after successful create/update
    fetchData();

    // Auto-select the new/updated inspection in the detail view
    setTimeout(() => {
      setSelectedInspection(inspection);
    }, 100); // Small delay to ensure data is refreshed

    // Close all modals
    setShowAddForm(false);
    setShowEditForm(false);
    setShowRenewalForm(false);
  };

  const handleEditInspection = (inspection: AnnualInspection) => {
    setSelectedInspection(inspection);
    setShowEditForm(true);
  };

  const handleRenewInspection = (inspection: AnnualInspection) => {
    setSelectedInspection(inspection);
    setShowRenewalForm(true);
  };

  const getInspectionStatus = (expirationDate: string, result: string, status: string) => {
    const expiry = new Date(expirationDate);
    const today = new Date();
    const daysUntil = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (status === "Inactive") {
      return {
        status: "inactive",
        daysUntil,
        color: "text-gray-600",
        bgColor: "bg-gray-50",
        badgeColor: "secondary",
      };
    } else if (status === "Scheduled" || result === "Pending") {
      return {
        status: "scheduled",
        daysUntil,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        badgeColor: "default",
      };
    } else if (result === "Fail") {
      if (daysUntil < 0) {
        return {
          status: "failed_expired",
          daysUntil,
          color: "text-red-600",
          bgColor: "bg-red-50",
          badgeColor: "destructive",
        };
      } else {
        return {
          status: "failed_current",
          daysUntil,
          color: "text-orange-600",
          bgColor: "bg-orange-50",
          badgeColor: "secondary",
        };
      }
    } else if (daysUntil < 0) {
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
            <Shield className="h-8 w-8 animate-pulse mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Loading annual inspections...</p>
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
          <h3 className="text-lg font-semibold mb-2">Failed to Load Annual Inspections</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchData}>Try Again</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      name={data.masterOrg.name}
      topNav={buildStandardNavigation(masterOrgId, orgId, userRole || undefined)}
      sidebarMenu="equipment"
      equipmentId={equipmentId}
      masterOrgId={masterOrgId}
      currentOrgId={orgId}
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="border-b bg-white px-6 py-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Annual Inspections</h1>
                <p className="text-gray-600">
                  {data.equipment.make} {data.equipment.model} {data.equipment.year} •{" "}
                  {data.organization.name}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Inspection
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add Annual Inspection</DialogTitle>
                      <DialogDescription>
                        Record a new annual equipment inspection
                      </DialogDescription>
                    </DialogHeader>
                    <div className="px-1">
                      <AnnualInspectionForm
                        equipmentId={equipmentId}
                        onSuccess={handleFormSuccess}
                        onCancel={() => setShowAddForm(false)}
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <div className="max-w-7xl mx-auto h-full">
            <div className="flex h-full">
              {/* Left sidebar - Inspections list */}
              <div className="w-80 border-r bg-gray-50 overflow-auto">
                <div className="p-4">
                  <div className="space-y-2">
                    {data.inspections.length === 0 ? (
                      <div className="text-center py-8">
                        <Shield className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <h3 className="font-medium text-gray-900 mb-2">No Annual Inspections</h3>
                        <p className="text-sm text-gray-500 mb-4">
                          Get started by adding your first annual inspection.
                        </p>
                        <Button size="sm" onClick={() => setShowAddForm(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add First Inspection
                        </Button>
                      </div>
                    ) : (
                      data.inspections.map((inspection) => {
                        const statusInfo = getInspectionStatus(
                          inspection.expirationDate,
                          inspection.result,
                          inspection.status,
                        );
                        const isSelected = selectedInspection?.id === inspection.id;

                        return (
                          <div
                            key={inspection.id}
                            onClick={() => setSelectedInspection(inspection)}
                            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                              isSelected
                                ? "border-blue-200 bg-blue-50"
                                : "border-gray-200 bg-white hover:border-gray-300"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={
                                    statusInfo.badgeColor as
                                      | "default"
                                      | "secondary"
                                      | "destructive"
                                      | "outline"
                                      | null
                                      | undefined
                                  }
                                >
                                  {inspection.result}
                                </Badge>
                                <Badge variant="outline">{inspection.status}</Badge>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(inspection.inspectionDate), "MM/dd/yy")}
                              </div>
                            </div>

                            <div className="mb-2">
                              <p className="font-medium text-sm text-gray-900">
                                Inspector: {inspection.inspectorName}
                              </p>
                              <p className="text-xs text-gray-600">
                                Expires:{" "}
                                {format(new Date(inspection.expirationDate), "MMM dd, yyyy")}
                              </p>
                            </div>

                            <div className={`text-xs ${statusInfo.color}`}>
                              {statusInfo.status === "scheduled" && "📅 Scheduled"}
                              {statusInfo.status === "expired" && "⚠️ Expired"}
                              {statusInfo.status === "expiring" &&
                                `⏰ Expires in ${statusInfo.daysUntil} days`}
                              {statusInfo.status === "current" &&
                                `✅ ${statusInfo.daysUntil} days remaining`}
                              {statusInfo.status === "inactive" && "⏸️ Inactive"}
                              {statusInfo.status === "failed_expired" && "❌ Failed & Expired"}
                              {statusInfo.status === "failed_current" &&
                                `❌ Failed (${statusInfo.daysUntil} days until compliance issue)`}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Right content - Inspection details */}
              <div className="flex-1 overflow-auto">
                <Card className="h-full rounded-none border-0">
                  <CardContent className="p-6">
                    {selectedInspection ? (
                      <div className="space-y-6">
                        {/* Header */}
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-gray-900">
                              Inspection Details
                            </h2>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  getInspectionStatus(
                                    selectedInspection.expirationDate,
                                    selectedInspection.result,
                                    selectedInspection.status,
                                  ).badgeColor as
                                    | "default"
                                    | "secondary"
                                    | "destructive"
                                    | "outline"
                                    | null
                                    | undefined
                                }
                              >
                                {selectedInspection.result}
                              </Badge>
                              <Badge variant="outline">{selectedInspection.status}</Badge>
                            </div>
                          </div>
                        </div>

                        {/* Basic Info */}
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Inspector Name
                            </label>
                            <div className="mt-2 text-sm text-gray-900">
                              {selectedInspection.inspectorName}
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Inspection Date
                            </label>
                            <div className="mt-2 text-sm text-gray-900">
                              {format(new Date(selectedInspection.inspectionDate), "MMMM dd, yyyy")}
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Expiration Date
                            </label>
                            <div className="mt-2 text-sm text-gray-900">
                              {format(new Date(selectedInspection.expirationDate), "MMMM dd, yyyy")}
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Days Until Expiration
                            </label>
                            <div className="mt-2 text-sm text-gray-900">
                              {Math.ceil(
                                (new Date(selectedInspection.expirationDate).getTime() -
                                  new Date().getTime()) /
                                  (1000 * 60 * 60 * 24),
                              )}{" "}
                              days
                            </div>
                          </div>
                        </div>

                        {/* Notes */}
                        {selectedInspection.notes && (
                          <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Notes
                            </label>
                            <div className="mt-2 p-3 bg-gray-50 rounded">
                              <p className="text-sm text-gray-700">{selectedInspection.notes}</p>
                            </div>
                          </div>
                        )}

                        {/* Gold Standard Add Ons Section */}
                        <div className="border-t pt-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-gray-900">Add-Ons</h4>
                            {selectedInspection?.issue?.id && (
                              <Button size="sm" variant="outline" onClick={() => setShowAddAddonModal(true)}>
                                <Plus className="h-4 w-4 mr-1" /> Add Add-On
                              </Button>
                            )}
                          </div>
                          <UnifiedAddonDisplay
                            items={attachments}
                            availableTypes={UNIFIED_ADDON_CONFIGURATIONS.annual_inspection.modal.availableTypes}
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
                                <DialogTitle>Edit Annual Inspection</DialogTitle>
                              </DialogHeader>
                              <div className="px-1">
                                <AnnualInspectionForm
                                  equipmentId={equipmentId}
                                  annualInspection={selectedInspection as any}
                                  onSuccess={handleFormSuccess}
                                  onCancel={() => setShowEditForm(false)}
                                />
                              </div>
                            </DialogContent>
                          </Dialog>

                          {selectedInspection.status === "Active" && (
                            <Dialog open={showRenewalForm} onOpenChange={setShowRenewalForm}>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <RotateCcw className="h-4 w-4 mr-2" />
                                  Renew
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Renew Annual Inspection</DialogTitle>
                                </DialogHeader>
                                <div className="px-1">
                                  <AnnualInspectionForm
                                    equipmentId={equipmentId}
                                    renewingInspection={selectedInspection as any}
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
                        icon={Shield}
                        title="No Inspection Selected"
                        description="Select an annual inspection from the list to view details."
                      />
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Unified Add-On Modal */}
      <UnifiedAddonModal
        isOpen={showAddAddonModal}
        onClose={() => setShowAddAddonModal(false)}
        onSuccess={refreshAttachments}
        issueId={selectedInspection?.issue?.id || ""}
        issueType="annual_inspection"
        availableTypes={UNIFIED_ADDON_CONFIGURATIONS.annual_inspection.modal.availableTypes}
        modalTitle={UNIFIED_ADDON_CONFIGURATIONS.annual_inspection.modal.modalTitle}
        modalDescription={UNIFIED_ADDON_CONFIGURATIONS.annual_inspection.modal.modalDescription}
        allowFileUpload
      />
    </AppLayout>
  );
}
