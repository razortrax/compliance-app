"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AppLayout } from "@/components/layouts/app-layout";
import { buildStandardNavigation, getUserRole } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ActivityLog } from "@/components/ui/activity-log";
import { MaintenanceIssueForm } from "@/components/maintenance/maintenance-issue-form";
import { ABScheduleReport } from "@/components/maintenance/ab-schedule-report";
import {
  Wrench,
  Plus,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  Settings,
  FileText,
  User,
  Edit,
  RotateCcw,
} from "lucide-react";
import { format } from "date-fns";

interface MaintenanceIssue {
  id: string;
  title: string;
  description?: string;
  maintenanceType: "A_SCHEDULE" | "B_SCHEDULE" | "CORRECTIVE" | "REPAIR" | "PREVENTIVE";
  sourceType: "ANNUAL_INSPECTION" | "ROADSIDE_INSPECTION" | "ROUTINE" | "ACCIDENT" | "OTHER";
  dueDate?: string;
  completedDate?: string;
  intervalDays?: number;
  intervalMiles?: number;
  inspectorName?: string;
  facilityName?: string;
  workDescription?: string;
  partsUsed?: any;
  laborHours?: number;
  cost?: number;
  status:
    | "SCHEDULED"
    | "OVERDUE"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "PARTIAL"
    | "DEFERRED"
    | "CANCELLED"
    | "ON_HOLD";
  result?: "COMPLETED" | "NO_WORK_NEEDED" | "ADDITIONAL_WORK_REQUIRED" | "FAILED_INSPECTION";
  dotCompliant: boolean;
  certificateNumber?: string;
  createdAt: string;
  updatedAt: string;
  issue: {
    id: string;
    title: string;
    description?: string;
    status: string;
    priority: string;
  };
}

interface Equipment {
  id: string;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  vin?: string | null;
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
  maintenanceIssues: MaintenanceIssue[];
}

