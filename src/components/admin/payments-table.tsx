import Link from "next/link";
import { formatAdminDate } from "@/lib/admin/format";

export function PaymentStatusBadge({ status }: { status: string }) {
  const styles =
    status === "captured"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : status === "failed"
        ? "bg-red-50 text-red-700 border-red-200"
        : status === "refunded"
          ? "bg-violet-50 text-violet-700 border-violet-200"
          : "bg-amber-50 text-amber-700 border-amber-200";

  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${styles}`}>
      {status}
    </span>
  );
}

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
  createdAt: Date | string;
  paidAt: Date | string | null;
};

export function PaymentsTable({ payments }: { payments: PaymentRow[] }) {
  if (payments.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
        No support payments yet. Coffee contributions will appear here.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-slate-500">Date</th>
            <th className="px-4 py-3 text-left font-medium text-slate-500">Amount</th>
            <th className="px-4 py-3 text-left font-medium text-slate-500">Status</th>
            <th className="px-4 py-3 text-left font-medium text-slate-500">Method</th>
            <th className="px-4 py-3 text-left font-medium text-slate-500">Payer</th>
            <th className="px-4 py-3 text-left font-medium text-slate-500">Audit</th>
            <th className="px-4 py-3 text-left font-medium text-slate-500">IP</th>
            <th className="px-4 py-3 text-left font-medium text-slate-500">Order ID</th>
            <th className="px-4 py-3 text-left font-medium text-slate-500">Payment ID</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {payments.map((payment) => (
            <tr key={payment.id} className="hover:bg-slate-50/80">
              <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                {formatAdminDate(payment.paidAt ?? payment.createdAt)}
              </td>
              <td className="px-4 py-3 font-medium text-slate-900">{payment.amountLabel}</td>
              <td className="px-4 py-3">
                <PaymentStatusBadge status={payment.status} />
              </td>
              <td className="px-4 py-3 capitalize text-slate-600">{payment.paymentMethod ?? "—"}</td>
              <td className="px-4 py-3 text-slate-600">
                <div className="max-w-[12rem] truncate">
                  {payment.payerEmail ?? payment.payerContact ?? "—"}
                </div>
                {payment.errorDescription && payment.status === "failed" && (
                  <p className="mt-1 max-w-xs truncate text-xs text-rose-600" title={payment.errorDescription}>
                    {payment.errorDescription}
                  </p>
                )}
              </td>
              <td className="px-4 py-3">
                {payment.auditId ? (
                  <Link
                    href={`/audits/${payment.auditId}`}
                    className="max-w-[10rem] truncate text-brand-600 hover:underline"
                    title={payment.auditUrl ?? payment.auditId}
                  >
                    {payment.auditUrl ?? "View report"}
                  </Link>
                ) : (
                  "—"
                )}
              </td>
              <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-500">
                {payment.clientIp ?? "—"}
              </td>
              <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-500">
                {payment.razorpayOrderId}
              </td>
              <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-500">
                {payment.razorpayPaymentId ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
