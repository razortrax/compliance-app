"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppLayout } from "@/components/layouts/app-layout";
import { useMasterOrg } from "@/hooks/use-master-org";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import DrugAlcoholIssueForm from "@/components/drugalcohol_issues/drugalcohol-issue-form";
import { UnifiedAddonDisplay } from "@/components/ui/unified-addon-display";
import { UnifiedAddonModal } from "@/components/ui/unified-addon-modal";
import { UNIFIED_ADDON_CONFIGURATIONS } from "@/hooks/use-unified-addons";
import { Plus, Users, Edit, Trash2, FileText } from "lucide-react";
import { format } from "date-fns";
import { buildStandardDriverNavigation } from "@/lib/utils";

interface DrugAlcoholIssue {
  id: string;
  result?: string;
  substance?: string;
  lab?: string;
  accreditedBy?: string;
  notes?: string;
  reason?: string;
  agency?: string;
  specimenNumber?: string;
  isDrug: boolean;
  isAlcohol: boolean;
  clinic?: any;
  createdAt: string;
  updatedAt: string;
  issue: {
    id: string;
    title: string;
    description?: string;
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

interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  party?: {
    id: string;
    role?: {
      id: string;
      organization?: {
        id: string;
        name: string;
      };
    }[];
  };
}

interface Attachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  filePath: string;
  attachmentType: string;
  description?: string;
  noteContent?: string;
  createdAt: string;
}

const REASON_LABELS: Record<string, string> = {
  PreEmployment: "Pre-Employment",
  Random: "Random",
  Reasonable_Suspicion: "Reasonable Suspicion",
  Post_Accident: "Post Accident",
  Return_to_Duty: "Return to Duty",
  FollowUp: "Follow-Up",
  Other: "Other",
};

const AGENCY_LABELS: Record<string, string> = {
  FMCSA: "FMCSA",
  PHMSA: "PHMSA",
  Non_DOT: "Non-DOT",
  Drug_Testing_Clearinghouse: "Drug Testing Clearinghouse",
  Water_Tech_Energy: "Water Tech Energy",
};

