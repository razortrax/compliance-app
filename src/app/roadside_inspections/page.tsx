'use client'

import { AppLayout } from '@/components/layouts/app-layout'

export default function RoadSideInspectionsPage() {
  return (
    <AppLayout
      name="Roadside Inspections"
      topNav={[]}
      showOrgSelector={false}
      showDriverEquipmentSelector={false}
      sidebarMenu="organization"
      onOrganizationSelect={() => {}}
    >
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Roadside Inspections</h1>
          <p className="text-gray-600">
            Roadside Inspections feature is temporarily under maintenance.
          </p>
          <p className="text-gray-600 mt-2">
            Please use other navigation options or check back later.
          </p>
        </div>
      </div>
    </AppLayout>
  )
} 