"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutDashboard, ArrowRight, Building } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function DashboardQuickAccess() {
  const router = useRouter();
  const handleDashboardClick = async () => {
    try {
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const { masterOrganization } = await response.json();
        if (masterOrganization?.id) {
          router.push(`/master/${masterOrganization.id}`);
        } else {
          router.push("/complete-profile");
        }
      } else {
        router.push("/complete-profile");
      }
    } catch (error) {
      console.error("Error navigating to dashboard:", error);
      router.push("/complete-profile");
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card className="relative hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-200 h-full">
        <CardHeader className="text-center pb-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 mx-auto mb-3">
            <LayoutDashboard className="h-6 w-6" />
          </div>
          <CardTitle className="text-lg">Master Dashboard</CardTitle>
          <CardDescription className="text-sm">
            Fleet overview and compliance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700"
            size="sm"
            onClick={handleDashboardClick}
          >
            Go to Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      <Link href="/organizations">
        <Card className="relative hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-green-200 h-full">
          <CardHeader className="text-center pb-3">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600 mx-auto mb-3">
              <Building className="h-6 w-6" />
            </div>
            <CardTitle className="text-lg">Organizations</CardTitle>
            <CardDescription className="text-sm">
              Manage your organizations and fleet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full bg-green-600 hover:bg-green-700" size="sm">
              Manage Organizations
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
