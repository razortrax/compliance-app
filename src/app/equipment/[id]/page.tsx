"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AppLayout } from "@/components/layouts/app-layout";
import { useMasterOrg } from "@/hooks/use-master-org";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EquipmentForm } from "@/components/equipment/equipment-form";
import {
  Truck,
  Edit,
  FileText,
  AlertCircle,
  CheckCircle,
  Calendar,
  MapPin,
  IdCard,
  Settings,
} from "lucide-react";

interface Equipment {
  id: string;
  vehicleNumber: string;
  make?: string;
  model?: string;
  year?: number;
  vin?: string;
  licensePlate?: string;
  registrationExpiry?: string;
  inspectionExpiry?: string;
  party?: {
    id: string;
  };
  organization?: {
    id: string;
    name: string;
  };
  location?: {
    id: string;
    name: string;
  };
}

export default function EquipmentDetailPage() {
  const params = useParams();
  const equipmentId = params.id as string;
  const { masterOrg } = useMasterOrg();

  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);

  useEffect(() => {
    if (equipmentId) {
      fetchEquipment();
    }
  }, [equipmentId]);

  const fetchEquipment = async () => {
    try {
      const response = await fetch(`/api/equipment/${equipmentId}`);
      if (response.ok) {
        const data = await response.json();
        setEquipment(data);
      } else {
        console.error("Failed to fetch equipment");
      }
    } catch (error) {
      console.error("Error fetching equipment:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getExpirationStatus = (expirationDate?: string) => {
    if (!expirationDate) return { status: "unknown", daysUntil: null, color: "text-gray-500" };

    const expiry = new Date(expirationDate);
    const today = new Date();
    const daysUntil = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) {
      return { status: "expired", daysUntil, color: "text-red-600" };
    } else if (daysUntil <= 30) {
      return { status: "expiring", daysUntil, color: "text-orange-600" };
    } else {
      return { status: "current", daysUntil, color: "text-green-600" };
    }
  };

  if (isLoading) {
    return (
      <AppLayout name={masterOrg?.name || "Master"} sidebarMenu="driver" className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading equipment details...</p>
        </div>
      </AppLayout>
    );
  }

  if (!equipment) {
    return (
      <AppLayout name={masterOrg?.name || "Master"} sidebarMenu="driver" className="p-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Equipment Not Found</h3>
          <p className="text-gray-600">The requested equipment could not be found.</p>
        </div>
      </AppLayout>
    );
  }

  const organization = equipment.organization;
  const masterName = masterOrg?.name || "Master";

  // Build top navigation based on access level
  const topNav = [];
  if (masterOrg) {
    topNav.push({ label: "Master", href: "/dashboard", isActive: false });
  }
  if (organization) {
    topNav.push({
      label: "Organization",
      href: `/organizations/${organization.id}`,
      isActive: false,
    });
    topNav.push({
      label: "Equipment",
      href: `/organizations/${organization.id}/equipment`,
      isActive: false,
    });
    topNav.push({
      label: equipment.vehicleNumber,
      href: `/equipment/${equipment.id}`,
      isActive: true,
    });
  }

  const registrationStatus = getExpirationStatus(equipment.registrationExpiry);
  const inspectionStatus = getExpirationStatus(equipment.inspectionExpiry);

  return (
    <AppLayout name={masterName} topNav={topNav} sidebarMenu="driver" className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Equipment Header */}
        <SectionHeader
          title={equipment.vehicleNumber}
          description={
            `${equipment.make || ""} ${equipment.model || ""} ${equipment.year || ""}`.trim() ||
            "Vehicle Details"
          }
          actions={
            <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
              <DialogTrigger asChild>
                <Button>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Equipment
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit {equipment.vehicleNumber}</DialogTitle>
                  <DialogDescription>Update equipment details and information</DialogDescription>
                </DialogHeader>
                <EquipmentForm
                  organizationId={organization?.id || ""}
                  equipment={equipment as any}
                  onSuccess={() => {
                    setShowEditForm(false);
                    fetchEquipment();
                  }}
                  onCancel={() => setShowEditForm(false)}
                />
              </DialogContent>
            </Dialog>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Vehicle Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Vehicle Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Vehicle Number</label>
                  <p className="text-sm font-medium">{equipment.vehicleNumber}</p>
                </div>

                {equipment.make && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Make</label>
                    <p className="text-sm">{equipment.make}</p>
                  </div>
                )}

                {equipment.model && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Model</label>
                    <p className="text-sm">{equipment.model}</p>
                  </div>
                )}

                {equipment.year && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Year</label>
                    <p className="text-sm">{equipment.year}</p>
                  </div>
                )}

                {equipment.vin && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">VIN</label>
                    <p className="text-sm font-mono text-xs">{equipment.vin}</p>
                  </div>
                )}

                {equipment.location && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Location</label>
                    <p className="text-sm flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {equipment.location.name}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Registration & Licensing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IdCard className="h-5 w-5" />
                Registration & Licensing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {equipment.licensePlate && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">License Plate</label>
                    <p className="text-sm">{equipment.licensePlate}</p>
                  </div>
                )}

                {equipment.registrationExpiry && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Registration Expiry</label>
                    <div className="flex items-center gap-2">
                      <p className="text-sm">
                        {new Date(equipment.registrationExpiry).toLocaleDateString()}
                      </p>
                      {registrationStatus.status === "current" && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                      {registrationStatus.status === "expiring" && (
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                      )}
                      {registrationStatus.status === "expired" && (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <p className={`text-xs ${registrationStatus.color}`}>
                      {registrationStatus.status === "expired"
                        ? `Expired ${Math.abs(registrationStatus.daysUntil!)} days ago`
                        : registrationStatus.status === "expiring"
                          ? `Expires in ${registrationStatus.daysUntil} days`
                          : `${registrationStatus.daysUntil} days remaining`}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Inspection & Compliance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Inspection & Compliance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {equipment.inspectionExpiry && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Annual Inspection Expiry
                    </label>
                    <div className="flex items-center gap-2">
                      <p className="text-sm">
                        {new Date(equipment.inspectionExpiry).toLocaleDateString()}
                      </p>
                      {inspectionStatus.status === "current" && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                      {inspectionStatus.status === "expiring" && (
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                      )}
                      {inspectionStatus.status === "expired" && (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <p className={`text-xs ${inspectionStatus.color}`}>
                      {inspectionStatus.status === "expired"
                        ? `Expired ${Math.abs(inspectionStatus.daysUntil!)} days ago`
                        : inspectionStatus.status === "expiring"
                          ? `Expires in ${inspectionStatus.daysUntil} days`
                          : `${inspectionStatus.daysUntil} days remaining`}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Compliance Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Registration</p>
                  <p className="text-2xl font-bold">1</p>
                </div>
                <IdCard className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Inspections</p>
                  <p className="text-2xl font-bold">2</p>
                </div>
                <Settings className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Maintenance</p>
                  <p className="text-2xl font-bold">5</p>
                </div>
                <FileText className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Incidents</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
                <AlertCircle className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
