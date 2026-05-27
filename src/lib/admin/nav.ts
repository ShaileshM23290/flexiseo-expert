import {
  Coffee,
  FileSearch,
  LayoutDashboard,
  Network,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";
import { canManageUsers, type AdminRole } from "@/lib/auth/roles";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  description?: string;
  adminOnly?: boolean;
};

export const adminNavItems: AdminNavItem[] = [
  {
    href: "/admin",
    label: "Overview",
    icon: LayoutDashboard,
    description: "Summary and quick stats",
  },
  {
    href: "/admin/audits",
    label: "Audits",
    icon: FileSearch,
    description: "All website audits",
  },
  {
    href: "/admin/ips",
    label: "IP Usage",
    icon: Network,
    description: "Traffic by IP address",
  },
  {
    href: "/admin/payments",
    label: "Payments",
    icon: Coffee,
    description: "Coffee support transactions",
  },
  {
    href: "/admin/users",
    label: "Users",
    icon: Users,
    description: "Admin access and roles",
    adminOnly: true,
  },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: Settings,
    description: "Password and system",
  },
];

export function getAdminNavItems(role: AdminRole): AdminNavItem[] {
  return adminNavItems.filter((item) => !item.adminOnly || canManageUsers(role));
}

export function isAdminNavActive(href: string, pathname: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname.startsWith(href);
}
