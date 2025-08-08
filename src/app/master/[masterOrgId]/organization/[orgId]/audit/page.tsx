"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { AppLayout } from "@/components/layouts/app-layout";
import { useMasterOrg } from "@/hooks/use-master-org";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Clipboard,
  Brain,
  CheckCircle,
  FileText,
  Search,
  TrendingUp,
  Zap,
  Calendar,
  AlertTriangle,
} from "lucide-react";

interface Organization {
  id: string;
  name: string;
  dotNumber?: string | null;
}

export default function OrganizationAuditPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const { masterOrg } = useMasterOrg();
  const masterOrgId = params.masterOrgId as string;
  const orgId = params.orgId as string;

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch organization data
  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        const response = await fetch(`/api/organizations/${orgId}`);
        if (response.ok) {
          const data = await response.json();
          setOrganization(data);
        }
      } catch (error) {
        console.error("Error fetching organization:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (orgId) {
      fetchOrganization();
    }
  }, [orgId]);

  if (isLoading) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  // Correct static top navigation - NEVER make these dynamic!
  const topNav = [
    {
      label: "Master",
      href: masterOrg?.id ? `/master/${masterOrg.id}` : "/dashboard",
      isActive: false,
    },
    {
      label: "Organization",
      href: `/organizations/${orgId}`,
      isActive: true,
    },
    {
      label: "Drivers",
      href: `/organizations/${orgId}/drivers`,
      isActive: false,
    },
    {
      label: "Equipment",
      href: `/organizations/${orgId}/equipment`,
      isActive: false,
    },
  ];

  return (
    <AppLayout name={masterOrg?.name || "Master"} topNav={topNav} className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with organization name */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/master/${masterOrgId}/organization/${orgId}`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Organization
            </Button>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{organization?.name}</h1>
        </div>

        {/* Coming Soon Hero */}
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Brain className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">AI-Powered Audit Preparation</h2>
            <Badge variant="secondary" className="mb-4">
              Coming Soon
            </Badge>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Advanced artificial intelligence to analyze your compliance records and prepare your
              organization for successful DOT audits with comprehensive documentation and strategic
              recommendations.
            </p>
          </CardContent>
        </Card>

        {/* Feature Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Search className="h-6 w-6 text-blue-600" />
                <CardTitle className="text-lg">Comprehensive Analysis</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                AI review of all roadside inspections, accidents, driver records, and equipment
                maintenance to identify potential compliance gaps and strengths.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-green-600" />
                <CardTitle className="text-lg">Document Generation</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Automatically generate audit-ready documentation packages with compliance summaries,
                corrective action records, and performance metrics.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <TrendingUp className="h-6 w-6 text-purple-600" />
                <CardTitle className="text-lg">Strategic Recommendations</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Receive targeted recommendations for improving safety scores, addressing recurring
                issues, and demonstrating commitment to compliance excellence.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Zap className="h-6 w-6 text-yellow-600" />
                <CardTitle className="text-lg">Real-time Preparation</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Dynamic audit preparation that updates as new incidents, inspections, and compliance
                activities are recorded in the system.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <CardTitle className="text-lg">Compliance Scoring</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Advanced scoring algorithms that predict audit outcomes and highlight areas of
                strength and improvement opportunities.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Calendar className="h-6 w-6 text-indigo-600" />
                <CardTitle className="text-lg">Audit Scheduling</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Proactive scheduling and preparation timeline management to ensure your organization
                is always audit-ready with minimal stress.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Planned Features */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clipboard className="h-5 w-5" />
              Planned Audit Features
            </CardTitle>
            <CardDescription>
              A complete audit management system with intelligent preparation and documentation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Audit List Management</h4>
                  <p className="text-sm text-gray-600">
                    Master list of organization audits on the left with detailed views on the right,
                    including historical audit results and trending data.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">New Audit Preparation Wizard</h4>
                  <p className="text-sm text-gray-600">
                    Guided process that uses AI to analyze current compliance status and generate
                    comprehensive preparation strategies for upcoming audits.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Intelligent Documentation Engine</h4>
                  <p className="text-sm text-gray-600">
                    AI-powered system that reviews roadside inspections, accidents, driver and
                    equipment records to generate audit documentation and messaging for successful
                    results.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Predictive Risk Assessment</h4>
                  <p className="text-sm text-gray-600">
                    Machine learning algorithms that identify patterns in violations and incidents
                    to predict potential audit focus areas and recommend proactive measures.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Development Timeline */}
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-yellow-600 mt-1" />
              <div>
                <h4 className="font-medium text-yellow-900 mb-2">Development Status</h4>
                <p className="text-sm text-yellow-800 mb-4">
                  The AI-powered audit system will be developed after all driver and equipment issue
                  management features are complete. This ensures a comprehensive compliance
                  foundation before implementing advanced audit preparation tools.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Phase 1: Driver Issues Complete ✓</Badge>
                  <Badge variant="outline">Phase 2: Equipment Issues (In Progress)</Badge>
                  <Badge variant="outline">Phase 3: Audit System (Coming Soon)</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
