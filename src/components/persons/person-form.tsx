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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2, X, UserX } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Person {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: Date | null;
  licenseNumber?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  party?: {
    role: Array<{
      roleType: string;
      organizationId: string;
      locationId?: string | null;
      location?: { id: string; name: string } | null;
      startDate?: string | null;
    }>;
  };
}

interface Location {
  id: string;
  name: string;
}

interface PersonFormProps {
  organizationId: string;
  person?: Person;
  onSuccess: () => void;
  onCancel: () => void;
  onDeactivate?: () => void;
}

export function PersonForm({
  organizationId,
  person,
  onSuccess,
  onCancel,
  onDeactivate,
}: PersonFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [dateOfBirth, setDateOfBirth] = useState<Date>();
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const [formData, setFormData] = useState({
    firstName: person?.firstName || "",
    lastName: person?.lastName || "",
    roleType: "driver", // Fixed: lowercase to match API expectations
    locationId: person?.party?.role?.[0]?.locationId || "none",
    hireDate: person?.party?.role?.[0]?.startDate
      ? new Date(person.party.role[0].startDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
  });

  // Load locations for this organization
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch(`/api/organizations/${organizationId}/locations`);
        if (response.ok) {
          const data = await response.json();
          setLocations(data);
        }
      } catch (error) {
        console.error("Error fetching locations:", error);
      }
    };

    fetchLocations();

    // Set initial date of birth if editing
    if (person?.dateOfBirth) {
      setDateOfBirth(new Date(person.dateOfBirth));
    }
  }, [organizationId, person]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        roleType: formData.roleType,
        dateOfBirth: dateOfBirth?.toISOString(),
        organizationId,
        // Convert "none" to null for locationId
        locationId: formData.locationId === "none" ? null : formData.locationId,
      };

      const url = person ? `/api/persons/${person.id}` : "/api/persons";
      const method = person ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const error = await response.json();
        console.error("Error saving person:", error);
        alert(`Error: ${error.error || "Failed to save person"}`);
      }
    } catch (error) {
      console.error("Error saving person:", error);
      alert("An error occurred while saving. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Basic details about the person</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Date of Birth</Label>
            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateOfBirth && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateOfBirth ? format(dateOfBirth, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateOfBirth}
                  onSelect={(date: Date | undefined) => {
                    setDateOfBirth(date);
                    setIsDatePickerOpen(false);
                  }}
                  defaultMonth={new Date(1980, 0)} // Start at 1980 for easier navigation
                  captionLayout="dropdown" // Add year/month dropdowns
                  fromYear={1940}
                  toYear={new Date().getFullYear()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Location Assignment */}
      <Card>
        <CardHeader>
          <CardTitle>Location Assignment</CardTitle>
          <CardDescription>Assign this driver to a specific location (optional)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="locationId">Assigned Location</Label>
            <Select
              value={formData.locationId}
              onValueChange={(value) => handleInputChange("locationId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select location (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No specific location</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex items-center justify-between">
        {/* Left side - Deactivate button (only when editing) */}
        <div>
          {person && onDeactivate && (
            <Button
              type="button"
              variant="outline"
              onClick={onDeactivate}
              disabled={isLoading}
              className="text-red-600 hover:text-red-700 hover:border-red-300"
            >
              <UserX className="h-4 w-4 mr-2" />
              Deactivate
            </Button>
          )}
        </div>

        {/* Right side - Cancel and Save buttons */}
        <div className="flex items-center space-x-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {person ? "Updating..." : "Adding..."}
              </>
            ) : (
              <>{person ? "Update Driver" : "Add Driver"}</>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
