"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Loader2, RefreshCw } from "lucide-react";
import {
  ActionPlanCard,
  CategoryScoreGrid,
  ExecutiveSummaryCard,
  GradeBadge,
  IssueCard,
  ScoreRing,
} from "@/components/audit/report-cards";
import { CoffeeSupportCard } from "@/components/support/coffee-support-card";
import { CoffeeSupportModal } from "@/components/support/coffee-support-modal";
import { PageBreakdownTable, type PageIssue } from "@/components/audit/page-breakdown";
import { AuditProgressCard, useAuditLoadingSteps } from "@/components/audit/audit-progress-card";
import { TechnicalInsightsPanel, type AuditRefreshResult } from "@/components/audit/technical-insights";
import { parseJsonField } from "@/lib/parse-json";
import { formatPublicAuditError, toPublicAuditError } from "@/lib/audit/public-errors";
import {
  buildAuditReportModel,
  parseIssueAiRecommendation,
} from "@/lib/audit/report-model";
import { categoryLabels, categories, type Category } from "@/lib/config";
import { gradeColor } from "@/lib/grades";
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
  completedAt?: string | null;
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
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState("");
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

  const handleIntegrationUpdated = useCallback(
    async (result?: AuditRefreshResult) => {
      if (result?.scoresUpdated) {
        setAudit((prev) =>
          prev
            ? {
                ...prev,
                overallScore: result.overallScore,
                categoryScores: JSON.stringify(result.categoryScores),
                totalIssues: result.totalIssues,
                criticalCount: result.criticalCount,
                warningCount: result.warningCount,
                noticeCount: result.noticeCount,
              }
            : prev
        );
      }
      await fetchAudit();
    },
    [fetchAudit]
  );

  async function handleDownloadPdf() {
    setDownloadingPdf(true);
    setPdfError("");

    try {
      const res = await fetch(`/api/audits/${auditId}/pdf?t=${Date.now()}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to download PDF");
      }

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      const filename =
        match?.[1] ?? `seo-audit-${audit?.domain ?? auditId}-${Date.now()}.pdf`;

      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      setPdfError(toPublicAuditError(err));
    } finally {
      setDownloadingPdf(false);
    }
  }

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

  const report = buildAuditReportModel(audit);
  const categoryScores = report.categoryScores;
  const executiveSummary = report.executiveSummary;
  const actionPlan = report.actionPlan;
  const categoryInsights = report.categoryInsights;
  const performanceData = parseJsonField<Record<string, unknown> | null>(audit.performanceData, null);
  const schemaSummary = parseJsonField<Record<string, unknown> | null>(audit.schemaSummary, null);
  const safeBrowsing = (performanceData?.trust as { safeBrowsing?: { safe: boolean; threats: string[] } | null })?.safeBrowsing;
  const verdict = report.verdict;
  const overallGrade = report.overallGrade;
  const overallScore = report.overallScore;

  const groupedAll = report.groupedIssues;
  const filteredIssues =
    activeTab === "all" ? groupedAll : groupedAll.filter((g) => g.category === activeTab);

  const pageIssuesById = buildPageIssuesMap(audit.pages, audit.issues);

  const pageIssueCounts = new Map(report.pages.map((p) => [p.id, p.issueCount]));

  const countForCategory = (cat: Category) =>
    groupedAll.filter((g) => g.category === cat).length;

  const totalUnique = report.stats.totalUnique;
  const criticalUnique = report.stats.critical;
  const warningUnique = report.stats.warning;
  const noticeUnique = report.stats.notice;

  return (
    <div className="px-4 py-10 sm:px-6">
      <CoffeeSupportModal auditId={audit.id} auditUrl={audit.url} />
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <Link
            href="/audit"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-brand-600"
          >
            <ArrowLeft className="h-4 w-4" /> New Audit
          </Link>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60 sm:w-auto"
            >
              <Download className={cn("h-4 w-4", downloadingPdf && "animate-pulse")} />
              {downloadingPdf ? "Preparing PDF…" : "Download PDF"}
            </button>
            <button
              type="button"
              onClick={handleReaudit}
              disabled={reauditing}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60 sm:w-auto"
            >
              <RefreshCw className={cn("h-4 w-4", reauditing && "animate-spin")} />
              Re-audit
            </button>
          </div>
        </div>
        {(reauditError || pdfError) && (
          <div className="mb-4 space-y-1">
            {reauditError && <p className="text-sm text-rose-600">{reauditError}</p>}
            {pdfError && <p className="text-sm text-rose-600">{pdfError}</p>}
          </div>
        )}

        {/* SEOptimer-style header */}
        <div className="glass-card rounded-2xl p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between md:gap-6">
            <div className="flex w-full flex-col items-center gap-4 md:flex-row md:items-start md:gap-6">
              <div className="flex shrink-0 flex-col items-center gap-3 md:flex-row md:items-center md:gap-4">
                <ScoreRing score={overallScore} size="lg" />
                <GradeBadge score={overallScore} size="sm" className="hidden md:flex" />
              </div>
              <div className="min-w-0 w-full text-center md:text-left">
                <p className={cn("text-sm font-semibold uppercase tracking-wide", gradeColor(overallGrade))}>
                  {overallScore}/100 · Grade {overallGrade}
                </p>
                <h1 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl lg:text-3xl">{verdict.title}</h1>
                <p className="mt-1 break-all text-sm text-slate-500">{audit.url}</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{verdict.description}</p>
              </div>
            </div>
            <div className="w-full shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center md:w-auto md:min-w-[9rem] md:text-right">
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

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              label: "Critical",
              count: criticalUnique,
              color: "text-rose-600",
              ring: "ring-rose-100",
              bg: "bg-rose-50",
              dot: "bg-rose-500",
            },
            {
              label: "Warnings",
              count: warningUnique,
              color: "text-amber-600",
              ring: "ring-amber-100",
              bg: "bg-amber-50",
              dot: "bg-amber-500",
            },
            {
              label: "Notices",
              count: noticeUnique,
              color: "text-sky-600",
              ring: "ring-sky-100",
              bg: "bg-sky-50",
              dot: "bg-sky-500",
            },
            {
              label: "Pages Crawled",
              count: audit.pagesCrawled,
              color: "text-slate-800",
              ring: "ring-slate-200",
              bg: "bg-white",
              dot: "bg-slate-400",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className={cn(
                "group relative overflow-hidden rounded-xl p-4 ring-1 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-5",
                stat.bg,
                stat.ring
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className={cn("text-3xl font-bold leading-none sm:text-4xl", stat.color)}>
                  {stat.count}
                </p>
                <span className={cn("mt-1 h-2 w-2 rounded-full", stat.dot)} />
              </div>
              <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                {stat.label}
              </p>
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
          onUpdated={handleIntegrationUpdated}
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
          <CoffeeSupportCard auditId={audit.id} auditUrl={audit.url} />
        </div>

        <div className="mt-8">
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab("all")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm",
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
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm",
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
              const aiRec = parseIssueAiRecommendation(group.aiRecommendation);
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
