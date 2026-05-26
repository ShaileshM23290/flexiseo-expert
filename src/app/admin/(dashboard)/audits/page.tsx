import type { Metadata } from "next";
import { AdminAuditsPanel } from "@/components/admin/admin-audits-panel";
import { getAuditsPaginated } from "@/lib/admin/stats";
import { siteConfig } from "@/lib/config";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Admin Audits",
  description: `All ${siteConfig.name} audits`,
  path: "/admin/audits",
  noIndex: true,
});

export default async function AdminAuditsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pageSize?: string }>;
}) {
  const params = await searchParams;
  const result = await getAuditsPaginated(params);

  return (
    <AdminAuditsPanel
      total={result.total}
      page={result.page}
      pageSize={result.pageSize}
      totalPages={result.totalPages}
      audits={result.items.map((audit) => ({
        ...audit,
        createdAt: audit.createdAt.toISOString(),
      }))}
    />
  );
}
