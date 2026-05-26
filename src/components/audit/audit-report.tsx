"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import {
  ActionPlanCard,
  CategoryScoreGrid,
  ExecutiveSummaryCard,
  GradeBadge,
  IssueCard,
} from "@/components/audit/report-cards";
import { PageBreakdownTable, type PageIssue } from "@/components/audit/page-breakdown";
import { AuditProgressCard, useAuditLoadingSteps } from "@/components/audit/audit-progress-card";
import { TechnicalInsightsPanel } from "@/components/audit/technical-insights";
import { parseJsonField } from "@/lib/parse-json";
import type { ActionPlan, CategoryRecommendation, ExecutiveSummary, IssueRecommendation } from "@/lib/ai/schemas";
import { categoryLabels, categories, normalizeCategory, type Category } from "@/lib/config";
import { overallVerdict, scoreToGrade, gradeColor } from "@/lib/grades";
import { formatPublicAuditError, toPublicAuditError } from "@/lib/audit/public-errors";
import { cn, sanitizeText } from "@/lib/utils";

interface AuditData {
  id: string;
  url: string;
  domain: string;
  status: string;
  errorMessage?: string | null;
  overallScore: number;
  categoryScores: string;
  pagesCrawled: number;
  totalIssues: number;
  criticalCount: number;
  warningCount: number;
  noticeCount: number;
  aiSummary: string | null;
  aiActionPlan: string | null;
  aiCategoryInsights: string | null;
  performanceData: string | null;
  schemaSummary: string | null;
  pages: Array<{
    id: string;
    url: string;
    title: string | null;
    wordCount: number;
    statusCode: number;
    aiPageSummary: string | null;
  }>;
  issues: Array<{
    id: string;
    category: string;
    severity: string;
    title: string;
    description: string;
    recommendation: string | null;
    affectedUrl: string | null;
    aiRecommendation: string | null;
    pageId: string | null;
  }>;
}

function parseCategoryScores(raw: string): Record<Category, number> {
  const parsed = parseJsonField<Record<string, number>>(raw, {});
  const scores = {} as Record<Category, number>;
  for (const cat of categories) {
    scores[cat] = parsed[cat] ?? 100;
  }
  return scores;
}

interface GroupedIssue {
  title: string;
  category: Category;
  severity: string;
  description: string;
  recommendation: string | null;
  affectedUrls: string[];
  aiRecommendation: string | null;
  representativeId: string;
}

const SEVERITY_RANK: Record<string, number> = { critical: 0, warning: 1, notice: 2 };

function groupClientIssues(
  issues: AuditData["issues"]
): GroupedIssue[] {
  const map = new Map<string, GroupedIssue>();
  for (const issue of issues) {
    const cat = normalizeCategory(issue.category);
    const key = `${cat}::${issue.title.toLowerCase().trim()}`;
    const url = issue.affectedUrl ?? "";
    const existing = map.get(key);
    if (existing) {
      if (url && !existing.affectedUrls.includes(url)) existing.affectedUrls.push(url);
      if (SEVERITY_RANK[issue.severity] < SEVERITY_RANK[existing.severity]) {
        existing.severity = issue.severity;
      }
      if (!existing.aiRecommendation && issue.aiRecommendation) {
        existing.aiRecommendation = issue.aiRecommendation;
      }
    } else {
      map.set(key, {
        title: issue.title,
        category: cat,
        severity: issue.severity,
        description: issue.description,
        recommendation: issue.recommendation,
        affectedUrls: url ? [url] : [],
        aiRecommendation: issue.aiRecommendation,
        representativeId: issue.id,
      });
    }
  }
  return [...map.values()].sort((a, b) => {
    const sev = (SEVERITY_RANK[a.severity] ?? 99) - (SEVERITY_RANK[b.severity] ?? 99);
    if (sev !== 0) return sev;
    return b.affectedUrls.length - a.affectedUrls.length;
  });
}

function buildPageIssuesMap(
  pages: AuditData["pages"],
  issues: AuditData["issues"]
): Map<string, PageIssue[]> {
  const urlToPageId = new Map(pages.map((p) => [p.url, p.id]));
  const byPageId = new Map<string, PageIssue[]>();

  for (const issue of issues) {
    const pageId =
      issue.pageId ?? (issue.affectedUrl ? urlToPageId.get(issue.affectedUrl) : undefined);
    if (!pageId) continue;

    const list = byPageId.get(pageId) ?? [];
    list.push({
      title: issue.title,
      severity: issue.severity,
      description: issue.description,
      recommendation: issue.recommendation,
    });
    byPageId.set(pageId, list);
  }

  return byPageId;
}

