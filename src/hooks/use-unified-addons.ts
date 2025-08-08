"use client";

import { useState, useMemo } from "react";
import { AddonType } from "@/components/ui/unified-addon-modal";
import { AddonDisplayConfig, AddonDisplayItem } from "@/components/ui/unified-addon-display";
import {
  FileText,
  Paperclip,
  Calendar,
  ClipboardList,
  Receipt,
  UserCheck,
  Camera,
  AlertTriangle,
  Shield,
  MessageSquare,
} from "lucide-react";

// Unified Add-On Configurations based on Patrick's specifications
export const UNIFIED_ADDON_CONFIGURATIONS = {
  // MVR Issues
  mvr: {
    modal: {
      availableTypes: [
        // Generic defaults for all (universal types)
        { value: "note", label: "Note", icon: FileText, description: "Add notes or comments" },
        {
          value: "attachment",
          label: "Attachment",
          icon: Paperclip,
          description: "Upload supporting documents",
        },
        {
          value: "todo",
          label: "ToDo",
          icon: ClipboardList,
          description: "Create assigned task (shows on user dashboard)",
        },
        {
          value: "communication",
          label: "Communication",
          icon: MessageSquare,
          description: "Log communications (future: auto-draft email/text)",
        },
        // MVR specific
        {
          value: "report",
          label: "MVR Report",
          icon: Paperclip,
          description: "Upload MVR report document",
        },
      ] as AddonType[],
      modalTitle: "Add MVR Documentation",
      modalDescription: "Add documentation or tasks to this MVR issue",
    },
    display: {
      showSearch: true,
      showTypeFilter: true,
      createButtonText: "Add MVR Addon",
      emptyStateText: "No MVR documentation yet",
    } as AddonDisplayConfig,
  },

  // Physical Issues
  physical: {
    modal: {
      availableTypes: [
        // Generic defaults for all (universal types)
        { value: "note", label: "Note", icon: FileText, description: "Add notes or comments" },
        {
          value: "attachment",
          label: "Attachment",
          icon: Paperclip,
          description: "Upload supporting documents",
        },
        {
          value: "todo",
          label: "ToDo",
          icon: ClipboardList,
          description: "Create assigned task (shows on user dashboard)",
        },
        {
          value: "communication",
          label: "Communication",
          icon: MessageSquare,
          description: "Log communications (future: auto-draft email/text)",
        },
        // Physical specific
        {
          value: "schedule",
          label: "Schedule",
          icon: Calendar,
          description: "Schedule appointment date and time",
        },
        {
          value: "report",
          label: "Physical Report",
          icon: Paperclip,
          description: "Upload physical examination report",
        },
      ] as AddonType[],
      modalTitle: "Add Physical Exam Documentation",
      modalDescription: "Add documentation or schedule physical examination",
    },
    display: {
      showSearch: true,
      showTypeFilter: true,
      createButtonText: "Add Physical Addon",
      emptyStateText: "No physical exam documentation yet",
    } as AddonDisplayConfig,
  },

  // License Issues
  license: {
    modal: {
      availableTypes: [
        // Generic defaults for all (universal types)
        { value: "note", label: "Note", icon: FileText, description: "Add notes or comments" },
        {
          value: "attachment",
          label: "Attachment",
          icon: Paperclip,
          description: "Upload supporting documents",
        },
        {
          value: "todo",
          label: "ToDo",
          icon: ClipboardList,
          description: "Create assigned task (shows on user dashboard)",
        },
        {
          value: "communication",
          label: "Communication",
          icon: MessageSquare,
          description: "Log communications (future: auto-draft email/text)",
        },
        // License specific
        {
          value: "license_front",
          label: "Front Photo",
          icon: Camera,
          description: "Upload front of license",
        },
        {
          value: "license_back",
          label: "Back Photo",
          icon: Camera,
          description: "Upload back of license",
        },
        {
          value: "endorsement",
          label: "Endorsement",
          icon: Paperclip,
          description: "Upload endorsement documentation",
        },
      ] as AddonType[],
      modalTitle: "Add License Documentation",
      modalDescription: "Add license photos and supporting documentation",
    },
    display: {
      showSearch: true,
      showTypeFilter: true,
      createButtonText: "Add License Addon",
      emptyStateText: "No license documentation yet",
    } as AddonDisplayConfig,
  },

  // Registration Issues (generic only)
  registration: {
    modal: {
      availableTypes: [
        // Generic defaults only - no specific types (but including all universal types)
        { value: "note", label: "Note", icon: FileText, description: "Add notes or comments" },
        {
          value: "attachment",
          label: "Attachment",
          icon: Paperclip,
          description: "Upload supporting documents",
        },
        {
          value: "todo",
          label: "ToDo",
          icon: ClipboardList,
          description: "Create assigned task (shows on user dashboard)",
        },
        {
          value: "communication",
          label: "Communication",
          icon: MessageSquare,
          description: "Log communications (future: auto-draft email/text)",
        },
      ] as AddonType[],
      modalTitle: "Add Registration Documentation",
      modalDescription: "Add notes or documentation to this registration issue",
    },
    display: {
      showSearch: true,
      showTypeFilter: true,
      createButtonText: "Add Registration Addon",
      emptyStateText: "No registration documentation yet",
    } as AddonDisplayConfig,
  },

  // Annual Inspection Issues
  annual_inspection: {
    modal: {
      availableTypes: [
        // Generic defaults for all (universal types)
        { value: "note", label: "Note", icon: FileText, description: "Add notes or comments" },
        {
          value: "attachment",
          label: "Attachment",
          icon: Paperclip,
          description: "Upload supporting documents",
        },
        {
          value: "todo",
          label: "ToDo",
          icon: ClipboardList,
          description: "Create assigned task (shows on user dashboard)",
        },
        {
          value: "communication",
          label: "Communication",
          icon: MessageSquare,
          description: "Log communications (future: auto-draft email/text)",
        },
        // Annual inspection specific
        {
          value: "schedule",
          label: "Schedule",
          icon: Calendar,
          description: "Schedule inspection date and time",
        },
        {
          value: "report",
          label: "Inspection Report",
          icon: Paperclip,
          description: "Upload annual inspection report",
        },
      ] as AddonType[],
      modalTitle: "Add Annual Inspection Documentation",
      modalDescription: "Add documentation or schedule annual inspection",
    },
    display: {
      showSearch: true,
      showTypeFilter: true,
      createButtonText: "Add Inspection Addon",
      emptyStateText: "No inspection documentation yet",
    } as AddonDisplayConfig,
  },

  // Training Issues
  training: {
    modal: {
      availableTypes: [
        // Generic defaults for all (universal types)
        { value: "note", label: "Note", icon: FileText, description: "Add notes or comments" },
        {
          value: "attachment",
          label: "Attachment",
          icon: Paperclip,
          description: "Upload supporting documents",
        },
        {
          value: "todo",
          label: "ToDo",
          icon: ClipboardList,
          description: "Create assigned task (shows on user dashboard)",
        },
        {
          value: "communication",
          label: "Communication",
          icon: MessageSquare,
          description: "Log communications (future: auto-draft email/text)",
        },
        // Training specific
        {
          value: "schedule",
          label: "Schedule",
          icon: Calendar,
          description: "Schedule training date and time",
        },
        {
          value: "certificate",
          label: "Certificate",
          icon: Paperclip,
          description: "Upload training certificate",
        },
      ] as AddonType[],
      modalTitle: "Add Training Documentation",
      modalDescription: "Add documentation or schedule training",
    },
    display: {
      showSearch: true,
      showTypeFilter: true,
      createButtonText: "Add Training Addon",
      emptyStateText: "No training documentation yet",
    } as AddonDisplayConfig,
  },

  // Maintenance Issues
  maintenance: {
    modal: {
      availableTypes: [
        // Generic defaults for all (universal types)
        { value: "note", label: "Note", icon: FileText, description: "Add notes or comments" },
        {
          value: "attachment",
          label: "Attachment",
          icon: Paperclip,
          description: "Upload supporting documents",
        },
        {
          value: "todo",
          label: "ToDo",
          icon: ClipboardList,
          description: "Create assigned task (shows on user dashboard)",
        },
        {
          value: "communication",
          label: "Communication",
          icon: MessageSquare,
          description: "Log communications (future: auto-draft email/text)",
        },
        // Maintenance specific
        {
          value: "schedule",
          label: "Schedule",
          icon: Calendar,
          description: "Schedule maintenance date and time",
        },
        {
          value: "work_order",
          label: "Work Order",
          icon: ClipboardList,
          description: "Create or upload work order",
        },
        {
          value: "receipt",
          label: "Receipt",
          icon: Receipt,
          description: "Upload repair/maintenance receipt",
        },
      ] as AddonType[],
      modalTitle: "Add Maintenance Documentation",
      modalDescription: "Add documentation or schedule maintenance work",
    },
    display: {
      showSearch: true,
      showTypeFilter: true,
      createButtonText: "Add Maintenance Addon",
      emptyStateText: "No maintenance documentation yet",
    } as AddonDisplayConfig,
  },

  // Drug/Alcohol Issues
  drugalcohol: {
    modal: {
      availableTypes: [
        // Generic defaults for all (universal types)
        { value: "note", label: "Note", icon: FileText, description: "Add notes or comments" },
        {
          value: "attachment",
          label: "Attachment",
          icon: Paperclip,
          description: "Upload supporting documents",
        },
        {
          value: "todo",
          label: "ToDo",
          icon: ClipboardList,
          description: "Create assigned task (shows on user dashboard)",
        },
        {
          value: "communication",
          label: "Communication",
          icon: MessageSquare,
          description: "Log communications (future: auto-draft email/text)",
        },
        // No specific types for drug/alcohol - using generic only
      ] as AddonType[],
      modalTitle: "Add Drug & Alcohol Test Documentation",
      modalDescription: "Add documentation to this drug & alcohol test record",
    },
    display: {
      showSearch: true,
      showTypeFilter: true,
      createButtonText: "Add Test Addon",
      emptyStateText: "No test documentation yet",
    } as AddonDisplayConfig,
  },

  // RSIN (Roadside Inspections)
  roadside_inspection: {
    modal: {
      availableTypes: [
        // Generic defaults for all (universal types)
        { value: "note", label: "Note", icon: FileText, description: "Add notes or comments" },
        {
          value: "attachment",
          label: "Attachment",
          icon: Paperclip,
          description: "Upload supporting documents",
        },
        {
          value: "todo",
          label: "ToDo",
          icon: ClipboardList,
          description: "Create assigned task (shows on user dashboard)",
        },
        {
          value: "communication",
          label: "Communication",
          icon: MessageSquare,
          description: "Log communications (future: auto-draft email/text)",
        },
        // RSIN specific
        {
          value: "dvir_report",
          label: "DVIR Report",
          icon: Paperclip,
          description: "Upload DVIR report",
        },
        {
          value: "caf_original",
          label: "CAF - Original",
          icon: ClipboardList,
          description: "Original CAF document",
        },
        {
          value: "caf_returned",
          label: "CAF - Returned",
          icon: UserCheck,
          description: "Returned signed CAF",
        },
      ] as AddonType[],
      modalTitle: "Add RSIN Documentation",
      modalDescription: "Add documentation to this roadside inspection",
    },
    display: {
      showSearch: true,
      showTypeFilter: true,
      createButtonText: "Add RSIN Addon",
      emptyStateText: "No roadside inspection documentation yet",
    } as AddonDisplayConfig,
  },

  // Accidents
  accident: {
    modal: {
      availableTypes: [
        // Generic defaults for all (universal types)
        { value: "note", label: "Note", icon: FileText, description: "Add notes or comments" },
        {
          value: "attachment",
          label: "Attachment",
          icon: Paperclip,
          description: "Upload supporting documents",
        },
        {
          value: "todo",
          label: "ToDo",
          icon: ClipboardList,
          description: "Create assigned task (shows on user dashboard)",
        },
        {
          value: "communication",
          label: "Communication",
          icon: MessageSquare,
          description: "Log communications (future: auto-draft email/text)",
        },
        // Accident specific
        {
          value: "police_report",
          label: "Police Report",
          icon: Shield,
          description: "Upload police report",
        },
        {
          value: "caf_original",
          label: "CAF - Original",
          icon: ClipboardList,
          description: "Original CAF document",
        },
        {
          value: "caf_returned",
          label: "CAF - Returned",
          icon: UserCheck,
          description: "Returned signed CAF",
        },
        {
          value: "accident_photo",
          label: "Accident Photo",
          icon: Camera,
          description: "Upload accident scene photos",
        },
      ] as AddonType[],
      modalTitle: "Add Accident Documentation",
      modalDescription: "Add evidence and documentation to this accident report",
    },
    display: {
      showSearch: true,
      showTypeFilter: true,
      allowView: true,
      allowDownload: true,
      createButtonText: "Add Documentation",
      emptyStateText: "No accident documentation yet",
      displayMode: "grid" as const,
    } as AddonDisplayConfig,
  },

  // Future entities - using generic types for now (all 4 universal types)
  organization: {
    modal: {
      availableTypes: [
        { value: "note", label: "Note", icon: FileText, description: "Add notes or comments" },
        {
          value: "attachment",
          label: "Attachment",
          icon: Paperclip,
          description: "Upload supporting documents",
        },
        {
          value: "todo",
          label: "ToDo",
          icon: ClipboardList,
          description: "Create assigned task (shows on user dashboard)",
        },
        {
          value: "communication",
          label: "Communication",
          icon: MessageSquare,
          description: "Log communications (future: auto-draft email/text)",
        },
      ] as AddonType[],
      modalTitle: "Add Organization Documentation",
      modalDescription: "Add documentation to this organization",
    },
    display: {
      showSearch: true,
      showTypeFilter: true,
      createButtonText: "Add Documentation",
      emptyStateText: "No organization documentation yet",
    } as AddonDisplayConfig,
  },

  location: {
    modal: {
      availableTypes: [
        { value: "note", label: "Note", icon: FileText, description: "Add notes or comments" },
        {
          value: "attachment",
          label: "Attachment",
          icon: Paperclip,
          description: "Upload supporting documents",
        },
        {
          value: "todo",
          label: "ToDo",
          icon: ClipboardList,
          description: "Create assigned task (shows on user dashboard)",
        },
        {
          value: "communication",
          label: "Communication",
          icon: MessageSquare,
          description: "Log communications (future: auto-draft email/text)",
        },
      ] as AddonType[],
      modalTitle: "Add Location Documentation",
      modalDescription: "Add documentation to this location",
    },
    display: {
      showSearch: true,
      showTypeFilter: true,
      createButtonText: "Add Documentation",
      emptyStateText: "No location documentation yet",
    } as AddonDisplayConfig,
  },

  staff: {
    modal: {
      availableTypes: [
        { value: "note", label: "Note", icon: FileText, description: "Add notes or comments" },
        {
          value: "attachment",
          label: "Attachment",
          icon: Paperclip,
          description: "Upload supporting documents",
        },
        {
          value: "todo",
          label: "ToDo",
          icon: ClipboardList,
          description: "Create assigned task (shows on user dashboard)",
        },
        {
          value: "communication",
          label: "Communication",
          icon: MessageSquare,
          description: "Log communications (future: auto-draft email/text)",
        },
      ] as AddonType[],
      modalTitle: "Add Staff Documentation",
      modalDescription: "Add documentation to this staff member",
    },
    display: {
      showSearch: true,
      showTypeFilter: true,
      createButtonText: "Add Documentation",
      emptyStateText: "No staff documentation yet",
    } as AddonDisplayConfig,
  },
};

