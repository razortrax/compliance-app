"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Calendar, Stethoscope, Clock } from "lucide-react";

interface PhysicalIssue {
  id: string;
  issueId: string;
  type?: string;
  medicalExaminer?: string;
  selfCertified: boolean;
  nationalRegistry: boolean;
  result?: string;
  status: string;
  startDate?: string;
  expirationDate?: string;
  outOfServiceDate?: string;
  backInServiceDate?: string;
  createdAt: string;
  updatedAt: string;
  issue: {
    id: string;
    title: string;
    description?: string;
    status: string;
    priority: string;
  };
}

interface PhysicalIssueFormProps {
  physicalIssue?: PhysicalIssue | null;
  partyId?: string; // Changed from personId to partyId
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const physicalTypes = [
  { value: "Annual", label: "Annual" },
  { value: "Bi_Annual", label: "Bi-Annual" },
  { value: "Return_to_Duty", label: "Return to Duty" },
  { value: "Post_Accident", label: "Post Accident" },
  { value: "One_Month", label: "1 Month" },
  { value: "Three_Month", label: "3 Month" },
  { value: "Six_Month", label: "6 Month" },
  { value: "Pre_Hire", label: "Pre-Hire" },
  { value: "No_Physical_Issue", label: "No Physical Issue" },
];

const physicalResults = [
  { value: "Three_Month", label: "3 Months", months: 3 },
  { value: "Six_Month", label: "6 Months", months: 6 },
  { value: "One_Year", label: "1 Year", months: 12 },
  { value: "Two_Years", label: "2 Years", months: 24 },
  { value: "Disqualified", label: "Disqualified", months: 0 },
];

export default function PhysicalIssueForm({
  partyId,
  physicalIssue,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: PhysicalIssueFormProps) {
  const [formData, setFormData] = useState({
    type: physicalIssue?.type || "",
    medicalExaminer: physicalIssue?.medicalExaminer || "",
    selfCertified: physicalIssue?.selfCertified || false,
    nationalRegistry: physicalIssue?.nationalRegistry || false,
    result: physicalIssue?.result || "",
    startDate: physicalIssue?.startDate
      ? new Date(physicalIssue.startDate).toISOString().split("T")[0]
      : "",
    expirationDate: physicalIssue?.expirationDate
      ? new Date(physicalIssue.expirationDate).toISOString().split("T")[0]
      : "",
    outOfServiceDate: physicalIssue?.outOfServiceDate
      ? new Date(physicalIssue.outOfServiceDate).toISOString().split("T")[0]
      : "",
    backInServiceDate: physicalIssue?.backInServiceDate
      ? new Date(physicalIssue.backInServiceDate).toISOString().split("T")[0]
      : "",
    status: physicalIssue?.status || "Qualified",
  });

  // Auto-calculate expiration date when start date or result changes
  useEffect(() => {
    if (formData.startDate && formData.result && formData.result !== "Disqualified") {
      const selectedResult = physicalResults.find((r) => r.value === formData.result);
      if (selectedResult) {
        const startDate = new Date(formData.startDate);
        const expirationDate = new Date(startDate);
        expirationDate.setMonth(expirationDate.getMonth() + selectedResult.months);

        setFormData((prev) => ({
          ...prev,
          expirationDate: expirationDate.toISOString().split("T")[0],
        }));
      }
    } else if (formData.result === "Disqualified") {
      // Clear expiration date for disqualified results
      setFormData((prev) => ({
        ...prev,
        expirationDate: "",
        status: "Disqualified",
        outOfServiceDate: formData.startDate, // Set out of service to exam date
      }));
    } else if (formData.result && formData.result !== "Disqualified") {
      // Reset status to qualified for valid results
      setFormData((prev) => ({
        ...prev,
        status: "Qualified",
        outOfServiceDate: "",
        backInServiceDate: "",
      }));
    }
  }, [formData.startDate, formData.result]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const submitData = {
      ...formData,
      title: `Physical Exam - ${formData.type}`, // Generate title like MVR does
      partyId: physicalIssue ? undefined : partyId, // Use partyId like MVR
      // Convert dates to proper format
      startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
      expirationDate: formData.expirationDate
        ? new Date(formData.expirationDate).toISOString()
        : null,
      outOfServiceDate: formData.outOfServiceDate
        ? new Date(formData.outOfServiceDate).toISOString()
        : null,
      backInServiceDate: formData.backInServiceDate
        ? new Date(formData.backInServiceDate).toISOString()
        : null,
    };

    onSubmit(submitData);
  };

  const isDisqualified = formData.result === "Disqualified";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Physical Examination Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Physical Type *</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => handleInputChange("type", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select physical type" />
              </SelectTrigger>
              <SelectContent>
                {physicalTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Medical Examiner */}
          <div className="space-y-2">
            <Label htmlFor="medicalExaminer">Medical Examiner</Label>
            <Input
              id="medicalExaminer"
              value={formData.medicalExaminer}
              onChange={(e) => handleInputChange("medicalExaminer", e.target.value)}
              placeholder="Name of medical examiner"
            />
          </div>

          {/* Checkboxes */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="selfCertified"
                checked={formData.selfCertified}
                onCheckedChange={(checked) => handleInputChange("selfCertified", !!checked)}
              />
              <Label htmlFor="selfCertified">Self Certified</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="nationalRegistry"
                checked={formData.nationalRegistry}
                onCheckedChange={(checked) => handleInputChange("nationalRegistry", !!checked)}
              />
              <Label htmlFor="nationalRegistry">National Registry</Label>
            </div>
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label htmlFor="startDate">Exam Date *</Label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) => handleInputChange("startDate", e.target.value)}
              required
            />
          </div>

          {/* Result */}
          <div className="space-y-2">
            <Label htmlFor="result">Medical Result *</Label>
            <Select
              value={formData.result}
              onValueChange={(value) => handleInputChange("result", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select medical result" />
              </SelectTrigger>
              <SelectContent>
                {physicalResults.map((result) => (
                  <SelectItem key={result.value} value={result.value}>
                    {result.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Auto-calculated or manual expiration date */}
          {!isDisqualified && (
            <div className="space-y-2">
              <Label htmlFor="expirationDate" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Expiration Date
                {formData.startDate && formData.result && (
                  <span className="text-sm text-green-600">(Auto-calculated)</span>
                )}
              </Label>
              <Input
                id="expirationDate"
                type="date"
                value={formData.expirationDate}
                onChange={(e) => handleInputChange("expirationDate", e.target.value)}
                readOnly={!!(formData.startDate && formData.result)}
                className={formData.startDate && formData.result ? "bg-green-50" : ""}
              />
            </div>
          )}

          {/* Disqualified Status Fields */}
          {isDisqualified && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-red-700 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Disqualification Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="outOfServiceDate">Out of Service Date</Label>
                  <Input
                    id="outOfServiceDate"
                    type="date"
                    value={formData.outOfServiceDate}
                    onChange={(e) => handleInputChange("outOfServiceDate", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="backInServiceDate">Back in Service Date</Label>
                  <Input
                    id="backInServiceDate"
                    type="date"
                    value={formData.backInServiceDate}
                    onChange={(e) => handleInputChange("backInServiceDate", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Auto-calculation Info */}
      {formData.startDate && formData.result && !isDisqualified && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-blue-700">
              <Clock className="h-4 w-4" />
              <span className="text-sm">
                <strong>Auto-calculated:</strong> Expiration date set to {formData.startDate} +{" "}
                {physicalResults.find((r) => r.value === formData.result)?.label.toLowerCase()}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Actions */}
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : physicalIssue ? "Update Physical" : "Create Physical"}
        </Button>
      </div>
    </form>
  );
}