export default function EquipmentMaintenanceIssuesPage() {
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
  const [showABSchedule, setShowABSchedule] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<MaintenanceIssue | null>(null);

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

      // For now, using mock data until the actual API is implemented
      const mockData: PageData = {
        masterOrg: { id: masterOrgId, name: "Compliance Inc" },
        organization: { id: orgId, name: "Test Organization" },
        equipment: {
          id: equipmentId,
          make: "Freightliner",
          model: "Cascadia",
          year: 2022,
          vin: "1FUJGHDV8NLAA1234",
          party: { id: "party_123" },
        },
        maintenanceIssues: [
          {
            id: "maint_001",
            title: "A-Schedule Maintenance",
            description: "Routine A-schedule maintenance including oil change and basic inspection",
            maintenanceType: "A_SCHEDULE",
            sourceType: "ROUTINE",
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            intervalDays: 90,
            intervalMiles: 25000,
            inspectorName: "Mike Johnson",
            facilityName: "Fleet Services Inc",
            workDescription: "Oil change, filter replacement, basic safety inspection",
            partsUsed: ["Engine oil", "Oil filter", "Air filter"],
            laborHours: 2.0,
            cost: 285.0,
            status: "SCHEDULED",
            dotCompliant: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            issue: {
              id: "issue_001",
              title: "A-Schedule Maintenance",
              description: "Routine maintenance",
              status: "Active",
              priority: "Medium",
            },
          },
          {
            id: "maint_002",
            title: "Brake Inspection Corrective Action",
            description: "Fix brake issues found during roadside inspection",
            maintenanceType: "CORRECTIVE",
            sourceType: "ROADSIDE_INSPECTION",
            completedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            inspectorName: "John Smith",
            facilityName: "ABC Truck Repair",
            workDescription: "Replaced worn brake pads and adjusted brake drums",
            partsUsed: ["Brake pads", "Brake hardware"],
            laborHours: 3.5,
            cost: 450.0,
            status: "COMPLETED",
            result: "COMPLETED",
            dotCompliant: true,
            certificateNumber: "CERT-2024-001",
            createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            issue: {
              id: "issue_002",
              title: "Brake Inspection Corrective Action",
              description: "Corrective action from roadside inspection",
              status: "Closed",
              priority: "High",
            },
          },
          {
            id: "maint_003",
            title: "B-Schedule Maintenance",
            description: "Comprehensive B-schedule maintenance and inspection",
            maintenanceType: "B_SCHEDULE",
            sourceType: "ROUTINE",
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            intervalDays: 180,
            intervalMiles: 50000,
            status: "SCHEDULED",
            dotCompliant: false,
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            issue: {
              id: "issue_003",
              title: "B-Schedule Maintenance",
              description: "Comprehensive maintenance",
              status: "Active",
              priority: "Medium",
            },
          },
        ],
      };

      setData(mockData);
    } catch (error) {
      console.error("Error fetching maintenance issues:", error);
      setError("Failed to load maintenance issues");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSuccess = () => {
    setShowAddForm(false);
    setShowEditForm(false);
    setSelectedIssue(null);
    fetchData();
  };

  const handleEdit = (issue: MaintenanceIssue) => {
    setSelectedIssue(issue);
    setShowEditForm(true);
  };

  const handleGenerateABSchedule = () => {
    setShowABSchedule(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return "bg-blue-100 text-blue-800";
      case "OVERDUE":
        return "bg-red-100 text-red-800";
      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "PARTIAL":
        return "bg-orange-100 text-orange-800";
      case "DEFERRED":
        return "bg-purple-100 text-purple-800";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800";
      case "ON_HOLD":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getMaintenanceTypeIcon = (type: string) => {
    switch (type) {
      case "A_SCHEDULE":
      case "B_SCHEDULE":
        return Calendar;
      case "CORRECTIVE":
        return AlertTriangle;
      case "REPAIR":
        return Wrench;
      case "PREVENTIVE":
        return CheckCircle;
      default:
        return Settings;
    }
  };

  if (isLoading) {
    return (
      <AppLayout
        name="Fleetrax"
        topNav={buildStandardNavigation(masterOrgId, orgId, userRole || undefined)}
        sidebarMenu="equipment"
        equipmentId={equipmentId}
        masterOrgId={masterOrgId}
        currentOrgId={orgId}
        className="p-6"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading maintenance issues...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout
        name="Fleetrax"
        topNav={buildStandardNavigation(masterOrgId, orgId, userRole || undefined)}
        sidebarMenu="equipment"
        equipmentId={equipmentId}
        masterOrgId={masterOrgId}
        currentOrgId={orgId}
        className="p-6"
      >
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">Failed to Load Maintenance Issues</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchData}>Try Again</Button>
        </div>
      </AppLayout>
    );
  }

  const equipmentName =
    `${data?.equipment.make || "Equipment"} ${data?.equipment.model || ""} ${data?.equipment.year || ""}`.trim();

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
      <div className="flex flex-col h-full max-w-7xl mx-auto">
        {/* Header Section - EXACT STRUCTURE */}
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <div className="space-y-1">
            <p className="text-sm text-gray-600">{data?.organization.name}</p>
            <h1 className="text-2xl font-bold text-gray-900">
              {equipmentName} - Maintenance Issues
            </h1>
            <p className="text-sm text-gray-500">Equipment maintenance records and scheduling</p>
          </div>

          {/* Button Group - RIGHT ALIGNED */}
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => handleGenerateABSchedule()}>
              <FileText className="h-4 w-4 mr-2" />
              Generate A&B Schedule
            </Button>

            <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Maintenance Issue
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Maintenance Issue</DialogTitle>
                  <DialogDescription>
                    Create a new maintenance record for this equipment.
                  </DialogDescription>
                </DialogHeader>
                <div className="px-1">
                  <MaintenanceIssueForm
                    equipmentId={equipmentId}
                    onSubmit={handleFormSuccess}
                    onCancel={() => setShowAddForm(false)}
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Split Pane Layout - FIXED HEIGHT CONSTRAINTS */}
        <div className="flex gap-6 flex-1 min-h-0">
          {/* Left Pane - EXACT STRUCTURE */}
          <div className="w-[300px] flex-shrink-0">
            <Card className="h-full flex flex-col">
              <CardHeader className="flex-shrink-0">
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Maintenance Issues ({data?.maintenanceIssues.length || 0})
                </CardTitle>
                <CardDescription>Scheduled and completed maintenance</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto min-h-0">
                {data?.maintenanceIssues && data.maintenanceIssues.length > 0 ? (
                  <div className="space-y-3">
                    {data.maintenanceIssues.map((issue) => {
                      const MaintenanceIcon = getMaintenanceTypeIcon(issue.maintenanceType);
                      return (
                        <div
                          key={issue.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedIssue?.id === issue.id
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                          }`}
                          onClick={() => setSelectedIssue(issue)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <MaintenanceIcon className="h-4 w-4 text-gray-500" />
                                <div className="font-medium text-sm truncate">{issue.title}</div>
                              </div>
                              <div className="text-xs text-gray-600">
                                {issue.maintenanceType.replace("_", " ")} •{" "}
                                {issue.sourceType.replace("_", " ")}
                              </div>
                              {issue.dueDate && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Due: {format(new Date(issue.dueDate), "MMM dd, yyyy")}
                                </div>
                              )}
                              {issue.completedDate && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Completed: {format(new Date(issue.completedDate), "MMM dd, yyyy")}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <Badge className={`text-xs ${getStatusColor(issue.status)}`}>
                                {issue.status.replace("_", " ")}
                              </Badge>
                              {issue.cost && (
                                <div className="text-xs text-gray-500">
                                  ${issue.cost.toFixed(2)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState
                    icon={Wrench}
                    title="No Maintenance Issues"
                    description="No maintenance records found for this equipment."
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Pane - FIXED HEIGHT CONSTRAINTS */}
          <div className="flex-1 min-w-0">
            <Card className="h-full flex flex-col">
              <CardHeader className="flex-shrink-0">
                <div className="flex items-center justify-between">
                  <CardTitle>Maintenance Details</CardTitle>
                  {selectedIssue && (
                    <Button variant="outline" size="sm" onClick={() => handleEdit(selectedIssue)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto min-h-0">
                {selectedIssue ? (
                  <div className="space-y-6 pb-6">
                    {/* Maintenance Summary */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Title
                        </label>
                        <div className="mt-1 text-lg font-semibold">{selectedIssue.title}</div>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Status
                        </label>
                        <div className="mt-1">
                          <Badge className={getStatusColor(selectedIssue.status)}>
                            {selectedIssue.status.replace("_", " ")}
                          </Badge>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Maintenance Type
                        </label>
                        <div className="mt-1 text-sm">
                          {selectedIssue.maintenanceType.replace("_", " ")}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Source
                        </label>
                        <div className="mt-1 text-sm">
                          {selectedIssue.sourceType.replace("_", " ")}
                        </div>
                      </div>

                      {selectedIssue.dueDate && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Due Date
                          </label>
                          <div className="mt-1 text-sm">
                            {format(new Date(selectedIssue.dueDate), "MMMM dd, yyyy")}
                          </div>
                        </div>
                      )}

                      {selectedIssue.completedDate && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Completed Date
                          </label>
                          <div className="mt-1 text-sm">
                            {format(new Date(selectedIssue.completedDate), "MMMM dd, yyyy")}
                          </div>
                        </div>
                      )}

                      {selectedIssue.cost && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Cost
                          </label>
                          <div className="mt-1 text-lg font-semibold text-green-600">
                            ${selectedIssue.cost.toFixed(2)}
                          </div>
                        </div>
                      )}

                      {selectedIssue.laborHours && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Labor Hours
                          </label>
                          <div className="mt-1 text-sm">{selectedIssue.laborHours} hours</div>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    {selectedIssue.description && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Description
                        </label>
                        <div className="mt-1 text-sm text-gray-900">
                          {selectedIssue.description}
                        </div>
                      </div>
                    )}

                    {/* Work Description */}
                    {selectedIssue.workDescription && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Work Performed
                        </label>
                        <div className="mt-1 text-sm text-gray-900">
                          {selectedIssue.workDescription}
                        </div>
                      </div>
                    )}

                    {/* Parts Used */}
                    {selectedIssue.partsUsed && selectedIssue.partsUsed.length > 0 && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Parts Used
                        </label>
                        <div className="mt-2">
                          <div className="flex flex-wrap gap-2">
                            {selectedIssue.partsUsed.map((part: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {part}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Inspector/Facility Info */}
                    {(selectedIssue.inspectorName || selectedIssue.facilityName) && (
                      <div className="grid grid-cols-2 gap-4">
                        {selectedIssue.inspectorName && (
                          <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Inspector/Technician
                            </label>
                            <div className="mt-1 text-sm">{selectedIssue.inspectorName}</div>
                          </div>
                        )}

                        {selectedIssue.facilityName && (
                          <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Facility
                            </label>
                            <div className="mt-1 text-sm">{selectedIssue.facilityName}</div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* DOT Compliance & Certificate */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          DOT Compliant
                        </label>
                        <div className="mt-1">
                          <Badge variant={selectedIssue.dotCompliant ? "default" : "destructive"}>
                            {selectedIssue.dotCompliant ? "Yes" : "No"}
                          </Badge>
                        </div>
                      </div>

                      {selectedIssue.certificateNumber && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Certificate Number
                          </label>
                          <div className="mt-1 text-sm font-mono">
                            {selectedIssue.certificateNumber}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Gold Standard Add Ons - CONTAINED WITHIN SCROLL */}
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold mb-4">Communications & Documentation</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <ActivityLog issueId={selectedIssue.issue.id} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    icon={Wrench}
                    title="Select a Maintenance Issue"
                    description="Choose a maintenance issue from the list to view its details."
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Maintenance Issue</DialogTitle>
            <DialogDescription>
              Update maintenance issue details and tracking information.
            </DialogDescription>
          </DialogHeader>
          <div className="px-1">
            {selectedIssue && (
              <MaintenanceIssueForm
                equipmentId={equipmentId}
                maintenanceIssue={selectedIssue as any}
                onSubmit={handleFormSuccess}
                onCancel={() => setShowEditForm(false)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* A&B Schedule Modal */}
      <Dialog open={showABSchedule} onOpenChange={setShowABSchedule}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>A&B Maintenance Schedule Report</DialogTitle>
            <DialogDescription>
              Generate and print the A&B maintenance schedule for this equipment.
            </DialogDescription>
          </DialogHeader>
          <div className="px-1">
            {data && (
              <ABScheduleReport
                equipment={data.equipment}
                organizationName={data.organization.name}
                onClose={() => setShowABSchedule(false)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
