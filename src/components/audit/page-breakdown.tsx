"use client";

import { Fragment, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { sanitizeText, severityColor, priorityColor, cn } from "@/lib/utils";
import type { PageSummary } from "@/lib/ai/schemas";

export interface PageIssue {
  title: string;
  severity: string;
  description: string;
  recommendation: string | null;
}

interface PageRow {
  id: string;
  url: string;
  title: string | null;
  wordCount: number;
  statusCode: number;
  aiPageSummary: string | null;
  issueCount: number;
  issues: PageIssue[];
}

export function PageBreakdownTable({ pages }: { pages: PageRow[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  function parseSummary(raw: string | null): PageSummary | null {
    if (!raw) return null;
    try {
      return JSON.parse(raw) as PageSummary;
    } catch {
      return null;
    }
  }

  return (
    <div className="glass-card overflow-hidden rounded-xl">
      <div className="border-b border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900">Page Breakdown</h3>
        <p className="mt-1 text-sm text-slate-600">
          Expand rows to see SEO issues found on each page
        </p>
      </div>
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="p-4 font-medium">Page</th>
              <th className="p-4 font-medium">Words</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Issues</th>
              <th className="p-4 font-medium" />
            </tr>
          </thead>
          <tbody>
            {pages.map((page) => {
              const summary = parseSummary(page.aiPageSummary);
              const isOpen = expanded === page.id;
              const hasDetails = page.issues.length > 0 || Boolean(summary);

              return (
                <Fragment key={page.id}>
                  <tr className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="max-w-xs truncate p-4 text-slate-700" title={page.url}>
                      {page.title ?? page.url}
                    </td>
                    <td className="p-4 text-slate-600">{page.wordCount}</td>
                    <td className="p-4">
                      <span className={page.statusCode >= 400 ? "text-rose-600" : "text-emerald-600"}>
                        {page.statusCode || "—"}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600">{page.issueCount}</td>
                    <td className="p-4">
                      {hasDetails ? (
                        <button
                          type="button"
                          onClick={() => setExpanded(isOpen ? null : page.id)}
                          className="flex items-center gap-1 text-brand-600 hover:text-brand-700"
                          aria-expanded={isOpen}
                        >
                          {isOpen ? (
                            <>Less <ChevronUp className="h-4 w-4" /></>
                          ) : (
                            <>Details <ChevronDown className="h-4 w-4" /></>
                          )}
                        </button>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                  {isOpen && hasDetails && (
                    <tr className="bg-slate-50">
                      <td colSpan={5} className="p-4">
                        <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
                          <p className="truncate text-xs text-slate-500" title={page.url}>
                            {page.url}
                          </p>

                          {page.issues.length > 0 && (
                            <div>
                              <p className="text-xs font-medium uppercase text-slate-500">
                                Issues on this page
                              </p>
                              <ul className="mt-2 space-y-3">
                                {page.issues.map((issue, i) => (
                                  <li
                                    key={`${issue.title}-${i}`}
                                    className="rounded-lg border border-slate-100 bg-slate-50/80 p-3"
                                  >
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="font-medium text-slate-900">{issue.title}</span>
                                      <span
                                        className={cn(
                                          "rounded-full border px-2 py-0.5 text-xs capitalize",
                                          severityColor(issue.severity)
                                        )}
                                      >
                                        {issue.severity}
                                      </span>
                                    </div>
                                    <p className="mt-1 text-sm text-slate-600">
                                      {sanitizeText(issue.description)}
                                    </p>
                                    {issue.recommendation && (
                                      <p className="mt-2 text-sm text-brand-700">
                                        Fix: {sanitizeText(issue.recommendation)}
                                      </p>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {summary && (
                            <div className={page.issues.length > 0 ? "border-t border-slate-100 pt-4" : ""}>
                              <p className="text-xs font-medium uppercase text-slate-500">
                                AI page summary
                              </p>
                              <p className="mt-2 text-sm text-slate-700">{sanitizeText(summary.summary)}</p>
                              <span
                                className={cn(
                                  "mt-2 inline-block rounded-full border px-2 py-0.5 text-xs capitalize",
                                  priorityColor(summary.priority)
                                )}
                              >
                                Priority: {summary.priority}
                              </span>
                              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                <div>
                                  <p className="text-xs font-medium uppercase text-slate-500">Main Problems</p>
                                  <ul className="mt-1 space-y-1">
                                    {summary.mainProblems.map((p, i) => (
                                      <li key={i} className="text-sm text-slate-700">
                                        • {sanitizeText(p)}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                <div>
                                  <p className="text-xs font-medium uppercase text-slate-500">
                                    Recommended Fixes
                                  </p>
                                  <ul className="mt-1 space-y-1">
                                    {summary.recommendedFixes.map((f, i) => (
                                      <li key={i} className="text-sm text-slate-700">
                                        • {sanitizeText(f)}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          )}

                          {page.issues.length === 0 && !summary && (
                            <p className="text-sm text-slate-500">No page-specific issues recorded.</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
