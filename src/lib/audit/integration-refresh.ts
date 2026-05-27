import { prisma } from "@/lib/db";
import type { SecurityHeaders, PageSignals } from "./analyzer";
import { fetchBacklinkProfile } from "./backlinks";
import { fetchCruxData } from "./crux";
import { fetchDnsChecks } from "./dns";
import {
  analyzeBacklinks,
  analyzeCrux,
  analyzeDns,
  analyzeObservatory,
  analyzeSafeBrowsing,
  analyzeW3c,
} from "./external-analysis";
import { analyzePageSpeed, groupIssues, type DetectedIssue } from "./analyzer";
import type { ObservatoryResult } from "./observatory";
import { fetchObservatoryScan } from "./observatory";
import { fetchPageSpeedInsights } from "./pagespeed";
import { calculateCategoryScoresFromChecks, calculateOverallScore, type ScoringContext } from "./scoring";
import { checkSafeBrowsing } from "./safe-browsing";
import { validateHtml } from "./w3c-validator";
import { resolveCanonicalAuditUrl } from "./resolve-url";
import { getDomain } from "../utils";

export const INTEGRATION_IDS = [
  "openpagerank",
  "google-vitals",
  "observatory",
  "safe-browsing",
  "dns",
  "w3c",
] as const;

export type IntegrationId = (typeof INTEGRATION_IDS)[number];

export function isIntegrationId(value: string): value is IntegrationId {
  return (INTEGRATION_IDS as readonly string[]).includes(value);
}

const ISSUE_KEY_PREFIXES: Record<IntegrationId, string[]> = {
  openpagerank: ["backlinks-", "weak-link-profile", "low-domain-authority"],
  "google-vitals": ["crux-", "pagespeed-", "cwv-", "lh-"],
  observatory: ["observatory-"],
  "safe-browsing": ["safe-browsing-"],
  dns: ["dns-"],
  w3c: ["w3c-"],
};

interface StoredScoringContext {
  baseUrl: string;
  robotsTxt: string | null;
  sitemapFound: boolean;
  pageSignals: PageSignals[];
  brokenInternalLinks: number;
  redirectInternalLinks: number;
  orphanPageCount: number;
  pagesWithLowInternalLinks: number;
  httpsEnforced: boolean;
  wwwCanonicalized: boolean;
  isSpaShell: boolean;
}

const LEGACY_TITLE_HINTS: Record<IntegrationId, string[]> = {
  openpagerank: ["Link authority", "inbound link", "domain authority"],
  "google-vitals": ["PageSpeed", "CrUX", "LCP", "CLS", "INP", "Lighthouse", "Core Web Vitals"],
  observatory: ["Security headers", "Observatory", "Security:"],
  "safe-browsing": ["Safe Browsing", "threats detected"],
  dns: ["SPF", "DMARC", "MX record", "IPv6"],
  w3c: ["HTML markup", "W3C"],
};

function issueMatchesIntegration(
  issue: { issueKey?: string | null; title: string },
  integration: IntegrationId
): boolean {
  if (issue.issueKey) {
    return ISSUE_KEY_PREFIXES[integration].some(
      (prefix) => issue.issueKey === prefix || issue.issueKey!.startsWith(prefix)
    );
  }
  const title = issue.title.toLowerCase();
  return LEGACY_TITLE_HINTS[integration].some((hint) => title.includes(hint.toLowerCase()));
}

function isHomepage(pageUrl: string, baseUrl: string): boolean {
  try {
    const a = new URL(pageUrl);
    const b = new URL(baseUrl);
    if (a.hostname.replace(/^www\./, "").toLowerCase() !== b.hostname.replace(/^www\./, "").toLowerCase()) {
      return false;
    }
    const path = a.pathname.replace(/\/$/, "") || "/";
    return path === "/" || path === "";
  } catch {
    return false;
  }
}

function syncHomepageSecurityHeaders(
  stored: StoredScoringContext,
  headers: SecurityHeaders,
  isHttps: boolean
) {
  const home =
    stored.pageSignals.find((p) => isHomepage(p.url, stored.baseUrl)) ?? stored.pageSignals[0];
  if (!home) return;
  home.securityHeaders = headers;
  home.isHttps = isHttps;
}

