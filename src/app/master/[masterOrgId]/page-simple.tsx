"use client";

interface MasterDashboardPageProps {
  params: {
    masterOrgId: string;
  };
}

export default function MasterDashboardPage({ params }: MasterDashboardPageProps) {
  const { masterOrgId } = params;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Master Dashboard</h1>
      <p>Master Org ID: {masterOrgId}</p>
      <p>If you can see this, the routing is working!</p>
    </div>
  );
}
