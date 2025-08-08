"use client";

import { useState, useEffect } from "react";
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
import { EmptyState } from "@/components/ui/empty-state";
import {
  Plus,
  Filter,
  Search,
  X,
  Tag,
  ExternalLink,
  FileText,
  Paperclip,
  Link,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";

interface OrganizationAddon {
  id: string;
  name: string;
  type: "attachment" | "note" | "url";
  description?: string;
  content?: string; // For notes
  url?: string; // For URLs
  username?: string; // For URL logins
  password?: string; // For URL logins (encrypted in real app)
  fileName?: string; // For attachments
  fileSize?: string; // For attachments
  filePath?: string; // For attachments
  tags: string[];
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

const ADDON_TYPES = [
  { value: "attachment", label: "Attachment", icon: Paperclip },
  { value: "note", label: "Note", icon: FileText },
  { value: "url", label: "URL with Login", icon: Link },
];

const ADDON_STATUSES = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

interface OrganizationAddOnsProps {
  organizationId: string;
  organizationName: string;
}

export function OrganizationAddOns({ organizationId, organizationName }: OrganizationAddOnsProps) {
  const [addons, setAddons] = useState<OrganizationAddon[]>([]);
  const [filteredAddons, setFilteredAddons] = useState<OrganizationAddon[]>([]);
  const [selectedAddon, setSelectedAddon] = useState<OrganizationAddon | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Form states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "note" as "attachment" | "note" | "url",
    description: "",
    content: "",
    url: "",
    username: "",
    password: "",
    tags: [] as string[],
  });
  const [newTag, setNewTag] = useState("");

  // Mock data for demonstration
  useEffect(() => {
    const mockAddons: OrganizationAddon[] = [
      {
        id: "1",
        name: "DOT Compliance Checklist",
        type: "attachment",
        description: "Annual DOT compliance verification checklist",
        fileName: "DOT_Compliance_Checklist_2025.pdf",
        fileSize: "2.3 MB",
        filePath: "/uploads/attachments/dot-checklist.pdf",
        tags: ["compliance", "DOT", "annual"],
        status: "active",
        createdAt: "2025-01-15T10:00:00Z",
        updatedAt: "2025-01-15T10:00:00Z",
      },
      {
        id: "2",
        name: "Fleet Safety Meeting Notes",
        type: "note",
        description: "Monthly safety meeting agenda and key points",
        content:
          "Key topics covered:\n- Winter driving safety protocols\n- New DOT regulations effective March 2025\n- Equipment inspection reminders\n- Driver training schedule updates\n\nAction items:\n- Schedule defensive driving refresher for all drivers\n- Update emergency contact information\n- Review and update vehicle inspection checklists",
        tags: ["safety", "meetings", "protocols"],
        status: "active",
        createdAt: "2025-01-10T14:30:00Z",
        updatedAt: "2025-01-10T14:30:00Z",
      },
      {
        id: "3",
        name: "FMCSA Portal Access",
        type: "url",
        description: "Direct access to FMCSA DataQs portal for accident reports",
        url: "https://dataqs.fmcsa.dot.gov/",
        username: "fleetadmin@company.com",
        password: "••••••••••",
        tags: ["FMCSA", "reports", "portal"],
        status: "active",
        createdAt: "2025-01-05T09:15:00Z",
        updatedAt: "2025-01-05T09:15:00Z",
      },
      {
        id: "4",
        name: "Insurance Certificate Archive",
        type: "attachment",
        description: "Current insurance certificates and policies",
        fileName: "Insurance_Certificates_2025.zip",
        fileSize: "15.7 MB",
        filePath: "/uploads/attachments/insurance-certs.zip",
        tags: ["insurance", "certificates", "policies"],
        status: "active",
        createdAt: "2025-01-01T12:00:00Z",
        updatedAt: "2025-01-01T12:00:00Z",
      },
    ];

    setAddons(mockAddons);
    setFilteredAddons(mockAddons);
    if (mockAddons.length > 0) {
      setSelectedAddon(mockAddons[0]);
    }
  }, []);

  // Filter addons based on search and filters
  useEffect(() => {
    let filtered = addons;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (addon) =>
          addon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          addon.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          addon.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          addon.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())),
      );
    }

    // Type filter
    if (selectedTypes.length > 0) {
      filtered = filtered.filter((addon) => selectedTypes.includes(addon.type));
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
  }, [addons, searchTerm, selectedTypes, selectedStatuses, selectedTags]);

  // Get all unique tags from addons
  const allTags = Array.from(new Set(addons.flatMap((addon) => addon.tags)));

  const handleAddAddon = async () => {
    if (!formData.name.trim()) {
      alert("Please enter a name for the add-on");
      return;
    }

    const newAddon: OrganizationAddon = {
      id: Date.now().toString(),
      name: formData.name,
      type: formData.type,
      description: formData.description || undefined,
      content: formData.type === "note" ? formData.content : undefined,
      url: formData.type === "url" ? formData.url : undefined,
      username: formData.type === "url" ? formData.username : undefined,
      password: formData.type === "url" ? formData.password : undefined,
      tags: formData.tags,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setAddons((prev) => [...prev, newAddon]);
    setSelectedAddon(newAddon);
    setShowAddDialog(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: "",
      type: "note",
      description: "",
      content: "",
      url: "",
      username: "",
      password: "",
      tags: [],
    });
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

  const toggleTypeFilter = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const toggleStatusFilter = (status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status],
    );
  };

  const toggleTagFilter = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setSelectedTypes([]);
    setSelectedStatuses([]);
    setSelectedTags([]);
  };

  const quickFilterNotes = () => {
    setSelectedTypes(["note"]);
    setSelectedStatuses([]);
    setSelectedTags([]);
  };

  const quickFilterDocs = () => {
    setSelectedTypes(["attachment"]);
    setSelectedStatuses([]);
    setSelectedTags([]);
  };

  const quickFilterLogins = () => {
    setSelectedTypes(["url"]);
    setSelectedStatuses([]);
    setSelectedTags([]);
  };

  const isQuickFilterActive = (type: string) => {
    return (
      selectedTypes.length === 1 &&
      selectedTypes[0] === type &&
      selectedStatuses.length === 0 &&
      selectedTags.length === 0
    );
  };

  const getTypeIcon = (type: string) => {
    const typeConfig = ADDON_TYPES.find((t) => t.value === type);
    return typeConfig?.icon || FileText;
  };

  const handleUrlOpen = (addon: OrganizationAddon) => {
    if (addon.url) {
      // For now, just open the URL in a new tab
      // Future enhancement: Auto-fill credentials (requires browser extension or advanced implementation)
      window.open(addon.url, "_blank");

      // If credentials exist, show a helpful message
      if (addon.username) {
        alert(
          `Opening ${addon.name}\n\nUsername: ${addon.username}\n\nPassword will need to be entered manually for security.`,
        );
      }
    }
  };

  return (
    <div className="grid grid-cols-12 gap-6 h-[600px]">
      {/* Left Sidebar - Add Ons List (300px) */}
      <div className="col-span-4 border-r border-gray-200 pr-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Stuff</h3>
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Add-On</DialogTitle>
                  <DialogDescription>
                    Create a new attachment, note, or URL for {organizationName}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Type Selection - Make this prominent */}
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <Label htmlFor="type" className="text-base font-semibold">
                      Select Add-On Type
                    </Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: any) =>
                        setFormData((prev) => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ADDON_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <type.icon className="h-4 w-4" />
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Basic Fields */}
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder={`Enter ${formData.type === "note" ? "note" : formData.type === "url" ? "login" : "document"} name`}
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, description: e.target.value }))
                      }
                      placeholder={`Brief description of this ${formData.type === "note" ? "note" : formData.type === "url" ? "login resource" : "document"}`}
                    />
                  </div>

                  {/* Type-Specific Content Area */}
                  <div className="p-4 border rounded-lg bg-blue-50">
                    <h4 className="font-medium mb-3 text-blue-900">
                      {formData.type === "note" && "📝 Note Content"}
                      {formData.type === "url" && "🔗 Login Details"}
                      {formData.type === "attachment" && "📎 Document Upload"}
                    </h4>

                    {/* Note-specific fields */}
                    {formData.type === "note" && (
                      <div>
                        <Label htmlFor="content">Note Content</Label>
                        <Textarea
                          id="content"
                          value={formData.content}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, content: e.target.value }))
                          }
                          placeholder="Enter your note content here..."
                          rows={4}
                          className="mt-2"
                        />
                      </div>
                    )}

                    {/* URL-specific fields */}
                    {formData.type === "url" && (
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="url">Website URL</Label>
                          <Input
                            id="url"
                            value={formData.url}
                            onChange={(e) =>
                              setFormData((prev) => ({ ...prev, url: e.target.value }))
                            }
                            placeholder="https://example.com"
                            className="mt-1"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor="username">Username</Label>
                            <Input
                              id="username"
                              value={formData.username}
                              onChange={(e) =>
                                setFormData((prev) => ({ ...prev, username: e.target.value }))
                              }
                              placeholder="Login username"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="password">Password</Label>
                            <Input
                              id="password"
                              type="password"
                              value={formData.password}
                              onChange={(e) =>
                                setFormData((prev) => ({ ...prev, password: e.target.value }))
                              }
                              placeholder="Login password"
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Attachment-specific fields */}
                    {formData.type === "attachment" && (
                      <div className="text-center py-6">
                        <Paperclip className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                        <p className="text-sm text-gray-600 mb-2">File Upload Coming Soon</p>
                        <p className="text-xs text-gray-500">
                          Use Notes or URLs for now to reference documents
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
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
                        <Tag className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {formData.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                          <X
                            className="h-3 w-3 ml-1 cursor-pointer"
                            onClick={() => removeTag(tag)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Button onClick={handleAddAddon} className="w-full">
                    Create{" "}
                    {formData.type === "note"
                      ? "Note"
                      : formData.type === "url"
                        ? "Login"
                        : "Document"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search add-ons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-4 gap-2">
            {/* Main Filter Dropdown - Icon Only */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="w-full justify-center">
                  <Filter className="h-4 w-4" />
                  {selectedTypes.length + selectedStatuses.length + selectedTags.length > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs px-1">
                      {selectedTypes.length + selectedStatuses.length + selectedTags.length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  {/* Type Filter */}
                  <div>
                    <Label className="text-sm font-medium">Type</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {ADDON_TYPES.map((type) => (
                        <Badge
                          key={type.value}
                          variant={selectedTypes.includes(type.value) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => toggleTypeFilter(type.value)}
                        >
                          {type.label}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {ADDON_STATUSES.map((status) => (
                        <Badge
                          key={status.value}
                          variant={selectedStatuses.includes(status.value) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => toggleStatusFilter(status.value)}
                        >
                          {status.label}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Tag Filter */}
                  {allTags.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">Tags</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {allTags.map((tag) => (
                          <Badge
                            key={tag}
                            variant={selectedTags.includes(tag) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => toggleTagFilter(tag)}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button variant="outline" size="sm" onClick={clearAllFilters} className="w-full">
                    Clear All Filters
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Quick Filter Buttons */}
            <Button
              variant={isQuickFilterActive("note") ? "default" : "outline"}
              size="sm"
              onClick={quickFilterNotes}
              className="w-full"
            >
              Notes
            </Button>

            <Button
              variant={isQuickFilterActive("attachment") ? "default" : "outline"}
              size="sm"
              onClick={quickFilterDocs}
              className="w-full"
            >
              Docs
            </Button>

            <Button
              variant={isQuickFilterActive("url") ? "default" : "outline"}
              size="sm"
              onClick={quickFilterLogins}
              className="w-full"
            >
              Logins
            </Button>
          </div>

          {/* Add Ons List */}
          <div className="space-y-2 overflow-y-auto">
            {filteredAddons.length > 0 ? (
              filteredAddons.map((addon) => {
                const IconComponent = getTypeIcon(addon.type);
                return (
                  <Card
                    key={addon.id}
                    className={`cursor-pointer transition-colors ${
                      selectedAddon?.id === addon.id
                        ? "ring-2 ring-blue-500 bg-blue-50"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedAddon(addon)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-2 flex-1">
                          <IconComponent className="h-4 w-4 mt-0.5 text-gray-500" />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{addon.name}</h4>
                            {addon.description && (
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                {addon.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <Badge
                                variant={addon.status === "active" ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {addon.status}
                              </Badge>
                              <div className="flex gap-1">
                                {addon.tags.slice(0, 2).map((tag) => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                {addon.tags.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{addon.tags.length - 2}
                                  </Badge>
                                )}
                              </div>
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
                icon={Filter}
                title="No add-ons found"
                description={
                  searchTerm ||
                  selectedTypes.length > 0 ||
                  selectedStatuses.length > 0 ||
                  selectedTags.length > 0
                    ? "Try adjusting your filters"
                    : "Create your first add-on to get started"
                }
              />
            )}
          </div>
        </div>
      </div>

      {/* Right Content - Add On Details */}
      <div className="col-span-8">
        {selectedAddon ? (
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {(() => {
                    const IconComponent = getTypeIcon(selectedAddon.type);
                    return <IconComponent className="h-6 w-6 mt-1 text-gray-500" />;
                  })()}
                  <div>
                    <CardTitle className="text-xl">{selectedAddon.name}</CardTitle>
                    <CardDescription className="mt-1">{selectedAddon.description}</CardDescription>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={selectedAddon.status === "active" ? "default" : "secondary"}>
                        {selectedAddon.status}
                      </Badge>
                      <Badge variant="outline">
                        {ADDON_TYPES.find((t) => t.value === selectedAddon.type)?.label}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {selectedAddon.type === "url" && selectedAddon.url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUrlOpen(selectedAddon)}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open URL
                    </Button>
                  )}
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Content based on type */}
              {selectedAddon.type === "note" && selectedAddon.content && (
                <div>
                  <Label className="text-sm font-medium">Content</Label>
                  <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm">{selectedAddon.content}</pre>
                  </div>
                </div>
              )}

              {selectedAddon.type === "url" && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">URL</Label>
                    <div className="mt-2">
                      <a
                        href={selectedAddon.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline break-all"
                      >
                        {selectedAddon.url}
                      </a>
                    </div>
                  </div>
                  {selectedAddon.username && (
                    <div>
                      <Label className="text-sm font-medium">Username</Label>
                      <p className="mt-2 text-sm text-gray-900">{selectedAddon.username}</p>
                    </div>
                  )}
                  {selectedAddon.password && (
                    <div>
                      <Label className="text-sm font-medium">Password</Label>
                      <p className="mt-2 text-sm text-gray-900">{selectedAddon.password}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        💡 Future enhancement: Auto-fill login button (requires browser extension or
                        advanced security setup)
                      </p>
                    </div>
                  )}
                </div>
              )}

              {selectedAddon.type === "attachment" && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">File Information</Label>
                    <div className="mt-2 p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Paperclip className="h-8 w-8 text-gray-400" />
                        <div>
                          <p className="font-medium">{selectedAddon.fileName}</p>
                          <p className="text-sm text-gray-500">{selectedAddon.fileSize}</p>
                        </div>
                      </div>
                      <Button className="mt-3" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View File
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tags */}
              <div>
                <Label className="text-sm font-medium">Tags</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedAddon.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Metadata */}
              <div className="text-xs text-gray-500 border-t pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">Created:</span>{" "}
                    {new Date(selectedAddon.createdAt).toLocaleDateString()}
                  </div>
                  <div>
                    <span className="font-medium">Updated:</span>{" "}
                    {new Date(selectedAddon.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <EmptyState
            icon={FileText}
            title="Select an Add-On"
            description="Choose an add-on from the list to view its details"
          />
        )}
      </div>
    </div>
  );
}