function syncObservatoryHeaders(
  stored: StoredScoringContext,
  observatory: ObservatoryResult
) {
  if (!observatory.available || observatory.source !== "local") return;
  const failed = new Set(observatory.failedTests.map((t) => t.name));
  const headers: SecurityHeaders = {
    hsts: !failed.has("strict-transport-security"),
    csp: !failed.has("content-security-policy"),
    xContentType: !failed.has("x-content-type-options"),
    xFrameOptions: !failed.has("x-frame-options"),
    referrerPolicy: !failed.has("referrer-policy"),
    permissionsPolicy: !failed.has("permissions-policy"),
  };
  syncHomepageSecurityHeaders(stored, headers, stored.pageSignals[0]?.isHttps ?? true);
}

function recalculateAuditScores(
  stored: StoredScoringContext | undefined,
  performanceData: Record<string, unknown>,
  schemaSummary: Record<string, unknown>
) {
  if (!stored?.pageSignals?.length) {
    return null;
  }

  const scoringContext = buildScoringContext(stored, performanceData, schemaSummary);
  const categoryScores = calculateCategoryScoresFromChecks(scoringContext);
  const overallScore = calculateOverallScore(categoryScores);
  return { categoryScores, overallScore };
}

function buildScoringContext(
  stored: StoredScoringContext,
  performanceData: Record<string, unknown>,
  schemaSummary: Record<string, unknown>
): ScoringContext {
  const trust = performanceData.trust as {
    observatory?: ScoringContext["observatory"];
    safeBrowsing?: ScoringContext["safeBrowsing"];
    dns?: ScoringContext["dns"];
  } | null;

  return {
    baseUrl: stored.baseUrl,
    pages: stored.pageSignals,
    robotsTxt: stored.robotsTxt,
    sitemapFound: stored.sitemapFound,
    pageSpeed: (performanceData.pageSpeed as ScoringContext["pageSpeed"]) ?? null,
    crux: (performanceData.crux as ScoringContext["crux"]) ?? null,
    observatory: trust?.observatory ?? null,
    safeBrowsing: trust?.safeBrowsing ?? null,
    dns: trust?.dns ?? null,
    w3c: (schemaSummary.w3c as ScoringContext["w3c"]) ?? null,
    backlinks: (performanceData.backlinks as ScoringContext["backlinks"]) ?? null,
    brokenInternalLinks: stored.brokenInternalLinks,
    redirectInternalLinks: stored.redirectInternalLinks,
    orphanPageCount: stored.orphanPageCount,
    pagesWithLowInternalLinks: stored.pagesWithLowInternalLinks,
    httpsEnforced: stored.httpsEnforced,
    wwwCanonicalized: stored.wwwCanonicalized,
    isSpaShell: stored.isSpaShell,
  };
}

async function fetchIntegrationIssues(
  integration: IntegrationId,
  baseUrl: string,
  performanceData: Record<string, unknown>,
  schemaSummary: Record<string, unknown>,
  options?: { refresh?: boolean }
): Promise<DetectedIssue[]> {
  switch (integration) {
    case "openpagerank": {
      const backlinks = await fetchBacklinkProfile(baseUrl);
      performanceData.backlinks = backlinks;
      return analyzeBacklinks(baseUrl, backlinks);
    }
    case "google-vitals": {
      const [crux, pageSpeed] = await Promise.all([
        fetchCruxData(baseUrl),
        fetchPageSpeedInsights(baseUrl),
      ]);
      performanceData.crux = crux;
      performanceData.pageSpeed = pageSpeed;
      const issues: DetectedIssue[] = [];
      if (crux) issues.push(...analyzeCrux(baseUrl, crux));
      if (pageSpeed) issues.push(...analyzePageSpeed(baseUrl, pageSpeed));
      return issues;
    }
    case "observatory": {
      const stored = performanceData._scoringContext as StoredScoringContext | undefined;
      const trust = (performanceData.trust as Record<string, unknown>) ?? {};
      const previous = trust.observatory as ObservatoryResult | undefined;
      const observatory = await fetchObservatoryScan(baseUrl, null, true, {
        refresh: options?.refresh,
        previous: previous ?? null,
      });
      trust.observatory = observatory;
      performanceData.trust = trust;
      if (stored) {
        syncObservatoryHeaders(stored, observatory);
        performanceData._scoringContext = stored;
      }
      return analyzeObservatory(baseUrl, observatory);
    }
    case "safe-browsing": {
      const safeBrowsing = await checkSafeBrowsing(baseUrl);
      const trust = (performanceData.trust as Record<string, unknown>) ?? {};
      trust.safeBrowsing = safeBrowsing;
      performanceData.trust = trust;
      return analyzeSafeBrowsing(baseUrl, safeBrowsing);
    }
    case "dns": {
      const dns = await fetchDnsChecks(baseUrl);
      const trust = (performanceData.trust as Record<string, unknown>) ?? {};
      trust.dns = dns;
      performanceData.trust = trust;
      return dns ? analyzeDns(baseUrl, dns) : [];
    }
    case "w3c": {
      const w3c = await validateHtml(baseUrl);
      schemaSummary.w3c = w3c;
      return w3c ? analyzeW3c(baseUrl, w3c) : [];
    }
    default:
      return [];
  }
}

