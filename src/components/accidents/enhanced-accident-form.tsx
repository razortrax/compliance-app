"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Users,
  AlertTriangle,
  Shield,
  Car,
  Plus,
  X,
  Eye,
  Upload,
  MessageSquare,
} from "lucide-react";

interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  licenseNumber?: string;
  partyId?: string;
}

interface Equipment {
  id: string;
  unitNumber: string;
  make?: string;
  model?: string;
  year?: number;
  plateNumber?: string;
  vin?: string;
  unitType?: string;
}

interface Violation {
  code: string;
  violationCode?: string;
  description: string;
  type: string;
  severity: string;
  violationType?: string;
  unitNumber?: number;
  outOfService?: boolean;
  inspectorComments?: string;
}

interface AddonItem {
  id?: string;
  type: "note" | "attachment" | "url" | "photo";
  title: string;
  content?: string;
  fileName?: string;
  fileUrl?: string;
  url?: string;
  description?: string;
}

interface FormData {
  // Basic Information
  incidentDate: string;
  incidentTime: string;
  reportNumber: string;
  officerName: string;
  agencyName: string;
  officerBadge: string;

  // Location Information
  locationAddress: string;
  locationCity: string;
  locationState: string;
  locationZip: string;

  // Accident Classifications
  isFatality: boolean;
  isReportable: boolean;
  isInjury: boolean;
  isTow: boolean;
  isCitation: boolean;
  needsReport: boolean;
  needsDrugTest: boolean;

  // Additional Details
  numberOfFatalities?: number;
  numberOfVehicles?: number;
  accidentDescription: string;
  weatherConditions: string;
  roadConditions: string;
  trafficConditions: string;

  // Parties Involved
  primaryDriverId: string;
  selectedEquipmentIds: string[];

  // Violations
  violations: Violation[];

  // Addons - The important section!
  addons: AddonItem[];
}

interface EnhancedAccidentFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  preSelectedDriverId?: string;
  preSelectedEquipmentIds?: string[];
  organizationId: string;
  masterOrgId: string;
}