export default function AuditReportPage({ auditId }: { auditId: string }) {
  const [audit, setAudit] = useState<AuditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [reauditing, setReauditing] = useState(false);
  const [reauditError, setReauditError] = useState("");
  const { stepIndex, startedAt } = useAuditLoadingSteps(audit?.status === "running");
  const [activeTab, setActiveTab] = useState<Category | "all">("all");

  const fetchAudit = useCallback(async () => {
    const res = await fetch(`/api/audits/${auditId}`);
    const data = await res.json();
    setAudit(data);
    setLoading(false);
    return data as AuditData;
  }, [auditId]);

  useEffect(() => {
    fetchAudit();
  }, [fetchAudit]);

  useEffect(() => {
    if (audit?.status !== "running") return;

    const poll = window.setInterval(async () => {
      const data = await fetchAudit();
      if (data.status === "completed" || data.status === "failed") {
        setReauditing(false);
      }
    }, 2000);

    return () => window.clearInterval(poll);
  }, [audit?.status, fetchAudit]);

  useEffect(() => {
    if (audit?.status !== "completed" || audit.aiSummary) return;

    const poll = window.setInterval(() => {
      void fetchAudit();
    }, 3000);

    const stop = window.setTimeout(() => window.clearInterval(poll), 120_000);

    return () => {
      window.clearInterval(poll);
      window.clearTimeout(stop);
    };
  }, [audit?.status, audit?.aiSummary, fetchAudit]);

  async function handleReaudit() {
    setReauditing(true);
    setReauditError("");

    try {
      const res = await fetch(`/api/audits/${auditId}/reaudit`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to start re-audit");
      }
      setAudit((prev) => (prev ? { ...prev, status: "running" } : prev));
    } catch (err) {
      setReauditError(toPublicAuditError(err));
      setReauditing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!audit) {
    return (
      <div className="px-4 py-20 text-center">
        <p className="text-slate-600">Audit not found.</p>
        <Link href="/audit" className="mt-4 inline-block text-brand-600 hover:underline">
          Start a new audit
        </Link>
      </div>
    );
  }

  if (audit.status === "running") {
    return (
      <div className="px-4 py-20 sm:px-6">
        <AuditProgressCard
          title={reauditing ? "Re-running audit…" : "Analyzing your website…"}
          stepIndex={stepIndex}
          startedAt={startedAt}
          url={audit.url}
          className="mx-auto max-w-md p-8"
        />
      </div>
    );
  }

  if (audit.status === "failed") {
    return (
      <div className="px-4 py-20 text-center sm:px-6">
        <p className="text-slate-600">Audit failed.</p>
        <p className="mt-2 text-sm text-rose-600">
          {formatPublicAuditError(audit.errorMessage)}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleReaudit}
            disabled={reauditing}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            <RefreshCw className={cn("h-4 w-4", reauditing && "animate-spin")} />
            Re-audit
          </button>
          <Link href="/audit" className="text-sm text-brand-600 hover:underline">
            Start a new audit
          </Link>
        </div>
        {reauditError && <p className="mt-3 text-sm text-rose-600">{reauditError}</p>}
      </div>
    );
  }

  if (audit.status !== "completed") {
    return (
      <div className="px-4 py-20 text-center">
        <p className="text-slate-600">Audit is not ready yet.</p>
        <Link href="/audit" className="mt-4 inline-block text-brand-600 hover:underline">
          Start a new audit
        </Link>
      </div>
    );
  }

  const categoryScores = parseCategoryScores(audit.categoryScores);
  const executiveSummary = parseJsonField<ExecutiveSummary | null>(audit.aiSummary, null);
  const actionPlan = parseJsonField<ActionPlan | null>(audit.aiActionPlan, null);
  const categoryInsights = parseJsonField<Record<string, CategoryRecommendation>>(audit.aiCategoryInsights, {});
  const performanceData = parseJsonField<Record<string, unknown> | null>(audit.performanceData, null);
  const schemaSummary = parseJsonField<Record<string, unknown> | null>(audit.schemaSummary, null);
  const safeBrowsing = (performanceData?.trust as { safeBrowsing?: { safe: boolean; threats: string[] } | null })?.safeBrowsing;
  const verdict = overallVerdict(audit.overallScore);
  const overallGrade = scoreToGrade(audit.overallScore);

  const groupedAll = groupClientIssues(audit.issues);
  const filteredIssues =
    activeTab === "all" ? groupedAll : groupedAll.filter((g) => g.category === activeTab);

  const pageIssuesById = buildPageIssuesMap(audit.pages, audit.issues);

  const pageIssueCounts = new Map<string, number>();
  pageIssuesById.forEach((issues, pageId) => {
    pageIssueCounts.set(pageId, issues.length);
  });

  const countForCategory = (cat: Category) =>
    groupedAll.filter((g) => g.category === cat).length;

  const totalUnique = groupedAll.length;
  const criticalUnique = groupedAll.filter((g) => g.severity === "critical").length;
  const warningUnique = groupedAll.filter((g) => g.severity === "warning").length;
  const noticeUnique = groupedAll.filter((g) => g.severity === "notice").length;

  return (
    <div className="px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/audit"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-brand-600"
          >
            <ArrowLeft className="h-4 w-4" /> New Audit
          </Link>
          <button
            type="button"
            onClick={handleReaudit}
            disabled={reauditing}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw className={cn("h-4 w-4", reauditing && "animate-spin")} />
            Re-audit
          </button>
        </div>
        {reauditError && (
          <p className="mb-4 text-sm text-rose-600">{reauditError}</p>
        )}

        {/* SEOptimer-style header */}
        <div className="glass-card rounded-2xl p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-6">
              <GradeBadge score={audit.overallScore} />
              <div>
                <p className={cn("text-sm font-semibold uppercase tracking-wide", gradeColor(overallGrade))}>
                  Overall Grade: {overallGrade}
                </p>
                <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">{verdict.title}</h1>
                <p className="mt-1 text-sm text-slate-500">{audit.url}</p>
                <p className="mt-2 text-sm text-slate-600">{verdict.description}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-slate-900">{totalUnique}</p>
              <p className="text-sm text-slate-500">Unique Recommendations</p>
            </div>
          </div>
        </div>

        {safeBrowsing && !safeBrowsing.safe && (
          <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            <strong>Security warning:</strong> Google Safe Browsing flagged this site
            {safeBrowsing.threats.length > 0 && ` (${safeBrowsing.threats.join(", ")})`}.
            Investigate immediately before sharing or linking to this domain.
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          {[
            { label: "Critical", count: criticalUnique, color: "text-rose-600" },
            { label: "Warnings", count: warningUnique, color: "text-amber-600" },
            { label: "Notices", count: noticeUnique, color: "text-sky-600" },
            { label: "Pages Crawled", count: audit.pagesCrawled, color: "text-slate-700" },
          ].map((stat) => (
            <div key={stat.label} className="glass-card rounded-lg px-4 py-2">
              <span className={cn("text-lg font-bold", stat.color)}>{stat.count}</span>
              <span className="ml-2 text-sm text-slate-500">{stat.label}</span>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Category Scores</h2>
          <CategoryScoreGrid scores={categoryScores} />
        </div>

        <TechnicalInsightsPanel
          auditId={audit.id}
          performanceData={performanceData}
          schemaSummary={schemaSummary}
          onUpdated={fetchAudit}
        />

        {executiveSummary && (
          <div className="mt-8">
            <ExecutiveSummaryCard summary={executiveSummary} />
          </div>
        )}

        {actionPlan && (
          <div className="mt-8">
            <ActionPlanCard plan={actionPlan} />
          </div>
        )}

        <div className="mt-8">
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab("all")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                activeTab === "all"
                  ? "bg-brand-600 text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
              )}
            >
              All ({totalUnique})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  activeTab === cat
                    ? "bg-brand-600 text-white"
                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                )}
              >
                {categoryLabels[cat]} ({countForCategory(cat)})
              </button>
            ))}
          </div>

          {activeTab !== "all" && categoryInsights[activeTab] && (
            <div className="mb-6 glass-card rounded-xl p-5">
              <h3 className="font-semibold text-slate-900">
                AI Insights — {categoryLabels[activeTab]}
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                {sanitizeText(categoryInsights[activeTab].summary)}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Score: {categoryInsights[activeTab].score}/100 · Priority:{" "}
                {categoryInsights[activeTab].priority}
              </p>
            </div>
          )}

          <div className="space-y-4">
            {filteredIssues.map((group) => {
              const aiRec = parseJsonField<IssueRecommendation | null>(group.aiRecommendation, null);
              return (
                <IssueCard
                  key={`${group.category}-${group.title}`}
                  title={group.title}
                  severity={group.severity}
                  description={group.description}
                  recommendation={group.recommendation}
                  aiRecommendation={aiRec}
                  category={categoryLabels[group.category] ?? group.category}
                  affectedUrls={group.affectedUrls}
                />
              );
            })}
            {filteredIssues.length === 0 && (
              <p className="text-center text-slate-500">No issues in this category.</p>
            )}
          </div>
        </div>

        <div className="mt-8">
          <PageBreakdownTable
            pages={audit.pages.map((p) => ({
              ...p,
              issueCount: pageIssueCounts.get(p.id) ?? 0,
              issues: pageIssuesById.get(p.id) ?? [],
            }))}
          />
        </div>
      </div>
    </div>
  );
}
