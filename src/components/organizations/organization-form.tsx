"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

// DOT number validation - required but allows "No DOT" option
const dotNumberSchema = z
  .string()
  .min(1, "DOT number is required")
  .refine(
    (val) => {
      if (val === "NO_DOT") return true;
      // Basic DOT number format: 6-8 digits
      return /^\d{6,8}$/.test(val);
    },
    {
      message: "DOT number must be 6-8 digits or select 'No DOT'",
    },
  );

const formSchema = z.object({
  name: z.string().min(1, "Company name is required"),
  dotNumber: dotNumberSchema,
  einNumber: z.string().optional(),
  phone: z.string().optional(),
  // Prepared for future location-based addresses
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface OrganizationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FormData) => Promise<void>;
  initialData?: Partial<FormData>;
  isEditing?: boolean;
}

export function OrganizationForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isEditing = false,
}: OrganizationFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [dotType, setDotType] = useState<"dot" | "no-dot">(
    initialData?.dotNumber === "NO_DOT" ? "no-dot" : "dot",
  );
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      dotNumber: initialData?.dotNumber || "",
      einNumber: initialData?.einNumber || "",
      phone: initialData?.phone || "",
      notes: initialData?.notes || "",
    },
  });

  const handleSubmit = async (data: FormData) => {
    // Prevent double submission
    if (isSubmitting) {
      console.log("🚫 Form already submitting, ignoring duplicate submission");
      return;
    }

    setIsSubmitting(true);

    try {
      console.log("📝 Submitting organization form:", data);
      await onSubmit(data);
      toast({
        title: "Success",
        description: "Organization saved successfully",
      });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save organization:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save organization",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDotTypeChange = (value: "dot" | "no-dot") => {
    setDotType(value);
    if (value === "no-dot") {
      form.setValue("dotNumber", "NO_DOT");
    } else {
      form.setValue("dotNumber", "");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Organization" : "Add New Organization"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update organization information"
              : "Create a new organization with required DOT information."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter company name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>DOT Registration *</FormLabel>
              <Select value={dotType} onValueChange={handleDotTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select DOT status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dot">Has DOT Number</SelectItem>
                  <SelectItem value="no-dot">No DOT Number</SelectItem>
                </SelectContent>
              </Select>

              {dotType === "dot" && (
                <FormField
                  control={form.control}
                  name="dotNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder="e.g. 1234567" {...field} />
                      </FormControl>
                      <FormDescription>Enter your 6-8 digit DOT number</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="einNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>EIN Number</FormLabel>
                  <FormControl>
                    <Input placeholder="XX-XXXXXXX" {...field} />
                  </FormControl>
                  <FormDescription>Employer Identification Number (optional)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="(555) 123-4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Input placeholder="Additional information" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : isEditing ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
