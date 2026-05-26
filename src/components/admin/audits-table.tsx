import Link from "next/link";
import { formatAdminDate } from "@/lib/admin/format";

export function AuditStatusBadge({ status }: { status: string }) {
  const styles =
    status === "completed"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : status === "failed"
        ? "bg-red-50 text-red-700 border-red-200"
        : "bg-amber-50 text-amber-700 border-amber-200";

  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${styles}`}>
      {status}
    </span>
  );
}

type AuditRow = {
  id: string;
  url: string;
  domain: string;
  status: string;
  clientIp: string | null;
  pagesCrawled: number;
  overallScore: number;
  createdAt: Date | string;
};

export function AuditsTable({ audits, showIp = true }: { audits: AuditRow[]; showIp?: boolean }) {
  if (audits.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
        No audits yet. Once users run scans, they will appear here.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-slate-500">URL</th>
            <th className="px-4 py-3 text-left font-medium text-slate-500">Domain</th>
            {showIp && <th className="px-4 py-3 text-left font-medium text-slate-500">IP</th>}
            <th className="px-4 py-3 text-left font-medium text-slate-500">Status</th>
            <th className="px-4 py-3 text-left font-medium text-slate-500">Score</th>
            <th className="px-4 py-3 text-left font-medium text-slate-500">Pages</th>
            <th className="px-4 py-3 text-left font-medium text-slate-500">Created</th>
            <th className="px-4 py-3 text-left font-medium text-slate-500">Report</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {audits.map((audit) => (
            <tr key={audit.id} className="hover:bg-slate-50/80">
              <td className="max-w-md truncate px-4 py-3 font-medium text-slate-900">{audit.url}</td>
              <td className="px-4 py-3 text-slate-600">{audit.domain}</td>
              {showIp && (
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-500">
                  {audit.clientIp ?? "unknown"}
                </td>
              )}
              <td className="px-4 py-3">
                <AuditStatusBadge status={audit.status} />
              </td>
              <td className="px-4 py-3 text-slate-700">
                {audit.status === "completed" ? audit.overallScore : "—"}
              </td>
              <td className="px-4 py-3 text-slate-600">{audit.pagesCrawled || "—"}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                {formatAdminDate(audit.createdAt)}
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/audits/${audit.id}`}
                  target="_blank"
                  className="font-medium text-brand-600 hover:text-brand-700"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
