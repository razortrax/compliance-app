"use client";

import { useParams } from "next/navigation";
import { OrganizationDetailContent } from "@/components/organizations/organization-detail-content";

export default function MasterOrganizationPage() {
  const params = useParams();
  const masterOrgId = params.masterOrgId as string;
  const organizationId = params.orgId as string;

  return (
    <OrganizationDetailContent
      organizationId={organizationId}
      navigationContext="master"
      masterOrgId={masterOrgId}
    />
  );
}
