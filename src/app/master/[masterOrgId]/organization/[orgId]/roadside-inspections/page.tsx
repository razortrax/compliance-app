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
import { EmptyState } from "@/components/ui/empty-state";
import { ActivityLog } from "@/components/ui/activity-log";
import EnhancedRoadsideInspectionForm from "@/components/roadside_inspections/enhanced-roadside-inspection-form";
import ViolationGroupsWithCAFGeneration from "@/components/cafs/violation-groups-with-caf-generation";
import CAFDetailModal from "@/components/cafs/caf-detail-modal";
import { format } from "date-fns";
import {
  ShieldCheck,
  Plus,
  Calendar,
  MapPin,
  AlertTriangle,
  User,
  Badge as BadgeIcon,
  FileText,
} from "lucide-react";

interface Incident {
  id: string;
  incidentType: "ROADSIDE_INSPECTION";
  incidentDate: Date;
  incidentTime?: string;
  officerName: string;
  agencyName?: string;
  officerBadge?: string;
  reportNumber?: string;
  locationAddress?: string;
  locationCity?: string;
  locationState?: string;
  roadsideData?: any;
  equipment: Array<{
    id: string;
    unitNumber: number;
    make?: string;
    model?: string;
    plateNumber?: string;
    unitType?: string;
  }>;
  violations: Array<{
    id: string;
    violationCode: string;
    description: string;
    outOfService: boolean;
    severity?: string;
    unitNumber?: number;
  }>;
  issue: {
    id: string;
    title: string;
    status: string;
    priority: string;
    createdAt: Date;
    partyId?: string;
  };
}

interface ContextData {
  masterOrg: { id: string; name: string };
  organization: { id: string; name: string };
  incidents: Incident[];
}

