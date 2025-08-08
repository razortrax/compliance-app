"use client";

import { EntityDetailPage } from "@/components/entity/entity-detail-page";

interface LocationPageProps {
  params: {
    id: string;
  };
}

export default function LocationPage({ params }: LocationPageProps) {
  return <EntityDetailPage entityType="location" entityId={params.id} />;
}
