import { formatUrl, getDomain } from "../utils";
import { crawlerUserAgent } from "../config";
import {
  analyzePage,
  analyzePageSpeed,
  analyzeSite,
  buildSiteIssue,
  checkBrokenLinks,
  analyzeSiteLinkGraph,
  extractPageSignals,
  groupIssues,
  type DetectedIssue,
  type IssueGroup,
  type PageSignals,
} from "./analyzer";
import { fetchPageSpeedInsights } from "./pagespeed";
import { fetchBacklinkProfile } from "./backlinks";
import { fetchCruxData } from "./crux";
import { fetchObservatoryScan } from "./observatory";
import { checkSafeBrowsing } from "./safe-browsing";
import { fetchDnsChecks } from "./dns";
import { validateHtml } from "./w3c-validator";
import { buildExternalIssues, type ExternalInsightsSummary } from "./external-analysis";
import {
  calculateCategoryScoresFromChecks,
  calculateOverallScore,
  type ScoringContext,
} from "./scoring";

const MAX_PAGES = 15;
const FETCH_TIMEOUT = 15000;

const NON_PAGE_EXT = /\.(xml|xml\.gz|pdf|jpg|jpeg|png|gif|webp|svg|css|js|zip|gz|mp4|woff2?|ico)(\?.*)?$/i;

