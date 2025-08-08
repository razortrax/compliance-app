"use client";

import { useState, useEffect } from "react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, X } from "lucide-react";
import { addYears } from "date-fns";

interface Registration {
  id: string;
  plateNumber: string;
  state: string;
  startDate: string;
  expirationDate: string;
  renewalDate?: string | null;
  status: "Active" | "Expired";
  notes?: string | null;
  issue: {
    id: string;
    title: string;
    description?: string | null;
    status: string;
    priority: string;
    party: {
      id: string;
      equipment?: {
        make?: string | null;
        model?: string | null;
        year?: number | null;
      } | null;
      organization?: {
        name: string;
      } | null;
    };
  };
}

interface Equipment {
  id: string;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  party: {
    id: string;
  };
}

interface RegistrationFormProps {
  registration?: Registration | null;
  equipmentId?: string; // Auto-assign to this equipment if provided
  renewingRegistration?: Registration | null; // Registration being renewed (triggers renewal logic)
  onSuccess: (registration: any) => void;
  onCancel: () => void;
}

const US_STATES = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
];

export function RegistrationForm({
  registration,
  equipmentId,
  renewingRegistration,
  onSuccess,
  onCancel,
}: RegistrationFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [equipment, setEquipment] = useState<Equipment | null>(null);

  // Form state
  const [plateNumber, setPlateNumber] = useState(
    registration?.plateNumber || renewingRegistration?.plateNumber || "",
  );
  const [state, setState] = useState(registration?.state || renewingRegistration?.state || "");
  const [startDate, setStartDate] = useState(
    registration?.startDate
      ? new Date(registration.startDate).toISOString().split("T")[0]
      : renewingRegistration
        ? new Date(renewingRegistration.expirationDate).toISOString().split("T")[0] // Start = old expiration for continuity
        : "",
  );
  const [expirationDate, setExpirationDate] = useState(
    registration?.expirationDate
      ? new Date(registration.expirationDate).toISOString().split("T")[0]
      : renewingRegistration
        ? addYears(new Date(renewingRegistration.expirationDate), 1).toISOString().split("T")[0] // Pre-calculate for renewals
        : "",
  );
  const [renewalDate, setRenewalDate] = useState(
    registration?.renewalDate
      ? new Date(registration.renewalDate).toISOString().split("T")[0]
      : renewingRegistration
        ? new Date().toISOString().split("T")[0] // Set today as renewal date for the OLD registration
        : "",
  );
  const [status, setStatus] = useState<"Active" | "Expired">(registration?.status || "Active");
  const [notes, setNotes] = useState(registration?.notes || "");

  // Auto-calculate expiration date ONLY when user manually changes start date (not on initial load)
  useEffect(() => {
    if (startDate && !registration && !renewingRegistration) {
      // Only auto-calculate for NEW registrations, not renewals
      const start = new Date(startDate);
      const expiration = addYears(start, 1);
      setExpirationDate(expiration.toISOString().split("T")[0]);
    }
  }, [startDate, registration, renewingRegistration]);

  // Handle expiration date updates for renewals when start date changes
  useEffect(() => {
    if (startDate && renewingRegistration) {
      const start = new Date(startDate);
      const expiration = addYears(start, 1);
      const newExpireDateString = expiration.toISOString().split("T")[0];
      setExpirationDate(newExpireDateString);
    }
  }, [startDate, renewingRegistration]);

  // Load equipment if equipmentId provided
  useEffect(() => {
    if (equipmentId) {
      const fetchEquipment = async () => {
        try {
          const response = await fetch(`/api/equipment/${equipmentId}`);
          if (response.ok) {
            const data = await response.json();
            setEquipment(data);
          }
        } catch (error) {
          console.error("Error fetching equipment:", error);
        }
      };
      fetchEquipment();
    }
  }, [equipmentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!plateNumber || !state || !startDate || !expirationDate) {
      alert("Please fill in all required fields");
      return;
    }

    setIsLoading(true);

    try {
      const partyId = equipment?.party.id || registration?.issue.party.id;
      if (!partyId) {
        throw new Error("No equipment party ID found");
      }

      const registrationData = {
        plateNumber: plateNumber.trim(),
        state,
        startDate: new Date(startDate).toISOString(),
        expirationDate: new Date(expirationDate).toISOString(),
        renewalDate: renewalDate ? new Date(renewalDate).toISOString() : null,
        status,
        notes: notes.trim() || null,
        partyId,
        title: `Registration: ${plateNumber} (${state})`,
        description:
          `Equipment registration for ${equipment?.make || "Equipment"} ${equipment?.model || ""} ${equipment?.year || ""}`.trim(),
        priority: "medium",
      };

      const url = registration ? `/api/registrations/${registration.id}` : "/api/registrations";
      const method = registration ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registrationData),
      });

      if (response.ok) {
        const result = await response.json();

        // If this is a renewal, expire the old registration
        if (renewingRegistration) {
          await fetch(`/api/registrations/${renewingRegistration.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...renewingRegistration,
              status: "Expired",
              renewalDate: renewalDate
                ? new Date(renewalDate).toISOString()
                : new Date().toISOString(),
            }),
          });
        }

        onSuccess(result);
      } else {
        const error = await response.json();
        console.error("Registration save error:", error);
        alert(`Error: ${error.error || "Failed to save registration"}`);
      }
    } catch (error) {
      console.error("Error submitting registration:", error);
      alert("An error occurred while saving. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getFormTitle = () => {
    if (renewingRegistration) return "Renew Registration";
    if (registration) return "Edit Registration";
    return "Add New Registration";
  };

  const getFormDescription = () => {
    if (renewingRegistration)
      return "Create a new registration starting when the current one expires (seamless continuity)";
    if (registration) return "Update registration information";
    return "Register equipment with state authorities";
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getFormTitle()}
            {renewingRegistration && (
              <Badge variant="outline" className="bg-blue-50">
                Renewal
              </Badge>
            )}
          </CardTitle>
          <CardDescription>{getFormDescription()}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Registration Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="plateNumber">Plate Number *</Label>
              <Input
                id="plateNumber"
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                placeholder="ABC123"
                required
                disabled={!!renewingRegistration}
                className={renewingRegistration ? "bg-gray-50" : ""}
              />
              {renewingRegistration && (
                <p className="text-xs text-gray-500">
                  Plate number carried over from existing registration
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State *</Label>
              <Select value={state} onValueChange={setState} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map((state) => (
                    <SelectItem key={state.value} value={state.value}>
                      {state.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Fields - HTML5 Gold Standard */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expirationDate">Expiration Date *</Label>
              <Input
                id="expirationDate"
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                required
                className="w-full"
              />
            </div>

            {renewingRegistration && (
              <div className="space-y-2">
                <Label htmlFor="renewalDate">Renewal Date</Label>
                <Input
                  id="renewalDate"
                  type="date"
                  value={renewalDate}
                  onChange={(e) => setRenewalDate(e.target.value)}
                  className="w-full"
                />
              </div>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={status}
              onValueChange={(value: "Active" | "Expired") => setStatus(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes about this registration..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex items-center justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {renewingRegistration ? "Renewing..." : registration ? "Updating..." : "Creating..."}
            </>
          ) : (
            <>
              {renewingRegistration
                ? "Renew Registration"
                : registration
                  ? "Update Registration"
                  : "Create Registration"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
