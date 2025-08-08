"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { AppLayout } from "@/components/layouts/app-layout";
import { useMasterOrg } from "@/hooks/use-master-org";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Edit, Package, ArrowLeft, Settings, Filter, Tag, X, Search } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { ActivityLog } from "@/components/ui/activity-log";

interface Organization {
  id: string;
  name: string;
  dotNumber?: string | null;
}

interface Addon {
  id: string;
  name: string;
  category: string;
  description?: string;
  status: "active" | "inactive";
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

const ADDON_CATEGORIES = [
  "Safety",
  "Operations",
  "Logistics",
  "Maintenance",
  "Compliance",
  "Finance",
  "HR",
  "Technology",
];

const ADDON_STATUSES = [
  { value: "active", label: "Active", color: "bg-green-100 text-green-800" },
  { value: "inactive", label: "Inactive", color: "bg-gray-100 text-gray-800" },
];

export default function OrganizationOtherStuffPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const { masterOrg } = useMasterOrg();
  const masterOrgId = params.masterOrgId as string;
  const orgId = params.orgId as string;

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [filteredAddons, setFilteredAddons] = useState<Addon[]>([]);
  const [selectedAddon, setSelectedAddon] = useState<Addon | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  // Add form states
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    status: "active" as "active" | "inactive",
    tags: [] as string[],
  });
  const [newTag, setNewTag] = useState("");

  // Fetch organization data
  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        const response = await fetch(`/api/organizations/${orgId}`);
        if (response.ok) {
          const data = await response.json();
          setOrganization(data);
        }
      } catch (error) {
        console.error("Error fetching organization:", error);
      }
    };

    const fetchAddons = async () => {
      try {
        // TODO: Replace with actual API endpoint when available
        // For now, we'll use mock data structure
        const mockAddons: Addon[] = [
          {
            id: "1",
            name: "Safety Equipment Tracking",
            category: "Safety",
            description: "Track safety equipment maintenance and inspections",
            status: "active",
            tags: ["safety", "equipment", "maintenance"],
            createdAt: "2024-01-15",
            updatedAt: "2024-01-20",
          },
          {
            id: "2",
            name: "Fuel Management System",
            category: "Operations",
            description: "Monitor fuel consumption and efficiency metrics",
            status: "active",
            tags: ["fuel", "efficiency", "monitoring"],
            createdAt: "2024-01-10",
            updatedAt: "2024-01-18",
          },
          {
            id: "3",
            name: "Route Optimization",
            category: "Logistics",
            description: "Optimize delivery routes for efficiency",
            status: "inactive",
            tags: ["routes", "optimization", "delivery"],
            createdAt: "2024-01-05",
            updatedAt: "2024-01-12",
          },
          {
            id: "4",
            name: "Driver Performance Analytics",
            category: "HR",
            description: "Track and analyze driver performance metrics",
            status: "active",
            tags: ["analytics", "performance", "drivers"],
            createdAt: "2024-01-20",
            updatedAt: "2024-01-25",
          },
        ];

        setAddons(mockAddons);
        setFilteredAddons(mockAddons);
        // Auto-select first addon if any
        if (mockAddons.length > 0) {
          setSelectedAddon(mockAddons[0]);
        }
      } catch (error) {
        console.error("Error fetching addons:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (orgId) {
      fetchOrganization();
      fetchAddons();
    }
  }, [orgId]);

  // Filter addons based on search and filters
  useEffect(() => {
    let filtered = addons;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (addon) =>
          addon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          addon.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          addon.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          addon.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())),
      );
    }

    // Category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((addon) => selectedCategories.includes(addon.category));
    }

    // Status filter
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter((addon) => selectedStatuses.includes(addon.status));
    }

    // Tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter((addon) => selectedTags.some((tag) => addon.tags.includes(tag)));
    }

    setFilteredAddons(filtered);
  }, [addons, searchTerm, selectedCategories, selectedTags, selectedStatuses]);

  // Get all unique tags from addons
  const allTags = Array.from(new Set(addons.flatMap((addon) => addon.tags)));

  const handleAddAddon = async () => {
    try {
      // Validation
      if (!formData.name.trim()) {
        alert("Please enter a name for the addon");
        return;
      }
      if (!formData.category) {
        alert("Please select a category");
        return;
      }

      // TODO: Implement actual API call
      const newAddon: Addon = {
        id: Date.now().toString(), // Temporary ID generation
        name: formData.name,
        category: formData.category,
        description: formData.description,
        status: formData.status,
        tags: formData.tags,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setAddons((prev) => [...prev, newAddon]);
      setSelectedAddon(newAddon);
      setIsAddDialogOpen(false);

      // Reset form
      setFormData({
        name: "",
        category: "",
        description: "",
        status: "active",
        tags: [],
      });
    } catch (error) {
      console.error("Error adding addon:", error);
    }
  };

  const handleEditAddon = (addon: Addon) => {
    setFormData({
      name: addon.name,
      category: addon.category,
      description: addon.description || "",
      status: addon.status,
      tags: [...addon.tags],
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateAddon = async () => {
    if (!selectedAddon) return;

    try {
      // TODO: Implement actual API call
      const updatedAddon: Addon = {
        ...selectedAddon,
        name: formData.name,
        category: formData.category,
        description: formData.description,
        status: formData.status,
        tags: formData.tags,
        updatedAt: new Date().toISOString(),
      };

      setAddons((prev) =>
        prev.map((addon) => (addon.id === selectedAddon.id ? updatedAddon : addon)),
      );
      setSelectedAddon(updatedAddon);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating addon:", error);
    }
  };

  const handleAddonSelect = (addon: Addon) => {
    setSelectedAddon(addon);
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const toggleCategoryFilter = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    );
  };

  const toggleTagFilter = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const toggleStatusFilter = (status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status],
    );
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setSelectedCategories([]);
    setSelectedTags([]);
    setSelectedStatuses([]);
  };

  const activeFilterCount =
    selectedCategories.length +
    selectedTags.length +
    selectedStatuses.length +
    (searchTerm ? 1 : 0);

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

  // Correct static top navigation - NEVER make these dynamic!
  const topNav = [
    {
      label: "Master",
      href: masterOrg?.id ? `/master/${masterOrg.id}` : "/dashboard",
      isActive: false,
    },
    {
      label: "Organization",
      href: `/organizations/${orgId}`,
      isActive: true,
    },
    {
      label: "Drivers",
      href: `/organizations/${orgId}/drivers`,
      isActive: false,
    },
    {
      label: "Equipment",
      href: `/organizations/${orgId}/equipment`,
      isActive: false,
    },
  ];

  return (
    <AppLayout name={masterOrg?.name || "Master"} topNav={topNav} className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with organization name */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/organizations/${orgId}`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Organization
            </Button>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{organization?.name}</h1>
        </div>

        <div className="flex gap-6">
          {/* Master List (300px wide) */}
          <div className="w-80 flex-shrink-0">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Other Stuff
                      <Badge variant="secondary">{filteredAddons.length}</Badge>
                    </CardTitle>
                    <CardDescription>Manage additional features and addons</CardDescription>
                  </div>
                  <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                      <DialogHeader>
                        <DialogTitle>Add New Addon</DialogTitle>
                        <DialogDescription>
                          Create a new addon or feature for this organization
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="name">Name</Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) =>
                              setFormData((prev) => ({ ...prev, name: e.target.value }))
                            }
                            placeholder="Enter addon name"
                          />
                        </div>

                        <div>
                          <Label htmlFor="category">Category</Label>
                          <Select
                            value={formData.category}
                            onValueChange={(value) =>
                              setFormData((prev) => ({ ...prev, category: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {ADDON_CATEGORIES.map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) =>
                              setFormData((prev) => ({ ...prev, description: e.target.value }))
                            }
                            placeholder="Enter addon description"
                            rows={3}
                          />
                        </div>

                        <div>
                          <Label htmlFor="status">Status</Label>
                          <Select
                            value={formData.status}
                            onValueChange={(value: "active" | "inactive") =>
                              setFormData((prev) => ({ ...prev, status: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Tags</Label>
                          <div className="flex gap-2 mb-2">
                            <Input
                              value={newTag}
                              onChange={(e) => setNewTag(e.target.value)}
                              placeholder="Add tag"
                              onKeyPress={(e) => e.key === "Enter" && addTag()}
                            />
                            <Button type="button" onClick={addTag} size="sm">
                              Add
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {formData.tags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="flex items-center gap-1"
                              >
                                {tag}
                                <X
                                  className="h-3 w-3 cursor-pointer"
                                  onClick={() => removeTag(tag)}
                                />
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleAddAddon}>Create Addon</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Search and Filter Controls */}
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search addons..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Filter className="h-4 w-4 mr-1" />
                          Filter
                          {activeFilterCount > 0 && (
                            <Badge variant="secondary" className="ml-1 text-xs">
                              {activeFilterCount}
                            </Badge>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80" align="start">
                        <div className="space-y-4">
                          {/* Category Filters */}
                          <div>
                            <Label className="text-sm font-medium">Categories</Label>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {ADDON_CATEGORIES.map((category) => (
                                <Badge
                                  key={category}
                                  variant={
                                    selectedCategories.includes(category) ? "default" : "outline"
                                  }
                                  className="cursor-pointer"
                                  onClick={() => toggleCategoryFilter(category)}
                                >
                                  {category}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* Status Filters */}
                          <div>
                            <Label className="text-sm font-medium">Status</Label>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {ADDON_STATUSES.map((status) => (
                                <Badge
                                  key={status.value}
                                  variant={
                                    selectedStatuses.includes(status.value) ? "default" : "outline"
                                  }
                                  className="cursor-pointer"
                                  onClick={() => toggleStatusFilter(status.value)}
                                >
                                  {status.label}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* Tag Filters */}
                          {allTags.length > 0 && (
                            <div>
                              <Label className="text-sm font-medium">Tags</Label>
                              <div className="flex flex-wrap gap-1 mt-2 max-h-32 overflow-y-auto">
                                {allTags.map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                                    className="cursor-pointer"
                                    onClick={() => toggleTagFilter(tag)}
                                  >
                                    <Tag className="h-3 w-3 mr-1" />
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Clear Filters */}
                          {activeFilterCount > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={clearAllFilters}
                              className="w-full"
                            >
                              Clear All Filters
                            </Button>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredAddons.length > 0 ? (
                  <div className="space-y-2">
                    {filteredAddons.map((addon) => (
                      <Card
                        key={addon.id}
                        className={`cursor-pointer transition-colors ${
                          selectedAddon?.id === addon.id
                            ? "border-blue-500 bg-blue-50"
                            : "hover:bg-gray-50"
                        }`}
                        onClick={() => handleAddonSelect(addon)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{addon.name}</h4>
                              <p className="text-xs text-gray-600">{addon.category}</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {addon.tags.slice(0, 2).map((tag) => (
                                  <Badge key={tag} variant="secondary" className="text-xs px-1">
                                    {tag}
                                  </Badge>
                                ))}
                                {addon.tags.length > 2 && (
                                  <Badge variant="outline" className="text-xs px-1">
                                    +{addon.tags.length - 2}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Badge
                              variant={addon.status === "active" ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {addon.status}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={Package}
                    title={
                      searchTerm || activeFilterCount > 0 ? "No matching addons" : "No addons yet"
                    }
                    description={
                      searchTerm || activeFilterCount > 0
                        ? "Try adjusting your search or filters"
                        : "Add your first addon to get started"
                    }
                    action={
                      searchTerm || activeFilterCount > 0
                        ? {
                            label: "Clear Filters",
                            onClick: clearAllFilters,
                          }
                        : {
                            label: "Add First Addon",
                            onClick: () => setIsAddDialogOpen(true),
                          }
                    }
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Content Area */}
          <div className="flex-1">
            {selectedAddon ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        {selectedAddon.name}
                      </CardTitle>
                      <CardDescription>
                        {selectedAddon.description || "No description available"}
                      </CardDescription>
                    </div>
                    <Button variant="outline" onClick={() => handleEditAddon(selectedAddon)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Addon Details */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-medium text-sm text-gray-600 mb-1">Category</h5>
                        <p className="text-sm">{selectedAddon.category}</p>
                      </div>
                      <div>
                        <h5 className="font-medium text-sm text-gray-600 mb-1">Status</h5>
                        <Badge
                          variant={selectedAddon.status === "active" ? "default" : "secondary"}
                        >
                          {selectedAddon.status}
                        </Badge>
                      </div>
                      <div>
                        <h5 className="font-medium text-sm text-gray-600 mb-1">Created</h5>
                        <p className="text-sm">
                          {new Date(selectedAddon.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <h5 className="font-medium text-sm text-gray-600 mb-1">Last Updated</h5>
                        <p className="text-sm">
                          {new Date(selectedAddon.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Tags */}
                    <div>
                      <h5 className="font-medium text-gray-900 mb-3">Tags</h5>
                      <div className="flex flex-wrap gap-2">
                        {selectedAddon.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Addon Configuration */}
                    <div>
                      <h5 className="font-medium text-gray-900 mb-3">Configuration</h5>
                      <Card className="bg-gray-50">
                        <CardContent className="p-4">
                          <p className="text-sm text-gray-600">
                            Configuration options for {selectedAddon.name} will be available here.
                            This is where users can customize settings, view usage statistics, and
                            manage addon-specific features.
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Activity Log */}
                    <div>
                      <h5 className="font-medium text-gray-900 mb-3">Recent Activity</h5>
                      <ActivityLog organizationId={orgId} title="Addon Activity" compact={true} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select an addon</h3>
                  <p className="text-gray-600">
                    Choose an addon from the list to view its details and configuration options.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit Addon</DialogTitle>
              <DialogDescription>Update the addon information and settings</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter addon name"
                />
              </div>

              <div>
                <Label htmlFor="edit-category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {ADDON_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Enter addon description"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "active" | "inactive") =>
                    setFormData((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Tags</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add tag"
                    onKeyPress={(e) => e.key === "Enter" && addTag()}
                  />
                  <Button type="button" onClick={addTag} size="sm">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateAddon}>Update Addon</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