async function fetchWithTimeout(
  url: string
): Promise<{ html: string; statusCode: number; loadTimeMs: number; headers: Headers }> {
  const start = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": crawlerUserAgent(),
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    const html = await response.text();
    return {
      html,
      statusCode: response.status,
      loadTimeMs: Date.now() - start,
      headers: response.headers,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchRobotsTxt(baseUrl: string): Promise<string | null> {
  try {
    const url = new URL("/robots.txt", baseUrl).toString();
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function isSameSite(url: string, baseUrl: string): boolean {
  try {
    const a = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    const b = new URL(baseUrl).hostname.replace(/^www\./, "").toLowerCase();
    if (a === b) return true;
    if (a.endsWith(`.${b}`) || b.endsWith(`.${a}`)) return true;
    return false;
  } catch {
    return false;
  }
}

function isCrawlablePageUrl(url: string, baseUrl: string): boolean {
  try {
    const u = new URL(url);
    if (!/^https?:$/i.test(u.protocol)) return false;
    if (NON_PAGE_EXT.test(u.pathname)) return false;
    if (/\/sitemap/i.test(u.pathname)) return false;
    return isSameSite(url, baseUrl);
  } catch {
    return false;
  }
}

function rankPageUrls(urls: string[], baseUrl: string): string[] {
  const baseHost = new URL(baseUrl).hostname.replace(/^www\./, "").toLowerCase();

  return [...new Set(urls)].sort((a, b) => {
    try {
      const ua = new URL(a);
      const ub = new URL(b);
      const aExact = ua.hostname.replace(/^www\./, "").toLowerCase() === baseHost ? 0 : 1;
      const bExact = ub.hostname.replace(/^www\./, "").toLowerCase() === baseHost ? 0 : 1;
      if (aExact !== bExact) return aExact - bExact;
      const aDepth = ua.pathname.split("/").filter(Boolean).length;
      const bDepth = ub.pathname.split("/").filter(Boolean).length;
      if (aDepth !== bDepth) return aDepth - bDepth;
      return ua.pathname.length - ub.pathname.length;
    } catch {
      return 0;
    }
  });
}

async function extractPageUrlsFromSitemap(
  sitemapUrl: string,
  baseUrl: string,
  maxUrls: number,
  depth = 0
): Promise<string[]> {
  if (depth > 2 || maxUrls <= 0) return [];

  try {
    const res = await fetch(sitemapUrl, {
      headers: { "User-Agent": crawlerUserAgent() },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return [];

    const text = await res.text();
    const locs = [...text.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((m) => m[1].trim());

    if (/<sitemapindex/i.test(text)) {
      const childSitemaps = locs.filter((u) => /\.xml/i.test(u) || /sitemap/i.test(u));
      const pageUrls: string[] = [];
      for (const child of childSitemaps.slice(0, 8)) {
        if (pageUrls.length >= maxUrls) break;
        const found = await extractPageUrlsFromSitemap(
          child,
          baseUrl,
          maxUrls - pageUrls.length,
          depth + 1
        );
        pageUrls.push(...found);
      }
      return pageUrls;
    }

    return locs.filter((u) => isCrawlablePageUrl(u, baseUrl)).slice(0, maxUrls);
  } catch {
    return [];
  }
}

async function discoverUrls(
  baseUrl: string,
  robotsTxt: string | null
): Promise<{ urls: string[]; sitemapFound: boolean }> {
  const candidates = new Set<string>([baseUrl, new URL("/", baseUrl).toString()]);
  const sitemapUrls: string[] = [];
  let sitemapFound = false;

  if (robotsTxt) {
    const sitemapMatches = robotsTxt.match(/^Sitemap:\s*(.+)$/gim);
    sitemapMatches?.forEach((line) => {
      const match = line.match(/^Sitemap:\s*(.+)$/i);
      if (match?.[1]) sitemapUrls.push(match[1].trim());
    });
  }

  const defaultSitemap = new URL("/sitemap.xml", baseUrl).toString();
  if (!sitemapUrls.includes(defaultSitemap)) sitemapUrls.push(defaultSitemap);

  for (const sitemapUrl of sitemapUrls) {
    const pageUrls = await extractPageUrlsFromSitemap(sitemapUrl, baseUrl, MAX_PAGES * 3);
    if (pageUrls.length > 0) sitemapFound = true;
    pageUrls.forEach((u) => candidates.add(u));
    if (candidates.size >= MAX_PAGES * 2) break;
  }

  const ranked = rankPageUrls(Array.from(candidates), baseUrl);
  const urls = ranked.slice(0, MAX_PAGES);

  return { urls: urls.length > 0 ? urls : [baseUrl], sitemapFound };
}

function looksLikeHtml(html: string): boolean {
  const sample = html.slice(0, 4000).toLowerCase();
  return sample.includes("<html") || sample.includes("<!doctype html");
}

async function probeHttpsRedirect(baseUrl: string): Promise<{
  httpsEnforced: boolean;
  httpStatus: number | null;
  finalUrl: string | null;
}> {
  try {
    const u = new URL(baseUrl);
    const httpUrl = `http://${u.hostname}${u.pathname || "/"}`;
    const res = await fetch(httpUrl, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
      headers: { "User-Agent": crawlerUserAgent() },
    });
    return {
      httpsEnforced: res.url.startsWith("https://"),
      httpStatus: res.status,
      finalUrl: res.url,
    };
  } catch {
    return { httpsEnforced: false, httpStatus: null, finalUrl: null };
  }
}

async function probeWwwCanonical(baseUrl: string): Promise<{
  wwwResolves: boolean;
  apexResolves: boolean;
  canonicalized: boolean;
}> {
  try {
    const u = new URL(baseUrl);
    const host = u.hostname.replace(/^www\./, "");
    const apexUrl = `${u.protocol}//${host}/`;
    const wwwUrl = `${u.protocol}//www.${host}/`;

    const [apexRes, wwwRes] = await Promise.all([
      fetch(apexUrl, { redirect: "follow", signal: AbortSignal.timeout(8000), headers: { "User-Agent": crawlerUserAgent() } }).catch(() => null),
      fetch(wwwUrl, { redirect: "follow", signal: AbortSignal.timeout(8000), headers: { "User-Agent": crawlerUserAgent() } }).catch(() => null),
    ]);

    const apexFinal = apexRes?.url ? new URL(apexRes.url).hostname : null;
    const wwwFinal = wwwRes?.url ? new URL(wwwRes.url).hostname : null;

    return {
      wwwResolves: Boolean(wwwRes && wwwRes.status < 400),
      apexResolves: Boolean(apexRes && apexRes.status < 400),
      canonicalized: apexFinal !== null && wwwFinal !== null && apexFinal === wwwFinal,
    };
  } catch {
    return { wwwResolves: false, apexResolves: false, canonicalized: true };
  }
}

export interface AuditRunResult {
  domain: string;
  pages: Array<{
    url: string;
    title: string | null;
    metaDescription: string | null;
    h1: string | null;
    h1Count: number;
    wordCount: number;
    canonical: string | null;
    isIndexable: boolean;
    hasSocialTags: boolean;
    hasSchema: boolean;
    statusCode: number;
    loadTimeMs: number;
    issues: DetectedIssue[];
  }>;
  issues: DetectedIssue[];
  issueGroups: IssueGroup[];
  categoryScores: ReturnType<typeof calculateCategoryScoresFromChecks>;
  overallScore: number;
  isSpaShell: boolean;
  pagesCrawled: number;
  criticalCount: number;
  warningCount: number;
  noticeCount: number;
  socialSummary: Record<string, unknown>;
  schemaSummary: Record<string, unknown>;
  performanceData: Record<string, unknown>;
}

export async function runAudit(rawUrl: string): Promise<AuditRunResult> {
  const baseUrl = formatUrl(rawUrl);
  const domain = getDomain(baseUrl);

  const [robotsTxt, httpsProbe, wwwProbe] = await Promise.all([
    fetchRobotsTxt(baseUrl),
    probeHttpsRedirect(baseUrl),
    probeWwwCanonical(baseUrl),
  ]);
  const { urls: urlsToCrawl, sitemapFound } = await discoverUrls(baseUrl, robotsTxt);

  const pages: AuditRunResult["pages"] = [];
  const allIssues: DetectedIssue[] = [];
  const pageSignals: PageSignals[] = [];
  let homepageHtml: string | null = null;
  let brokenInternalLinks = 0;
  let redirectInternalLinks = 0;
  const checkedLinkUrls = new Set<string>();
  const allBrokenUrls = new Set<string>();
  const allRedirectUrls = new Set<string>();

  for (const pageUrl of urlsToCrawl) {
    if (!isCrawlablePageUrl(pageUrl, baseUrl)) continue;

    try {
      const { html, statusCode, loadTimeMs, headers } = await fetchWithTimeout(pageUrl);

      if (!looksLikeHtml(html)) {
        continue;
      }

      if (pageUrl === baseUrl || pageUrl === baseUrl + "/") homepageHtml = html;

      const signals = extractPageSignals(pageUrl, html, statusCode, loadTimeMs, headers);
      pageSignals.push(signals);
      const issues = analyzePage(signals);
      allIssues.push(...issues);

      const isFirstHtmlPage = pages.length === 0;
      const broken = await checkBrokenLinks(pageUrl, html, 25, checkedLinkUrls);
      broken.brokenUrls.forEach((u) => allBrokenUrls.add(u));
      broken.redirectUrls.forEach((u) => allRedirectUrls.add(u));
      allIssues.push(...broken.issues);

      // Extra pass on homepage for deeper sampling (nav/footer links)
      if (isFirstHtmlPage) {
        const homeExtra = await checkBrokenLinks(pageUrl, html, 15, checkedLinkUrls);
        homeExtra.brokenUrls.forEach((u) => allBrokenUrls.add(u));
        homeExtra.redirectUrls.forEach((u) => allRedirectUrls.add(u));
        allIssues.push(...homeExtra.issues);
      }

      brokenInternalLinks = allBrokenUrls.size;
      redirectInternalLinks = allRedirectUrls.size;

      pages.push({
        url: signals.url,
        title: signals.title,
        metaDescription: signals.metaDescription,
        h1: signals.h1,
        h1Count: signals.h1Count,
        wordCount: signals.wordCount,
        canonical: signals.canonical,
        isIndexable: signals.isIndexable,
        hasSocialTags: signals.hasSocialTags,
        hasSchema: signals.hasSchema,
        statusCode: signals.statusCode,
        loadTimeMs: signals.loadTimeMs,
        issues,
      });
    } catch (error) {
      const errIssue: DetectedIssue = {
        key: "crawl-failure",
        category: "onpage",
        severity: "critical",
        title: "Failed to crawl page",
        description: `Could not fetch ${pageUrl}: ${error instanceof Error ? error.message : "Unknown error"}`,
        recommendation: "Ensure the URL is accessible and returns valid HTML.",
        affectedUrl: pageUrl,
      };
      allIssues.push(errIssue);
      pages.push({
        url: pageUrl,
        title: null,
        metaDescription: null,
        h1: null,
        h1Count: 0,
        wordCount: 0,
        canonical: null,
        isIndexable: true,
        hasSocialTags: false,
        hasSchema: false,
        statusCode: 0,
        loadTimeMs: 0,
        issues: [errIssue],
      });
    }
  }

  if (pages.length === 0) {
    throw new Error("Could not crawl any HTML pages from this URL.");
  }

  allIssues.push(
    ...analyzeSite(
      baseUrl,
      pages.map((p) => ({
        url: p.url,
        title: p.title,
        metaDescription: p.metaDescription,
        hasSchema: p.hasSchema,
        hasSocialTags: p.hasSocialTags,
      })),
      robotsTxt,
      sitemapFound
    )
  );

  const pageSpeed = await fetchPageSpeedInsights(baseUrl);
  const homepage =
    pageSignals.find((p) => {
      try {
        const u = new URL(p.url);
        const b = new URL(baseUrl);
        const path = u.pathname.replace(/\/$/, "") || "/";
        return (
          u.hostname.replace(/^www\./, "") === b.hostname.replace(/^www\./, "") &&
          (path === "/" || path === "")
        );
      } catch {
        return false;
      }
    }) ?? pageSignals[0];

  // Free third-party checks — run in parallel after crawl
  const [crux, observatory, safeBrowsing, dns, w3c, backlinks] = await Promise.all([
    fetchCruxData(baseUrl),
    fetchObservatoryScan(baseUrl, homepage?.securityHeaders, homepage?.isHttps ?? true),
    checkSafeBrowsing(baseUrl),
    fetchDnsChecks(baseUrl),
    validateHtml(baseUrl),
    fetchBacklinkProfile(baseUrl),
  ]);

  const externalSummary: ExternalInsightsSummary = {
    crux,
    observatory,
    safeBrowsing,
    dns,
    w3c,
    backlinks,
  };

  allIssues.push(...buildExternalIssues(baseUrl, externalSummary));

  if (pageSpeed) {
    allIssues.push(...analyzePageSpeed(baseUrl, pageSpeed));
  }

  // Site-wide canonical / redirect checks
  if (!httpsProbe.httpsEnforced && baseUrl.startsWith("https://")) {
    allIssues.push(
      buildSiteIssue(
        "no-https-redirect",
        "onpage",
        "warning",
        "HTTP does not redirect to HTTPS",
        "Visiting the http:// version of your site does not redirect to https://.",
        "Configure a server-level 301 redirect from HTTP to HTTPS.",
        baseUrl
      )
    );
  }

  if (wwwProbe.wwwResolves && wwwProbe.apexResolves && !wwwProbe.canonicalized) {
    allIssues.push(
      buildSiteIssue(
        "www-not-canonicalized",
        "onpage",
        "warning",
        "www and non-www versions are both reachable",
        "Both www.yoursite and yoursite resolve without redirecting to a single canonical host.",
        "Pick one canonical host and 301-redirect the other to avoid duplicate content.",
        baseUrl
      )
    );
  }

  const linkGraph = analyzeSiteLinkGraph(baseUrl, pageSignals);
  allIssues.push(...linkGraph.issues);

  const isSpaShell = pageSignals.length > 0 && pageSignals[0].looksLikeSpaShell;

  const scoringContext: ScoringContext = {
    baseUrl,
    pages: pageSignals,
    robotsTxt,
    sitemapFound,
    pageSpeed,
    crux,
    observatory,
    safeBrowsing,
    dns,
    w3c,
    backlinks,
    brokenInternalLinks,
    redirectInternalLinks,
    orphanPageCount: linkGraph.orphanPageCount,
    pagesWithLowInternalLinks: linkGraph.pagesWithLowInternalLinks,
    httpsEnforced: httpsProbe.httpsEnforced,
    wwwCanonicalized: wwwProbe.canonicalized || !wwwProbe.wwwResolves || !wwwProbe.apexResolves,
    isSpaShell,
  };

  const categoryScores = calculateCategoryScoresFromChecks(scoringContext);
  const overallScore = calculateOverallScore(categoryScores);
  const issueGroups = groupIssues(allIssues);

  const pagesWithSocial = pages.filter((p) => p.hasSocialTags).length;
  const pagesWithSchema = pages.filter((p) => p.hasSchema).length;
  const avgLoadTime =
    pages.length > 0
      ? Math.round(pages.reduce((s, p) => s + p.loadTimeMs, 0) / pages.length)
      : 0;

  return {
    domain,
    pages,
    issues: allIssues,
    issueGroups,
    categoryScores,
    overallScore,
    isSpaShell,
    pagesCrawled: pages.length,
    // Counts represent unique findings (grouped), not raw per-page duplicates
    criticalCount: issueGroups.filter((g) => g.severity === "critical").length,
    warningCount: issueGroups.filter((g) => g.severity === "warning").length,
    noticeCount: issueGroups.filter((g) => g.severity === "notice").length,
    socialSummary: {
      pagesWithOgTags: pagesWithSocial,
      totalPages: pages.length,
      coverage: pages.length ? Math.round((pagesWithSocial / pages.length) * 100) : 0,
    },
    schemaSummary: {
      pagesWithSchema,
      totalPages: pages.length,
      coverage: pages.length ? Math.round((pagesWithSchema / pages.length) * 100) : 0,
      w3c: w3c ?? null,
    },
    performanceData: {
      averageLoadTimeMs: avgLoadTime,
      slowPages: pages.filter((p) => p.loadTimeMs > 3000).length,
      pageSpeed: pageSpeed ?? null,
      crux: crux ?? null,
      backlinks: backlinks ?? null,
      homepageHtmlSize: homepageHtml ? Buffer.byteLength(homepageHtml, "utf8") : null,
      trust: {
        observatory: observatory ?? null,
        safeBrowsing: safeBrowsing ?? null,
        dns: dns ?? null,
      },
      _scoringContext: {
        baseUrl,
        robotsTxt,
        sitemapFound,
        pageSignals,
        brokenInternalLinks,
        redirectInternalLinks,
        orphanPageCount: linkGraph.orphanPageCount,
        pagesWithLowInternalLinks: linkGraph.pagesWithLowInternalLinks,
        httpsEnforced: httpsProbe.httpsEnforced,
        wwwCanonicalized:
          wwwProbe.canonicalized || !wwwProbe.wwwResolves || !wwwProbe.apexResolves,
        isSpaShell,
      },
    },
  };
}
