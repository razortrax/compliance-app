"use client";

import { useParams } from "next/navigation";
import { OrganizationDetailContent } from "@/components/organizations/organization-detail-content";

export default function DirectOrganizationPage() {
  const params = useParams();
  const organizationId = params.id as string;

  return <OrganizationDetailContent organizationId={organizationId} navigationContext="direct" />;
}
