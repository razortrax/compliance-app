"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Printer,
  Download,
  Calendar,
  Wrench,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

interface ABScheduleItem {
  itemCode: string;
  itemDescription: string;
  intervalDays?: number;
  intervalMiles?: number;
  intervalType: "TIME_BASED" | "MILEAGE_BASED" | "BOTH";
  category: string;
  component: string;
  taskType: string;
  estimatedHours?: number;
  estimatedCost?: number;
  dotRequired: boolean;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  safetyRelated: boolean;
  sortOrder: number;
}

interface Equipment {
  id: string;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  vin?: string | null;
  category?: {
    label: string;
  };
}

interface ABScheduleReportProps {
  equipment: Equipment;
  organizationName: string;
  onClose: () => void;
}

export function ABScheduleReport({ equipment, organizationName, onClose }: ABScheduleReportProps) {
  const [scheduleItems, setScheduleItems] = useState<ABScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);

  const equipmentCategory = equipment.category?.label || "Unknown";
  const isPowerUnit = equipmentCategory.toLowerCase().includes("power");
  const scheduleType = isPowerUnit ? "Power Unit" : "Trailer";

  useEffect(() => {
    fetchABSchedule();
  }, [equipment.id]);

  const fetchABSchedule = async () => {
    try {
      setIsLoading(true);

      // For now, using the same mock data structure as our seeded A&B schedules
      const mockScheduleItems: ABScheduleItem[] = isPowerUnit
        ? [
            // A Schedule Items for Power Units
            {
              itemCode: "A1",
              itemDescription: "Engine Oil & Filter Change",
              intervalDays: 90,
              intervalMiles: 25000,
              intervalType: "BOTH",
              category: "ENGINE",
              component: "Oil System",
              taskType: "REPLACE",
              estimatedHours: 1.5,
              estimatedCost: 150.0,
              dotRequired: false,
              priority: "MEDIUM",
              safetyRelated: false,
              sortOrder: 1,
            },
            {
              itemCode: "A2",
              itemDescription: "Air Filter Inspection/Replacement",
              intervalDays: 90,
              intervalMiles: 25000,
              intervalType: "BOTH",
              category: "ENGINE",
              component: "Air Intake",
              taskType: "INSPECT",
              estimatedHours: 0.5,
              estimatedCost: 75.0,
              dotRequired: false,
              priority: "MEDIUM",
              safetyRelated: false,
              sortOrder: 2,
            },
            {
              itemCode: "A3",
              itemDescription: "Brake System Inspection",
              intervalDays: 90,
              intervalMiles: 25000,
              intervalType: "BOTH",
              category: "BRAKE",
              component: "Brake System",
              taskType: "INSPECT",
              estimatedHours: 2.0,
              estimatedCost: 100.0,
              dotRequired: true,
              priority: "HIGH",
              safetyRelated: true,
              sortOrder: 3,
            },
            {
              itemCode: "A4",
              itemDescription: "Tire Pressure & Tread Inspection",
              intervalDays: 30,
              intervalMiles: 10000,
              intervalType: "BOTH",
              category: "TIRE",
              component: "Tires",
              taskType: "INSPECT",
              estimatedHours: 0.5,
              estimatedCost: 25.0,
              dotRequired: true,
              priority: "HIGH",
              safetyRelated: true,
              sortOrder: 4,
            },
            {
              itemCode: "A5",
              itemDescription: "Lights & Electrical System Check",
              intervalDays: 90,
              intervalMiles: 25000,
              intervalType: "BOTH",
              category: "ELECTRICAL",
              component: "Lighting",
              taskType: "INSPECT",
              estimatedHours: 1.0,
              estimatedCost: 50.0,
              dotRequired: true,
              priority: "HIGH",
              safetyRelated: true,
              sortOrder: 5,
            },
            // B Schedule Items for Power Units
            {
              itemCode: "B1",
              itemDescription: "Transmission Service",
              intervalDays: 180,
              intervalMiles: 50000,
              intervalType: "BOTH",
              category: "TRANSMISSION",
              component: "Transmission",
              taskType: "SERVICE",
              estimatedHours: 3.0,
              estimatedCost: 400.0,
              dotRequired: false,
              priority: "MEDIUM",
              safetyRelated: false,
              sortOrder: 6,
            },
            {
              itemCode: "B2",
              itemDescription: "Differential Service",
              intervalDays: 180,
              intervalMiles: 50000,
              intervalType: "BOTH",
              category: "DRIVETRAIN",
              component: "Differential",
              taskType: "SERVICE",
              estimatedHours: 2.0,
              estimatedCost: 250.0,
              dotRequired: false,
              priority: "MEDIUM",
              safetyRelated: false,
              sortOrder: 7,
            },
            {
              itemCode: "B3",
              itemDescription: "Fuel System Inspection",
              intervalDays: 180,
              intervalMiles: 50000,
              intervalType: "BOTH",
              category: "FUEL",
              component: "Fuel System",
              taskType: "INSPECT",
              estimatedHours: 1.5,
              estimatedCost: 100.0,
              dotRequired: true,
              priority: "HIGH",
              safetyRelated: true,
              sortOrder: 8,
            },
            {
              itemCode: "B4",
              itemDescription: "Exhaust System Inspection",
              intervalDays: 180,
              intervalMiles: 50000,
              intervalType: "BOTH",
              category: "EXHAUST",
              component: "Exhaust System",
              taskType: "INSPECT",
              estimatedHours: 1.0,
              estimatedCost: 75.0,
              dotRequired: true,
              priority: "MEDIUM",
              safetyRelated: true,
              sortOrder: 9,
            },
          ]
        : [
            // A Schedule Items for Trailers
            {
              itemCode: "TA1",
              itemDescription: "Brake System Inspection",
              intervalDays: 90,
              intervalMiles: 25000,
              intervalType: "BOTH",
              category: "BRAKE",
              component: "Brake System",
              taskType: "INSPECT",
              estimatedHours: 1.5,
              estimatedCost: 100.0,
              dotRequired: true,
              priority: "HIGH",
              safetyRelated: true,
              sortOrder: 1,
            },
            {
              itemCode: "TA2",
              itemDescription: "Tire Pressure & Tread Inspection",
              intervalDays: 30,
              intervalMiles: 10000,
              intervalType: "BOTH",
              category: "TIRE",
              component: "Tires",
              taskType: "INSPECT",
              estimatedHours: 0.5,
              estimatedCost: 25.0,
              dotRequired: true,
              priority: "HIGH",
              safetyRelated: true,
              sortOrder: 2,
            },
            {
              itemCode: "TA3",
              itemDescription: "Lights & Electrical System Check",
              intervalDays: 90,
              intervalMiles: 25000,
              intervalType: "BOTH",
              category: "ELECTRICAL",
              component: "Lighting",
              taskType: "INSPECT",
              estimatedHours: 0.5,
              estimatedCost: 50.0,
              dotRequired: true,
              priority: "HIGH",
              safetyRelated: true,
              sortOrder: 3,
            },
            {
              itemCode: "TA4",
              itemDescription: "Suspension System Inspection",
              intervalDays: 90,
              intervalMiles: 25000,
              intervalType: "BOTH",
              category: "SUSPENSION",
              component: "Suspension",
              taskType: "INSPECT",
              estimatedHours: 1.0,
              estimatedCost: 75.0,
              dotRequired: true,
              priority: "HIGH",
              safetyRelated: true,
              sortOrder: 4,
            },
            // B Schedule Items for Trailers
            {
              itemCode: "TB1",
              itemDescription: "Wheel Bearing Service",
              intervalDays: 180,
              intervalMiles: 50000,
              intervalType: "BOTH",
              category: "BEARING",
              component: "Wheel Bearings",
              taskType: "SERVICE",
              estimatedHours: 2.5,
              estimatedCost: 300.0,
              dotRequired: false,
              priority: "MEDIUM",
              safetyRelated: false,
              sortOrder: 5,
            },
            {
              itemCode: "TB2",
              itemDescription: "Landing Gear Inspection",
              intervalDays: 180,
              intervalMiles: 50000,
              intervalType: "BOTH",
              category: "LANDING_GEAR",
              component: "Landing Gear",
              taskType: "INSPECT",
              estimatedHours: 1.0,
              estimatedCost: 50.0,
              dotRequired: true,
              priority: "MEDIUM",
              safetyRelated: true,
              sortOrder: 6,
            },
          ];

      setScheduleItems(mockScheduleItems);
    } catch (error) {
      console.error("Error fetching A&B schedule:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  };

  const handleDownload = () => {
    // Future enhancement: Generate and download PDF
    alert("PDF download feature coming soon!");
  };

  const getScheduleCategory = (items: ABScheduleItem[]) => {
    const aSchedule = items.filter(
      (item) => item.itemCode.includes("A") || item.itemCode.startsWith("TA"),
    );
    const bSchedule = items.filter(
      (item) => item.itemCode.includes("B") || item.itemCode.startsWith("TB"),
    );
    return { aSchedule, bSchedule };
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
        return AlertTriangle;
      case "HIGH":
        return AlertTriangle;
      case "MEDIUM":
        return Clock;
      case "LOW":
        return CheckCircle;
      default:
        return Clock;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
        return "text-red-600";
      case "HIGH":
        return "text-orange-600";
      case "MEDIUM":
        return "text-yellow-600";
      case "LOW":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Generating A&B Schedule...</p>
        </div>
      </div>
    );
  }

  const { aSchedule, bSchedule } = getScheduleCategory(scheduleItems);
  const currentDate = new Date().toLocaleDateString();
  const equipmentInfo =
    `${equipment.make || ""} ${equipment.model || ""} ${equipment.year || ""}`.trim();

  return (
    <div className="space-y-6">
      {/* Print Header - Only visible when printing */}
      <div className="print:block hidden">
        <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
          <h1 className="text-2xl font-bold">A&B MAINTENANCE SCHEDULE</h1>
          <h2 className="text-lg font-semibold">{scheduleType}</h2>
          <div className="mt-2 text-sm">
            <p>
              <strong>Organization:</strong> {organizationName}
            </p>
            <p>
              <strong>Equipment:</strong> {equipmentInfo}
            </p>
            <p>
              <strong>VIN:</strong> {equipment.vin || "N/A"}
            </p>
            <p>
              <strong>Generated:</strong> {currentDate}
            </p>
          </div>
        </div>
      </div>

      {/* Screen Header */}
      <div className="print:hidden">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">A&B Maintenance Schedule</h2>
            <p className="text-gray-600">
              {scheduleType} - {equipmentInfo}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button onClick={handlePrint} disabled={isPrinting}>
              <Printer className="h-4 w-4 mr-2" />
              {isPrinting ? "Preparing..." : "Print"}
            </Button>
          </div>
        </div>
      </div>

      {/* A Schedule Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />A Schedule - Routine Maintenance (
            {aSchedule.length} items)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {aSchedule.map((item, index) => {
              const PriorityIcon = getPriorityIcon(item.priority);
              return (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="outline" className="font-mono">
                          {item.itemCode}
                        </Badge>
                        <h4 className="font-semibold">{item.itemDescription}</h4>
                        <PriorityIcon className={`h-4 w-4 ${getPriorityColor(item.priority)}`} />
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Category:</span>
                          <p className="text-gray-600">{item.category.replace("_", " ")}</p>
                        </div>
                        <div>
                          <span className="font-medium">Component:</span>
                          <p className="text-gray-600">{item.component}</p>
                        </div>
                        <div>
                          <span className="font-medium">Task:</span>
                          <p className="text-gray-600">{item.taskType}</p>
                        </div>
                        <div>
                          <span className="font-medium">Interval:</span>
                          <p className="text-gray-600">
                            {item.intervalDays && `${item.intervalDays} days`}
                            {item.intervalDays && item.intervalMiles && " / "}
                            {item.intervalMiles && `${item.intervalMiles.toLocaleString()} miles`}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium">Est. Hours:</span>
                          <p className="text-gray-600">{item.estimatedHours || "N/A"}</p>
                        </div>
                        <div>
                          <span className="font-medium">Est. Cost:</span>
                          <p className="text-gray-600">
                            {item.estimatedCost ? `$${item.estimatedCost.toFixed(2)}` : "N/A"}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium">DOT Required:</span>
                          <Badge variant={item.dotRequired ? "default" : "secondary"}>
                            {item.dotRequired ? "Yes" : "No"}
                          </Badge>
                        </div>
                        <div>
                          <span className="font-medium">Safety Related:</span>
                          <Badge variant={item.safetyRelated ? "destructive" : "secondary"}>
                            {item.safetyRelated ? "Yes" : "No"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* B Schedule Section */}
      {bSchedule.length > 0 && (
        <>
          <div className="my-6 border-t border-gray-300"></div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-orange-600" />B Schedule - Comprehensive Maintenance
                ({bSchedule.length} items)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bSchedule.map((item, index) => {
                  const PriorityIcon = getPriorityIcon(item.priority);
                  return (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge variant="outline" className="font-mono">
                              {item.itemCode}
                            </Badge>
                            <h4 className="font-semibold">{item.itemDescription}</h4>
                            <PriorityIcon
                              className={`h-4 w-4 ${getPriorityColor(item.priority)}`}
                            />
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Category:</span>
                              <p className="text-gray-600">{item.category.replace("_", " ")}</p>
                            </div>
                            <div>
                              <span className="font-medium">Component:</span>
                              <p className="text-gray-600">{item.component}</p>
                            </div>
                            <div>
                              <span className="font-medium">Task:</span>
                              <p className="text-gray-600">{item.taskType}</p>
                            </div>
                            <div>
                              <span className="font-medium">Interval:</span>
                              <p className="text-gray-600">
                                {item.intervalDays && `${item.intervalDays} days`}
                                {item.intervalDays && item.intervalMiles && " / "}
                                {item.intervalMiles &&
                                  `${item.intervalMiles.toLocaleString()} miles`}
                              </p>
                            </div>
                            <div>
                              <span className="font-medium">Est. Hours:</span>
                              <p className="text-gray-600">{item.estimatedHours || "N/A"}</p>
                            </div>
                            <div>
                              <span className="font-medium">Est. Cost:</span>
                              <p className="text-gray-600">
                                {item.estimatedCost ? `$${item.estimatedCost.toFixed(2)}` : "N/A"}
                              </p>
                            </div>
                            <div>
                              <span className="font-medium">DOT Required:</span>
                              <Badge variant={item.dotRequired ? "default" : "secondary"}>
                                {item.dotRequired ? "Yes" : "No"}
                              </Badge>
                            </div>
                            <div>
                              <span className="font-medium">Safety Related:</span>
                              <Badge variant={item.safetyRelated ? "destructive" : "secondary"}>
                                {item.safetyRelated ? "Yes" : "No"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Print Footer */}
      <div className="print:block hidden mt-8 pt-4 border-t border-gray-300">
        <div className="text-xs text-gray-600 text-center">
          <p>
            This A&B Maintenance Schedule should be kept with the vehicle and in the equipment file
            in the office.
          </p>
          <p>Generated by Fleetrax Compliance Management System • {currentDate}</p>
        </div>
      </div>

      {/* Screen Footer */}
      <div className="print:hidden mt-6 text-center">
        <p className="text-sm text-gray-500">
          This schedule should be kept with the vehicle and in the equipment file in the office.
        </p>
      </div>
    </div>
  );
}
