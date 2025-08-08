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
import { FileText, Upload, Plus } from "lucide-react";

interface AddAddonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  issueId: string;
}

export function AddAddonModal({ isOpen, onClose, onSuccess, issueId }: AddAddonModalProps) {
  const [title, setTitle] = useState("");
  const [noteText, setNoteText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!title) {
        setTitle(file.name.split(".").slice(0, -1).join("."));
      }
    }
  };

  const handleSubmit = async () => {
    // Must have at least a title or note (file uploads disabled)
    if (!title.trim() && !noteText.trim()) {
      alert("Please provide a title or note");
      return;
    }

    setIsUploading(true);

    try {
      // Only handle notes for now (file uploads disabled)
      const response = await fetch("/api/attachments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          issueId,
          attachmentType: "note",
          title: title.trim() || `Note - ${new Date().toLocaleDateString()}`,
          description: "",
          noteContent: noteText.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save note");
      }

      // Reset form
      setTitle("");
      setNoteText("");
      setSelectedFile(null);

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
    setTitle("");
    setNoteText("");
    setSelectedFile(null);
  };

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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Addon</DialogTitle>
          <DialogDescription>Add a note, file, or both to this license</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Addon title (optional)"
            />
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="note">Note</Label>
            <Textarea
              id="note"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add a note or memo (optional)"
              rows={3}
            />
          </div>

          {/* File Upload - Temporarily Disabled */}
          <div className="space-y-2">
            <Label htmlFor="file">File</Label>
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
            <Button
              onClick={handleSubmit}
              disabled={isUploading || (!title.trim() && !noteText.trim())}
            >
              {isUploading ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-gray-300 border-t-white rounded-full"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Note
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
