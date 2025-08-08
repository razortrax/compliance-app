"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layouts/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, FileText, AlertTriangle, Clock, Shield, Car, Eye, Truck } from "lucide-react";
import { ActivityLog } from "@/components/ui/activity-log";
import { EmptyState } from "@/components/ui/empty-state";
import { format } from "date-fns";
import { useMasterOrg } from "@/hooks/use-master-org";
import { buildStandardNavigation, getUserRole } from "@/lib/utils";
import { EnhancedAccidentForm } from "@/components/accidents/enhanced-accident-form";

interface Accident {
  id: string;
  reportNumber?: string;
  incidentDate: string;
  incidentTime?: string;
  officerName: string;
  agencyName: string;
  officerBadge?: string;
  locationAddress?: string;
  locationCity?: string;
  locationState?: string;
  locationZip?: string;
  isFatality: boolean;
  isReportable: boolean;
  isInjury: boolean;
  isTow: boolean;
  isCitation: boolean;
  needsReport: boolean;
  needsDrugTest: boolean;
  numberOfFatalities?: number;
  numberOfVehicles?: number;
  accidentDescription?: string;
  weatherConditions?: string;
  roadConditions?: string;
  trafficConditions?: string;
  issue: {
    id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    party: {
      id: string;
      equipment?: {
        vehicleType: string;
        make?: string;
        model?: string;
        year?: number;
        vinNumber?: string;
        plateNumber?: string;
      };
    };
  };
  equipment: Array<{
    id: string;
    unitNumber: number;
    unitType?: string;
    make?: string;
    model?: string;
    year?: number;
    plateNumber?: string;
    vin?: string;
  }>;
  violations: Array<{
    id: string;
    violationCode: string;
    description: string;
    outOfService: boolean;
    severity?: string;
    unitNumber?: number;
    violationType?: string;
    inspectorComments?: string;
  }>;
}

interface Equipment {
  id: string;
  vehicleType: string;
  make?: string;
  model?: string;
  year?: number;
  vinNumber?: string;
  plateNumber?: string;
  party?: {
    id: string;
  };
}

interface AccidentPageData {
  masterOrg: { id: string; name: string };
  organization: { id: string; name: string };
  equipment: Equipment;
  accidents: Accident[];
}

