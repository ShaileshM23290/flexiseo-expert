import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { paginationRange } from "@/lib/admin/pagination";

type AdminPaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  basePath: string;
};

function buildHref(basePath: string, page: number, pageSize: number) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  if (pageSize !== 25) params.set("pageSize", String(pageSize));
  return `${basePath}?${params.toString()}`;
}

export function AdminPagination({
  page,
  pageSize,
  total,
  totalPages,
  basePath,
}: AdminPaginationProps) {
  if (total === 0) return null;

  const pages = paginationRange(page, totalPages);
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="mt-4 flex flex-col gap-4 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-500">
        Showing {from}–{to} of {total.toLocaleString()}
      </p>

      <nav aria-label="Pagination" className="flex items-center gap-1">
        <Link
          href={buildHref(basePath, page - 1, pageSize)}
          aria-disabled={page <= 1}
          className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-medium ${
            page <= 1
              ? "pointer-events-none border-slate-100 text-slate-300"
              : "border-slate-200 text-slate-700 hover:bg-slate-50"
          }`}
        >
          <ChevronLeft className="h-4 w-4" />
          Prev
        </Link>

        {pages[0] > 1 && (
          <>
            <Link
              href={buildHref(basePath, 1, pageSize)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              1
            </Link>
            {pages[0] > 2 && <span className="px-1 text-slate-400">…</span>}
          </>
        )}

        {pages.map((p) => (
          <Link
            key={p}
            href={buildHref(basePath, p, pageSize)}
            aria-current={p === page ? "page" : undefined}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
              p === page
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {p}
          </Link>
        ))}

        {pages[pages.length - 1] < totalPages && (
          <>
            {pages[pages.length - 1] < totalPages - 1 && (
              <span className="px-1 text-slate-400">…</span>
            )}
            <Link
              href={buildHref(basePath, totalPages, pageSize)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {totalPages}
            </Link>
          </>
        )}

        <Link
          href={buildHref(basePath, page + 1, pageSize)}
          aria-disabled={page >= totalPages}
          className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-medium ${
            page >= totalPages
              ? "pointer-events-none border-slate-100 text-slate-300"
              : "border-slate-200 text-slate-700 hover:bg-slate-50"
          }`}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Link>
      </nav>
    </div>
  );
}
