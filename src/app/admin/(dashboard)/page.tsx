import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Globe, Monitor, Users } from "lucide-react";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { AuditsTable } from "@/components/admin/audits-table";
import { IpUsageTable } from "@/components/admin/ip-usage-table";
import { getAdminOverview } from "@/lib/admin/stats";
import { siteConfig } from "@/lib/config";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Admin Dashboard",
  description: `${siteConfig.name} admin dashboard`,
  path: "/admin",
  noIndex: true,
});

export default async function AdminOverviewPage() {
  const overview = await getAdminOverview();

  return (
    <div className="w-full space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Total audits" value={overview.totalAudits} icon={Monitor} />
        <AdminStatCard label="Unique IPs" value={overview.uniqueIps} icon={Users} />
        <AdminStatCard label="Domains crawled" value={overview.uniqueDomains} icon={Globe} />
        <AdminStatCard
          label="Audits today"
          value={overview.auditsToday}
          icon={Monitor}
          hint="Since midnight"
        />
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-slate-900">Top IP addresses</h2>
          <Link
            href="/admin/ips"
            className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <IpUsageTable rows={overview.topIps} />
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-slate-900">Recent audits</h2>
          <Link
            href="/admin/audits"
            className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <AuditsTable audits={overview.recentAudits} />
      </section>
    </div>
  );
}
