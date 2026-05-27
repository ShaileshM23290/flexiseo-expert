"use client";

import { useState } from "react";
import {
  CheckCircle2,
  FileCode,
  Globe,
  Mail,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Gauge,
  Code2,
  Users,
  Link2,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toPublicAuditError } from "@/lib/audit/public-errors";
import type { IntegrationId } from "@/lib/audit/integration-refresh";
import type { BacklinkProfile } from "@/lib/audit/backlinks";
import type { CruxResult } from "@/lib/audit/crux";
import type { DnsResult } from "@/lib/audit/dns";
import type { ObservatoryResult } from "@/lib/audit/observatory";
import type { PageSpeedResult } from "@/lib/audit/pagespeed";
import type { SafeBrowsingResult } from "@/lib/audit/safe-browsing";
import type { W3cValidationResult } from "@/lib/audit/w3c-validator";

export interface AuditRefreshResult {
  overallScore: number;
  categoryScores: Record<string, number>;
  totalIssues: number;
  criticalCount: number;
  warningCount: number;
  noticeCount: number;
  scoresUpdated: boolean;
}

interface TechnicalInsightsProps {
  auditId: string;
  performanceData: Record<string, unknown> | null;
  schemaSummary: Record<string, unknown> | null;
  onUpdated?: (result?: AuditRefreshResult) => void | Promise<void>;
}

function ratingColor(rating: string): string {
  if (rating === "GOOD") return "text-emerald-600 bg-emerald-50 border-emerald-200";
  if (rating === "NEEDS_IMPROVEMENT") return "text-amber-600 bg-amber-50 border-amber-200";
  if (rating === "POOR") return "text-rose-600 bg-rose-50 border-rose-200";
  return "text-slate-600 bg-slate-50 border-slate-200";
}

function gradeBadgeClass(grade: string): string {
  if (grade.startsWith("A")) return "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (grade.startsWith("B")) return "text-sky-700 bg-sky-50 border-sky-200";
  if (grade.startsWith("C")) return "text-amber-700 bg-amber-50 border-amber-200";
  return "text-rose-700 bg-rose-50 border-rose-200";
}

function MetricPill({ label, value, rating }: { label: string; value: string; rating?: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-slate-900">{value}</p>
      {rating && rating !== "UNKNOWN" && (
        <span className={cn("mt-2 inline-block rounded-full border px-2 py-0.5 text-xs font-medium", ratingColor(rating))}>
          {rating.replace(/_/g, " ")}
        </span>
      )}
    </div>
  );
}

function SectionRefreshButton({
  loading,
  onClick,
}: {
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      title="Refresh this check only — no crawl or AI cost"
      aria-label="Refresh this check"
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100 disabled:opacity-60"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <RefreshCw className="h-4 w-4" />
      )}
      <span className="hidden sm:inline">Refresh</span>
    </button>
  );
}