export interface UseUnifiedAddonsOptions {
  issueType: keyof typeof UNIFIED_ADDON_CONFIGURATIONS;
  issueId: string;
  customModalConfig?: Partial<typeof UNIFIED_ADDON_CONFIGURATIONS.license.modal>;
  customDisplayConfig?: Partial<AddonDisplayConfig>;
}

export function useUnifiedAddons({
  issueType,
  issueId,
  customModalConfig = {},
  customDisplayConfig = {},
}: UseUnifiedAddonsOptions) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddon, setEditingAddon] = useState<AddonDisplayItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get configuration for this issue type
  const config = UNIFIED_ADDON_CONFIGURATIONS[issueType];
  if (!config) {
    throw new Error(`Unknown issue type: ${issueType}`);
  }

  // Merge configurations
  const modalConfig = useMemo(
    () => ({
      ...config.modal,
      ...customModalConfig,
    }),
    [config.modal, customModalConfig],
  );

  const displayConfig = useMemo(
    () => ({
      ...config.display,
      ...customDisplayConfig,
    }),
    [config.display, customDisplayConfig],
  );

  // Modal handlers
  const openCreateModal = () => {
    setEditingAddon(null);
    setIsModalOpen(true);
  };

  const openEditModal = (addon: AddonDisplayItem) => {
    setEditingAddon(addon);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAddon(null);
  };

  // Submit handler
  const handleSubmit = async (formData: any) => {
    setIsSubmitting(true);
    try {
      const endpoint = "/api/attachments";
      const method = editingAddon ? "PUT" : "POST";

      const payload = {
        ...formData,
        issueId,
        issueType,
        ...(editingAddon && { id: editingAddon.id }),
      };

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${editingAddon ? "update" : "create"} addon`);
      }

      return await response.json();
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    // Configuration
    modalConfig,
    displayConfig,
    availableTypes: modalConfig.availableTypes,

    // State
    isModalOpen,
    editingAddon,
    isSubmitting,

    // Handlers
    openCreateModal,
    openEditModal,
    closeModal,
    handleSubmit,

    // Utilities
    isEditing: !!editingAddon,
    modalTitle: editingAddon
      ? `Edit ${modalConfig.modalTitle.replace("Add ", "")}`
      : modalConfig.modalTitle,
  };
}

export default useUnifiedAddons;
