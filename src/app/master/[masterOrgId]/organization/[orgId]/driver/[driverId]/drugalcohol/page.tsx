"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppLayout } from "@/components/layouts/app-layout";
import { buildStandardDriverNavigation } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DrugAlcoholIssueForm from "@/components/drugalcohol_issues/drugalcohol-issue-form";
import { ActivityLog } from "@/components/ui/activity-log";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Edit,
  Plus,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  Shield,
  TestTubes,
} from "lucide-react";
import { format } from "date-fns";
import { ActivityLog } from "@/components/ui/activity-log";

interface DrugAlcoholTest {
  id: string;
  result: string;
  substance?: string | null;
  lab?: string | null;
  accreditedBy?: string | null;
  reason: string;
  agency: string;
  specimenNumber?: string | null;
  isDrug: boolean;
  isAlcohol: boolean;
  clinic?: any;
  notes?: string | null;
  createdAt: string;
  issue: {
    id: string;
    title: string;
    description?: string;
    status: string;
    priority: string;
  };
}

interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  licenseNumber?: string;
  party?: {
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
  driver: Driver;
  drugAlcoholTests: DrugAlcoholTest[];
}

export default function MasterDriverDrugAlcoholPage() {
  const params = useParams();
  const router = useRouter();
  const masterOrgId = params.masterOrgId as string;
  const orgId = params.orgId as string;
  const driverId = params.driverId as string;

  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTest, setSelectedTest] = useState<DrugAlcoholTest | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [showAddAddonModal, setShowAddAddonModal] = useState(false);

  // URL-driven data loading - Gold Standard pattern! 🚀
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Single URL-driven API call with all contextual data pre-filtered!
        const [drugAlcoholResult, orgsResult] = await Promise.allSettled([
          fetch(`/api/master/${masterOrgId}/organization/${orgId}/driver/${driverId}/drugalcohol`),
          fetch("/api/organizations"), // Still need for org selector
        ]);

        // Handle drug & alcohol data (primary)
        if (drugAlcoholResult.status === "fulfilled" && drugAlcoholResult.value.ok) {
          const pageData: PageData = await drugAlcoholResult.value.json();
          setData(pageData);
          console.log("✅ URL-driven drug & alcohol API success!");
          console.log(
            `🧪 Loaded ${pageData.drugAlcoholTests.length} test records for ${pageData.driver.firstName} ${pageData.driver.lastName}`,
          );
        } else {
          const error =
            drugAlcoholResult.status === "fulfilled"
              ? await drugAlcoholResult.value.text()
              : drugAlcoholResult.reason;
          throw new Error(`Failed to fetch drug & alcohol data: ${error}`);
        }

        // Handle organizations data (secondary)
        if (orgsResult.status === "fulfilled" && orgsResult.value.ok) {
          const orgs = await orgsResult.value.json();
          setOrganizations(orgs);
        }
      } catch (err) {
        console.error("❌ Drug & alcohol data fetch error:", err);
        setError(err instanceof Error ? err.message : "Failed to load drug & alcohol data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [masterOrgId, orgId, driverId]);

  // Get result status for display
  const getResultStatus = (test: DrugAlcoholTest) => {
    if (test.result === "Negative") {
      return {
        status: "pass",
        badge: (
          <Badge className="flex items-center gap-1 bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3" />
            Negative
          </Badge>
        ),
      };
    } else if (test.result === "Positive") {
      return {
        status: "fail",
        badge: (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Positive
          </Badge>
        ),
      };
    } else if (test.result === "Negative_Dilute") {
      return {
        status: "warning",
        badge: (
          <Badge className="flex items-center gap-1 bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="h-3 w-3" />
            Negative Dilute
          </Badge>
        ),
      };
    }

    return {
      status: "unknown",
      badge: (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      ),
    };
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddTest = async (formData: any) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/drugalcohol_issues", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          partyId: data?.driver.party?.id,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create test: ${errorText}`);
      }

      const newTest = await response.json();

      // Refresh the data
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          drugAlcoholTests: [newTest, ...prev.drugAlcoholTests],
        };
      });
      setIsAddDialogOpen(false);
      setSelectedTest(newTest);
    } catch (error) {
      console.error("Error creating test:", error);
      alert(error instanceof Error ? error.message : "An error occurred while creating the test");
    } finally {
      setIsSubmitting(false);
    }
  };

  const refreshAttachments = async () => {
    if (selectedTest?.issue.id) {
      try {
        const response = await fetch(`/api/attachments?issueId=${selectedTest.issue.id}`);
        if (response.ok) {
          const data = await response.json();
          setAttachments(data);
        }
      } catch (error) {
        console.error("Error fetching attachments:", error);
      }
    }
  };

  useEffect(() => {
    if (selectedTest?.issue.id) {
      refreshAttachments();
    } else {
      setAttachments([]);
    }
  }, [selectedTest]);

  if (loading) {
    return (
      <AppLayout name="Loading..." topNav={[]} className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AppLayout>
    );
  }

  if (error || !data) {
    return (
      <AppLayout name="FleeTrax" topNav={[]} className="p-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Data</h2>
          <p className="text-gray-600">{error}</p>
          <Button onClick={() => router.refresh()} className="mt-4">
            Try Again
          </Button>
        </div>
      </AppLayout>
    );
  }

  // Build standard navigation
  const topNav = buildStandardDriverNavigation(driverId || "", masterOrgId || "", "drivers");

  return (
    <AppLayout name={data.masterOrg.name} topNav={topNav} className="p-6">
      <div className="max-w-7xl mx-auto h-full">
        {/* Driver and Drug & Alcohol Header - Gold Standard */}
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <p className="text-sm text-gray-600">{data.organization.name}</p>
            <h1 className="text-2xl font-bold text-gray-900">
              {data.driver.firstName} {data.driver.lastName} - Drug & Alcohol Testing
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>Tests: {data.drugAlcoholTests.length}</span>
            </div>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Test
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Drug & Alcohol Test</DialogTitle>
              </DialogHeader>
              <div className="px-1">
                <DrugAlcoholIssueForm
                  partyId={data.driver.party?.id}
                  onSuccess={handleAddTest}
                  onCancel={() => setIsAddDialogOpen(false)}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Split Pane Layout - Gold Standard */}
        <div className="flex gap-6 h-[calc(100vh-200px)]">
          {/* Left Pane - Tests List (300px) */}
          <div className="w-[300px] flex-shrink-0">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTubes className="h-5 w-5" />
                  Drug & Alcohol Tests
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
                  {data.drugAlcoholTests.length > 0 ? (
                    <div className="space-y-1">
                      {data.drugAlcoholTests.map((test) => {
                        const resultStatus = getResultStatus(test);
                        const isSelected = selectedTest?.id === test.id;

                        return (
                          <div
                            key={test.id}
                            className={`p-3 cursor-pointer border-l-4 transition-colors ${
                              isSelected
                                ? "bg-blue-50 border-l-blue-500"
                                : "hover:bg-gray-50 border-l-transparent"
                            }`}
                            onClick={() => setSelectedTest(test)}
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium text-sm truncate">{test.issue.title}</h4>
                                {resultStatus.badge}
                              </div>

                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <TestTubes className="h-3 w-3" />
                                {test.isDrug && test.isAlcohol
                                  ? "D&A"
                                  : test.isDrug
                                    ? "Drug"
                                    : test.isAlcohol
                                      ? "Alcohol"
                                      : "Test"}
                                <span>•</span>
                                <Clock className="h-3 w-3" />
                                {format(new Date(test.createdAt), "MMM d")}
                              </div>

                              {test.reason && (
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <Shield className="h-3 w-3" />
                                  {test.reason.replace("_", " ")}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-gray-500">
                      <TestTubes className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <h4 className="font-medium text-gray-900 mb-1">No tests yet</h4>
                      <p className="text-sm">Add your first drug & alcohol test</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Pane - Test Details */}
          <div className="flex-1">
            <Card className="h-full">
              {selectedTest ? (
                <div className="h-full flex flex-col">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <TestTubes className="h-5 w-5" />
                        Test Details
                      </CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedTest(null)}>
                        ✕
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 overflow-y-auto space-y-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900">{selectedTest.issue.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {selectedTest.issue.description}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Result:</span>
                          <div className="mt-1">{getResultStatus(selectedTest).badge}</div>
                        </div>

                        <div>
                          <span className="font-medium text-gray-700">Date:</span>
                          <p className="text-gray-600 mt-1">
                            {format(new Date(selectedTest.createdAt), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>

                      {selectedTest.substance && (
                        <div>
                          <span className="font-medium text-gray-700">Substance:</span>
                          <p className="text-gray-600">{selectedTest.substance}</p>
                        </div>
                      )}

                      {selectedTest.lab && (
                        <div>
                          <span className="font-medium text-gray-700">Laboratory:</span>
                          <p className="text-gray-600">{selectedTest.lab}</p>
                        </div>
                      )}

                      {selectedTest.specimenNumber && (
                        <div>
                          <span className="font-medium text-gray-700">Specimen #:</span>
                          <p className="text-gray-600">{selectedTest.specimenNumber}</p>
                        </div>
                      )}
                    </div>

                    {/* Add-Ons */}
                    {selectedTest?.issue?.id && (
                      <ActivityLog
                        issueId={selectedTest.issue.id}
                        allowedTypes={["note", "communication", "url", "credential", "attachment", "task"]}
                        compact={false}
                        maxHeight="400px"
                      />
                    )}
                  </CardContent>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <TestTubes className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a test</h3>
                    <p className="text-sm">Choose a test from the list to view details</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
      {/* Unified Add-On Modal removed; ActivityLog provides add functionality */}
    </AppLayout>
  );
}
