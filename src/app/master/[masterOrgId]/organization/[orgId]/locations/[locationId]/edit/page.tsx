"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LocationForm } from "@/components/locations/location-form";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface EditLocationPageProps {
  params: {
    id: string;
    locationId: string;
  };
}

export default function EditLocationPage({ params }: EditLocationPageProps) {
  const router = useRouter();
  const [location, setLocation] = useState<any>(null);
  const [organization, setOrganization] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [params.locationId]);

  const fetchData = async () => {
    try {
      // Fetch location details
      const locResponse = await fetch(
        `/api/organizations/${params.id}/locations/${params.locationId}`,
      );
      if (locResponse.ok) {
        const locData = await locResponse.json();
        setLocation(locData);
      }

      // Fetch organization details for context
      const orgResponse = await fetch(`/api/organizations/${params.id}`);
      if (orgResponse.ok) {
        const orgData = await orgResponse.json();
        setOrganization(orgData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    router.push(`/organizations/${params.id}/locations/${params.locationId}`);
  };

  const handleCancel = () => {
    router.push(`/organizations/${params.id}/locations/${params.locationId}`);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!location) {
    return <div>Location not found</div>;
  }

  return (
    <div className="flex flex-col">
      {/* Breadcrumbs */}
      <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
        <a href="/dashboard" className="hover:text-gray-900">
          Organizations
        </a>
        <span className="text-gray-400">/</span>
        <a href={`/organizations/${params.id}`} className="hover:text-gray-900">
          {organization?.name || "Organization"}
        </a>
        <span className="text-gray-400">/</span>
        <a
          href={`/organizations/${params.id}/locations/${params.locationId}`}
          className="hover:text-gray-900"
        >
          {location.name}
        </a>
        <span className="text-gray-400">/</span>
        <span className="text-gray-900">Edit</span>
      </nav>

      <div className="mb-6">
        <PageHeader
          title={`Edit ${location.name}`}
          actions={
            <Button variant="outline" onClick={handleCancel} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Location
            </Button>
          }
        />
      </div>

      <div className="max-w-2xl">
        <LocationForm
          organizationId={params.id}
          location={location}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
