"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AppLayout } from "@/components/layouts/app-layout";
import { buildStandardNavigation } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Shield,
  AlertTriangle,
  Plus,
} from "lucide-react";
import Link from "next/link";

interface Equipment {
  id: string;
  vehicleType: string;
  make?: string;
  model?: string;
  year?: number;
  vinNumber?: string;
  plateNumber?: string;
  registrationExpiry?: string;
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
}

export default function MasterEquipmentDetailPage() {
  const params = useParams();
  const masterOrgId = params.masterOrgId as string;
  const orgId = params.orgId as string;
  const equipmentId = params.equipmentId as string;

  const [data, setData] = useState<PageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (equipmentId) {
      fetchData();
      fetchUserRole();
    }
  }, [equipmentId, masterOrgId, orgId]);

  const fetchUserRole = async () => {
    try {
      const response = await fetch("/api/user/role");
      if (response.ok) {
        const data = await response.json();
        setUserRole(data.role?.roleType || null);
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
    }
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/master/${masterOrgId}/organization/${orgId}/equipment/${equipmentId}`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch equipment details");
      }

      const pageData = await response.json();
      setData(pageData);
    } catch (error) {
      console.error("Error fetching equipment:", error);
      setError(error instanceof Error ? error.message : "An unknown error occurred");
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
      <AppLayout
        name={data?.masterOrg?.name || "Loading..."}
        sidebarMenu="equipment"
        className="p-6"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Truck className="h-8 w-8 animate-pulse mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Loading equipment details...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout name={data?.masterOrg?.name || "Error"} sidebarMenu="equipment" className="p-6">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold mb-2">Failed to Load Equipment</h3>
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
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold mb-2">Equipment Not Found</h3>
          <p className="text-gray-600">The requested equipment could not be found.</p>
        </div>
      </AppLayout>
    );
  }

  const registrationStatus = getExpirationStatus(data.equipment.registrationExpiry);

  return (
    <AppLayout
      name={data.masterOrg.name}
      sidebarMenu="equipment"
      topNav={buildStandardNavigation(masterOrgId, orgId, userRole || undefined)}
      className="p-6"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {data.equipment.make} {data.equipment.model} ({data.equipment.vehicleType})
            </h1>
            <p className="text-gray-600 mt-1">
              {data.organization.name} • Unit #{data.equipment.id.slice(-6)}
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Edit Equipment</DialogTitle>
                  <DialogDescription>Update equipment information and details</DialogDescription>
                </DialogHeader>
                <EquipmentForm
                  organizationId={orgId}
                  equipment={data.equipment as any}
                  onSuccess={() => {
                    setShowEditForm(false);
                    fetchData();
                  }}
                  onCancel={() => setShowEditForm(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Equipment Issues - Quick Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href={`/master/${masterOrgId}/organization/${orgId}/equipment/${equipmentId}/roadside-inspections`}
          >
            <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="h-4 w-4 text-blue-500" />
                      <p className="text-sm font-medium text-gray-600">Roadside Inspections</p>
                    </div>
                    <p className="text-2xl font-bold">--</p>
                    <p className="text-xs text-gray-500">Click to view/manage</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link
            href={`/master/${masterOrgId}/organization/${orgId}/equipment/${equipmentId}/accidents`}
          >
            <Card className="border-l-4 border-l-red-500 hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <p className="text-sm font-medium text-gray-600">Accidents</p>
                    </div>
                    <p className="text-2xl font-bold">--</p>
                    <p className="text-xs text-gray-500">Click to view/manage</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Equipment Details */}
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
                  <label className="text-sm font-medium text-gray-500">Vehicle Type</label>
                  <p className="text-sm font-medium">{data.equipment.vehicleType}</p>
                </div>

                {data.equipment.make && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Make</label>
                    <p className="text-sm">{data.equipment.make}</p>
                  </div>
                )}

                {data.equipment.model && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Model</label>
                    <p className="text-sm">{data.equipment.model}</p>
                  </div>
                )}

                {data.equipment.year && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Year</label>
                    <p className="text-sm">{data.equipment.year}</p>
                  </div>
                )}

                {data.equipment.vinNumber && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">VIN</label>
                    <p className="text-sm font-mono text-xs">{data.equipment.vinNumber}</p>
                  </div>
                )}

                {data.equipment.location && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Location</label>
                    <p className="text-sm flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {data.equipment.location.name}
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
                {data.equipment.plateNumber && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">License Plate</label>
                    <p className="text-sm">{data.equipment.plateNumber}</p>
                  </div>
                )}

                {data.equipment.registrationExpiry && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Registration Expiry</label>
                    <div className="flex items-center gap-2">
                      <p className="text-sm">
                        {new Date(data.equipment.registrationExpiry).toLocaleDateString()}
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
                <div className="text-center text-gray-500 py-4">
                  <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Inspection tracking coming soon</p>
                </div>
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