export function EnhancedAccidentForm({
  onSubmit,
  onCancel,
  isSubmitting = false,
  preSelectedDriverId,
  preSelectedEquipmentIds = [],
  organizationId,
  masterOrgId,
}: EnhancedAccidentFormProps) {
  const [formData, setFormData] = useState<FormData>({
    incidentDate: new Date().toISOString().split("T")[0], // Default to today
    incidentTime: "",
    reportNumber: "",
    officerName: "",
    agencyName: "",
    officerBadge: "",
    locationAddress: "",
    locationCity: "",
    locationState: "",
    locationZip: "",
    isFatality: false,
    isReportable: false,
    isInjury: false,
    isTow: false,
    isCitation: false,
    needsReport: false,
    needsDrugTest: false,
    numberOfFatalities: undefined,
    numberOfVehicles: undefined,
    accidentDescription: "",
    weatherConditions: "",
    roadConditions: "",
    trafficConditions: "",
    primaryDriverId: preSelectedDriverId || "",
    selectedEquipmentIds: preSelectedEquipmentIds,
    violations: [],
    addons: [],
  });

  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([]);
  const [availableEquipment, setAvailableEquipment] = useState<Equipment[]>([]);
  const [violationSearch, setViolationSearch] = useState("");
  const [driverSearch, setDriverSearch] = useState("");
  const [equipmentSearch, setEquipmentSearch] = useState("");
  const [availableViolations, setAvailableViolations] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("basic");

  // New addon form state
  const [newAddon, setNewAddon] = useState<Partial<AddonItem>>({
    type: "note",
    title: "",
    content: "",
  });
  const [showAddAddon, setShowAddAddon] = useState(false);

  // Load drivers and equipment on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch drivers
        const driversResponse = await fetch(
          `/api/master/${masterOrgId}/organization/${organizationId}/drivers`,
        );
        if (driversResponse.ok) {
          const driversData = await driversResponse.json();
          const drivers =
            driversData.drivers?.map((driver: any) => ({
              id: driver.id,
              firstName: driver.firstName,
              lastName: driver.lastName,
              licenseNumber: driver.licenseNumber,
              partyId: driver.partyId,
            })) || [];
          setAvailableDrivers(drivers);

          // Set the preselected driver if provided
          if (preSelectedDriverId && formData.primaryDriverId !== preSelectedDriverId) {
            setFormData((prev) => ({
              ...prev,
              primaryDriverId: preSelectedDriverId,
            }));
          }
        }

        // Fetch equipment
        const equipmentResponse = await fetch(
          `/api/master/${masterOrgId}/organization/${organizationId}/equipment`,
        );
        if (equipmentResponse.ok) {
          const equipmentData = await equipmentResponse.json();
          const equipment =
            equipmentData.equipment?.map((eq: any) => ({
              id: eq.id,
              unitNumber: eq.unitNumber,
              make: eq.make,
              model: eq.model,
              year: eq.year,
              plateNumber: eq.plateNumber,
              vin: eq.vin,
              unitType: eq.unitType,
            })) || [];
          setAvailableEquipment(equipment);
        }
      } catch (error) {
        console.error("Error fetching form data:", error);
      }
    };

    fetchData();
  }, [masterOrgId, organizationId]);

  // Search violations using real API
  useEffect(() => {
    const searchViolations = async () => {
      if (violationSearch.length >= 2) {
        try {
          const response = await fetch(
            `/api/violations/search?q=${encodeURIComponent(violationSearch)}`,
          );
          if (response.ok) {
            const violations = await response.json();
            setAvailableViolations(violations);
          } else {
            setAvailableViolations([]);
          }
        } catch (error) {
          console.error("Error searching violations:", error);
          setAvailableViolations([]);
        }
      } else {
        setAvailableViolations([]);
      }
    };

    const timeoutId = setTimeout(searchViolations, 300); // Debounce search
    return () => clearTimeout(timeoutId);
  }, [violationSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Debug form data
    console.log("Form validation - current formData:", formData);

    // Validation
    const missingFields = [];
    if (!formData.incidentDate) missingFields.push("Accident Date");
    if (!formData.primaryDriverId) missingFields.push("Primary Driver");
    if (!formData.officerName) missingFields.push("Officer Name");
    if (!formData.agencyName) missingFields.push("Agency Name");

    if (missingFields.length > 0) {
      console.log("Missing fields:", missingFields);
      alert(`Please fill in the following required fields:\n• ${missingFields.join("\n• ")}`);
      return;
    }

    // Transform data for submission
    const submissionData = {
      incidentType: "ACCIDENT",
      incidentDate: formData.incidentDate,
      incidentTime: formData.incidentTime,
      officerName: formData.officerName,
      agencyName: formData.agencyName,
      officerBadge: formData.officerBadge,
      reportNumber: formData.reportNumber,
      locationAddress: formData.locationAddress,
      locationCity: formData.locationCity,
      locationState: formData.locationState,
      locationZip: formData.locationZip,

      // Accident-specific data goes in JSON field
      accidentData: {
        isFatality: formData.isFatality,
        isReportable: formData.isReportable,
        isInjury: formData.isInjury,
        isTow: formData.isTow,
        isCitation: formData.isCitation,
        needsReport: formData.needsReport,
        needsDrugTest: formData.needsDrugTest,
        numberOfFatalities: formData.numberOfFatalities,
        numberOfVehicles: formData.numberOfVehicles,
        accidentDescription: formData.accidentDescription,
        weatherConditions: formData.weatherConditions,
        roadConditions: formData.roadConditions,
        trafficConditions: formData.trafficConditions,
        addons: formData.addons,
      },

      equipment: formData.selectedEquipmentIds.map((equipmentId, index) => ({
        equipmentId,
        unitNumber: index + 1,
      })),

      violations: formData.violations,

      title: `Accident - ${formData.agencyName} - ${formData.incidentDate}`,
      description: formData.accidentDescription || "Motor vehicle accident",
    };

    console.log("Submitting accident data:", submissionData);
    onSubmit(submissionData);
  };

  const addViolation = (violation: any) => {
    const newViolation: Violation = {
      code: violation.code, // Keep for display
      violationCode: violation.code, // Add for API compatibility
      description: violation.description,
      type: violation.type,
      severity: violation.severity || "WARNING",
      violationType:
        violation.type === "Vehicle"
          ? "Equipment"
          : violation.type === "Driver"
            ? "Driver_Performance"
            : "Company",
      outOfService:
        violation.severity === "OUT_OF_SERVICE" || violation.severity === "Out_Of_Service",
    };

    setFormData((prev) => ({
      ...prev,
      violations: [newViolation, ...prev.violations], // Add to beginning
    }));

    setViolationSearch(""); // Clear search
    setAvailableViolations([]); // Clear results
  };

  const removeViolation = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      violations: prev.violations.filter((_, i) => i !== index),
    }));
  };

  const addAddon = () => {
    if (!newAddon.title?.trim()) {
      alert("Please enter a title for the addon");
      return;
    }

    const addon: AddonItem = {
      id: `temp_${Date.now()}`,
      type: newAddon.type as "note" | "attachment" | "url" | "photo",
      title: newAddon.title,
      content: newAddon.content,
      description: newAddon.description,
      url: newAddon.url,
    };

    setFormData((prev) => ({
      ...prev,
      addons: [...prev.addons, addon],
    }));

    // Reset addon form
    setNewAddon({
      type: "note",
      title: "",
      content: "",
    });
    setShowAddAddon(false);
  };

  const removeAddon = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      addons: prev.addons.filter((_, i) => i !== index),
    }));
  };

  // Filter functions for search
  const filteredDrivers = availableDrivers.filter(
    (driver) =>
      driverSearch.length < 2 ||
      `${driver.firstName} ${driver.lastName}`.toLowerCase().includes(driverSearch.toLowerCase()) ||
      driver.licenseNumber?.toLowerCase().includes(driverSearch.toLowerCase()),
  );

  const filteredEquipment = availableEquipment.filter(
    (equipment) =>
      equipmentSearch.length < 2 ||
      equipment.unitNumber.toLowerCase().includes(equipmentSearch.toLowerCase()) ||
      equipment.make?.toLowerCase().includes(equipmentSearch.toLowerCase()) ||
      equipment.model?.toLowerCase().includes(equipmentSearch.toLowerCase()),
  );

  return (
    <form onSubmit={handleSubmit} className="h-full flex flex-col">
      {/* Fixed Tab Headers */}
      <div className="flex-shrink-0 px-6 py-4 bg-white border-b">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Basic Info
            </TabsTrigger>
            <TabsTrigger value="parties" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Parties & Equipment
            </TabsTrigger>
            <TabsTrigger value="violations" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Violations
            </TabsTrigger>
            <TabsTrigger value="addons" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Addons
            </TabsTrigger>
            <TabsTrigger value="review" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Review
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Tab 1: Basic Information */}
          <TabsContent value="basic" className="h-full">
            <div className="p-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Accident Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="incidentDate">Accident Date *</Label>
                      <Input
                        id="incidentDate"
                        type="date"
                        value={formData.incidentDate}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, incidentDate: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="incidentTime">Accident Time</Label>
                      <Input
                        id="incidentTime"
                        type="time"
                        value={formData.incidentTime}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, incidentTime: e.target.value }))
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="officerName">Officer Name *</Label>
                      <Input
                        id="officerName"
                        value={formData.officerName}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, officerName: e.target.value }))
                        }
                        placeholder="Responding officer"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="agencyName">Agency Name *</Label>
                      <Input
                        id="agencyName"
                        value={formData.agencyName}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, agencyName: e.target.value }))
                        }
                        placeholder="Law enforcement agency"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="reportNumber">Report Number</Label>
                      <Input
                        id="reportNumber"
                        value={formData.reportNumber}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, reportNumber: e.target.value }))
                        }
                        placeholder="Police report number"
                      />
                    </div>
                    <div>
                      <Label htmlFor="officerBadge">Officer Badge</Label>
                      <Input
                        id="officerBadge"
                        value={formData.officerBadge}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, officerBadge: e.target.value }))
                        }
                        placeholder="Badge number"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Location Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="locationAddress">Address</Label>
                    <Input
                      id="locationAddress"
                      value={formData.locationAddress}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, locationAddress: e.target.value }))
                      }
                      placeholder="Street address"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="locationCity">City</Label>
                      <Input
                        id="locationCity"
                        value={formData.locationCity}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, locationCity: e.target.value }))
                        }
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <Label htmlFor="locationState">State</Label>
                      <Input
                        id="locationState"
                        value={formData.locationState}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, locationState: e.target.value }))
                        }
                        placeholder="State"
                      />
                    </div>
                    <div>
                      <Label htmlFor="locationZip">ZIP Code</Label>
                      <Input
                        id="locationZip"
                        value={formData.locationZip}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, locationZip: e.target.value }))
                        }
                        placeholder="ZIP"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Accident Classifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="isFatality"
                          checked={formData.isFatality}
                          onCheckedChange={(checked) =>
                            setFormData((prev) => ({ ...prev, isFatality: !!checked }))
                          }
                        />
                        <Label htmlFor="isFatality" className="text-red-600 font-medium">
                          Fatality
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="isInjury"
                          checked={formData.isInjury}
                          onCheckedChange={(checked) =>
                            setFormData((prev) => ({ ...prev, isInjury: !!checked }))
                          }
                        />
                        <Label htmlFor="isInjury">Personal Injury</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="isTow"
                          checked={formData.isTow}
                          onCheckedChange={(checked) =>
                            setFormData((prev) => ({ ...prev, isTow: !!checked }))
                          }
                        />
                        <Label htmlFor="isTow">Vehicle Towed</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="isCitation"
                          checked={formData.isCitation}
                          onCheckedChange={(checked) =>
                            setFormData((prev) => ({ ...prev, isCitation: !!checked }))
                          }
                        />
                        <Label htmlFor="isCitation">Citations Issued</Label>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="isReportable"
                          checked={formData.isReportable}
                          onCheckedChange={(checked) =>
                            setFormData((prev) => ({ ...prev, isReportable: !!checked }))
                          }
                        />
                        <Label htmlFor="isReportable">DOT Reportable</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="needsReport"
                          checked={formData.needsReport}
                          onCheckedChange={(checked) =>
                            setFormData((prev) => ({ ...prev, needsReport: !!checked }))
                          }
                        />
                        <Label htmlFor="needsReport">Accident Report Required</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="needsDrugTest"
                          checked={formData.needsDrugTest}
                          onCheckedChange={(checked) =>
                            setFormData((prev) => ({ ...prev, needsDrugTest: !!checked }))
                          }
                        />
                        <Label htmlFor="needsDrugTest">Drug Test Required</Label>
                      </div>
                    </div>
                  </div>

                  {/* Conditional fields */}
                  <div className="grid grid-cols-2 gap-4">
                    {formData.isFatality && (
                      <div>
                        <Label htmlFor="numberOfFatalities">Number of Fatalities</Label>
                        <Input
                          id="numberOfFatalities"
                          type="number"
                          min="1"
                          value={formData.numberOfFatalities || ""}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              numberOfFatalities: e.target.value
                                ? parseInt(e.target.value)
                                : undefined,
                            }))
                          }
                        />
                      </div>
                    )}
                    <div>
                      <Label htmlFor="numberOfVehicles">Number of Vehicles</Label>
                      <Input
                        id="numberOfVehicles"
                        type="number"
                        min="1"
                        value={formData.numberOfVehicles || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            numberOfVehicles: e.target.value ? parseInt(e.target.value) : undefined,
                          }))
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Basic Info Buttons */}
              <div className="flex justify-between pt-6 border-t mt-6">
                <div>
                  <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                  </Button>
                </div>
                <div>
                  <Button
                    type="button"
                    onClick={() => setActiveTab("parties")}
                    className="flex items-center gap-2"
                  >
                    Next: Parties & Equipment
                    <Users className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab 2: Parties & Equipment */}
          <TabsContent value="parties" className="h-full">
            <div className="p-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Driver Selection</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="driverSearch">Search Drivers</Label>
                    <Input
                      id="driverSearch"
                      value={driverSearch}
                      onChange={(e) => setDriverSearch(e.target.value)}
                      placeholder="Search by name or license number..."
                    />
                  </div>

                  <div>
                    <Label>Primary Driver *</Label>
                    <Select
                      value={formData.primaryDriverId}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, primaryDriverId: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select primary driver" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredDrivers.map((driver) => (
                          <SelectItem key={driver.id} value={driver.id}>
                            {driver.firstName} {driver.lastName}{" "}
                            {driver.licenseNumber && `(${driver.licenseNumber})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Equipment Selection</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="equipmentSearch">Search Equipment</Label>
                    <Input
                      id="equipmentSearch"
                      value={equipmentSearch}
                      onChange={(e) => setEquipmentSearch(e.target.value)}
                      placeholder="Search by unit number, make, or model..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Equipment Involved</Label>
                    {filteredEquipment.map((equipment) => (
                      <div key={equipment.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`equipment-${equipment.id}`}
                          checked={formData.selectedEquipmentIds.includes(equipment.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData((prev) => ({
                                ...prev,
                                selectedEquipmentIds: [...prev.selectedEquipmentIds, equipment.id],
                              }));
                            } else {
                              setFormData((prev) => ({
                                ...prev,
                                selectedEquipmentIds: prev.selectedEquipmentIds.filter(
                                  (id) => id !== equipment.id,
                                ),
                              }));
                            }
                          }}
                        />
                        <Label htmlFor={`equipment-${equipment.id}`} className="flex-1">
                          Unit {equipment.unitNumber} - {equipment.make || "Unknown"}{" "}
                          {equipment.model || ""}
                          {equipment.year && ` (${equipment.year})`}
                        </Label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Parties & Equipment Buttons */}
              <div className="flex justify-between pt-6 border-t mt-6">
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab("basic")}
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Back: Basic Info
                  </Button>
                  <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                  </Button>
                </div>
                <div>
                  <Button
                    type="button"
                    onClick={() => setActiveTab("violations")}
                    className="flex items-center gap-2"
                  >
                    Next: Violations
                    <AlertTriangle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab 3: Violations */}
          <TabsContent value="violations" className="h-full">
            <div className="p-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Violation Search</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="violationSearch">Search Violations</Label>
                    <Input
                      id="violationSearch"
                      value={violationSearch}
                      onChange={(e) => setViolationSearch(e.target.value)}
                      placeholder="Search by code or description (e.g., 392.2, brake, hours)"
                    />
                  </div>

                  {availableViolations.length > 0 && (
                    <div className="border rounded-lg max-h-48 overflow-y-auto">
                      {availableViolations.map((violation) => (
                        <div
                          key={violation.code}
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                          onClick={() => addViolation(violation)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-medium">{violation.code}</div>
                              <div className="text-sm text-gray-600">{violation.description}</div>
                            </div>
                            <div className="flex gap-1 ml-2">
                              <Badge variant="outline">{violation.type}</Badge>
                              <Badge
                                variant={
                                  violation.severity === "OUT_OF_SERVICE"
                                    ? "destructive"
                                    : "secondary"
                                }
                              >
                                {violation.severity}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Selected Violations ({formData.violations.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {formData.violations.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>No violations added yet</p>
                      <p className="text-sm">Search and add violations found during the accident</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {formData.violations.map((violation, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-start p-3 border rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="font-medium">{violation.code}</div>
                            <div className="text-sm text-gray-600">{violation.description}</div>
                            <div className="flex gap-1 mt-1">
                              <Badge variant="outline">{violation.type}</Badge>
                              <Badge
                                variant={
                                  violation.severity === "OUT_OF_SERVICE"
                                    ? "destructive"
                                    : "secondary"
                                }
                              >
                                {violation.severity}
                              </Badge>
                              {violation.outOfService && <Badge variant="destructive">OOS</Badge>}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeViolation(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Violations Buttons */}
              <div className="flex justify-between pt-6 border-t mt-6">
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab("parties")}
                    className="flex items-center gap-2"
                  >
                    <Users className="h-4 w-4" />
                    Back: Parties & Equipment
                  </Button>
                  <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                  </Button>
                </div>
                <div>
                  <Button
                    type="button"
                    onClick={() => setActiveTab("addons")}
                    className="flex items-center gap-2"
                  >
                    Next: Addons
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab 4: Addons - THE IMPORTANT SECTION! */}
          <TabsContent value="addons" className="h-full">
            <div className="p-6 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Additional Information & Attachments</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        Add photos, documents, witness statements, and other relevant information
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={() => setShowAddAddon(true)}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Item
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Add Addon Form */}
                  {showAddAddon && (
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <div className="space-y-4">
                        <div>
                          <Label>Type</Label>
                          <Select
                            value={newAddon.type}
                            onValueChange={(value) =>
                              setNewAddon((prev) => ({ ...prev, type: value as any }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="note">
                                <div className="flex items-center gap-2">
                                  <MessageSquare className="h-4 w-4" />
                                  Note
                                </div>
                              </SelectItem>
                              <SelectItem value="attachment">
                                <div className="flex items-center gap-2">
                                  <Upload className="h-4 w-4" />
                                  File Attachment
                                </div>
                              </SelectItem>
                              <SelectItem value="photo">
                                <div className="flex items-center gap-2">
                                  <Car className="h-4 w-4" />
                                  Photo
                                </div>
                              </SelectItem>
                              <SelectItem value="url">
                                <div className="flex items-center gap-2">
                                  <Eye className="h-4 w-4" />
                                  URL/Link
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Title *</Label>
                          <Input
                            value={newAddon.title || ""}
                            onChange={(e) =>
                              setNewAddon((prev) => ({ ...prev, title: e.target.value }))
                            }
                            placeholder="Enter a descriptive title"
                          />
                        </div>

                        {newAddon.type === "note" && (
                          <div>
                            <Label>Content</Label>
                            <Textarea
                              value={newAddon.content || ""}
                              onChange={(e) =>
                                setNewAddon((prev) => ({ ...prev, content: e.target.value }))
                              }
                              placeholder="Enter note content..."
                              rows={4}
                            />
                          </div>
                        )}

                        {newAddon.type === "url" && (
                          <div>
                            <Label>URL</Label>
                            <Input
                              value={newAddon.url || ""}
                              onChange={(e) =>
                                setNewAddon((prev) => ({ ...prev, url: e.target.value }))
                              }
                              placeholder="https://..."
                            />
                          </div>
                        )}

                        <div>
                          <Label>Description</Label>
                          <Textarea
                            value={newAddon.description || ""}
                            onChange={(e) =>
                              setNewAddon((prev) => ({ ...prev, description: e.target.value }))
                            }
                            placeholder="Additional details..."
                            rows={2}
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button type="button" onClick={addAddon}>
                            Add Item
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowAddAddon(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Addon List */}
                  {formData.addons.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Plus className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>No additional items yet</p>
                      <p className="text-sm">
                        Add photos, notes, documents, or links related to this accident
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {formData.addons.map((addon, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-start p-3 border rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {addon.type === "note" && <MessageSquare className="h-4 w-4" />}
                              {addon.type === "attachment" && <Upload className="h-4 w-4" />}
                              {addon.type === "photo" && <Car className="h-4 w-4" />}
                              {addon.type === "url" && <Eye className="h-4 w-4" />}
                              <span className="font-medium">{addon.title}</span>
                              <Badge variant="outline">{addon.type}</Badge>
                            </div>
                            {addon.content && (
                              <p className="text-sm text-gray-600 mt-1">{addon.content}</p>
                            )}
                            {addon.url && <p className="text-sm text-blue-600 mt-1">{addon.url}</p>}
                            {addon.description && (
                              <p className="text-xs text-gray-500 mt-1">{addon.description}</p>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAddon(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Additional Details Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Environmental Conditions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="accidentDescription">Accident Description</Label>
                    <Textarea
                      id="accidentDescription"
                      value={formData.accidentDescription}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, accidentDescription: e.target.value }))
                      }
                      placeholder="Describe what happened..."
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="weatherConditions">Weather Conditions</Label>
                      <Select
                        value={formData.weatherConditions}
                        onValueChange={(value) =>
                          setFormData((prev) => ({ ...prev, weatherConditions: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select weather" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="clear">Clear</SelectItem>
                          <SelectItem value="cloudy">Cloudy</SelectItem>
                          <SelectItem value="rain">Rain</SelectItem>
                          <SelectItem value="snow">Snow</SelectItem>
                          <SelectItem value="fog">Fog</SelectItem>
                          <SelectItem value="wind">Windy</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="roadConditions">Road Conditions</Label>
                      <Select
                        value={formData.roadConditions}
                        onValueChange={(value) =>
                          setFormData((prev) => ({ ...prev, roadConditions: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select road condition" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dry">Dry</SelectItem>
                          <SelectItem value="wet">Wet</SelectItem>
                          <SelectItem value="icy">Icy</SelectItem>
                          <SelectItem value="muddy">Muddy</SelectItem>
                          <SelectItem value="construction">Construction Zone</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="trafficConditions">Traffic Conditions</Label>
                      <Select
                        value={formData.trafficConditions}
                        onValueChange={(value) =>
                          setFormData((prev) => ({ ...prev, trafficConditions: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select traffic" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="moderate">Moderate</SelectItem>
                          <SelectItem value="heavy">Heavy</SelectItem>
                          <SelectItem value="stopped">Stopped</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Addons Buttons */}
              <div className="flex justify-between pt-6 border-t mt-6">
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab("violations")}
                    className="flex items-center gap-2"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    Back: Violations
                  </Button>
                  <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                  </Button>
                </div>
                <div>
                  <Button
                    type="button"
                    onClick={() => setActiveTab("review")}
                    className="flex items-center gap-2"
                  >
                    Next: Review
                    <Shield className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab 5: Review */}
          <TabsContent value="review" className="h-full">
            <div className="p-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Review Accident Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Summary */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="font-medium">
                        {formData.agencyName} - {formData.incidentDate}
                        {formData.incidentTime && ` at ${formData.incidentTime}`}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Officer: {formData.officerName}
                        {formData.reportNumber && ` • Report: ${formData.reportNumber}`}
                      </p>
                    </div>
                  </div>

                  {/* Classification Summary */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Classifications</h4>
                    <div className="flex flex-wrap gap-2">
                      {formData.isFatality && <Badge variant="destructive">Fatality</Badge>}
                      {formData.isInjury && <Badge variant="secondary">Injury</Badge>}
                      {formData.isReportable && <Badge variant="default">DOT Reportable</Badge>}
                      {formData.isTow && <Badge variant="outline">Vehicle Towed</Badge>}
                      {formData.isCitation && <Badge variant="outline">Citations Issued</Badge>}
                      {formData.needsReport && <Badge variant="outline">Report Required</Badge>}
                      {formData.needsDrugTest && (
                        <Badge variant="outline">Drug Test Required</Badge>
                      )}
                    </div>
                  </div>

                  {/* Parties & Equipment */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Driver & Equipment ({1 + formData.selectedEquipmentIds.length} total)
                    </h4>
                    <div className="space-y-1 text-sm">
                      <p>
                        Driver:{" "}
                        {availableDrivers.find((d) => d.id === formData.primaryDriverId)?.firstName}{" "}
                        {availableDrivers.find((d) => d.id === formData.primaryDriverId)?.lastName}
                      </p>
                      {formData.selectedEquipmentIds.length > 0 && (
                        <p>Equipment: {formData.selectedEquipmentIds.length} units selected</p>
                      )}
                    </div>
                  </div>

                  {/* Violations */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Violations ({formData.violations.length})
                    </h4>
                    {formData.violations.length > 0 ? (
                      <div className="space-y-1">
                        {formData.violations.map((violation, index) => (
                          <div key={index} className="text-sm bg-gray-50 p-2 rounded">
                            <span className="font-medium">{violation.code}</span> -{" "}
                            {violation.description}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No violations recorded</p>
                    )}
                  </div>

                  {/* Addons */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Additional Items ({formData.addons.length})
                    </h4>
                    {formData.addons.length > 0 ? (
                      <div className="space-y-1">
                        {formData.addons.map((addon, index) => (
                          <div
                            key={index}
                            className="text-sm bg-gray-50 p-2 rounded flex items-center gap-2"
                          >
                            <Badge variant="outline">{addon.type}</Badge>
                            <span className="font-medium">{addon.title}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No additional items added</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Review Buttons */}
              <div className="flex justify-between pt-6 border-t mt-6">
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab("addons")}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Back: Addons
                  </Button>
                  <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                  </Button>
                </div>
                <div>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Creating Accident..." : "Create Accident"}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </form>
  );
}
