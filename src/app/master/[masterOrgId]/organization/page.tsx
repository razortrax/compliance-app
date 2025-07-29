import { OrganizationList } from "@/components/organizations/organization-list"

interface OrganizationPageProps {
  params: {
    masterOrgId: string
  }
}

export default function OrganizationPage({ params }: OrganizationPageProps) {
  const { masterOrgId } = params
  
  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
          <p className="text-muted-foreground">
            Manage your fleet organizations and track compliance status
          </p>
        </div>
        
        <OrganizationList masterOrgId={masterOrgId} />
      </div>
    </div>
  )
} 