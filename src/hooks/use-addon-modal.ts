"use client";

import { useState } from "react";
import { AddonType } from "@/components/ui/unified-addon-modal";
import { FileText, Paperclip, Link } from "lucide-react";

// Predefined configurations for different issue types
export const ADDON_CONFIGURATIONS = {
  // Driver-related issues (simple note/attachment)
  license: {
    availableTypes: [
      {
        value: "note",
        label: "Note",
        icon: FileText,
        description: "Add a note about this license",
      },
      {
        value: "attachment",
        label: "Document",
        icon: Paperclip,
        description: "Upload license document or scan",
      },
    ] as AddonType[],
    allowFileUpload: false, // Until DigitalOcean Spaces
    allowUrlWithCredentials: false,
    defaultType: "note",
    modalTitle: "Add License Addon",
    modalDescription: "Add additional information or documents to this license record",
  },

  training: {
    availableTypes: [
      {
        value: "note",
        label: "Note",
        icon: FileText,
        description: "Add training notes or comments",
      },
      {
        value: "attachment",
        label: "Certificate",
        icon: Paperclip,
        description: "Upload training certificate or completion document",
      },
    ] as AddonType[],
    allowFileUpload: false,
    allowUrlWithCredentials: false,
    defaultType: "note",
    modalTitle: "Add Training Addon",
    modalDescription: "Add additional information or certificates to this training record",
  },

  mvr: {
    availableTypes: [
      {
        value: "note",
        label: "Note",
        icon: FileText,
        description: "Add notes about this MVR report",
      },
      {
        value: "attachment",
        label: "Report Document",
        icon: Paperclip,
        description: "Upload MVR report or related documents",
      },
    ] as AddonType[],
    allowFileUpload: false,
    allowUrlWithCredentials: false,
    defaultType: "note",
    modalTitle: "Add MVR Addon",
    modalDescription: "Add additional information or documents to this MVR record",
  },

  drugalcohol: {
    availableTypes: [
      { value: "note", label: "Note", icon: FileText, description: "Add notes about this test" },
      {
        value: "attachment",
        label: "Test Results",
        icon: Paperclip,
        description: "Upload test results or related documents",
      },
    ] as AddonType[],
    allowFileUpload: false,
    allowUrlWithCredentials: false,
    defaultType: "note",
    modalTitle: "Add Drug & Alcohol Test Addon",
    modalDescription: "Add additional information or documents to this test record",
  },

  physical: {
    availableTypes: [
      {
        value: "note",
        label: "Note",
        icon: FileText,
        description: "Add notes about this physical exam",
      },
      {
        value: "attachment",
        label: "Medical Certificate",
        icon: Paperclip,
        description: "Upload DOT medical certificate or exam documents",
      },
    ] as AddonType[],
    allowFileUpload: false,
    allowUrlWithCredentials: false,
    defaultType: "note",
    modalTitle: "Add Physical Exam Addon",
    modalDescription: "Add additional information or certificates to this physical exam record",
  },

  accident: {
    availableTypes: [
      {
        value: "note",
        label: "Note",
        icon: FileText,
        description: "Add notes about this accident",
      },
      {
        value: "attachment",
        label: "Report/Photo",
        icon: Paperclip,
        description: "Upload accident reports, photos, or documentation",
      },
    ] as AddonType[],
    allowFileUpload: false,
    allowUrlWithCredentials: false,
    defaultType: "note",
    modalTitle: "Add Accident Addon",
    modalDescription: "Add additional information or documentation to this accident record",
  },

  roadside_inspection: {
    availableTypes: [
      {
        value: "note",
        label: "Note",
        icon: FileText,
        description: "Add notes about this inspection",
      },
      {
        value: "attachment",
        label: "Inspection Report",
        icon: Paperclip,
        description: "Upload inspection report or related documents",
      },
    ] as AddonType[],
    allowFileUpload: false,
    allowUrlWithCredentials: false,
    defaultType: "note",
    modalTitle: "Add Roadside Inspection Addon",
    modalDescription: "Add additional information or documents to this inspection record",
  },

  // Equipment-related
  registration: {
    availableTypes: [
      {
        value: "note",
        label: "Note",
        icon: FileText,
        description: "Add notes about this registration",
      },
      {
        value: "attachment",
        label: "Registration Document",
        icon: Paperclip,
        description: "Upload registration documents or renewals",
      },
    ] as AddonType[],
    allowFileUpload: false,
    allowUrlWithCredentials: false,
    defaultType: "note",
    modalTitle: "Add Registration Addon",
    modalDescription: "Add additional information or documents to this registration record",
  },

  maintenance: {
    availableTypes: [
      {
        value: "note",
        label: "Note",
        icon: FileText,
        description: "Add maintenance notes or instructions",
      },
      {
        value: "attachment",
        label: "Work Order/Receipt",
        icon: Paperclip,
        description: "Upload work orders, receipts, or photos",
      },
    ] as AddonType[],
    allowFileUpload: false,
    allowUrlWithCredentials: false,
    defaultType: "note",
    modalTitle: "Add Maintenance Addon",
    modalDescription: "Add additional information or documentation to this maintenance record",
  },

  // Organization-level (full featured)
  organization: {
    availableTypes: [
      { value: "note", label: "Note", icon: FileText, description: "Add internal notes or memos" },
      {
        value: "attachment",
        label: "Document",
        icon: Paperclip,
        description: "Upload files and documents",
      },
      {
        value: "url",
        label: "External System",
        icon: Link,
        description: "Link to external systems with login credentials",
      },
    ] as AddonType[],
    allowFileUpload: false, // Until DigitalOcean Spaces
    allowUrlWithCredentials: true, // Organizations can store login credentials
    defaultType: "note",
    modalTitle: "Add Organization Addon",
    modalDescription: "Add notes, documents, or external system links to this organization",
  },

  // Generic fallback
  generic: {
    availableTypes: [
      { value: "note", label: "Note", icon: FileText, description: "Add a note or memo" },
      {
        value: "attachment",
        label: "Document",
        icon: Paperclip,
        description: "Upload a document or file",
      },
    ] as AddonType[],
    allowFileUpload: false,
    allowUrlWithCredentials: false,
    defaultType: "note",
    modalTitle: "Add Addon",
    modalDescription: "Add additional information to this record",
  },
};

export type AddonConfigurationType = keyof typeof ADDON_CONFIGURATIONS;

export function useAddonModal(type: AddonConfigurationType = "generic") {
  const [isOpen, setIsOpen] = useState(false);

  const configuration = ADDON_CONFIGURATIONS[type];

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  return {
    isOpen,
    openModal,
    closeModal,
    configuration,
  };
}

// Helper function to get configuration for a specific type
export function getAddonConfiguration(type: AddonConfigurationType) {
  return ADDON_CONFIGURATIONS[type] || ADDON_CONFIGURATIONS.generic;
}
