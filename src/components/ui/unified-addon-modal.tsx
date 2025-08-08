"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { FileText, Upload, Plus, Link, Paperclip } from "lucide-react";

export interface AddonType {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

export interface UnifiedAddonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  issueId?: string;
  cafId?: string;
  issueType?: string; // e.g., 'License', 'Training', 'MVR', etc.

  // Configuration options
  availableTypes?: AddonType[];
  allowFileUpload?: boolean;
  allowUrlWithCredentials?: boolean;
  defaultType?: string;
  modalTitle?: string;
  modalDescription?: string;
}

// Default addon types - can be customized per implementation
const DEFAULT_ADDON_TYPES: AddonType[] = [
  {
    value: "note",
    label: "Note",
    icon: FileText,
    description: "Add a text note or memo",
  },
  {
    value: "attachment",
    label: "File Attachment",
    icon: Paperclip,
    description: "Upload a document or file",
  },
  {
    value: "url",
    label: "URL with Login",
    icon: Link,
    description: "External link with optional credentials",
  },
];

export function UnifiedAddonModal({
  isOpen,
  onClose,
  onSuccess,
  issueId,
  cafId,
  issueType = "record",
  availableTypes = DEFAULT_ADDON_TYPES,
  allowFileUpload = false, // Disabled by default until DigitalOcean Spaces
  allowUrlWithCredentials = false, // Only for organization-level addons
  defaultType = "note",
  modalTitle = "Add Addon",
  modalDescription,
}: UnifiedAddonModalProps) {
  // Form state
  const [formData, setFormData] = useState({
    type: defaultType,
    title: "",
    description: "",
    noteContent: "",
    url: "",
    username: "",
    password: "",
    tags: [] as string[],
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [newTag, setNewTag] = useState("");

  // Filter available types based on configuration
  const filteredTypes = availableTypes.filter((type) => {
    if (type.value === "attachment" && !allowFileUpload) return false;
    if (type.value === "url" && !allowUrlWithCredentials) return false;
    return true;
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!formData.title) {
        setFormData((prev) => ({
          ...prev,
          title: file.name.split(".").slice(0, -1).join("."),
        }));
      }
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const validateForm = () => {
    if (formData.type === "note") {
      return formData.title.trim() || formData.noteContent.trim();
    }
    if (formData.type === "attachment") {
      return selectedFile || formData.title.trim();
    }
    if (formData.type === "url") {
      return formData.url.trim() && formData.title.trim();
    }
    return formData.title.trim();
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      alert("Please fill in required fields");
      return;
    }

    setIsUploading(true);

    try {
      const payload: any = {
        ...(issueId && { issueId }),
        ...(cafId && { cafId }),
        attachmentType: formData.type,
        title: formData.title.trim() || `${formData.type} - ${new Date().toLocaleDateString()}`,
        description: formData.description.trim(),
        tags: formData.tags,
      };

      // Add type-specific data
      if (formData.type === "note") {
        payload.noteContent = formData.noteContent.trim();
      } else if (formData.type === "url") {
        payload.url = formData.url.trim();
        if (allowUrlWithCredentials) {
          payload.username = formData.username.trim();
          payload.password = formData.password.trim();
        }
      }

      const response = await fetch("/api/attachments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to save addon");
      }

      resetForm();
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error adding addon:", error);
      alert("Failed to add addon. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      type: defaultType,
      title: "",
      description: "",
      noteContent: "",
      url: "",
      username: "",
      password: "",
      tags: [],
    });
    setSelectedFile(null);
    setNewTag("");
  };

  const selectedTypeConfig = filteredTypes.find((t) => t.value === formData.type);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          resetForm();
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{modalTitle}</DialogTitle>
          <DialogDescription>
            {modalDescription || `Add additional information to this ${issueType.toLowerCase()}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Type Selection */}
          {filteredTypes.length > 1 && (
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {filteredTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span>{type.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {selectedTypeConfig?.description && (
                <p className="text-sm text-gray-500">{selectedTypeConfig.description}</p>
              )}
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Enter a title"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Optional description"
            />
          </div>

          {/* Type-specific fields */}
          {formData.type === "note" && (
            <div className="space-y-2">
              <Label htmlFor="noteContent">Note Content</Label>
              <Textarea
                id="noteContent"
                value={formData.noteContent}
                onChange={(e) => setFormData((prev) => ({ ...prev, noteContent: e.target.value }))}
                placeholder="Enter your note content"
                rows={4}
              />
            </div>
          )}

          {formData.type === "url" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="url">URL *</Label>
                <Input
                  id="url"
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData((prev) => ({ ...prev, url: e.target.value }))}
                  placeholder="https://example.com"
                />
              </div>

              {allowUrlWithCredentials && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, username: e.target.value }))
                      }
                      placeholder="Optional login username"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, password: e.target.value }))
                      }
                      placeholder="Optional login password"
                    />
                  </div>
                </>
              )}
            </>
          )}

          {formData.type === "attachment" && allowFileUpload && (
            <div className="space-y-2">
              <Label htmlFor="file">File</Label>
              <input
                id="file"
                type="file"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {selectedFile && (
                <p className="text-sm text-gray-600">Selected: {selectedFile.name}</p>
              )}
            </div>
          )}

          {formData.type === "attachment" && !allowFileUpload && (
            <div className="space-y-2">
              <Label>File Upload</Label>
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center bg-gray-50">
                <div className="opacity-50">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm text-gray-500">File uploads temporarily disabled</p>
                  <p className="text-xs text-gray-400">
                    Will be available once DigitalOcean Spaces is configured
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add tag"
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
              />
              <Button type="button" variant="outline" size="sm" onClick={handleAddTag}>
                Add
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-blue-600"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                resetForm();
                onClose();
              }}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isUploading || !validateForm()}>
              {isUploading ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-gray-300 border-t-white rounded-full"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add {selectedTypeConfig?.label || "Addon"}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
