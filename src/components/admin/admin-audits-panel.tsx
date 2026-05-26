"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AuditsTable } from "@/components/admin/audits-table";

type AuditRow = {
  id: string;
  url: string;
  domain: string;
  status: string;
  clientIp: string | null;
  pagesCrawled: number;
  overallScore: number;
  createdAt: string;
};

export function AdminAuditsPanel({
  audits,
  total,
  page,
  pageSize,
  totalPages,
}: {
  audits: AuditRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDeleteAll() {
    setDeleting(true);
    setError("");

    try {
      const res = await fetch("/api/admin/audits", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to delete audits");
        return;
      }
      setConfirmOpen(false);
      router.push("/admin/audits");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          {total.toLocaleString()} audit{total === 1 ? "" : "s"} total
        </p>
        {total > 0 && (
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
          >
            <Trash2 className="h-4 w-4" />
            Delete all audits
          </button>
        )}
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <AuditsTable audits={audits} />

      <AdminPagination
        page={page}
        pageSize={pageSize}
        total={total}
        totalPages={totalPages}
        basePath="/admin/audits"
      />

      {confirmOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">Delete all audits?</h3>
            <p className="mt-2 text-sm text-slate-600">
              This permanently removes all {total.toLocaleString()} audit{total === 1 ? "" : "s"},
              including pages, issues, and AI recommendations. This cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setConfirmOpen(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteAll}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete all
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
