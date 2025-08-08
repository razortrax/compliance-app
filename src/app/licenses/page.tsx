"use client";

import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layouts/app-layout";
import { useMasterOrg } from "@/hooks/use-master-org";
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
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import { LicenseForm } from "@/components/licenses/license-form";
import {
  Plus,
  FileText,
  Calendar,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Edit,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";

interface Endorsement {
  code: string;
  name: string;
  expirationDate?: string | null;
  renewalRequired?: boolean;
  certificationNumber?: string;
}

interface Restriction {
  code: string;
  description: string;
}

interface License {
  id: string;
  licenseType: string;
  licenseState: string;
  licenseNumber: string;
  certification: string;
  expirationDate: string;
  renewalDate?: string | null;
  endorsements: Endorsement[];
  restrictions: Restriction[];
  notes?: string | null;
  calculatedStatus: "current" | "warning" | "critical" | "expired";
  daysUntilExpiry: number;
  issue: {
    id: string;
    title: string;
    description?: string | null;
    status: string;
    priority: string;
    party: {
      id: string;
      person?: {
        firstName: string;
        lastName: string;
      } | null;
      organization?: {
        name: string;
      } | null;
    };
  };
}

const LICENSE_TYPE_LABELS: Record<string, string> = {
  CDL_A: "CDL Class A",
  CDL_B: "CDL Class B",
  CDL_C: "CDL Class C",
  NON_CDL: "Non-CDL License",
  CDL_PERMIT: "CDL Permit",
  DOT_PHYSICAL: "DOT Physical",
  LIABILITY_INSURANCE: "Liability Insurance",
  DOT_REGISTRATION: "DOT Registration",
  MC_AUTHORITY: "Motor Carrier Authority",
};

const ENDORSEMENT_LABELS: Record<string, string> = {
  H: "Hazardous Materials",
  P: "Passengers",
  S: "School Bus",
  N: "Tanker",
  T: "Double/Triple Trailers",
  X: "Hazmat + Tanker",
  M: "Motorcycle",
};

export default function LicensesPage() {
  const { masterOrg } = useMasterOrg();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLicense, setEditingLicense] = useState<License | null>(null);
  const [filter, setFilter] = useState<"all" | "current" | "warning" | "critical" | "expired">(
    "all",
  );

  useEffect(() => {
    fetchLicenses();
  }, []);

  const fetchLicenses = async () => {
    try {
      const response = await fetch("/api/licenses");
      if (response.ok) {
        const data = await response.json();
        setLicenses(data);
      } else {
        console.error("Failed to fetch licenses");
      }
    } catch (error) {
      console.error("Error fetching licenses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLicense = async (licenseId: string) => {
    if (!confirm("Are you sure you want to deactivate this license?")) return;

    try {
      const response = await fetch(`/api/licenses/${licenseId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchLicenses(); // Refresh list
      } else {
        alert("Failed to deactivate license");
      }
    } catch (error) {
      console.error("Error deactivating license:", error);
      alert("An error occurred while deactivating the license");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "current":
        return "bg-green-100 text-green-800";
      case "warning":
        return "bg-yellow-100 text-yellow-800";
      case "critical":
        return "bg-orange-100 text-orange-800";
      case "expired":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "current":
        return <CheckCircle className="h-4 w-4" />;
      case "warning":
        return <Clock className="h-4 w-4" />;
      case "critical":
        return <AlertTriangle className="h-4 w-4" />;
      case "expired":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  // Filter licenses based on selected filter
  const filteredLicenses = licenses.filter((license) => {
    if (filter === "all") return true;
    return license.calculatedStatus === filter;
  });

  // Calculate counts for filter buttons
  const counts = {
    all: licenses.length,
    current: licenses.filter((l) => l.calculatedStatus === "current").length,
    warning: licenses.filter((l) => l.calculatedStatus === "warning").length,
    critical: licenses.filter((l) => l.calculatedStatus === "critical").length,
    expired: licenses.filter((l) => l.calculatedStatus === "expired").length,
  };

  if (loading) {
    return (
      <AppLayout
        name={masterOrg?.name || "Master"}
        sidebarMenu="driver"
        masterOrgId={masterOrg?.id}
        className="p-6"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading licenses...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      name={masterOrg?.name || "Master"}
      sidebarMenu="driver"
      masterOrgId={masterOrg?.id}
      className="p-6"
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <SectionHeader
          title="License Management"
          description="Track and manage all licenses, certifications, and endorsements"
          actions={
            <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add License
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New License</DialogTitle>
                  <DialogDescription>
                    Create a new license or certification record
                  </DialogDescription>
                </DialogHeader>
                <LicenseForm
                  onSuccess={() => {
                    setShowAddForm(false);
                    fetchLicenses();
                  }}
                  onCancel={() => setShowAddForm(false)}
                />
              </DialogContent>
            </Dialog>
          }
        />

        {/* Filter Buttons */}
        <div className="flex space-x-2">
          {(["all", "current", "warning", "critical", "expired"] as const).map((filterOption) => (
            <Button
              key={filterOption}
              variant={filter === filterOption ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(filterOption)}
              className="flex items-center gap-2"
            >
              {filterOption !== "all" && getStatusIcon(filterOption)}
              {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
              <Badge variant="secondary" className="ml-1">
                {counts[filterOption]}
              </Badge>
            </Button>
          ))}
        </div>

        {/* Licenses List */}
        {filteredLicenses.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No licenses found"
            description={
              filter === "all"
                ? "No licenses have been added yet. Start by adding your first license or certification."
                : `No licenses found with ${filter} status.`
            }
            action={{
              label: "Add First License",
              onClick: () => setShowAddForm(true),
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLicenses.map((license) => (
              <Card key={license.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {LICENSE_TYPE_LABELS[license.licenseType] || license.licenseType}
                      </CardTitle>
                      <CardDescription>
                        {license.issue.party.person
                          ? `${license.issue.party.person.firstName} ${license.issue.party.person.lastName}`
                          : license.issue.party.organization?.name || "Unknown"}
                      </CardDescription>
                    </div>
                    <Badge
                      className={`${getStatusColor(license.calculatedStatus)} flex items-center gap-1`}
                    >
                      {getStatusIcon(license.calculatedStatus)}
                      {license.calculatedStatus}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* License Details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span>
                        {license.licenseState} - {license.licenseNumber}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>
                        Expires: {format(new Date(license.expirationDate), "MMM dd, yyyy")}
                      </span>
                    </div>
                    {license.daysUntilExpiry >= 0 && (
                      <div className="text-xs text-gray-500">
                        {license.daysUntilExpiry} days remaining
                      </div>
                    )}
                    {license.daysUntilExpiry < 0 && (
                      <div className="text-xs text-red-600">
                        Expired {Math.abs(license.daysUntilExpiry)} days ago
                      </div>
                    )}
                  </div>

                  {/* Endorsements */}
                  {license.endorsements.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-gray-700 mb-1">Endorsements</div>
                      <div className="flex flex-wrap gap-1">
                        {license.endorsements.map((endorsement, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {endorsement.code} -{" "}
                            {ENDORSEMENT_LABELS[endorsement.code] || endorsement.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingLicense(license)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteLicense(license.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Deactivate
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit License Dialog */}
        <Dialog open={!!editingLicense} onOpenChange={() => setEditingLicense(null)}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit License</DialogTitle>
              <DialogDescription>Update license information and settings</DialogDescription>
            </DialogHeader>
            {editingLicense && (
              <LicenseForm
                license={editingLicense}
                onSuccess={() => {
                  setEditingLicense(null);
                  fetchLicenses();
                }}
                onCancel={() => setEditingLicense(null)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