export default function RoadsideInspectionsPage() {
  const params = useParams();
  const masterOrgId = params.masterOrgId as string;
  const orgId = params.orgId as string;

  // ⚠️ CRITICAL: Gold Standard State Management (exact copy from Training)
  const [data, setData] = useState<ContextData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // CAF Generation State
  const [createdCAFsInSession, setCreatedCAFsInSession] = useState<string[]>([]);
  const [selectedCAFId, setSelectedCAFId] = useState<string | null>(null);

  // ⚠️ CRITICAL: Data Fetching (exact pattern from Training)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/master/${masterOrgId}/organization/${orgId}/roadside-inspections`,
        );

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Organization not found");
          }
          throw new Error(`Failed to fetch roadside inspections: ${response.status}`);
        }

        const result = await response.json();
        setData(result);

        // Auto-select first incident if available
        if (result.incidents && result.incidents.length > 0 && !selectedIncident) {
          setSelectedIncident(result.incidents[0]);
        }
      } catch (err) {
        console.error("Error fetching roadside inspections:", err);
        setError(err instanceof Error ? err.message : "Failed to load roadside inspections");
      } finally {
        setLoading(false);
      }
    };

    const fetchUserRole = async () => {
      try {
        const role = await getUserRole();
        setUserRole(role);
      } catch (error) {
        console.error("Error fetching user role:", error);
      }
    };

    if (masterOrgId && orgId) {
      fetchData();
      fetchUserRole();
    }
  }, [masterOrgId, orgId]);

  if (loading) {
    return (
      <AppLayout
        name="Loading..."
        topNav={buildStandardNavigation(masterOrgId, orgId, userRole || undefined)}
        className="p-6"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading roadside inspections...</div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout
        name="Error"
        topNav={buildStandardNavigation(masterOrgId, orgId, userRole || undefined)}
        className="p-6"
      >
        <div className="text-center py-8">
          <div className="text-red-600 mb-2">Error</div>
          <div className="text-gray-600">{error}</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      name={data?.masterOrg.name || "Fleetrax"}
      topNav={buildStandardNavigation(masterOrgId, orgId, userRole || undefined)}
      className="p-6"
    >
      {/* ⚠️ CRITICAL: EXACT LAYOUT STRUCTURE REQUIRED */}
      <div className="max-w-7xl mx-auto h-full">
        <div className="space-y-6">
          {/* Header Section - EXACT STRUCTURE */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <ShieldCheck className="h-6 w-6" />
                Roadside Inspections
              </h1>
              <p className="text-gray-600 mt-1">
                DOT roadside inspections for {data?.organization.name}
              </p>
            </div>

            {/* Button Group - RIGHT ALIGNED */}
            <div className="flex items-center gap-3">
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Add Inspection
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[700px]">
                  <DialogHeader>
                    <DialogTitle>Create Roadside Inspection</DialogTitle>
                    <DialogDescription>
                      Record a new DOT roadside inspection for this organization.
                    </DialogDescription>
                  </DialogHeader>
                  {/* TODO: Add UnifiedIncidentForm component */}
                  <div className="p-4 text-center text-gray-500">
                    Roadside Inspection form will be implemented here
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
                    <ShieldCheck className="h-5 w-5" />
                    Inspections ({data?.incidents.length || 0})
                  </CardTitle>
                  <CardDescription>Recent roadside inspections</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto">
                  {data?.incidents && data.incidents.length > 0 ? (
                    <div className="space-y-3">
                      {data.incidents.map((incident) => (
                        <div
                          key={incident.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedIncident?.id === incident.id
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                          }`}
                          onClick={() => setSelectedIncident(incident)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">
                                {format(new Date(incident.incidentDate), "MMM dd, yyyy")}
                              </div>
                              <div className="text-xs text-gray-600 truncate">
                                {incident.officerName}
                              </div>
                              {incident.locationCity && (
                                <div className="text-xs text-gray-500 truncate">
                                  {incident.locationCity}, {incident.locationState}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <Badge
                                variant={
                                  incident.issue.priority === "high" ? "destructive" : "secondary"
                                }
                                className="text-xs"
                              >
                                {incident.issue.status}
                              </Badge>
                              {incident.violations.some((v) => v.outOfService) && (
                                <Badge variant="destructive" className="text-xs">
                                  OOS
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={ShieldCheck}
                      title="No Inspections"
                      description="No roadside inspections recorded yet."
                    />
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Pane - EXACT STRUCTURE */}
            <div className="flex-1">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Inspection Details</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto">
                  {selectedIncident ? (
                    <div className="space-y-6">
                      {/* Inspection Summary */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Date & Time
                          </label>
                          <div className="mt-1">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span>
                                {format(new Date(selectedIncident.incidentDate), "MMMM dd, yyyy")}
                                {selectedIncident.incidentTime &&
                                  ` at ${selectedIncident.incidentTime}`}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Inspector
                          </label>
                          <div className="mt-1">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <span>{selectedIncident.officerName}</span>
                            </div>
                            {selectedIncident.officerBadge && (
                              <div className="flex items-center gap-2 mt-1">
                                <BadgeIcon className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-600">
                                  Badge #{selectedIncident.officerBadge}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {selectedIncident.agencyName && (
                          <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Agency
                            </label>
                            <div className="mt-1">{selectedIncident.agencyName}</div>
                          </div>
                        )}

                        {selectedIncident.reportNumber && (
                          <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Report Number
                            </label>
                            <div className="mt-1 flex items-center gap-2">
                              <FileText className="h-4 w-4 text-gray-400" />
                              {selectedIncident.reportNumber}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Location */}
                      {(selectedIncident.locationAddress || selectedIncident.locationCity) && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Location
                          </label>
                          <div className="mt-1 flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                            <div>
                              {selectedIncident.locationAddress && (
                                <div>{selectedIncident.locationAddress}</div>
                              )}
                              {selectedIncident.locationCity && (
                                <div>
                                  {selectedIncident.locationCity}, {selectedIncident.locationState}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Equipment Involved */}
                      {selectedIncident.equipment.length > 0 && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Equipment Involved
                          </label>
                          <div className="mt-2 space-y-2">
                            {selectedIncident.equipment.map((eq) => (
                              <div
                                key={eq.id}
                                className="flex items-center justify-between p-2 bg-gray-50 rounded"
                              >
                                <div>
                                  <div className="font-medium">Unit {eq.unitNumber}</div>
                                  {(eq.make || eq.model) && (
                                    <div className="text-sm text-gray-600">
                                      {eq.make} {eq.model}
                                    </div>
                                  )}
                                </div>
                                {eq.plateNumber && (
                                  <Badge variant="outline">{eq.plateNumber}</Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Violations */}
                      {selectedIncident.violations.length > 0 && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Violations ({selectedIncident.violations.length})
                          </label>
                          <div className="mt-2 space-y-2">
                            {selectedIncident.violations.map((violation) => (
                              <div key={violation.id} className="p-3 border rounded-lg">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                                        {violation.violationCode}
                                      </code>
                                      {violation.outOfService && (
                                        <Badge variant="destructive" className="text-xs">
                                          <AlertTriangle className="h-3 w-3 mr-1" />
                                          OOS
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-700 mt-1">
                                      {violation.description}
                                    </p>
                                    {violation.unitNumber && (
                                      <p className="text-xs text-gray-500 mt-1">
                                        Unit {violation.unitNumber}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* CAF Generation and Management */}
                      {selectedIncident.violations && selectedIncident.violations.length > 0 && (
                        <div>
                          <ViolationGroupsWithCAFGeneration
                            incident={{ id: selectedIncident.id }}
                            violations={selectedIncident.violations}
                            organizationId={orgId}
                            onCAFCreated={(caf) => {
                              if (caf?.id) setCreatedCAFsInSession((prev) => [...prev, caf.id]);
                            }}
                            onCAFClick={(caf) => setSelectedCAFId(caf.id)}
                          />
                        </div>
                      )}

                      {/* Activity Log */}
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Activity Log
                        </label>
                        <div className="mt-2">
                          <ActivityLog issueId={selectedIncident.issue.id} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <EmptyState
                      icon={ShieldCheck}
                      title="No Inspection Selected"
                      description="Select an inspection from the list to view details."
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* CAF Detail Modal */}
      <CAFDetailModal cafId={selectedCAFId ?? undefined} onClose={() => setSelectedCAFId(null)} />
    </AppLayout>
  );
}
