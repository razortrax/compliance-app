import { AppLayout } from '@/components/layouts/app-layout'
import { MasterOverviewDashboard } from "@/components/dashboard/master-overview-dashboard"
import { useUser } from '@clerk/nextjs'

'use client'

export default function DashboardPage() {
  const { user } = useUser()
  
  // Get master name (user's name for now)
  const masterName = user?.fullName || user?.firstName || 'Master'
  
  return (
    <AppLayout
      name={masterName}
      topNav={[]}  // Empty as specified in pagesContentOutline
      className="px-6 py-8 max-w-7xl mx-auto"
    >
      <MasterOverviewDashboard />
    </AppLayout>
  )
} 