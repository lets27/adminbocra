import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Building2,
  FileWarning,
  LayoutDashboard,
  MapPinned,
  ShieldAlert,
  Waves,
} from "lucide-react";

export type DashboardBadgeVariant =
  | "default"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | "outline";

export type AdminNavItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

export const adminNavItems: AdminNavItem[] = [
  {
    href: "/",
    label: "Dashboard",
    description: "Live escalation pulse",
    icon: LayoutDashboard,
  },
  {
    href: "/complaints",
    label: "Complaints",
    description: "Queue, triage, detail",
    icon: ShieldAlert,
  },
  {
    href: "/operators",
    label: "Operators",
    description: "Oversight and policy load",
    icon: Building2,
  },
  {
    href: "/operator-analytics",
    label: "Operator Load",
    description: "Complaint weight ranking",
    icon: BarChart3,
  },
  {
    href: "/map",
    label: "Map",
    description: "Operator locations and load",
    icon: MapPinned,
  },
  {
    href: "/licensing",
    label: "Licensing",
    description: "Risk and license posture",
    icon: FileWarning,
  },
  {
    href: "/analytics",
    label: "Analytics",
    description: "Region, category, operator",
    icon: Waves,
  },
];

export function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatTimestamp(value: number | null | undefined) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-BW", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export function formatShortDate(value: number | null | undefined) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-BW", {
    dateStyle: "medium",
  }).format(value);
}

export function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "n/a";
  }

  return `${Math.round(value)}%`;
}

export function getComplaintStatusVariant(
  status: string,
): DashboardBadgeVariant {
  if (status === "UNDER_INVESTIGATION") {
    return "danger";
  }

  if (status === "ESCALATED_TO_BOCRA") {
    return "warning";
  }

  if (status === "ESCALATION_REQUESTED") {
    return "outline";
  }

  if (status === "CLOSED") {
    return "secondary";
  }

  return "default";
}

export function getLicenseStatusVariant(
  status: string,
): DashboardBadgeVariant {
  if (status === "ACTIVE") {
    return "success";
  }

  if (status === "UNDER_REVIEW") {
    return "warning";
  }

  if (status === "SUSPENDED") {
    return "danger";
  }

  return "outline";
}

export function getRiskVariant(riskLevel: string): DashboardBadgeVariant {
  if (riskLevel === "HIGH") {
    return "danger";
  }

  if (riskLevel === "MEDIUM") {
    return "warning";
  }

  return "success";
}

export function getRecommendedActionVariant(
  action: string,
): DashboardBadgeVariant {
  if (action === "SUSPENSION_IN_EFFECT") {
    return "danger";
  }

  if (
    action === "REVIEW_RECOMMENDED" ||
    action === "REVIEW_IN_PROGRESS"
  ) {
    return "warning";
  }

  if (action === "EXPIRY_FOLLOW_UP") {
    return "outline";
  }

  return "secondary";
}

export function getNavItemIsActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
