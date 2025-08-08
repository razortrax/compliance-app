"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layouts/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { buildStandardDriverNavigation } from "@/lib/utils";
import MvrIssueForm from "@/components/mvr_issues/mvr-issue-form";
import { MvrRenewalForm } from "@/components/mvr_issues/mvr-renewal-form";
import { ActivityLog } from "@/components/ui/activity-log";
import { Plus, FileText, AlertTriangle, Clock, CheckCircle, Edit, Calendar } from "lucide-react";
import { format } from "date-fns";

interface MVRIssue {
  id: string;
  issueId: string;
  state: string;
  violationsCount: number;
  cleanRecord: boolean;
  notes?: string;
  type?: string;
  result?: string;
  result_dach?: string;
  result_status?: string;
  reviewedBy?: any;
  certification?: string;
  status?: string;
  startDate?: string;
  expirationDate?: string;
  renewalDate?: string;
  createdAt: string;
  updatedAt: string;
  issue: {
    id: string;
    title: string;
    status: string;
    priority: string;
  };
}

interface ContextData {
  driver: {
    id: string;
    firstName: string;
    lastName: string;
    licenseNumber?: string;
    party?: {
      id: string;
    };
  };
  organization: {
    id: string;
    name: string;
    dotNumber?: string;
  };
  masterOrg: {
    id: string;
    name: string;
  };
  mvrIssues: MVRIssue[];
}

interface MVRIssuePageProps {
  params: {
    masterOrgId: string;
    orgId: string;
    driverId: string;
  };
}