export default function DrugAlcoholIssuesPage() {
  const searchParams = useSearchParams();
  const driverId = searchParams.get("driverId");
  const { masterOrg, loading } = useMasterOrg();

  const [drugAlcoholIssues, setDrugAlcoholIssues] = useState<DrugAlcoholIssue[]>([]);
  const [selectedDrugAlcohol, setSelectedDrugAlcohol] = useState<DrugAlcoholIssue | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [organizations, setOrganizations] = useState<any[]>([]); // Changed from Organization[] to any[]
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showAddonModal, setShowAddonModal] = useState(false);
  const [partyId, setPartyId] = useState<string>("");

  useEffect(() => {
    if (driverId) {
      fetchDriver();
    }
  }, [driverId]);

  useEffect(() => {
    if (partyId) {
      fetchDrugAlcoholIssues();
    }
  }, [partyId]);

  useEffect(() => {
    if (selectedDrugAlcohol) {
      fetchAttachments();
    }
  }, [selectedDrugAlcohol]);

  const fetchDriver = async () => {
    try {
      const response = await fetch(`/api/persons/${driverId}`);
      if (response.ok) {
        const driverData = await response.json();
        setDriver(driverData);
        setPartyId(driverData.party?.id || "");
      }
    } catch (error) {
      console.error("Error fetching driver:", error);
    }
  };

  const fetchDrugAlcoholIssues = async () => {
    if (!partyId) {
      console.log("No party ID available yet");
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`/api/drugalcohol_issues?partyId=${partyId}`);
      if (response.ok) {
        const data = await response.json();
        setDrugAlcoholIssues(data);
        console.log("Fetched drug alcohol issues:", data.length);
      } else {
        console.error("Failed to fetch drug alcohol issues:", response.status);
      }
    } catch (error) {
      console.error("Error fetching drug alcohol issues:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAttachments = async () => {
    if (!selectedDrugAlcohol) return;

    try {
      const response = await fetch(`/api/attachments?issueId=${selectedDrugAlcohol.issue.id}`);
      if (response.ok) {
        const data = await response.json();
        setAttachments(data);
      }
    } catch (error) {
      console.error("Error fetching attachments:", error);
    }
  };

  const refreshSelectedDrugAlcoholAfterEdit = async () => {
    if (!selectedDrugAlcohol) return;

    try {
      const response = await fetch(`/api/drugalcohol_issues/${selectedDrugAlcohol.id}`);
      if (response.ok) {
        const updatedDrugAlcohol = await response.json();
        setSelectedDrugAlcohol(updatedDrugAlcohol);
        fetchDrugAlcoholIssues(); // Also refresh the list
      }
    } catch (error) {
      console.error("Error refreshing drug alcohol issue:", error);
    }
  };

  const handleAddAddonSuccess = () => {
    setShowAddonModal(false);
    fetchAttachments();
  };

  const handleOrganizationSelect = (organization: any) => {
    // Handle organization selection if needed
  };

  if (loading) {
    return (
      <AppLayout
        name="Loading..."
        topNav={[]}
        sidebarMenu="driver"
        driverId={driverId || undefined}
        masterOrgId={masterOrg?.id}
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AppLayout>
    );
  }

  if (!driver) {
    return (
      <AppLayout
        name="Driver Not Found"
        topNav={[]}
        sidebarMenu="driver"
        driverId={driverId || undefined}
        masterOrgId={masterOrg?.id}
      >
        <EmptyState
          icon={Users}
          title="Driver not found"
          description="The requested driver could not be found."
        />
      </AppLayout>
    );
  }

  // Calculate and display navigation
  const role = driver.party?.role?.[0];
  const organization = role?.organization;

  let displayName = "Master";
  if (masterOrg) {
    displayName = masterOrg.name;
  } else if (organization) {
    displayName = organization.name;
  }

  const topNav = buildStandardDriverNavigation(driverId || "", masterOrg?.id || "", "drivers");

  return (
    <>
      <AppLayout
        name={
          driver
            ? `${driver.firstName || ""} ${driver.lastName || ""}`.trim() || "Loading..."
            : "Loading..."
        }
        topNav={topNav}
        sidebarMenu="driver"
        driverId={driverId || undefined}
        masterOrgId={masterOrg?.id}
        currentOrgId={organization?.id}
        className="p-6"
      >
        <div className="max-w-7xl mx-auto h-full">
          {/* Driver and Drug & Alcohol Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-1">
              {masterOrg && organization && (
                <p className="text-sm text-gray-600">{organization.name}</p>
              )}
              <h1 className="text-2xl font-bold text-gray-900">
                {driver.firstName} {driver.lastName} - Drug & Alcohol Testing
              </h1>
              <p className="text-sm text-gray-600">
                Track and manage DOT drug and alcohol test records
              </p>
            </div>

            {/* Add Drug & Alcohol Button - only show if there are existing tests */}
            {drugAlcoholIssues.length > 0 && (
              <Button
                onClick={() => {
                  setSelectedDrugAlcohol(null);
                  setShowAddForm(true);
                  setShowEditForm(false);
                }}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Test Record
              </Button>
            )}
          </div>

          {/* Split Pane Layout */}
          <div className="flex gap-6 h-[calc(100vh-300px)]">
            {/* Left Pane - Drug & Alcohol List */}
            <div className="w-[300px] flex-shrink-0">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Test Records ({drugAlcoholIssues.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {drugAlcoholIssues.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No test records yet
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Add drug and alcohol test records for {driver.firstName} {driver.lastName}
                      </p>
                      <Button
                        onClick={() => {
                          setSelectedDrugAlcohol(null);
                          setShowAddForm(true);
                          setShowEditForm(false);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Test Record
                      </Button>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {drugAlcoholIssues.map((drugAlcohol) => {
                        const isActive = drugAlcohol.issue.status === "active";
                        const isSelected = selectedDrugAlcohol?.id === drugAlcohol.id;

                        return (
                          <div
                            key={drugAlcohol.id}
                            className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                              isSelected ? "bg-blue-50 border-r-2 border-blue-500" : ""
                            }`}
                            onClick={() => {
                              setSelectedDrugAlcohol(drugAlcohol);
                              setShowAddForm(false);
                              setShowEditForm(false);
                            }}
                          >
                            <div className="space-y-2">
                              {/* First Row: Title & Status */}
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium text-gray-900 text-sm truncate">
                                  {drugAlcohol.issue.title}
                                </h4>
                                {isActive && (
                                  <Badge
                                    variant="default"
                                    className="text-xs bg-green-100 text-green-800"
                                  >
                                    Active
                                  </Badge>
                                )}
                              </div>

                              {/* Second Row: Test Types & Reason */}
                              <div className="flex items-center justify-between">
                                <div className="text-xs text-gray-600">
                                  {(drugAlcohol.reason && REASON_LABELS[drugAlcohol.reason]) ||
                                    drugAlcohol.reason ||
                                    "Test"}
                                </div>
                                <div className="flex gap-1">
                                  {drugAlcohol.isDrug && (
                                    <Badge variant="secondary" className="text-xs">
                                      Drug
                                    </Badge>
                                  )}
                                  {drugAlcohol.isAlcohol && (
                                    <Badge variant="secondary" className="text-xs">
                                      Alcohol
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              {/* Third Row: Date & Result */}
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>
                                  {format(new Date(drugAlcohol.createdAt), "MMM dd, yyyy")}
                                </span>
                                {drugAlcohol.result && (
                                  <span
                                    className={`font-medium ${
                                      drugAlcohol.result === "Positive"
                                        ? "text-red-600"
                                        : "text-green-600"
                                    }`}
                                  >
                                    {drugAlcohol.result.replace("_", " ")}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Pane - Details */}
            <div className="flex-1">
              <Card className="h-full">
                {showAddForm ? (
                  <>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Add Test Record</CardTitle>
                          <CardDescription>
                            Create a new drug and alcohol test record for {driver.firstName}{" "}
                            {driver.lastName}
                          </CardDescription>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowAddForm(false);
                            setSelectedDrugAlcohol(null);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="overflow-y-auto max-h-[calc(100%-120px)] p-6">
                      <DrugAlcoholIssueForm
                        partyId={partyId}
                        onSuccess={(newDrugAlcohol) => {
                          setShowAddForm(false);
                          fetchDrugAlcoholIssues();
                          // Auto-select the newly created test
                          if (newDrugAlcohol) {
                            setSelectedDrugAlcohol(newDrugAlcohol);
                          }
                        }}
                        onCancel={() => {
                          setShowAddForm(false);
                          setSelectedDrugAlcohol(null);
                        }}
                      />
                    </CardContent>
                  </>
                ) : showEditForm ? (
                  <>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Edit Test Record</CardTitle>
                          <CardDescription>
                            Update drug and alcohol test information
                          </CardDescription>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowEditForm(false);
                            refreshSelectedDrugAlcoholAfterEdit();
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="overflow-y-auto max-h-[calc(100%-120px)] p-6">
                      <DrugAlcoholIssueForm
                        partyId={partyId}
                        drugAlcoholIssue={selectedDrugAlcohol}
                        onSuccess={() => {
                          setShowEditForm(false);
                          refreshSelectedDrugAlcoholAfterEdit();
                        }}
                        onCancel={() => {
                          setShowEditForm(false);
                          refreshSelectedDrugAlcoholAfterEdit();
                        }}
                      />
                    </CardContent>
                  </>
                ) : selectedDrugAlcohol ? (
                  <>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            {selectedDrugAlcohol.issue.title}
                          </CardTitle>
                          <CardDescription>
                            Drug and alcohol test details and documentation
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => setShowEditForm(true)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="overflow-y-auto max-h-[calc(100%-120px)] p-6">
                      <div className="space-y-6">
                        {/* Test Information */}
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-4">
                            Test Information
                          </h3>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">Test Types:</span>
                              <div className="flex gap-2 mt-1">
                                {selectedDrugAlcohol.isDrug && (
                                  <Badge variant="secondary">Drug Test</Badge>
                                )}
                                {selectedDrugAlcohol.isAlcohol && (
                                  <Badge variant="secondary">Alcohol Test</Badge>
                                )}
                              </div>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Reason:</span>
                              <p className="text-gray-900">
                                {selectedDrugAlcohol.reason
                                  ? REASON_LABELS[selectedDrugAlcohol.reason] ||
                                    selectedDrugAlcohol.reason
                                  : "Not specified"}
                              </p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Agency:</span>
                              <p className="text-gray-900">
                                {selectedDrugAlcohol.agency
                                  ? AGENCY_LABELS[selectedDrugAlcohol.agency] ||
                                    selectedDrugAlcohol.agency
                                  : "Not specified"}
                              </p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Result:</span>
                              <p
                                className={`font-medium ${
                                  selectedDrugAlcohol.result === "Positive"
                                    ? "text-red-600"
                                    : selectedDrugAlcohol.result === "Negative"
                                      ? "text-green-600"
                                      : "text-gray-900"
                                }`}
                              >
                                {selectedDrugAlcohol.result?.replace("_", " ") || "Pending"}
                              </p>
                            </div>
                            {selectedDrugAlcohol.substance && (
                              <div>
                                <span className="font-medium text-gray-700">Substance:</span>
                                <p className="text-gray-900">{selectedDrugAlcohol.substance}</p>
                              </div>
                            )}
                            {selectedDrugAlcohol.specimenNumber && (
                              <div>
                                <span className="font-medium text-gray-700">Specimen Number:</span>
                                <p className="text-gray-900">
                                  {selectedDrugAlcohol.specimenNumber}
                                </p>
                              </div>
                            )}
                            {selectedDrugAlcohol.lab && (
                              <div>
                                <span className="font-medium text-gray-700">Laboratory:</span>
                                <p className="text-gray-900">{selectedDrugAlcohol.lab}</p>
                              </div>
                            )}
                            {selectedDrugAlcohol.accreditedBy && (
                              <div>
                                <span className="font-medium text-gray-700">Accredited By:</span>
                                <p className="text-gray-900">{selectedDrugAlcohol.accreditedBy}</p>
                              </div>
                            )}
                            {selectedDrugAlcohol.clinic && (
                              <div>
                                <span className="font-medium text-gray-700">Clinic:</span>
                                <p className="text-gray-900">
                                  {typeof selectedDrugAlcohol.clinic === "string"
                                    ? selectedDrugAlcohol.clinic
                                    : JSON.stringify(selectedDrugAlcohol.clinic)}
                                </p>
                              </div>
                            )}
                            <div>
                              <span className="font-medium text-gray-700">Status:</span>
                              <Badge
                                variant={
                                  selectedDrugAlcohol.issue.status === "active"
                                    ? "default"
                                    : "secondary"
                                }
                                className="ml-2"
                              >
                                {selectedDrugAlcohol.issue.status}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Add-Ons Section */}
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-gray-900">Add-Ons</h3>
                            <Button size="sm" onClick={() => setShowAddonModal(true)}>
                              <Plus className="h-4 w-4 mr-2" />
                              Add Add-On
                            </Button>
                          </div>
                          <UnifiedAddonDisplay
                            items={attachments.map((a) => ({
                              id: a.id,
                              attachmentType:
                                a.attachmentType || (a.noteContent ? "note" : a.filePath ? "url" : "attachment"),
                              fileName: a.fileName,
                              description: a.description,
                              noteContent: a.noteContent,
                              url: a.filePath,
                              fileType: a.fileType,
                              fileSize: a.fileSize,
                              createdAt: a.createdAt,
                              updatedAt: a.updatedAt,
                              tags: a.tags,
                              status: a.status,
                            }))}
                            availableTypes={UNIFIED_ADDON_CONFIGURATIONS.drugalcohol.modal.availableTypes}
                            config={{
                              showSearch: true,
                              showTypeFilter: true,
                              allowCreate: false,
                              emptyStateText: "No add-ons yet",
                            }}
                            onViewClick={(item) => {
                              if (item.url) window.open(item.url, "_blank", "noopener,noreferrer");
                            }}
                            onDownloadClick={(item) => {
                              if (item.url) window.open(item.url, "_blank", "noopener,noreferrer");
                            }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-center">
                    <div>
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Select a Test Record
                      </h3>
                      <p className="text-gray-600">Choose a test from the list to view details</p>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </AppLayout>

      {/* Unified Add-On Modal */}
      <UnifiedAddonModal
        isOpen={showAddonModal}
        issueId={selectedDrugAlcohol?.issue.id || ""}
        onSuccess={handleAddAddonSuccess}
        onClose={() => setShowAddonModal(false)}
        issueType="drugalcohol"
        availableTypes={UNIFIED_ADDON_CONFIGURATIONS.drugalcohol.modal.availableTypes}
        modalTitle={UNIFIED_ADDON_CONFIGURATIONS.drugalcohol.modal.modalTitle}
        modalDescription={UNIFIED_ADDON_CONFIGURATIONS.drugalcohol.modal.modalDescription}
      />
    </>
  );
}
