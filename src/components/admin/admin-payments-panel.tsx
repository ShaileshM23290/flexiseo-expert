"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { PaymentsTable } from "@/components/admin/payments-table";
import { Coffee, IndianRupee, Receipt, Timer } from "lucide-react";

type PaymentRow = {
  id: string;
  type: string;
  status: string;
  amountLabel: string;
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
  auditId: string | null;
  auditUrl: string | null;
  clientIp: string | null;
  payerEmail: string | null;
  payerContact: string | null;
  paymentMethod: string | null;
  errorDescription: string | null;
  createdAt: string;
  paidAt: string | null;
};

const statusFilters = [
  { value: "all", label: "All" },
  { value: "captured", label: "Captured" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
];

export function AdminPaymentsPanel({
  payments,
  stats,
  total,
  page,
  pageSize,
  totalPages,
  status,
}: {
  payments: PaymentRow[];
  stats: {
    capturedRevenueLabel: string;
    capturedCount: number;
    paymentsToday: number;
    revenueTodayLabel: string;
    pendingCount: number;
    failedCount: number;
  };
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  status: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setStatus(nextStatus: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextStatus === "all") params.delete("status");
    else params.set("status", nextStatus);
    params.delete("page");
    router.push(`/admin/payments?${params.toString()}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Support payments</h1>
        <p className="mt-1 text-sm text-slate-500">
          Full transaction history for coffee contributions via Razorpay.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Total revenue"
          value={stats.capturedRevenueLabel}
          icon={IndianRupee}
          hint={`${stats.capturedCount.toLocaleString()} captured payments`}
        />
        <AdminStatCard
          label="Today"
          value={stats.revenueTodayLabel}
          icon={Coffee}
          hint={`${stats.paymentsToday} payment${stats.paymentsToday === 1 ? "" : "s"} today`}
        />
        <AdminStatCard label="Pending" value={stats.pendingCount} icon={Timer} />
        <AdminStatCard label="Failed" value={stats.failedCount} icon={Receipt} />
      </div>

      <div className="flex flex-wrap gap-2">
        {statusFilters.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setStatus(filter.value)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              status === filter.value
                ? "bg-brand-600 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <PaymentsTable payments={payments} />

      <AdminPagination
        page={page}
        pageSize={pageSize}
        total={total}
        totalPages={totalPages}
        basePath="/admin/payments"
        extraQuery={status !== "all" ? { status } : undefined}
      />

      <p className="text-xs text-slate-400">
        Configure Razorpay webhooks at{" "}
        <Link href="/api/support/coffee/webhook" className="text-brand-600 hover:underline">
          /api/support/coffee/webhook
        </Link>{" "}
        for automatic status updates when checkout verification is missed.
      </p>
    </div>
  );
}
