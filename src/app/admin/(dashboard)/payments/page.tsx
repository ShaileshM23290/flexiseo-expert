import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminPaymentsPanel } from "@/components/admin/admin-payments-panel";
import { getSupportPaymentStats, getSupportPaymentsPaginated } from "@/lib/admin/payments";
import { requireStaff } from "@/lib/auth/require-staff";
import { siteConfig } from "@/lib/config";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Admin Payments",
  description: `Support payment history for ${siteConfig.name}`,
  path: "/admin/payments",
  noIndex: true,
});

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pageSize?: string; status?: string }>;
}) {
  await requireStaff();
  const params = await searchParams;
  const status = params.status ?? "all";

  const [stats, result] = await Promise.all([
    getSupportPaymentStats(),
    getSupportPaymentsPaginated({ ...params, status }),
  ]);

  return (
    <Suspense fallback={<div className="text-sm text-slate-500">Loading payments…</div>}>
      <AdminPaymentsPanel
        stats={stats}
        status={status}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
        totalPages={result.totalPages}
        payments={result.items.map((payment) => ({
          ...payment,
          createdAt: payment.createdAt.toISOString(),
          paidAt: payment.paidAt?.toISOString() ?? null,
        }))}
      />
    </Suspense>
  );
}