export default function EquipmentAccidentsPage({
  params,
}: {
  params: { masterOrgId: string; orgId: string; equipmentId: string };
}) {
  const { masterOrgId, orgId, equipmentId } = params;

  const [data, setData] = useState<AccidentPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAccident, setSelectedAccident] = useState<Accident | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Smart accident status function - Equipment Gold Standard (Accident-specific)
  const getAccidentStatus = (accident: Accident) => {
    if (accident.isFatality) {
      return {
        status: "fatality",
        badge: (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Fatality
          </Badge>
        ),
      };
    } else if (accident.isInjury) {
      return {
        status: "injury",
        badge: (
          <Badge
            variant="outline"
            className="flex items-center gap-1 border-orange-500 text-orange-600"
          >
            <AlertTriangle className="h-3 w-3" />
            Injury
          </Badge>
        ),
      };
    } else if (accident.isTow) {
      return {
        status: "tow",
        badge: (
          <Badge
            variant="outline"
            className="flex items-center gap-1 border-yellow-500 text-yellow-600"
          >
            <Truck className="h-3 w-3" />
            Tow Required
          </Badge>
        ),
      };
    } else {
      return {
        status: "minor",
        badge: (
          <Badge variant="secondary" className="flex items-center gap-1 bg-blue-100 text-blue-700">
            <Car className="h-3 w-3" />
            Minor Accident
          </Badge>
        ),
      };
    }
  };

  useEffect(() => {
    fetchData();
  }, [masterOrgId, orgId, equipmentId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/master/${masterOrgId}/organization/${orgId}/equipment/${equipmentId}/accidents`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch accidents");
      }

      const pageData = await response.json();
      setData(pageData);

      // Auto-select first accident if any
      if (pageData.accidents.length > 0) {
        setSelectedAccident(pageData.accidents[0]);
      }
    } catch (error) {
      console.error("Error fetching accidents:", error);
      setError(error instanceof Error ? error.message : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccident = async (formData: any) => {
    try {
      const response = await fetch(
        `/api/master/${masterOrgId}/organization/${orgId}/equipment/${equipmentId}/accidents`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create accident");
      }

      const newAccident = await response.json();

      // Refresh data
      await fetchData();

      // Select the new accident
      setSelectedAccident(newAccident);
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error("Error creating accident:", error);
      alert(
        `Failed to create accident: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  if (loading) {
    return (
      <AppLayout
        name={data?.masterOrg?.name || "Loading..."}
        sidebarMenu="equipment"
        className="p-6"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Clock className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Loading accidents...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout name={data?.masterOrg?.name || "Error"} sidebarMenu="equipment" className="p-6">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold mb-2">Failed to Load Accidents</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchData}>Try Again</Button>
        </div>
      </AppLayout>
    );
  }

  if (!data) {
    return (
      <AppLayout name="Not Found" sidebarMenu="equipment" className="p-6">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold mb-2">Equipment Not Found</h3>
          <p className="text-gray-600">The requested equipment could not be found.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      name={data.masterOrg.name}
      sidebarMenu="equipment"
      topNav={buildStandardNavigation(masterOrgId, orgId, equipmentId)}
      className="p-6"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Accidents</h1>
            <p className="text-gray-600 mt-1">
              {data.organization.name} • {data.equipment.make} {data.equipment.model} (
              {data.equipment.vehicleType})
            </p>
          </div>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-12 gap-6 h-[600px]">
          {/* Left Sidebar - Accidents List (300px) */}
          <div className="col-span-4 border-r border-gray-200 pr-6">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Accidents</h3>
                  <p className="text-sm text-gray-600">
                    <Badge variant="secondary">{data.accidents.length}</Badge>
                    {data.accidents.length === 1 ? " accident" : " accidents"}
                  </p>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create Accident Report</DialogTitle>
                    </DialogHeader>
                    <EnhancedAccidentForm
                      onSubmit={handleAddAccident}
                      onCancel={() => setIsAddDialogOpen(false)}
                      preSelectedEquipmentIds={[equipmentId]}
                      organizationId={orgId}
                      masterOrgId={masterOrgId}
                    />
                  </DialogContent>
                </Dialog>
              </div>

              {/* Accidents List */}
              <div className="space-y-2 overflow-y-auto">
                {data.accidents.length > 0 ? (
                  data.accidents.map((accident) => {
                    const statusInfo = getAccidentStatus(accident);
                    return (
                      <Card
                        key={accident.id}
                        className={`cursor-pointer transition-colors ${
                          selectedAccident?.id === accident.id
                            ? "ring-2 ring-blue-500 bg-blue-50"
                            : "hover:bg-gray-50"
                        }`}
                        onClick={() => setSelectedAccident(accident)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2 flex-1">
                              <AlertTriangle className="h-4 w-4 mt-0.5 text-gray-500" />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm truncate">
                                  {accident.reportNumber ||
                                    `Accident ${format(new Date(accident.incidentDate), "MMM d")}`}
                                </h4>
                                <p className="text-xs text-gray-600 mt-1">
                                  {format(new Date(accident.incidentDate), "MMM d, yyyy")}
                                  {accident.incidentTime && ` at ${accident.incidentTime}`}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                  {accident.officerName} - {accident.agencyName}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  {statusInfo.badge}
                                  {accident.violations.length > 0 && (
                                    <Badge variant="outline" className="text-xs">
                                      {accident.violations.length} violation
                                      {accident.violations.length !== 1 ? "s" : ""}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                ) : (
                  <EmptyState
                    icon={AlertTriangle}
                    title="No accidents"
                    description="This equipment has no recorded accidents"
                    action={{
                      label: "Add First Accident",
                      onClick: () => setIsAddDialogOpen(true),
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Right Content - Accident Details */}
          <div className="col-span-8">
            {selectedAccident ? (
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-6 w-6 mt-1 text-gray-500" />
                      <div>
                        <CardTitle className="text-xl">
                          {selectedAccident.reportNumber ||
                            `Accident ${format(new Date(selectedAccident.incidentDate), "MMM d, yyyy")}`}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {selectedAccident.officerName} - {selectedAccident.agencyName}
                        </CardDescription>
                        <div className="flex items-center gap-2 mt-2">
                          {getAccidentStatus(selectedAccident).badge}
                          <Badge variant="outline">
                            Issue #{selectedAccident.issue.id.slice(-6)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Accident Details */}
                  <div>
                    <h4 className="font-medium mb-3">Accident Details</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-500">Date & Time:</span>
                        <p>
                          {format(new Date(selectedAccident.incidentDate), "MMM d, yyyy")}
                          {selectedAccident.incidentTime && ` at ${selectedAccident.incidentTime}`}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-500">Reportable:</span>
                        <p>{selectedAccident.isReportable ? "Yes" : "No"}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-500">Vehicles Involved:</span>
                        <p>{selectedAccident.numberOfVehicles || "Not specified"}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-500">Drug Test Required:</span>
                        <p>{selectedAccident.needsDrugTest ? "Yes" : "No"}</p>
                      </div>
                    </div>

                    {/* Severity Indicators */}
                    <div className="mt-4">
                      <span className="font-medium text-gray-500 block mb-2">
                        Severity Indicators:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {selectedAccident.isFatality && (
                          <Badge variant="destructive">Fatality</Badge>
                        )}
                        {selectedAccident.isInjury && (
                          <Badge variant="outline" className="border-orange-500 text-orange-600">
                            Injury
                          </Badge>
                        )}
                        {selectedAccident.isTow && (
                          <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                            Tow Required
                          </Badge>
                        )}
                        {selectedAccident.isCitation && (
                          <Badge variant="outline">Citation Issued</Badge>
                        )}
                        {selectedAccident.needsReport && (
                          <Badge variant="outline">Report Required</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {selectedAccident.accidentDescription && (
                    <div>
                      <h4 className="font-medium mb-3">Description</h4>
                      <p className="text-sm bg-gray-50 p-3 rounded-lg">
                        {selectedAccident.accidentDescription}
                      </p>
                    </div>
                  )}

                  {/* Conditions */}
                  {(selectedAccident.weatherConditions ||
                    selectedAccident.roadConditions ||
                    selectedAccident.trafficConditions) && (
                    <div>
                      <h4 className="font-medium mb-3">Conditions</h4>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        {selectedAccident.weatherConditions && (
                          <div>
                            <span className="font-medium text-gray-500">Weather:</span>
                            <p>{selectedAccident.weatherConditions}</p>
                          </div>
                        )}
                        {selectedAccident.roadConditions && (
                          <div>
                            <span className="font-medium text-gray-500">Road:</span>
                            <p>{selectedAccident.roadConditions}</p>
                          </div>
                        )}
                        {selectedAccident.trafficConditions && (
                          <div>
                            <span className="font-medium text-gray-500">Traffic:</span>
                            <p>{selectedAccident.trafficConditions}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Location */}
                  {(selectedAccident.locationAddress || selectedAccident.locationCity) && (
                    <div>
                      <h4 className="font-medium mb-3">Location</h4>
                      <p className="text-sm">
                        {[
                          selectedAccident.locationAddress,
                          selectedAccident.locationCity,
                          selectedAccident.locationState,
                          selectedAccident.locationZip,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>
                  )}

                  {/* Equipment Involved */}
                  <div>
                    <h4 className="font-medium mb-3">Equipment Involved</h4>
                    <div className="space-y-2">
                      {selectedAccident.equipment.map((equipment) => (
                        <div key={equipment.id} className="p-3 border rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Truck className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">Unit {equipment.unitNumber}</span>
                            {equipment.unitType && (
                              <Badge variant="secondary">{equipment.unitType}</Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="font-medium text-gray-500">Vehicle:</span>
                              <p>
                                {[equipment.year, equipment.make, equipment.model]
                                  .filter(Boolean)
                                  .join(" ")}
                              </p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-500">Plate:</span>
                              <p>{equipment.plateNumber}</p>
                            </div>
                            {equipment.vin && (
                              <div className="col-span-2">
                                <span className="font-medium text-gray-500">VIN:</span>
                                <p className="font-mono text-xs">{equipment.vin}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Violations */}
                  {selectedAccident.violations.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">
                        Violations ({selectedAccident.violations.length})
                      </h4>
                      <div className="space-y-3">
                        {selectedAccident.violations.map((violation) => (
                          <div key={violation.id} className="p-3 border rounded-lg">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge
                                    variant={violation.outOfService ? "destructive" : "outline"}
                                  >
                                    {violation.violationCode}
                                  </Badge>
                                  {violation.severity && (
                                    <Badge variant="secondary">{violation.severity}</Badge>
                                  )}
                                  {violation.unitNumber && (
                                    <Badge variant="outline">Unit {violation.unitNumber}</Badge>
                                  )}
                                  {violation.outOfService && (
                                    <Badge variant="destructive">OUT OF SERVICE</Badge>
                                  )}
                                </div>
                                <p className="text-sm font-medium mb-1">{violation.description}</p>
                                {violation.inspectorComments && (
                                  <p className="text-sm text-gray-600 italic">
                                    Officer: {violation.inspectorComments}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Activity Log */}
                  <div>
                    <h4 className="font-medium mb-3">Activity Log</h4>
                    <ActivityLog
                      issueId={selectedAccident.id}
                      title="Accident Activity"
                      showAddButton={true}
                    />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <EmptyState
                icon={FileText}
                title="Select an Accident"
                description="Choose an accident from the list to view its details"
              />
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
