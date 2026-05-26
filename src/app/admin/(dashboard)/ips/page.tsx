import type { Metadata } from "next";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { IpUsageTable } from "@/components/admin/ip-usage-table";
import { getIpUsagePaginated } from "@/lib/admin/stats";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Admin IP Usage",
  description: "Audit traffic by IP address",
  path: "/admin/ips",
  noIndex: true,
});

export default async function AdminIpsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pageSize?: string }>;
}) {
  const params = await searchParams;
  const result = await getIpUsagePaginated(params);

  return (
    <div className="w-full space-y-4">
      <div className="rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-800">
        IP addresses are logged when users submit audits. IP-based rate limits and blocklists will
        be added here in a future update.
      </div>
      <p className="text-sm text-slate-500">
        {result.total.toLocaleString()} unique IP{result.total === 1 ? "" : "s"} recorded
      </p>
      <IpUsageTable rows={result.items} />
      <AdminPagination
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
        totalPages={result.totalPages}
        basePath="/admin/ips"
      />
    </div>
  );
}
