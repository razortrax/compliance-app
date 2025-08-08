"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Building2,
  MapPin,
  Users,
  Truck,
  ArrowLeft,
  Edit,
  Save,
  X,
  Plus,
  Phone,
  Building,
  AlertCircle,
  ChevronRight,
  Mail,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable } from "@/components/ui/data-table";
import Link from "next/link";

interface EntityData {
  id: string;
  partyId: string;
  name: string;
  // Organization fields
  dotNumber?: string | null;
  einNumber?: string | null;
  // Location fields
  locationType?: string;
  isMainLocation?: boolean;
  // Common fields
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  email?: string | null;
  isActive?: boolean;
  party?: {
    status: string;
    userId?: string | null;
  };
  // Related entities
  locations?: any[];
  parentOrganization?: any;
  childLocations?: any[];
}

interface EntityDetailPageProps {
  entityType: "organization" | "location";
  entityId: string;
}

export function EntityDetailPage({ entityType, entityId }: EntityDetailPageProps) {
  const router = useRouter();
  const [entity, setEntity] = useState<EntityData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedEntity, setEditedEntity] = useState<EntityData | null>(null);
  const [relatedEntities, setRelatedEntities] = useState<EntityData[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Fetch entity data based on type
  const fetchEntityData = async () => {
    try {
      const endpoint =
        entityType === "organization"
          ? `/api/organizations/${entityId}`
          : `/api/locations/${entityId}`;

      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        setEntity(data);
        setEditedEntity(data);

        // Fetch related entities (locations for org, parent org for location)
        if (entityType === "organization") {
          const locResponse = await fetch(`/api/organizations/${entityId}/locations`);
          if (locResponse.ok) {
            const locations = await locResponse.json();
            setEntity((prev) => (prev ? { ...prev, locations } : null));
          }
        } else {
          // For locations, fetch parent organization
          const orgResponse = await fetch(`/api/locations/${entityId}/organization`);
          if (orgResponse.ok) {
            const parentOrg = await orgResponse.json();
            setEntity((prev) => (prev ? { ...prev, parentOrganization: parentOrg } : null));
          }
        }

        // Fetch related entities for switcher
        const relatedEndpoint =
          entityType === "organization" ? "/api/organizations" : "/api/locations";
        const relatedResponse = await fetch(relatedEndpoint);
        if (relatedResponse.ok) {
          const related = await relatedResponse.json();
          setRelatedEntities(related.filter((e: EntityData) => e.id !== entityId));
        }
      }
    } catch (error) {
      console.error("Error fetching entity data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (entityId) {
      fetchEntityData();
    }
  }, [entityType, entityId]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditedEntity(entity);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedEntity(entity);
  };

  const handleSave = async () => {
    if (!editedEntity) return;

    setIsSaving(true);
    try {
      const endpoint =
        entityType === "organization"
          ? `/api/organizations/${entityId}`
          : `/api/locations/${entityId}`;

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editedEntity),
      });

      if (response.ok) {
        const updated = await response.json();
        setEntity(updated);
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error saving entity:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEntitySelect = (selectedEntity: EntityData) => {
    setIsSheetOpen(false);
    const route =
      entityType === "organization"
        ? `/organizations/${selectedEntity.id}`
        : `/locations/${selectedEntity.id}`;
    router.push(route);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!entity) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {entityType === "organization" ? "Organization" : "Location"} not found
            </h2>
            <Button onClick={() => router.push("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const breadcrumbs = () => {
    if (entityType === "location" && entity.parentOrganization) {
      return [
        { label: "Organizations", href: "/dashboard" },
        {
          label: entity.parentOrganization.name,
          href: `/organizations/${entity.parentOrganization.id}`,
        },
        { label: entity.name },
      ];
    }
    return [{ label: "Organizations", href: "/dashboard" }, { label: entity.name }];
  };

  const getEntityIcon = () => (entityType === "organization" ? Building2 : MapPin);
  const EntityIcon = getEntityIcon();

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600">
          {breadcrumbs().map((crumb, index) => (
            <div key={index} className="flex items-center">
              {index > 0 && <span className="text-gray-400 mx-2">/</span>}
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-gray-900">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-gray-900">{crumb.label}</span>
              )}
            </div>
          ))}
        </nav>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Entity Switcher */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="default"
                  className="h-10 px-3 border-gray-300 hover:bg-gray-50"
                >
                  <EntityIcon className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle>
                    Switch {entityType === "organization" ? "Organization" : "Location"}
                  </SheetTitle>
                  <SheetDescription>Select a different {entityType} to manage</SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-2">
                  {relatedEntities.map((relatedEntity) => (
                    <button
                      key={relatedEntity.id}
                      onClick={() => handleEntitySelect(relatedEntity)}
                      className="w-full text-left p-3 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-between group"
                    >
                      <div>
                        <div className="font-medium">{relatedEntity.name}</div>
                        {entityType === "organization" && relatedEntity.dotNumber && (
                          <div className="text-sm text-gray-500">
                            DOT: {relatedEntity.dotNumber}
                          </div>
                        )}
                        {entityType === "location" && (
                          <div className="text-sm text-gray-500 capitalize">
                            {relatedEntity.locationType}
                          </div>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                    </button>
                  ))}
                </div>
              </SheetContent>
            </Sheet>

            <PageHeader title={entity.name} />
          </div>

          {/* Edit Button */}
          <div>
            {!isEditing ? (
              <Button onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            {entityType === "organization" && (
              <TabsTrigger value="locations">Locations</TabsTrigger>
            )}
            <TabsTrigger value="drivers">Drivers</TabsTrigger>
            <TabsTrigger value="equipment">Equipment</TabsTrigger>
            <TabsTrigger value="issues">Issues</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>
                      {entityType === "organization" ? "Organization" : "Location"} Information
                    </CardTitle>
                    <CardDescription>Basic details and contact information</CardDescription>
                  </div>
                  <StatusBadge status={(entity.party?.status as any) || "active"} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>
                      {entityType === "organization" ? "Organization" : "Location"} Name
                    </Label>
                    {isEditing ? (
                      <Input
                        value={editedEntity?.name || ""}
                        onChange={(e) =>
                          setEditedEntity((prev) =>
                            prev ? { ...prev, name: e.target.value } : null,
                          )
                        }
                      />
                    ) : (
                      <p className="text-gray-900">{entity.name}</p>
                    )}
                  </div>

                  {/* Organization-specific fields */}
                  {entityType === "organization" && (
                    <>
                      <div className="space-y-2">
                        <Label>DOT Number</Label>
                        {isEditing ? (
                          <Input
                            value={editedEntity?.dotNumber || ""}
                            onChange={(e) =>
                              setEditedEntity((prev) =>
                                prev ? { ...prev, dotNumber: e.target.value } : null,
                              )
                            }
                          />
                        ) : (
                          <p className="text-gray-900">
                            {entity.dotNumber === "NO_DOT"
                              ? "No DOT Number"
                              : entity.dotNumber || "Not provided"}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>EIN Number</Label>
                        {isEditing ? (
                          <Input
                            value={editedEntity?.einNumber || ""}
                            onChange={(e) =>
                              setEditedEntity((prev) =>
                                prev ? { ...prev, einNumber: e.target.value } : null,
                              )
                            }
                            placeholder="XX-XXXXXXX"
                          />
                        ) : (
                          <p className="text-gray-900">{entity.einNumber || "Not provided"}</p>
                        )}
                      </div>
                    </>
                  )}

                  {/* Location-specific fields */}
                  {entityType === "location" && (
                    <>
                      <div className="space-y-2">
                        <Label>Location Type</Label>
                        <p className="text-gray-900 capitalize">{entity.locationType}</p>
                      </div>

                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Badge variant={entity.isMainLocation ? "default" : "secondary"}>
                          {entity.isMainLocation ? "Main Location" : "Secondary Location"}
                        </Badge>
                      </div>
                    </>
                  )}

                  {/* Common fields */}
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    {isEditing ? (
                      <Input
                        value={editedEntity?.phone || ""}
                        onChange={(e) =>
                          setEditedEntity((prev) =>
                            prev ? { ...prev, phone: e.target.value } : null,
                          )
                        }
                      />
                    ) : (
                      <p className="text-gray-900">{entity.phone || "Not provided"}</p>
                    )}
                  </div>

                  {entity.email && (
                    <div className="space-y-2">
                      <Label>Email</Label>
                      {isEditing ? (
                        <Input
                          value={editedEntity?.email || ""}
                          onChange={(e) =>
                            setEditedEntity((prev) =>
                              prev ? { ...prev, email: e.target.value } : null,
                            )
                          }
                        />
                      ) : (
                        <p className="text-gray-900">{entity.email}</p>
                      )}
                    </div>
                  )}

                  <div className="space-y-2 md:col-span-2">
                    <Label>Address</Label>
                    {isEditing ? (
                      <Textarea
                        value={editedEntity?.address || ""}
                        onChange={(e) =>
                          setEditedEntity((prev) =>
                            prev ? { ...prev, address: e.target.value } : null,
                          )
                        }
                        rows={2}
                      />
                    ) : (
                      <p className="text-gray-900">{entity.address || "Not provided"}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>City</Label>
                    {isEditing ? (
                      <Input
                        value={editedEntity?.city || ""}
                        onChange={(e) =>
                          setEditedEntity((prev) =>
                            prev ? { ...prev, city: e.target.value } : null,
                          )
                        }
                      />
                    ) : (
                      <p className="text-gray-900">{entity.city || "Not provided"}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>State</Label>
                    {isEditing ? (
                      <Input
                        value={editedEntity?.state || ""}
                        onChange={(e) =>
                          setEditedEntity((prev) =>
                            prev ? { ...prev, state: e.target.value } : null,
                          )
                        }
                      />
                    ) : (
                      <p className="text-gray-900">{entity.state || "Not provided"}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Zip Code</Label>
                    {isEditing ? (
                      <Input
                        value={editedEntity?.zipCode || ""}
                        onChange={(e) =>
                          setEditedEntity((prev) =>
                            prev ? { ...prev, zipCode: e.target.value } : null,
                          )
                        }
                      />
                    ) : (
                      <p className="text-gray-900">{entity.zipCode || "Not provided"}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Locations Tab (Organizations only) */}
          {entityType === "organization" && (
            <TabsContent value="locations" className="mt-6">
              <SectionHeader
                title="Locations"
                description="Manage terminals, yards, and offices"
                actions={
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Location
                  </Button>
                }
              />

              {entity.locations && entity.locations.length > 0 ? (
                <DataTable
                  columns={[
                    {
                      accessorKey: "name",
                      header: "Location Name",
                      cell: ({ row }: any) => (
                        <Link
                          href={`/locations/${row.original.id}`}
                          className="font-medium text-blue-600 hover:text-blue-800 flex items-center gap-2"
                        >
                          {row.getValue("name")}
                          {row.original.isMainLocation && (
                            <Badge variant="default" className="text-xs">
                              Main
                            </Badge>
                          )}
                        </Link>
                      ),
                    },
                    {
                      accessorKey: "locationType",
                      header: "Type",
                      cell: ({ row }: any) => (
                        <Badge variant="outline" className="capitalize">
                          {row.getValue("locationType")}
                        </Badge>
                      ),
                    },
                    {
                      accessorKey: "address",
                      header: "Address",
                      cell: ({ row }: any) => (
                        <div className="text-sm">
                          <div>{row.original.address}</div>
                          <div className="text-gray-500">
                            {row.original.city}, {row.original.state} {row.original.zipCode}
                          </div>
                        </div>
                      ),
                    },
                  ]}
                  data={entity.locations}
                />
              ) : (
                <EmptyState
                  icon={Building2}
                  title="No locations yet"
                  description="Add terminals, yards, or offices to organize your operations"
                  action={{
                    label: "Add First Location",
                    onClick: () => {},
                  }}
                />
              )}
            </TabsContent>
          )}

          {/* Other tabs (Drivers, Equipment, Issues) remain the same for both entity types */}
          <TabsContent value="drivers" className="mt-6">
            <EmptyState
              icon={Users}
              title="No drivers assigned"
              description={`Drivers assigned to this ${entityType} will appear here.`}
              action={{
                label: "Add Driver",
                onClick: () => {},
              }}
            />
          </TabsContent>

          <TabsContent value="equipment" className="mt-6">
            <EmptyState
              icon={Truck}
              title="No equipment assigned"
              description={`Equipment assigned to this ${entityType} will appear here.`}
              action={{
                label: "Add Equipment",
                onClick: () => {},
              }}
            />
          </TabsContent>

          <TabsContent value="issues" className="mt-6">
            <EmptyState
              icon={AlertCircle}
              title="No active issues"
              description={`Compliance issues for this ${entityType} will appear here.`}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
