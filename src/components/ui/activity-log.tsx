"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  Plus,
  FileText,
  Phone,
  Link,
  Shield,
  CheckSquare,
  Edit,
  Trash2,
  CalendarIcon,
  Filter,
  X,
  Tag,
  Eye,
  EyeOff,
} from "lucide-react";
import { format } from "date-fns";

// Activity types with icons and colors
const ACTIVITY_TYPES = {
  note: {
    icon: FileText,
    label: "Note",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    description: "General notes and observations",
  },
  communication: {
    icon: Phone,
    label: "Communication",
    color: "bg-green-100 text-green-800 border-green-200",
    description: "Phone calls, emails, meetings",
  },
  url: {
    icon: Link,
    label: "URL",
    color: "bg-purple-100 text-purple-800 border-purple-200",
    description: "Links to portals, documentation",
  },
  credential: {
    icon: Shield,
    label: "Credential",
    color: "bg-red-100 text-red-800 border-red-200",
    description: "Login information (encrypted)",
  },
  attachment: {
    icon: FileText,
    label: "File",
    color: "bg-gray-100 text-gray-800 border-gray-200",
    description: "Documents, images, certificates",
  },
  task: {
    icon: CheckSquare,
    label: "Task",
    color: "bg-orange-100 text-orange-800 border-orange-200",
    description: "Follow-up items, reminders",
  },
};

// Default system tags - organizations can add custom ones later
const DEFAULT_TAGS = [
  // General
  "urgent",
  "high-priority",
  "follow-up",
  "reminder",
  "important",
  // Communication specific
  "phone",
  "email",
  "meeting",
  "voicemail",
  "text",
  // DOT/Compliance specific
  "dot",
  "dmv",
  "inspection",
  "violation",
  "renewal",
  "license",
  "training",
  // Status tags
  "pending",
  "completed",
  "in-progress",
  "cancelled",
  "approved",
  "rejected",
];

interface ActivityLog {
  id: string;
  activityType: string;
  title: string;
  content: string;
  tags: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  // Optional fields based on activity type
  fileName?: string;
  fileSize?: number;
  filePath?: string;
  username?: string;
  portalUrl?: string;
  dueDate?: string;
  isCompleted?: boolean;
  priority?: string;
}

interface ActivityLogProps {
  // Entity context - can connect to any entity
  issueId?: string;
  organizationId?: string;
  personId?: string;
  equipmentId?: string;
  locationId?: string;
  cafId?: string;

  // UI configuration
  title?: string;
  allowedTypes?: string[];
  showEntityLabel?: boolean;
  compact?: boolean;
  maxHeight?: string;
  showAddButton?: boolean;
}