export default function MVRIssuePage({ params }: MVRIssuePageProps) {
  const { masterOrgId, orgId, driverId } = params;
  const router = useRouter();

  const [data, setData] = useState<ContextData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMVR, setSelectedMVR] = useState<MVRIssue | null>(null);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isRenewalDialogOpen, setIsRenewalDialogOpen] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);

  // Single API call to get all context and data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log(`🔄 Fetching MVR data for driver ${driverId} in org ${orgId}`);

        const response = await fetch(
          `/api/master/${masterOrgId}/organization/${orgId}/driver/${driverId}/mvr-issue`,
        );

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Driver not found in this organization");
          } else if (response.status === 403) {
            throw new Error("Access denied to this organization");
          } else {
            throw new Error(`Failed to load data: ${response.status}`);
          }
        }

        const result = await response.json();
        setData(result);

        // Auto-select first MVR if available
        if (result.mvrIssues && result.mvrIssues.length > 0) {
          setSelectedMVR(result.mvrIssues[0]);
        }

        console.log("✅ MVR data loaded successfully:", result);
      } catch (error) {
        console.error("❌ Error fetching MVR data:", error);
        setError(error instanceof Error ? error.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [masterOrgId, orgId, driverId]);

  // Fetch organizations for selectors
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const response = await fetch("/api/organizations");
        if (response.ok) {
          const orgs = await response.json();
          setOrganizations(orgs);
        }
      } catch (error) {
        console.error("Error fetching organizations:", error);
      }
    };
    fetchOrganizations();
  }, []);

  const handleOrganizationSelect = (org: any) => {
    console.log("Organization selected:", org.id);
  };

  const handleMVRFormSuccess = (newMvr: any) => {
    console.log("MVR created successfully:", newMvr);
    // Refresh the MVR data
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        mvrIssues: [...(prev.mvrIssues || []), newMvr],
      };
    });
    setIsAddDialogOpen(false);
    // Auto-select the new MVR
    if (newMvr) {
      setSelectedMVR(newMvr);
    }
  };

  const handleMVRFormCancel = () => {
    setIsAddDialogOpen(false);
  };

  const handleEditSuccess = (updatedMvr: any) => {
    console.log("MVR updated successfully:", updatedMvr);
    // Update the MVR in the list
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        mvrIssues:
          prev.mvrIssues?.map((mvr) => (mvr.id === updatedMvr.id ? updatedMvr : mvr)) || [],
      };
    });
    setSelectedMVR(updatedMvr);
    setIsEditDialogOpen(false);
  };

  const handleRenewalSuccess = (renewedMvr: any) => {
    console.log("MVR renewed successfully:", renewedMvr);
    // Add the new renewed MVR to the list
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        mvrIssues: [...(prev.mvrIssues || []), renewedMvr],
      };
    });
    setSelectedMVR(renewedMvr);
    setIsRenewalDialogOpen(false);
  };

  const fetchAttachments = async (issueId: string) => {
    try {
      const response = await fetch(`/api/attachments?issueId=${issueId}`);
      if (response.ok) {
        const attachmentsData = await response.json();
        setAttachments(attachmentsData);
      }
    } catch (error) {
      console.error("Error fetching attachments:", error);
    }
  };

  const refreshAttachments = () => {
    if (selectedMVR?.issueId) {
      fetchAttachments(selectedMVR.issueId);
    }
  };

  // Fetch attachments when selectedMVR changes
  useEffect(() => {
    if (selectedMVR?.issueId) {
      fetchAttachments(selectedMVR.issueId);
    } else {
      setAttachments([]);
    }
  }, [selectedMVR]);

  const getExpirationStatus = (mvr: MVRIssue) => {
    if (!mvr.expirationDate) {
      return {
        status: "unknown",
        daysUntil: null,
        badge: (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            No Expiration
          </Badge>
        ),
      };
    }

    const expirationDate = new Date(mvr.expirationDate);
    const today = new Date();
    const daysUntilExpiration = Math.ceil(
      (expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
    const isExpired = daysUntilExpiration < 0;

    // Check if this MVR has been renewed (has a newer MVR after it)
    const hasNewerMVR =
      data?.mvrIssues?.some(
        (otherMvr) =>
          otherMvr.id !== mvr.id &&
          otherMvr.expirationDate &&
          mvr.expirationDate &&
          new Date(otherMvr.expirationDate) > new Date(mvr.expirationDate),
      ) || false;

    // INACTIVE MVRs - Show status tags instead of expiration countdown
    if (hasNewerMVR) {
      // This MVR was renewed - show "Renewed" tag
      return {
        status: "renewed",
        daysUntil: null,
        badge: (
          <Badge className="flex items-center gap-1 bg-blue-100 text-blue-800 border-blue-200">
            <CheckCircle className="h-3 w-3" />
            Renewed
          </Badge>
        ),
      };
    } else if (isExpired) {
      // This MVR is expired and not renewed - show "Expired" tag
      return {
        status: "expired",
        daysUntil: null,
        badge: (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Expired
          </Badge>
        ),
      };
    }

    // ACTIVE MVRs - Show expiration countdown as before
    if (daysUntilExpiration <= 30) {
      // Due within 30 days = Orange
      return {
        status: "critical",
        daysUntil: daysUntilExpiration,
        badge: (
          <Badge className="flex items-center gap-1 bg-orange-100 text-orange-800 border-orange-200">
            <Clock className="h-3 w-3" />
            {daysUntilExpiration}d
          </Badge>
        ),
      };
    } else if (daysUntilExpiration <= 60) {
      // Due within 60 days = Yellow
      return {
        status: "warning",
        daysUntil: daysUntilExpiration,
        badge: (
          <Badge className="flex items-center gap-1 bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="h-3 w-3" />
            {daysUntilExpiration}d
          </Badge>
        ),
      };
    } else {
      // Current and compliant = Green
      return {
        status: "current",
        daysUntil: daysUntilExpiration,
        badge: (
          <Badge className="flex items-center gap-1 bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3" />
            Current
          </Badge>
        ),
      };
    }
  };

  if (loading) {
    return (
      <AppLayout name="Loading..." topNav={[]} className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"> </div>
        </div>

        {/* Edit MVR Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit MVR Record</DialogTitle>
            </DialogHeader>
            <div className="px-1">
              <MvrIssueForm
                mvrIssue={selectedMVR}
                onSuccess={handleEditSuccess}
                onCancel={() => setIsEditDialogOpen(false)}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Renewal MVR Dialog */}
        <Dialog open={isRenewalDialogOpen} onOpenChange={setIsRenewalDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Renew MVR Record</DialogTitle>
            </DialogHeader>
            <div className="px-1">
              <MvrRenewalForm
                mvrIssue={selectedMVR}
                onSuccess={handleRenewalSuccess}
                onCancel={() => setIsRenewalDialogOpen(false)}
              />
            </div>
          </DialogContent>
        </Dialog>
      </AppLayout>
    );
  }

  if (error || !data) {
    return (
      <AppLayout name="FleeTrax" topNav={[]} className="p-6">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Data</h2>
          <p className="text-gray-600">{error}</p>
          <Button onClick={() => router.refresh()} className="mt-4">
            Try Again
          </Button>
        </div>
      </AppLayout>
    );
  }

  // Build standard navigation with consistent Drivers | Equipment pattern
  const topNav = buildStandardDriverNavigation(driverId || "", masterOrgId || "", "drivers");

  return (
    <AppLayout name={data.masterOrg.name} topNav={topNav} className="p-6">
      <div className="max-w-7xl mx-auto h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <p className="text-sm text-gray-600">{data.organization.name}</p>
            <h1 className="text-2xl font-bold text-gray-900">
              {data.driver.firstName} {data.driver.lastName} - Motor Vehicle Records
            </h1>
            {data.driver.licenseNumber && (
              <p className="text-sm text-gray-500">License: {data.driver.licenseNumber}</p>
            )}
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add MVR Record
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New MVR Record</DialogTitle>
              </DialogHeader>
              <div className="px-1">
                <MvrIssueForm
                  partyId={data.driver.party?.id}
                  onSuccess={handleMVRFormSuccess}
                  onCancel={handleMVRFormCancel}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Split Pane Layout */}
        <div className="flex gap-6 h-[calc(100vh-200px)]">
          {/* Left Pane - MVR List */}
          <div className="w-[300px] flex-shrink-0">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  MVR Records ({data.mvrIssues.length})
                </CardTitle>
                <CardDescription>Motor vehicle record history for this driver</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto">
                {data.mvrIssues.length === 0 ? (
                  <EmptyState
                    icon={FileText}
                    title="No MVR records found"
                    description="This driver doesn't have any MVR records yet."
                  />
                ) : (
                  <div className="space-y-3">
                    {[...data.mvrIssues]
                      .sort((a, b) => {
                        // First, sort by active status (expired records go to bottom)
                        const aExpired = a.expirationDate
                          ? new Date(a.expirationDate) < new Date()
                          : false;
                        const bExpired = b.expirationDate
                          ? new Date(b.expirationDate) < new Date()
                          : false;

                        if (aExpired !== bExpired) {
                          return aExpired ? 1 : -1; // Active records first
                        }

                        // Then sort by expiration date (newest first within each group)
                        const aDate = a.expirationDate ? new Date(a.expirationDate) : new Date(0);
                        const bDate = b.expirationDate ? new Date(b.expirationDate) : new Date(0);
                        return bDate.getTime() - aDate.getTime();
                      })
                      .map((mvr) => (
                        <div
                          key={mvr.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                            selectedMVR?.id === mvr.id
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => setSelectedMVR(mvr)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium">{mvr.type || "MVR Record"}</h3>
                            {getExpirationStatus(mvr).badge}
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>State: {mvr.state}</p>
                            {mvr.renewalDate && (
                              <p>Renewal: {format(new Date(mvr.renewalDate), "MMM d, yyyy")}</p>
                            )}
                            {mvr.expirationDate && (
                              <p>Expires: {format(new Date(mvr.expirationDate), "MMM d, yyyy")}</p>
                            )}
                            {mvr.cleanRecord ? (
                              <p className="text-green-600 font-medium">✓ Clean Record</p>
                            ) : (
                              <p className="text-amber-600 font-medium">
                                ⚠ {mvr.violationsCount} Violations
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Pane - MVR Details */}
          <div className="flex-1">
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>MVR Details</CardTitle>
                    <CardDescription>
                      {selectedMVR
                        ? "Details for selected MVR record"
                        : "Select an MVR record to view details"}
                    </CardDescription>
                  </div>
                  {selectedMVR && (
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setIsEditDialogOpen(true)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsRenewalDialogOpen(true)}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Renew
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="overflow-y-auto max-h-[calc(100%-120px)]">
                {selectedMVR ? (
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">State:</span>
                          <span className="ml-2">{selectedMVR.state}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Type:</span>
                          <span className="ml-2">{selectedMVR.type || "N/A"}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Violations Count:</span>
                          <span className="ml-2">{selectedMVR.violationsCount}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Clean Record:</span>
                          <span className="ml-2">{selectedMVR.cleanRecord ? "Yes" : "No"}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Date Created:</span>
                          <span className="ml-2">
                            {format(new Date(selectedMVR.createdAt), "MMM dd, yyyy")}
                          </span>
                        </div>
                        {selectedMVR.startDate && (
                          <div>
                            <span className="font-medium text-gray-700">Start Date:</span>
                            <span className="ml-2">
                              {format(new Date(selectedMVR.startDate), "MMM dd, yyyy")}
                            </span>
                          </div>
                        )}
                        {selectedMVR.expirationDate && (
                          <div>
                            <span className="font-medium text-gray-700">Expiration Date:</span>
                            <span className="ml-2">
                              {format(new Date(selectedMVR.expirationDate), "MMM dd, yyyy")}
                            </span>
                          </div>
                        )}
                        {selectedMVR.renewalDate && (
                          <div>
                            <span className="font-medium text-gray-700">Renewal Date:</span>
                            <span className="ml-2">
                              {format(new Date(selectedMVR.renewalDate), "MMM dd, yyyy")}
                            </span>
                          </div>
                        )}
                        <div>
                          <span className="font-medium text-gray-700">Last Updated:</span>
                          <span className="ml-2">
                            {format(new Date(selectedMVR.updatedAt), "MMM dd, yyyy")}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Issue Priority:</span>
                          <span className="ml-2 capitalize">
                            {selectedMVR.issue?.priority || "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Results */}
                    {(selectedMVR.result ||
                      selectedMVR.result_dach ||
                      selectedMVR.result_status ||
                      selectedMVR.certification) && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Results & Status</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          {selectedMVR.result && (
                            <div>
                              <span className="font-medium text-gray-700">Result:</span>
                              <span className="ml-2">{selectedMVR.result}</span>
                            </div>
                          )}
                          {selectedMVR.result_dach && (
                            <div>
                              <span className="font-medium text-gray-700">DACH Result:</span>
                              <span className="ml-2">{selectedMVR.result_dach}</span>
                            </div>
                          )}
                          {selectedMVR.result_status && (
                            <div>
                              <span className="font-medium text-gray-700">Result Status:</span>
                              <span className="ml-2">
                                {selectedMVR.result_status.replace("_", " ")}
                              </span>
                            </div>
                          )}
                          {selectedMVR.certification && (
                            <div>
                              <span className="font-medium text-gray-700">Certification:</span>
                              <span className="ml-2">
                                {selectedMVR.certification.replace("_", " ")}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {selectedMVR.notes && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Notes</h3>
                        <p className="text-sm text-gray-700">{selectedMVR.notes}</p>
                      </div>
                    )}

                    {/* Add-Ons (Activity Log) */}
                    <ActivityLog
                      issueId={selectedMVR.issueId}
                      allowedTypes={["note", "communication", "url", "credential", "attachment"]}
                      compact={false}
                      maxHeight="400px"
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Select an MVR record
                      </h3>
                      <p className="text-gray-600">
                        Choose an MVR record from the list to view its details
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit MVR Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit MVR Record</DialogTitle>
          </DialogHeader>
          <div className="px-1">
            <MvrIssueForm
              mvrIssue={selectedMVR}
              onSuccess={handleEditSuccess}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Renewal MVR Dialog */}
      <Dialog open={isRenewalDialogOpen} onOpenChange={setIsRenewalDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Renew MVR Record</DialogTitle>
          </DialogHeader>
          <div className="px-1">
            <MvrRenewalForm
              mvrIssue={selectedMVR}
              onSuccess={handleRenewalSuccess}
              onCancel={() => setIsRenewalDialogOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Unified Add-On Modal removed; ActivityLog provides add functionality */}
    </AppLayout>
  );
}
