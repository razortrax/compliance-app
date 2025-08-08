"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shield, Star, MapPin, Clock, DollarSign, Search } from "lucide-react";

interface Consultant {
  id: string;
  name: string;
  licenseNumber?: string;
  yearsExperience: number;
  hourlyRate: number;
  bio: string;
  specializations: string[];
  isVerified: boolean;
  rating?: number;
  location?: string;
}

// Mock data for now - this will come from API later
const mockConsultants: Consultant[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    licenseNumber: "DOT-12345",
    yearsExperience: 15,
    hourlyRate: 175,
    bio: "Experienced DOT compliance expert specializing in audit preparation and safety management. Former FMCSA investigator with deep knowledge of regulatory requirements.",
    specializations: ["DOT_AUDIT", "SAFETY", "HOURS_OF_SERVICE"],
    isVerified: true,
    rating: 4.9,
    location: "Texas, USA",
  },
  {
    id: "2",
    name: "Michael Chen",
    licenseNumber: "DOT-67890",
    yearsExperience: 12,
    hourlyRate: 150,
    bio: "Fleet safety consultant with expertise in driver qualification files and vehicle maintenance records. Helped 200+ companies achieve compliance.",
    specializations: ["DRIVER_QUALIFICATION", "VEHICLE_MAINTENANCE", "DRUG_ALCOHOL"],
    isVerified: true,
    rating: 4.8,
    location: "California, USA",
  },
  {
    id: "3",
    name: "Jennifer Williams",
    yearsExperience: 8,
    hourlyRate: 125,
    bio: "DOT compliance specialist focused on small to medium fleets. Expert in streamlining compliance processes and reducing regulatory burden.",
    specializations: ["GENERAL", "HOURS_OF_SERVICE", "SAFETY"],
    isVerified: false,
    rating: 4.7,
    location: "Florida, USA",
  },
];

const specializations = [
  { value: "DOT_AUDIT", label: "DOT Audit Preparation" },
  { value: "SAFETY", label: "Safety Management" },
  { value: "HOURS_OF_SERVICE", label: "Hours of Service Compliance" },
  { value: "DRIVER_QUALIFICATION", label: "Driver Qualification Files" },
  { value: "VEHICLE_MAINTENANCE", label: "Vehicle Maintenance Records" },
  { value: "DRUG_ALCOHOL", label: "Drug & Alcohol Testing" },
  { value: "HAZMAT", label: "Hazmat Transportation" },
  { value: "GENERAL", label: "General DOT Compliance" },
];

export default function ConsultantMarketplace() {
  const [consultants, setConsultants] = useState<Consultant[]>(mockConsultants);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSpecialization, setFilterSpecialization] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("rating");

  const formatSpecialization = (spec: string) => {
    return spec.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const filteredConsultants = consultants
    .filter((consultant) => {
      const matchesSearch =
        searchTerm === "" ||
        consultant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        consultant.bio.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSpecialization =
        filterSpecialization === "" || consultant.specializations.includes(filterSpecialization);

      return matchesSearch && matchesSpecialization;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return (b.rating || 0) - (a.rating || 0);
        case "experience":
          return b.yearsExperience - a.yearsExperience;
        case "rate":
          return a.hourlyRate - b.hourlyRate;
        default:
          return 0;
      }
    });

  const handleConsultationRequest = (consultantId: string) => {
    // This will open a modal or navigate to consultation request form
    alert(`Consultation request feature coming soon! Consultant ID: ${consultantId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Find DOT Compliance Experts</h1>
            <p className="text-lg text-muted-foreground">
              Connect with verified consultants who can help you navigate DOT regulations and
              prepare for audits
            </p>
          </div>

          {/* Search and Filters */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search consultants by name or expertise..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Select value={filterSpecialization} onValueChange={setFilterSpecialization}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by specialization" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Specializations</SelectItem>
                    {specializations.map((spec) => (
                      <SelectItem key={spec.value} value={spec.value}>
                        {spec.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="experience">Most Experience</SelectItem>
                    <SelectItem value="rate">Lowest Rate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Results Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">
              {filteredConsultants.length} consultant{filteredConsultants.length !== 1 ? "s" : ""}{" "}
              available
            </h2>
            <p className="text-sm text-muted-foreground">
              All consultants are reviewed for quality and expertise
            </p>
          </div>

          {/* Consultant List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredConsultants.map((consultant) => (
              <Card key={consultant.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {consultant.name}
                        {consultant.isVerified && (
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200"
                          >
                            <Shield className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        {consultant.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span>{consultant.rating}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{consultant.yearsExperience} years exp.</span>
                        </div>
                        {consultant.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>{consultant.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-lg font-semibold">
                        <DollarSign className="h-4 w-4" />
                        {consultant.hourlyRate}/hr
                      </div>
                      {consultant.licenseNumber && (
                        <p className="text-xs text-muted-foreground">{consultant.licenseNumber}</p>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {consultant.bio}
                  </p>

                  <div className="mb-4">
                    <p className="text-sm font-medium mb-2">Specializations:</p>
                    <div className="flex flex-wrap gap-2">
                      {consultant.specializations.map((spec) => (
                        <Badge
                          key={spec}
                          variant="outline"
                          className="bg-purple-50 text-purple-700 border-purple-200"
                        >
                          {formatSpecialization(spec)}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      View Profile
                    </Button>
                    <Button
                      size="sm"
                      className="flex-2 bg-purple-600 hover:bg-purple-700"
                      onClick={() => handleConsultationRequest(consultant.id)}
                    >
                      Request Consultation
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredConsultants.length === 0 && (
            <div className="text-center py-12">
              <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No consultants found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search criteria or check back later for new consultants.
              </p>
            </div>
          )}

          {/* Call to Action */}
          <Card className="mt-12">
            <CardContent className="p-8 text-center">
              <Shield className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Are you a DOT compliance expert?</h3>
              <p className="text-muted-foreground mb-4">
                Join our marketplace and help fleet operators stay compliant while growing your
                consulting practice.
              </p>
              <Button className="bg-purple-600 hover:bg-purple-700">Become a Consultant</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
