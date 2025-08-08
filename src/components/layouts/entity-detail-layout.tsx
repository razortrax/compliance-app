"use client";

import React, { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Settings, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface EntityTab {
  id: string;
  label: string;
  content: ReactNode;
  disabled?: boolean;
}

export interface EntityDetailLayoutProps {
  entityType: "organization" | "location";
  entityName: string;
  entityStatus?: "active" | "inactive" | "pending";
  breadcrumbs?: Array<{ label: string; href?: string }>;
  tabs: EntityTab[];
  activeTab?: string;
  onTabChange?: (value: string) => void;
  actions?: Array<{
    label: string;
    onClick: () => void;
    destructive?: boolean;
  }>;
}

export function EntityDetailLayout({
  entityType,
  entityName,
  entityStatus = "active",
  breadcrumbs = [],
  tabs,
  activeTab,
  onTabChange,
  actions = [],
}: EntityDetailLayoutProps) {
  const defaultBreadcrumbs = [
    {
      label: entityType === "organization" ? "Organizations" : "Locations",
      href: entityType === "organization" ? "/dashboard" : undefined,
    },
    ...breadcrumbs,
    { label: entityName },
  ];

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600">
          {defaultBreadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {index > 0 && <span className="text-gray-400 mx-2">/</span>}
              {crumb.href ? (
                <a href={crumb.href} className="hover:text-gray-900">
                  {crumb.label}
                </a>
              ) : (
                <span className="text-gray-900">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{entityName}</h1>
            <StatusBadge status={entityStatus} />
          </div>

          <div className="flex items-center gap-2">
            {/* Primary Edit Button */}
            {actions.length > 0 && (
              <Button variant="outline" size="sm" onClick={actions[0]?.onClick}>
                <Settings className="h-4 w-4 mr-2" />
                {actions[0]?.label || "Edit"}
              </Button>
            )}

            {/* Additional actions in dropdown if more than one */}
            {actions.length > 1 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {actions.slice(1).map((action, index) => (
                    <DropdownMenuItem
                      key={index}
                      onClick={action.onClick}
                      className={action.destructive ? "text-destructive" : ""}
                    >
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} disabled={tab.disabled}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {tabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="mt-6">
              {tab.content}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