export async function refreshAuditIntegration(auditId: string, integration: IntegrationId) {
  const audit = await prisma.audit.findUnique({
    where: { id: auditId },
    include: { issues: true, pages: true },
  });

  if (!audit) {
    throw new Error("Audit not found");
  }
  if (audit.status !== "completed") {
    throw new Error("Audit must be completed before refreshing a section");
  }

  const performanceData = JSON.parse(audit.performanceData ?? "{}") as Record<string, unknown>;
  const schemaSummary = JSON.parse(audit.schemaSummary ?? "{}") as Record<string, unknown>;
  let stored = performanceData._scoringContext as StoredScoringContext | undefined;

  const canonicalUrl = await resolveCanonicalAuditUrl(audit.url);
  if (stored && stored.baseUrl !== canonicalUrl) {
    stored = { ...stored, baseUrl: canonicalUrl };
    performanceData._scoringContext = stored;
  }

  const newIntegrationIssues = await fetchIntegrationIssues(
    integration,
    audit.url,
    performanceData,
    schemaSummary,
    { refresh: true }
  );

  const removeIds = audit.issues
    .filter((issue) => issueMatchesIntegration(issue, integration))
    .map((issue) => issue.id);

  if (removeIds.length > 0) {
    await prisma.auditIssue.deleteMany({
      where: { id: { in: removeIds } },
    });
  }

  const pageUrlToId = new Map(audit.pages.map((p) => [p.url, p.id]));

  for (const issue of newIntegrationIssues) {
    await prisma.auditIssue.create({
      data: {
        auditId,
        pageId: pageUrlToId.get(issue.affectedUrl) ?? null,
        category: issue.category,
        severity: issue.severity,
        issueKey: issue.key,
        title: issue.title,
        description: issue.description,
        recommendation: issue.recommendation,
        affectedUrl: issue.affectedUrl,
      },
    });
  }

  const allIssues = await prisma.auditIssue.findMany({ where: { auditId } });
  const grouped = groupIssues(
    allIssues.map((issue) => ({
      key: issue.issueKey ?? issue.title,
      category: issue.category as DetectedIssue["category"],
      severity: issue.severity as DetectedIssue["severity"],
      title: issue.title,
      description: issue.description,
      recommendation: issue.recommendation ?? "",
      affectedUrl: issue.affectedUrl ?? audit.url,
    }))
  );

  const updateData: {
    url?: string;
    domain?: string;
    performanceData: string;
    schemaSummary: string;
    totalIssues: number;
    criticalCount: number;
    warningCount: number;
    noticeCount: number;
    overallScore?: number;
    categoryScores?: string;
  } = {
    performanceData: JSON.stringify(performanceData),
    schemaSummary: JSON.stringify(schemaSummary),
    totalIssues: allIssues.length,
    criticalCount: grouped.filter((g) => g.severity === "critical").length,
    warningCount: grouped.filter((g) => g.severity === "warning").length,
    noticeCount: grouped.filter((g) => g.severity === "notice").length,
  };

  if (canonicalUrl !== audit.url) {
    updateData.url = canonicalUrl;
    updateData.domain = getDomain(canonicalUrl);
  }

  const scores = recalculateAuditScores(stored, performanceData, schemaSummary);
  if (scores) {
    updateData.categoryScores = JSON.stringify(scores.categoryScores);
    updateData.overallScore = scores.overallScore;
  }

  if (stored) {
    performanceData._scoringContext = stored;
    updateData.performanceData = JSON.stringify(performanceData);
  }

  await prisma.audit.update({
    where: { id: auditId },
    data: updateData,
  });

  const categoryScores = scores
    ? scores.categoryScores
    : JSON.parse(audit.categoryScores ?? "{}") as Record<string, number>;

  return {
    integration,
    overallScore: scores?.overallScore ?? audit.overallScore,
    categoryScores,
    totalIssues: updateData.totalIssues,
    criticalCount: updateData.criticalCount,
    warningCount: updateData.warningCount,
    noticeCount: updateData.noticeCount,
    scoresUpdated: Boolean(scores),
  };
}
