"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

// DOT number validation - simple format for now, prepared for API lookup
const dotNumberSchema = z.string().optional().refine((val) => {
  if (!val) return true;
  // Basic DOT number format: 6-8 digits
  return /^\d{6,8}$/.test(val);
}, {
  message: "DOT number must be 6-8 digits"
});

const formSchema = z.object({
  name: z.string().min(1, "Company name is required"),
  dotNumber: dotNumberSchema,
  einNumber: z.string().optional(),
  permitNumber: z.string().optional(),
  phone: z.string().optional(),
  // Prepared for future location-based addresses
  notes: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

interface OrganizationFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: FormData) => Promise<void>
  initialData?: Partial<FormData>
  isEditing?: boolean
}

export function OrganizationForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isEditing = false
}: OrganizationFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      dotNumber: initialData?.dotNumber || "",
      einNumber: initialData?.einNumber || "",
      permitNumber: initialData?.permitNumber || "",
      phone: initialData?.phone || "",
      notes: initialData?.notes || "",
    },
  })

  const handleSubmit = async (data: FormData) => {
    setIsLoading(true)
    try {
      await onSubmit(data)
      form.reset()
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to save organization:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const canActivate = () => {
    const einNumber = form.watch("einNumber")
    const permitNumber = form.watch("permitNumber")
    return einNumber && permitNumber
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Organization" : "Add New Organization"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Update organization information"
              : "Create a new organization. EIN and permit required for activation."
            }
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

            <FormField
              control={form.control}
              name="dotNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>DOT Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 1234567" {...field} />
                  </FormControl>
                  <FormDescription>
                    6-8 digit DOT number (if applicable)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="einNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      EIN Number
                      <Badge variant="outline" className="ml-1 text-xs">
                        Required for activation
                      </Badge>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="XX-XXXXXXX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="permitNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Permit Number
                      <Badge variant="outline" className="ml-1 text-xs">
                        Required for activation
                      </Badge>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Permit #" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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

            {!isEditing && (
              <div className="bg-muted p-3 rounded-lg text-sm">
                <p className="font-medium">Status: Pending</p>
                <p className="text-muted-foreground">
                  {canActivate() 
                    ? "✅ Ready for activation with EIN and permit"
                    : "❌ EIN and permit required for activation"
                  }
                </p>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
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
  )
} 