import { formatAdminDate } from "@/lib/admin/format";
import type { IpStatRow } from "@/lib/admin/stats";

export function IpUsageTable({ rows }: { rows: IpStatRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
        No IP data yet. IPs are recorded when new audits are submitted.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-slate-500">IP address</th>
            <th className="px-4 py-3 text-left font-medium text-slate-500">Audits</th>
            <th className="px-4 py-3 text-left font-medium text-slate-500">Unique domains</th>
            <th className="px-4 py-3 text-left font-medium text-slate-500">Sample domains</th>
            <th className="px-4 py-3 text-left font-medium text-slate-500">First seen</th>
            <th className="px-4 py-3 text-left font-medium text-slate-500">Last seen</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.ip} className="hover:bg-slate-50/80">
              <td className="whitespace-nowrap px-4 py-3 font-mono text-sm font-medium text-brand-700">
                {row.ip}
              </td>
              <td className="px-4 py-3 text-slate-900">{row.auditCount}</td>
              <td className="px-4 py-3 text-slate-600">{row.uniqueDomains}</td>
              <td className="max-w-xs truncate px-4 py-3 text-slate-500">
                {row.domains.join(", ") || "—"}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                {formatAdminDate(row.firstSeen)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                {formatAdminDate(row.lastSeen)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
