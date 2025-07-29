'use client'

import { AppLayout } from '@/components/layouts/app-layout'
import { MasterOverviewDashboard } from "@/components/dashboard/master-overview-dashboard"
import { useMasterOrg } from '@/hooks/use-master-org'

interface MasterDashboardPageProps {
  params: {
    masterOrgId: string
  }
}

export default function MasterDashboardPage({ params }: MasterDashboardPageProps) {
  const { masterOrgId } = params
  const { masterOrg, loading } = useMasterOrg()
  
  // Use master organization name in header
  const masterName = masterOrg?.name || 'Master'
  
  return (
    <AppLayout
      name={masterName}
      topNav={[]}  // Empty as specified in pagesContentOutline
      className="px-6 py-8 max-w-7xl mx-auto"
    >
      <MasterOverviewDashboard masterOrgId={masterOrgId} />
    </AppLayout>
  )
} 