import {
  FileSearch,
  LayoutDashboard,
  Network,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  description?: string;
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
    href: "/admin/settings",
    label: "Settings",
    icon: Settings,
    description: "Account and system",
  },
];

export function isAdminNavActive(href: string, pathname: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname.startsWith(href);
}
