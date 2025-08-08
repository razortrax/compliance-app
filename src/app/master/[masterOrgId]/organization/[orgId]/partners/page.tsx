"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppLayout } from "@/components/layouts/app-layout";
import { useMasterOrg } from "@/hooks/use-master-org";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ActivityLog } from "@/components/ui/activity-log";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, Plus, Building2 } from "lucide-react";

type Partner = {
  id: string;
  partyId: string;
  type: "organization" | "person";
  name: string;
  category: string;
  isActive: boolean;
  startedAt?: string;
};

const CATEGORY_CHIPS = [
  { value: "annual_inspection_shop", label: "Inspection Shop" },
  { value: "repair_facility", label: "Repair" },
  { value: "lab", label: "Lab" },
  { value: "collection_site", label: "Collection" },
  { value: "mro", label: "MRO" },
  { value: "tpa", label: "TPA" },
  { value: "training_provider", label: "Training" },
  { value: "background_check_provider", label: "Background" },
  { value: "insurance_carrier", label: "Insurance" },
  { value: "telematics_provider", label: "Telematics" },
  { value: "towing_service", label: "Towing" },
  { value: "agency", label: "Agency" },
];

export default function MasterOrganizationPartnersPage() {
  const params = useParams();
  const router = useRouter();
  const { masterOrg } = useMasterOrg();
  const orgId = params?.orgId as string;
  const masterOrgId = params?.masterOrgId as string;

  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Partner | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newPartnerName, setNewPartnerName] = useState("");
  const [newPartnerCategory, setNewPartnerCategory] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchPartners();
  }, [orgId, selectedCategory, query, includeInactive]);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("organizationId", orgId);
      if (selectedCategory) params.set("category", selectedCategory);
      if (includeInactive) params.set("includeInactive", "true");
      if (query.trim()) params.set("q", query.trim());
      const res = await fetch(`/api/partners?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPartners(data);
        if (data.length > 0 && (!selected || !data.find((p: Partner) => p.id === selected.id))) {
          setSelected(data[0]);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const topNav = useMemo(
    () => [
      { label: "Master", href: masterOrgId ? `/master/${masterOrgId}` : "/dashboard", isActive: false },
      {
        label: "Organization",
        href: masterOrgId ? `/master/${masterOrgId}/organization/${orgId}` : `/organizations/${orgId}`,
        isActive: false,
      },
      {
        label: "Partners",
        href: masterOrgId
          ? `/master/${masterOrgId}/organization/${orgId}/partners`
          : `/organizations/${orgId}/partners`,
        isActive: true,
      },
    ],
    [orgId, masterOrgId],
  );

  return (
    <AppLayout name={masterOrg?.name || "Fleetrax"} topNav={topNav} className="p-6">
      <div className="h-[80vh] flex border rounded-lg bg-white overflow-hidden">
        {/* Left: Master list */}
        <div className="w-96 border-r border-gray-200 flex flex-col">
          <div className="p-3 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Partners</h2>
              <Badge variant="secondary">{partners.length}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Popover open={filterOpen} onOpenChange={setFilterOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="Filters" className="relative">
                    <Filter className="h-4 w-4" />
                    {(selectedCategory || includeInactive) && (
                      <Badge variant="secondary" className="absolute -top-1 -right-1 h-5 w-5 p-0 text-[10px] leading-5">
                        {Number(!!selectedCategory) + Number(!!includeInactive)}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-3">
                    <div className="text-sm font-medium">Category</div>
                    <div className="flex flex-wrap gap-1 max-h-40 overflow-y-auto">
                      {CATEGORY_CHIPS.map((chip) => (
                        <Badge
                          key={chip.value}
                          variant={selectedCategory === chip.value ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => setSelectedCategory((prev) => (prev === chip.value ? null : chip.value))}
                        >
                          {chip.label}
                        </Badge>
                      ))}
                    </div>
                    <div className="text-sm font-medium">Status</div>
                    <div className="flex gap-2">
                      <Button
                        variant={includeInactive ? "default" : "outline"}
                        size="sm"
                        onClick={() => setIncludeInactive((v) => !v)}
                      >
                        Include Inactive
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <Input
                placeholder="Search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-8 w-40"
              />
              <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" /> New Partner
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Add Partner</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Name</label>
                      <Input
                        placeholder="Vendor name"
                        value={newPartnerName}
                        onChange={(e) => setNewPartnerName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Category</label>
                      <Select value={newPartnerCategory || undefined} onValueChange={setNewPartnerCategory as any}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORY_CHIPS.map((c) => (
                            <SelectItem key={c.value} value={c.value}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowNewDialog(false)} disabled={creating}>
                        Cancel
                      </Button>
                      <Button
                        onClick={async () => {
                          if (!newPartnerName.trim() || !newPartnerCategory) return;
                          setCreating(true);
                          try {
                            const res = await fetch("/api/partners", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ organizationId: orgId, name: newPartnerName.trim(), category: newPartnerCategory }),
                            });
                            if (res.ok) {
                              setShowNewDialog(false);
                              setNewPartnerName("");
                              setNewPartnerCategory(null);
                              await fetchPartners();
                            }
                          } finally {
                            setCreating(false);
                          }
                        }}
                        disabled={creating || !newPartnerName.trim() || !newPartnerCategory}
                      >
                        {creating ? "Creating..." : "Create"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button size="sm" variant="outline" onClick={() => router.push(`/master/${masterOrgId}/organization/${orgId}`)}>
                Back
              </Button>
            </div>
          </div>

          <div className="p-3 flex-1 overflow-y-auto space-y-2">
            {loading ? (
              <div className="text-center text-sm text-muted-foreground py-6">Loading...</div>
            ) : partners.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  <Building2 className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                  No partners yet
                </CardContent>
              </Card>
            ) : (
              partners.map((p) => (
                <Card
                  key={`${p.id}-${p.partyId}`}
                  className={`cursor-pointer transition-colors ${selected?.id === p.id ? "ring-2 ring-blue-500 bg-blue-50" : "hover:bg-gray-50"}`}
                  onClick={() => setSelected(p)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-muted-foreground capitalize">{p.category.replace(/_/g, " ")}</div>
                      </div>
                      <Badge variant={p.isActive ? "secondary" : "outline"}>{p.isActive ? "Active" : "Inactive"}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div className="p-3 border-t">
            <Button size="sm" className="w-full" onClick={() => router.push(`/master/${masterOrgId}/organization/${orgId}`)}>
              Back to Organization
            </Button>
          </div>
        </div>

        {/* Right: Detail pane */}
        <div className="flex-1 overflow-y-auto">
          {selected ? (
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Partner</div>
                  <h1 className="text-2xl font-bold">{selected.name}</h1>
                  <div className="mt-1">
                    <Badge variant="outline" className="capitalize">
                      {selected.category.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Edit</Button>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>
              </div>

              {/* Add‑Ons */}
              <Card>
                <CardHeader>
                  <CardTitle>Add‑Ons</CardTitle>
                </CardHeader>
                <CardContent>
                  <ActivityLog
                    organizationId={selected.type === "organization" ? selected.id : undefined}
                    personId={selected.type === "person" ? selected.id : undefined}
                    title="Add‑Ons"
                    showAddButton
                  />
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-sm text-muted-foreground">Select a partner to view details</div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}


