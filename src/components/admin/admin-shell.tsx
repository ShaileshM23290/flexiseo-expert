"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronLeft,
  ExternalLink,
  LogOut,
  Menu,
  RefreshCw,
  X,
} from "lucide-react";
import { useState, useTransition } from "react";
import { getAdminNavItems, isAdminNavActive } from "@/lib/admin/nav";
import { roleLabel, type AdminRole } from "@/lib/auth/roles";
import { siteConfig } from "@/lib/config";

const pageMeta: Record<string, { title: string; description: string }> = {
  "/admin": {
    title: "Overview",
    description: "Summary of audits, traffic, and platform usage.",
  },
  "/admin/audits": {
    title: "Audits",
    description: "All website SEO audits submitted to the platform.",
  },
  "/admin/ips": {
    title: "IP Usage",
    description: "Track audit activity by IP address.",
  },
  "/admin/users": {
    title: "Users",
    description: "Manage who can sign in to the admin panel.",
  },
  "/admin/settings": {
    title: "Settings",
    description: "Password and system configuration.",
  },
};

type AdminShellProps = {
  adminEmail: string;
  adminRole: AdminRole;
  children: React.ReactNode;
};

export function AdminShell({ adminEmail, adminRole, children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [refreshing, startRefresh] = useTransition();

  const meta = pageMeta[pathname] ?? { title: "Admin", description: "" };
  const navItems = getAdminNavItems(adminRole);

  function handleRefresh() {
    startRefresh(() => {
      router.refresh();
    });
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 px-5 py-5">
        <Link href="/admin" className="block" onClick={() => setMobileOpen(false)}>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">Admin</p>
          <p className="mt-0.5 text-lg font-bold text-slate-900">{siteConfig.name}</p>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const active = isAdminNavActive(item.href, pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${active ? "text-brand-600" : "text-slate-400"}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-4">
        <p className="truncate text-xs text-slate-500">{adminEmail}</p>
        <p className="mt-0.5 text-xs font-medium capitalize text-slate-400">{roleLabel(adminRole)}</p>
        <div className="mt-3 flex flex-col gap-2">
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-brand-600"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View public site
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-slate-900/20 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-slate-200 bg-white transition-transform lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          type="button"
          aria-label="Close sidebar"
          className="absolute right-3 top-4 rounded-lg p-1 text-slate-500 hover:bg-slate-100 lg:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <X className="h-5 w-5" />
        </button>
        {sidebar}
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex items-center gap-4 px-4 py-4 sm:px-6">
            <button
              type="button"
              aria-label="Open menu"
              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 lg:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold text-slate-900 sm:text-xl">{meta.title}</h1>
              {meta.description && (
                <p className="mt-0.5 text-sm text-slate-500">{meta.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              title="Refresh page data"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <Link
              href="/audit"
              className="hidden items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 sm:inline-flex"
            >
              <ChevronLeft className="h-4 w-4" />
              Public audit tool
            </Link>
          </div>
        </header>

        <main className="w-full px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