export function ActivityLog({
  issueId,
  organizationId,
  personId,
  equipmentId,
  locationId,
  cafId,
  title = "Activity Log",
  allowedTypes = Object.keys(ACTIVITY_TYPES),
  showEntityLabel = false,
  compact = false,
  maxHeight = "400px",
  showAddButton = true,
}: ActivityLogProps) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  // New activity form state
  const [newActivity, setNewActivity] = useState({
    activityType: "note",
    title: "",
    content: "",
    tags: [] as string[],
    dueDate: null as Date | null,
    priority: "medium",
    username: "",
    password: "",
    portalUrl: "",
  });

  const [availableTags, setAvailableTags] = useState<string[]>(DEFAULT_TAGS);
  const [tagInput, setTagInput] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);

  useEffect(() => {
    fetchActivities();
  }, [issueId, organizationId, personId, equipmentId, locationId, cafId]);

  useEffect(() => {
    filterActivities();
  }, [activities, selectedTags, selectedTypes]);

  const fetchActivities = async () => {
    try {
      setLoading(true);

      // Build query params based on entity context
      const params = new URLSearchParams();
      if (issueId) params.append("issueId", issueId);
      if (organizationId) params.append("organizationId", organizationId);
      if (personId) params.append("personId", personId);
      if (equipmentId) params.append("equipmentId", equipmentId);
      if (locationId) params.append("locationId", locationId);
      if (cafId) params.append("cafId", cafId);

      const response = await fetch(`/api/activity-log?${params}`);
      if (response.ok) {
        const data = await response.json();
        setActivities(data);
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterActivities = () => {
    let filtered = activities;

    // Filter by selected types
    if (selectedTypes.length > 0) {
      filtered = filtered.filter((activity) => selectedTypes.includes(activity.activityType));
    }

    // Filter by selected tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter((activity) =>
        selectedTags.some((tag) => activity.tags.includes(tag)),
      );
    }

    setFilteredActivities(filtered);
  };

  const handleAddActivity = async () => {
    try {
      const activityData = {
        activityType: newActivity.activityType,
        title: newActivity.title,
        content: newActivity.content,
        tags: newActivity.tags,
        ...(issueId && { issueId }),
        ...(organizationId && { organizationId }),
        ...(personId && { personId }),
        ...(equipmentId && { equipmentId }),
        ...(locationId && { locationId }),
        ...(cafId && { cafId }),
        // Activity-specific fields
        ...(newActivity.activityType === "task" && {
          dueDate: newActivity.dueDate?.toISOString(),
          priority: newActivity.priority,
        }),
        ...(newActivity.activityType === "credential" && {
          username: newActivity.username,
          password: newActivity.password, // Will be encrypted on backend
          portalUrl: newActivity.portalUrl,
        }),
      };

      const response = await fetch("/api/activity-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(activityData),
      });

      if (response.ok) {
        const newActivityRecord = await response.json();
        setActivities((prev) => [newActivityRecord, ...prev]);

        // Reset form
        setNewActivity({
          activityType: "note",
          title: "",
          content: "",
          tags: [],
          dueDate: null,
          priority: "medium",
          username: "",
          password: "",
          portalUrl: "",
        });
        setIsAddDialogOpen(false);
      }
    } catch (error) {
      console.error("Error adding activity:", error);
    }
  };

  const addTag = (tag: string) => {
    if (tag && !newActivity.tags.includes(tag)) {
      setNewActivity((prev) => ({
        ...prev,
        tags: [...prev.tags, tag],
      }));
    }
    setTagInput("");
    setShowTagInput(false);
  };

  const removeTag = (tagToRemove: string) => {
    setNewActivity((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const toggleTagFilter = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const toggleTypeFilter = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const getActivityIcon = (activityType: string) => {
    const config = ACTIVITY_TYPES[activityType as keyof typeof ACTIVITY_TYPES];
    if (!config) return FileText;
    return config.icon;
  };

  const getActivityColor = (activityType: string) => {
    const config = ACTIVITY_TYPES[activityType as keyof typeof ACTIVITY_TYPES];
    return config?.color || "bg-gray-100 text-gray-800 border-gray-200";
  };

  // Get unique tags from existing activities for filter options
  const allTags = Array.from(
    new Set([...DEFAULT_TAGS, ...activities.flatMap((activity) => activity.tags)]),
  ).sort();

  return (
    <Card className={compact ? "border-0 shadow-none" : ""}>
      <CardHeader className={compact ? "pb-3" : ""}>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {title}
            <Badge variant="secondary">{activities.length}</Badge>
          </CardTitle>

          <div className="flex items-center gap-2">
            {/* Filter Controls */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-1" />
                  Filter
                  {(selectedTags.length > 0 || selectedTypes.length > 0) && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {selectedTags.length + selectedTypes.length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  {/* Type Filters */}
                  <div>
                    <Label className="text-sm font-medium">Activity Types</Label>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {allowedTypes.map((type) => {
                        const config = ACTIVITY_TYPES[type as keyof typeof ACTIVITY_TYPES];
                        const Icon = config?.icon || FileText;
                        return (
                          <Badge
                            key={type}
                            variant={selectedTypes.includes(type) ? "default" : "outline"}
                            className={cn(
                              "cursor-pointer flex items-center gap-1",
                              selectedTypes.includes(type) && config?.color,
                            )}
                            onClick={() => toggleTypeFilter(type)}
                          >
                            <Icon className="h-3 w-3" />
                            {config?.label || type}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tag Filters */}
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

                  {/* Clear Filters */}
                  {(selectedTags.length > 0 || selectedTypes.length > 0) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTags([]);
                        setSelectedTypes([]);
                      }}
                      className="w-full"
                    >
                      Clear All Filters
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* Add Activity Button */}
            {showAddButton && (
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add Activity</DialogTitle>
                  </DialogHeader>

                  <div className="space-y-4">
                    {/* Activity Type Selection */}
                    <div className="grid grid-cols-3 gap-2">
                      {allowedTypes.map((type) => {
                        const config = ACTIVITY_TYPES[type as keyof typeof ACTIVITY_TYPES];
                        const Icon = config?.icon || FileText;
                        return (
                          <Button
                            key={type}
                            variant={newActivity.activityType === type ? "default" : "outline"}
                            className={cn(
                              "h-auto flex-col gap-2 p-4",
                              newActivity.activityType === type && config?.color,
                            )}
                            onClick={() =>
                              setNewActivity((prev) => ({ ...prev, activityType: type }))
                            }
                          >
                            <Icon className="h-5 w-5" />
                            <div className="text-center">
                              <div className="font-medium">{config?.label || type}</div>
                              <div className="text-xs text-muted-foreground">
                                {config?.description}
                              </div>
                            </div>
                          </Button>
                        );
                      })}
                    </div>

                    {/* Title */}
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={newActivity.title}
                        onChange={(e) =>
                          setNewActivity((prev) => ({ ...prev, title: e.target.value }))
                        }
                        placeholder="Brief title or subject"
                      />
                    </div>

                    {/* Content */}
                    <div>
                      <Label htmlFor="content">
                        {newActivity.activityType === "url"
                          ? "URL"
                          : newActivity.activityType === "credential"
                            ? "Portal URL"
                            : "Content"}
                      </Label>
                      <Textarea
                        id="content"
                        value={newActivity.content}
                        onChange={(e) =>
                          setNewActivity((prev) => ({ ...prev, content: e.target.value }))
                        }
                        placeholder={
                          newActivity.activityType === "note"
                            ? "Your notes..."
                            : newActivity.activityType === "communication"
                              ? "Details of the communication..."
                              : newActivity.activityType === "url"
                                ? "https://example.com"
                                : newActivity.activityType === "task"
                                  ? "Task description..."
                                  : "Details..."
                        }
                        rows={3}
                      />
                    </div>

                    {/* Credential-specific fields */}
                    {newActivity.activityType === "credential" && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="username">Username</Label>
                          <Input
                            id="username"
                            value={newActivity.username}
                            onChange={(e) =>
                              setNewActivity((prev) => ({ ...prev, username: e.target.value }))
                            }
                            placeholder="Portal username"
                          />
                        </div>
                        <div>
                          <Label htmlFor="password">Password</Label>
                          <Input
                            id="password"
                            type="password"
                            value={newActivity.password}
                            onChange={(e) =>
                              setNewActivity((prev) => ({ ...prev, password: e.target.value }))
                            }
                            placeholder="Portal password"
                          />
                        </div>
                      </div>
                    )}

                    {/* Task-specific fields */}
                    {newActivity.activityType === "task" && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Due Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !newActivity.dueDate && "text-muted-foreground",
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {newActivity.dueDate
                                  ? format(newActivity.dueDate, "PPP")
                                  : "Pick due date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={newActivity.dueDate || undefined}
                                onSelect={(date) =>
                                  setNewActivity((prev) => ({ ...prev, dueDate: date || null }))
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div>
                          <Label htmlFor="priority">Priority</Label>
                          <Select
                            value={newActivity.priority}
                            onValueChange={(value) =>
                              setNewActivity((prev) => ({ ...prev, priority: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="urgent">Urgent</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {/* Tags */}
                    <div>
                      <Label>Tags</Label>
                      <div className="space-y-2">
                        {/* Selected tags */}
                        <div className="flex flex-wrap gap-1">
                          {newActivity.tags.map((tag) => (
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

                        {/* Add tag controls */}
                        <div className="flex gap-2">
                          {showTagInput ? (
                            <div className="flex gap-1 flex-1">
                              <Input
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                placeholder="Enter tag name"
                                onKeyPress={(e) => e.key === "Enter" && addTag(tagInput)}
                                className="flex-1"
                              />
                              <Button size="sm" onClick={() => addTag(tagInput)}>
                                Add
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setShowTagInput(false)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowTagInput(true)}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Custom Tag
                            </Button>
                          )}
                        </div>

                        {/* Quick tag buttons */}
                        <div className="flex flex-wrap gap-1">
                          {DEFAULT_TAGS.slice(0, 8).map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                              onClick={() => addTag(tag)}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddActivity}>Add Activity</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className={compact ? "pt-0" : ""}>
        <div className={cn("space-y-3", `max-h-[${maxHeight}] overflow-y-auto`)}>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading activities...</div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {activities.length === 0 ? (
                <>
                  <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>No activities yet</p>
                  <p className="text-sm">Click "Add" to create your first activity</p>
                </>
              ) : (
                <>
                  <Filter className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>No activities match your filters</p>
                  <p className="text-sm">Try adjusting your filter criteria</p>
                </>
              )}
            </div>
          ) : (
            filteredActivities.map((activity) => {
              const Icon = getActivityIcon(activity.activityType);
              const config = ACTIVITY_TYPES[activity.activityType as keyof typeof ACTIVITY_TYPES];

              return (
                <div
                  key={activity.id}
                  className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "p-2 rounded-lg flex-shrink-0",
                        getActivityColor(activity.activityType),
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{activity.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {activity.content}
                          </p>
                        </div>
                        <div className="text-xs text-muted-foreground flex-shrink-0">
                          {format(new Date(activity.createdAt), "MMM dd, HH:mm")}
                        </div>
                      </div>

                      {/* Tags */}
                      {activity.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {activity.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Activity-specific content */}
                      {activity.activityType === "credential" && activity.username && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                          <div>Username: {activity.username}</div>
                          {activity.portalUrl && <div>Portal: {activity.portalUrl}</div>}
                        </div>
                      )}

                      {activity.activityType === "task" && activity.dueDate && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                          <CalendarIcon className="h-3 w-3" />
                          Due: {format(new Date(activity.dueDate), "MMM dd, yyyy")}
                          {activity.priority && activity.priority !== "medium" && (
                            <Badge
                              variant={activity.priority === "urgent" ? "destructive" : "secondary"}
                              className="text-xs"
                            >
                              {activity.priority}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
