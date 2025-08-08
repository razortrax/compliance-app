import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";

export type StatusType = "active" | "pending" | "inactive" | "overdue" | "completed" | "warning";

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  showIcon?: boolean;
  className?: string;
}

const statusConfig: Record<
  StatusType,
  {
    label: string;
    className: string;
    icon: React.ElementType;
  }
> = {
  active: {
    label: "Active",
    className: "bg-green-50 text-green-700 border-green-200",
    icon: CheckCircle,
  },
  pending: {
    label: "Pending",
    className: "bg-yellow-50 text-yellow-700 border-yellow-200",
    icon: Clock,
  },
  inactive: {
    label: "Inactive",
    className: "bg-gray-50 text-gray-700 border-gray-200",
    icon: XCircle,
  },
  overdue: {
    label: "Overdue",
    className: "bg-red-50 text-red-700 border-red-200",
    icon: AlertCircle,
  },
  completed: {
    label: "Completed",
    className: "bg-blue-50 text-blue-700 border-blue-200",
    icon: CheckCircle,
  },
  warning: {
    label: "Warning",
    className: "bg-orange-50 text-orange-700 border-orange-200",
    icon: AlertCircle,
  },
};

export function StatusBadge({ status, label, showIcon = true, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {showIcon && <Icon className="h-3 w-3 mr-1" />}
      {label || config.label}
    </Badge>
  );
}