function InsightCard({
  icon: Icon,
  title,
  subtitle,
  children,
  accent = "brand",
  integration,
  refreshing,
  onRefresh,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  accent?: "brand" | "sky" | "violet" | "amber";
  integration?: IntegrationId;
  refreshing?: boolean;
  onRefresh?: (integration: IntegrationId) => void;
}) {
  const accentMap = {
    brand: "bg-brand-50 text-brand-600",
    sky: "bg-sky-50 text-sky-600",
    violet: "bg-violet-50 text-violet-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="glass-card card-hover rounded-xl p-5">
      <div className="flex items-start gap-3">
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", accentMap[accent])}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-slate-900">{title}</h3>
              {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
            </div>
            {integration && onRefresh && (
              <SectionRefreshButton
                loading={Boolean(refreshing)}
                onClick={() => onRefresh(integration)}
              />
            )}
          </div>
          <div className="mt-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function TechnicalInsightsPanel({
  auditId,
  performanceData,
  schemaSummary,
  onUpdated,
}: TechnicalInsightsProps) {
  const [refreshing, setRefreshing] = useState<IntegrationId | null>(null);
  const [refreshError, setRefreshError] = useState("");

  const crux = (performanceData?.crux as CruxResult | null) ?? null;
  const pageSpeed = (performanceData?.pageSpeed as PageSpeedResult | null) ?? null;
  const trust = (performanceData?.trust as {
    observatory?: ObservatoryResult | null;
    safeBrowsing?: SafeBrowsingResult | null;
    dns?: DnsResult | null;
  } | null) ?? null;
  const w3c = (schemaSummary?.w3c as W3cValidationResult | null) ?? null;
  const backlinks = (performanceData?.backlinks as BacklinkProfile | null) ?? null;

  async function handleRefresh(integration: IntegrationId) {
    setRefreshing(integration);
    setRefreshError("");

    try {
      const res = await fetch(`/api/audits/${auditId}/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ integration }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Refresh failed");
      }
      await onUpdated?.({
        overallScore: data.overallScore,
        categoryScores: data.categoryScores ?? {},
        totalIssues: data.totalIssues,
        criticalCount: data.criticalCount,
        warningCount: data.warningCount,
        noticeCount: data.noticeCount,
        scoresUpdated: Boolean(data.scoresUpdated),
      });
    } catch (err) {
      setRefreshError(toPublicAuditError(err));
    } finally {
      setRefreshing(null);
    }
  }

  return (
    <div className="mt-8">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">Technical Intelligence</h2>
        <p className="mt-1 text-sm text-slate-500">
          Powered by Google CrUX, Lighthouse, Open PageRank, MDN HTTP Observatory, Safe Browsing, DNS, and W3C.
          Use <span className="font-medium text-brand-700">Refresh</span> on each card to re-run that check only — no full crawl or AI cost.
        </p>
        {refreshError && <p className="mt-2 text-sm text-rose-600">{refreshError}</p>}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <InsightCard
          icon={Link2}
          title="Link Authority"
          subtitle="Open PageRank (free)"
          accent="violet"
          integration="openpagerank"
          refreshing={refreshing === "openpagerank"}
          onRefresh={handleRefresh}
        >
          {backlinks?.available && backlinks.domainRank !== null ? (
            <>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <MetricPill label="Domain authority" value={`${backlinks.domainRank}/100`} />
                <MetricPill label="Source" value="Open PageRank" />
              </div>
              <p className="mt-3 text-xs text-slate-500">
                {backlinks.message ?? "Estimates inbound link strength from public PageRank data."}
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-600">
              {backlinks?.message ??
                "Click Refresh to load link authority, or add OPENPAGERANK_API_KEY to .env."}
            </p>
          )}
        </InsightCard>

        <InsightCard
          icon={Users}
          title="Core Web Vitals"
          subtitle="Google CrUX + Lighthouse"
          accent="sky"
          integration="google-vitals"
          refreshing={refreshing === "google-vitals"}
          onRefresh={handleRefresh}
        >
            {crux?.available ? (
              <div className="grid grid-cols-3 gap-2">
                <MetricPill
                  label="LCP (field)"
                  value={crux.lcp.p75 ? `${(crux.lcp.p75 / 1000).toFixed(1)}s` : "—"}
                  rating={crux.lcp.rating}
                />
                <MetricPill
                  label="CLS (field)"
                  value={crux.cls.p75 !== null ? crux.cls.p75.toFixed(3) : "—"}
                  rating={crux.cls.rating}
                />
                <MetricPill
                  label="INP (field)"
                  value={crux.inp.p75 ? `${crux.inp.p75}ms` : "—"}
                  rating={crux.inp.rating}
                />
              </div>
            ) : (
              <p className="text-sm text-slate-600">
                {crux
                  ? "No Chrome UX Report data yet — site needs more real-user traffic for field metrics."
                  : "Click Refresh to load CrUX and Lighthouse scores."}
              </p>
            )}
            {pageSpeed ? (
              <div className="mt-4 border-t border-slate-100 pt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Lighthouse (lab)</p>
                <div className="mt-2 grid grid-cols-4 gap-2 text-center">
                  {[
                    { label: "Perf", score: pageSpeed.performanceScore },
                    { label: "A11y", score: pageSpeed.accessibilityScore },
                    { label: "BP", score: pageSpeed.bestPracticesScore },
                    { label: "SEO", score: pageSpeed.seoScore },
                  ].map((m) => (
                    <div key={m.label} className="rounded-lg bg-white p-2 ring-1 ring-slate-100">
                      <p className="text-xs text-slate-500">{m.label}</p>
                      <p className="text-lg font-bold text-slate-900">{m.score}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="mt-4 border-t border-slate-100 pt-4 text-sm text-slate-500">
                Lighthouse scores not loaded yet.
              </p>
            )}
          </InsightCard>

        <InsightCard
          icon={Shield}
          title="Security Headers"
          subtitle="MDN HTTP Observatory"
          accent="violet"
          integration="observatory"
          refreshing={refreshing === "observatory"}
          onRefresh={handleRefresh}
        >
          {trust?.observatory?.available ? (
            <>
              <div className="flex items-center gap-4">
                <span className={cn("rounded-xl border px-4 py-2 text-3xl font-bold", gradeBadgeClass(trust.observatory.grade))}>
                  {trust.observatory.grade}
                </span>
                <div>
                  <p className="text-sm text-slate-600">
                    Score <span className="font-semibold text-slate-900">{trust.observatory.score}/100</span>
                  </p>
                  <p className="text-xs text-slate-500">
                    {trust.observatory.testsPassed} passed · {trust.observatory.testsFailed} failed
                    {trust.observatory.source === "local"
                      ? " · local scan"
                      : " · MDN Observatory"}
                  </p>
                </div>
              </div>
              {trust.observatory.failedTests.length > 0 && (
                <div className="mt-3 rounded-lg border border-rose-100 bg-rose-50/60 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-rose-700">Failing checks</p>
                  <ul className="mt-1.5 space-y-1">
                    {trust.observatory.failedTests.slice(0, 4).map((t) => (
                      <li key={t.name} className="text-xs text-slate-700">
                        • {t.scoreDescription || t.name.replace(/-/g, " ")}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50/80 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Headers evaluated</p>
                <ul className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-0.5">
                  {[
                    "Content-Security-Policy",
                    "Strict-Transport-Security",
                    "X-Frame-Options",
                    "X-Content-Type-Options",
                    "Referrer-Policy",
                    "Permissions-Policy",
                  ].map((h) => (
                    <li key={h} className="text-xs text-slate-600">
                      • {h}
                    </li>
                  ))}
                </ul>
              </div>
              {trust.observatory.detailsUrl && trust.observatory.source === "mozilla" && (
                <a
                  href={trust.observatory.detailsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-xs font-medium text-brand-600 hover:text-brand-700"
                >
                  View full MDN report →
                </a>
              )}
              {trust.observatory.message && trust.observatory.source === "local" && (
                <p className="mt-3 text-xs text-amber-700">{trust.observatory.message}</p>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-600">
              {trust?.observatory?.message ??
                "Mozilla scan did not complete during the audit. Click Refresh — it usually works when run alone (~30s)."}
            </p>
          )}
        </InsightCard>

        <InsightCard
          icon={trust?.safeBrowsing?.available && trust.safeBrowsing.safe === false ? ShieldAlert : ShieldCheck}
          title="Google Safe Browsing"
          subtitle="Malware & phishing check"
          accent={trust?.safeBrowsing?.available && trust.safeBrowsing.safe === false ? "amber" : "brand"}
          integration="safe-browsing"
          refreshing={refreshing === "safe-browsing"}
          onRefresh={handleRefresh}
        >
          {trust?.safeBrowsing?.available ? (
            <>
              <div className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium", trust.safeBrowsing.safe ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700")}>
                {trust.safeBrowsing.safe ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> Not on Google&apos;s threat lists
                  </>
                ) : (
                  <>
                    <ShieldAlert className="h-4 w-4" /> Flagged: {trust.safeBrowsing.threats.join(", ")}
                  </>
                )}
              </div>
              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <MetricPill
                  label="URL checked"
                  value={(() => {
                    try {
                      return new URL(trust.safeBrowsing.checkedUrl).hostname;
                    } catch {
                      return trust.safeBrowsing.checkedUrl;
                    }
                  })()}
                />
                <MetricPill
                  label="Threat types found"
                  value={trust.safeBrowsing.threats.length === 0 ? "None" : String(trust.safeBrowsing.threats.length)}
                />
              </div>
              <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50/80 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Scanned for</p>
                <ul className="mt-1.5 space-y-0.5">
                  {(trust.safeBrowsing.scannedFor ?? [
                    "Malware",
                    "Phishing / social engineering",
                    "Unwanted software",
                    "Potentially harmful apps",
                  ]).map((item) => (
                    <li key={item} className="text-xs text-slate-600">
                      • {item}
                    </li>
                  ))}
                </ul>
              </div>
              {trust.safeBrowsing.safe && (
                <p className="mt-3 text-xs text-slate-500">
                  Google Safe Browsing did not list this URL under malware, phishing, or unwanted software at check time.
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-600">
              {trust?.safeBrowsing?.message ??
                "Safe Browsing did not run. Enable the API in Google Cloud, then click Refresh."}
            </p>
          )}
        </InsightCard>

        <InsightCard
          icon={Mail}
          title="Email & DNS"
          subtitle="SPF, DMARC, MX records"
          accent="brand"
          integration="dns"
          refreshing={refreshing === "dns"}
          onRefresh={handleRefresh}
        >
          {trust?.dns ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "SPF", ok: trust.dns.hasSpf },
                  { label: "DMARC", ok: trust.dns.hasDmarc },
                  { label: "MX", ok: trust.dns.hasMx },
                  { label: "IPv6", ok: trust.dns.hasIpv6 },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
                      item.ok ? "border-emerald-100 bg-emerald-50/50 text-emerald-800" : "border-slate-100 bg-slate-50 text-slate-600"
                    )}
                  >
                    {item.ok ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Globe className="h-4 w-4 text-slate-400" />}
                    {item.label}
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Email auth score: {trust.dns.emailAuthScore}/100
                {trust.dns.dmarcPolicy && ` · DMARC p=${trust.dns.dmarcPolicy}`}
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-600">Click Refresh to check DNS and email records.</p>
          )}
        </InsightCard>

        <InsightCard
          icon={Code2}
          title="HTML Validation"
          subtitle="W3C Nu HTML Checker"
          accent="amber"
          integration="w3c"
          refreshing={refreshing === "w3c"}
          onRefresh={handleRefresh}
        >
          {w3c ? (
            <>
              <div className="flex items-center gap-4">
                <div className={cn("rounded-lg px-3 py-2 text-sm font-semibold", w3c.valid ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>
                  {w3c.valid ? "Valid markup" : `${w3c.errorCount} error(s)`}
                </div>
                <p className="text-sm text-slate-600">{w3c.warningCount} warning(s)</p>
              </div>
              {w3c.topIssues.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {w3c.topIssues.slice(0, 3).map((issue, i) => (
                    <li key={i} className="text-xs text-slate-600">
                      {issue.line ? `Line ${issue.line}: ` : ""}{issue.message}
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-600">Click Refresh to validate homepage HTML.</p>
          )}
        </InsightCard>

        {performanceData?.averageLoadTimeMs != null && (
          <InsightCard icon={Gauge} title="Crawl Performance" subtitle="Our server-side fetch metrics" accent="sky">
            <div className="grid grid-cols-2 gap-3">
              <MetricPill
                label="Avg load time"
                value={`${Math.round(Number(performanceData.averageLoadTimeMs))}ms`}
              />
              <MetricPill
                label="Slow pages"
                value={String(performanceData.slowPages ?? 0)}
              />
            </div>
            <p className="mt-3 text-xs text-slate-500">
              From our crawl — use full Re-audit to refresh these metrics.
            </p>
          </InsightCard>
        )}

        {schemaSummary?.totalPages != null && (
          <InsightCard
            icon={FileCode}
            title="Structured Data"
            subtitle="Schema.org coverage across crawled pages"
            accent="violet"
          >
            <div className="grid grid-cols-2 gap-3">
              <MetricPill
                label="Pages with schema"
                value={`${Number(schemaSummary.pagesWithSchema ?? 0)} / ${Number(schemaSummary.totalPages ?? 0)}`}
              />
              <MetricPill
                label="Coverage"
                value={`${Number(schemaSummary.coverage ?? 0)}%`}
                rating={
                  Number(schemaSummary.coverage ?? 0) >= 70
                    ? "GOOD"
                    : Number(schemaSummary.coverage ?? 0) >= 30
                    ? "NEEDS_IMPROVEMENT"
                    : "POOR"
                }
              />
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  Number(schemaSummary.coverage ?? 0) >= 70
                    ? "bg-emerald-500"
                    : Number(schemaSummary.coverage ?? 0) >= 30
                    ? "bg-amber-500"
                    : "bg-rose-500"
                )}
                style={{ width: `${Math.max(2, Number(schemaSummary.coverage ?? 0))}%` }}
              />
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Schema.org markup helps Google show rich results. Higher coverage means more pages
              are eligible for enhanced search appearances.
            </p>
          </InsightCard>
        )}
      </div>
    </div>
  );
}
