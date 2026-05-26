import type { Category } from "../config";
import type { PageSignals } from "./analyzer";
import type { CruxResult } from "./crux";
import type { DnsResult } from "./dns";
import type { ObservatoryResult } from "./observatory";
import type { PageSpeedResult } from "./pagespeed";
import type { SafeBrowsingResult } from "./safe-browsing";
import type { W3cValidationResult } from "./w3c-validator";
import type { BacklinkProfile } from "./backlinks";
import { scoreBacklinkProfile } from "./backlinks";
import { gradeToScore } from "./external-analysis";

export interface ScoringContext {
  baseUrl: string;
  pages: PageSignals[];
  robotsTxt: string | null;
  sitemapFound: boolean;
  pageSpeed: PageSpeedResult | null;
  crux: CruxResult | null;
  observatory: ObservatoryResult | null;
  safeBrowsing: SafeBrowsingResult | null;
  dns: DnsResult | null;
  w3c: W3cValidationResult | null;
  backlinks: BacklinkProfile | null;
  brokenInternalLinks: number;
  redirectInternalLinks: number;
  orphanPageCount: number;
  pagesWithLowInternalLinks: number;
  httpsEnforced: boolean;
  wwwCanonicalized: boolean;
  isSpaShell: boolean;
}

interface CheckDef {
  id: string;
  category: Category;
  weight: number;
  score: (ctx: ScoringContext) => number;
}

function normalizeHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function isHomepage(pageUrl: string, baseUrl: string): boolean {
  try {
    const a = new URL(pageUrl);
    const b = new URL(baseUrl);
    if (normalizeHost(pageUrl) !== normalizeHost(baseUrl)) return false;
    const path = a.pathname.replace(/\/$/, "") || "/";
    return path === "/" || path === "";
  } catch {
    return false;
  }
}

function getHomepage(ctx: ScoringContext): PageSignals | undefined {
  return ctx.pages.find((p) => isHomepage(p.url, ctx.baseUrl)) ?? ctx.pages[0];
}

function passRate(pages: PageSignals[], test: (p: PageSignals) => boolean): number {
  if (pages.length === 0) return 0;
  return pages.filter(test).length / pages.length;
}

/** Homepage-heavy blend — mirrors how audit tools prioritize the entry page. */
function homepageWeightedScore(
  ctx: ScoringContext,
  test: (p: PageSignals) => boolean,
  homeWeight = 0.65
): number {
  const home = getHomepage(ctx);
  const others = ctx.pages.filter((p) => p !== home);
  const homeScore = home && test(home) ? 100 : 0;
  const othersScore = others.length ? passRate(others, test) * 100 : 100;
  return Math.round(homeScore * homeWeight + othersScore * (1 - homeWeight));
}

function titleScore(p: PageSignals): number {
  if (!p.title) return 0;
  const len = p.title.length;
  if (len >= 10 && len <= 70) return 100;
  if (len >= 5 && len < 10) return 75;
  if (len > 70 && len <= 90) return 85;
  return 60;
}

function metaScore(p: PageSignals): number {
  if (p.metaDescription && p.metaDescription.length >= 70) return 100;
  if (p.metaDescription && p.metaDescription.length >= 30) return 80;
  if (p.ogDescription?.trim() || p.ogTitle?.trim()) return 70;
  return 0;
}

function h1Score(p: PageSignals, baseUrl: string): number {
  if (p.h1Count === 1) return 100;
  if (p.h1Count === 0) {
    // Search / app homepages often omit H1 — partial credit when title exists
    if (isHomepage(p.url, baseUrl) && p.title) return 55;
    return p.title ? 40 : 0;
  }
  if (p.h1Count === 2) return 70;
  return 50;
}

function contentPages(pages: PageSignals[]): PageSignals[] {
  return pages.filter((p) => {
    try {
      const path = new URL(p.url).pathname.replace(/\/$/, "") || "/";
      return path !== "/" && p.wordCount > 250;
    } catch {
      return p.wordCount > 250;
    }
  });
}

const CHECKS: CheckDef[] = [
  // On-Page SEO
  {
    id: "ssl",
    category: "onpage",
    weight: 12,
    score: (ctx) => (getHomepage(ctx)?.isHttps ? 100 : 0),
  },
  {
    id: "title",
    category: "onpage",
    weight: 14,
    score: (ctx) => {
      const home = getHomepage(ctx);
      if (!home) return 0;
      const homePart = titleScore(home);
      const others = ctx.pages.filter((p) => p !== home);
      const othersPart =
        others.length > 0
          ? others.reduce((s, p) => s + titleScore(p), 0) / others.length
          : 100;
      return Math.round(homePart * 0.65 + othersPart * 0.35);
    },
  },
  {
    id: "meta-description",
    category: "onpage",
    weight: 10,
    score: (ctx) => {
      const home = getHomepage(ctx);
      if (!home) return 0;
      const homePart = metaScore(home);
      const others = ctx.pages.filter((p) => p !== home);
      const othersPart =
        others.length > 0
          ? others.reduce((s, p) => s + metaScore(p), 0) / others.length
          : 100;
      return Math.round(homePart * 0.65 + othersPart * 0.35);
    },
  },
  {
    id: "h1",
    category: "onpage",
    weight: 10,
    score: (ctx) => {
      const home = getHomepage(ctx);
      if (!home) return 0;
      const homePart = h1Score(home, ctx.baseUrl);
      const others = ctx.pages.filter((p) => p !== home);
      const othersPart =
        others.length > 0
          ? others.reduce((s, p) => s + h1Score(p, ctx.baseUrl), 0) / others.length
          : 100;
      return Math.round(homePart * 0.6 + othersPart * 0.4);
    },
  },
  {
    id: "canonical",
    category: "onpage",
    weight: 8,
    score: (ctx) => homepageWeightedScore(ctx, (p) => Boolean(p.canonical), 0.7),
  },
  {
    id: "indexable",
    category: "onpage",
    weight: 10,
    score: (ctx) => (getHomepage(ctx)?.isIndexable ? 100 : 0),
  },
  {
    id: "robots-txt",
    category: "onpage",
    weight: 8,
    score: (ctx) => (ctx.robotsTxt ? 100 : 40),
  },
  {
    id: "sitemap",
    category: "onpage",
    weight: 8,
    score: (ctx) => (ctx.sitemapFound ? 100 : 50),
  },
  {
    id: "schema",
    category: "onpage",
    weight: 6,
    score: (ctx) => {
      const home = getHomepage(ctx);
      const present = home?.hasSchema ?? passRate(ctx.pages, (p) => p.hasSchema) > 0;
      if (!present) return 30;
      const validRate = passRate(ctx.pages.filter((p) => p.hasSchema), (p) => p.schemaValid);
      return Math.round(60 + validRate * 40);
    },
  },
  {
    id: "https-redirect",
    category: "onpage",
    weight: 6,
    score: (ctx) => (ctx.httpsEnforced ? 100 : 40),
  },
  {
    id: "www-canonical",
    category: "onpage",
    weight: 4,
    score: (ctx) => (ctx.wwwCanonicalized ? 100 : 50),
  },
  {
    id: "mixed-content",
    category: "onpage",
    weight: 4,
    score: (ctx) => (ctx.pages.some((p) => p.mixedContent) ? 30 : 100),
  },
  {
    id: "lighthouse-seo",
    category: "onpage",
    weight: 18,
    score: (ctx) => ctx.pageSpeed?.seoScore ?? 70,
  },
  {
    id: "duplicate-titles",
    category: "onpage",
    weight: 6,
    score: (ctx) => {
      const seen = new Map<string, number>();
      for (const p of ctx.pages) {
        if (!p.title) continue;
        const key = p.title.toLowerCase().trim();
        seen.set(key, (seen.get(key) ?? 0) + 1);
      }
      const dupes = [...seen.values()].filter((n) => n > 1).length;
      if (dupes === 0) return 100;
      if (dupes === 1) return 70;
      return 40;
    },
  },
  {
    id: "heading-structure",
    category: "onpage",
    weight: 6,
    score: (ctx) => {
      const content = contentPages(ctx.pages);
      if (content.length === 0) return 100;
      return Math.round(passRate(content, (p) => p.h2Count > 0) * 100);
    },
  },
  {
    id: "crawlable-pages",
    category: "onpage",
    weight: 8,
    score: (ctx) => {
      const ok = ctx.pages.filter((p) => p.statusCode > 0 && p.statusCode < 400);
      return Math.round((ok.length / Math.max(ctx.pages.length, 1)) * 100);
    },
  },
  {
    id: "broken-links",
    category: "onpage",
    weight: 10,
    score: (ctx) => {
      if (ctx.brokenInternalLinks === 0) return 100;
      if (ctx.brokenInternalLinks === 1) return 60;
      if (ctx.brokenInternalLinks <= 3) return 35;
      return 10;
    },
  },
  {
    id: "redirect-links",
    category: "onpage",
    weight: 6,
    score: (ctx) => {
      if (ctx.redirectInternalLinks === 0) return 100;
      if (ctx.redirectInternalLinks <= 2) return 70;
      if (ctx.redirectInternalLinks <= 5) return 45;
      return 20;
    },
  },
  {
    id: "internal-linking",
    category: "onpage",
    weight: 8,
    score: (ctx) => {
      const content = contentPages(ctx.pages);
      const sample = content.length > 0 ? content : ctx.pages.filter((p) => p.statusCode < 400);
      if (sample.length === 0) return 50;

      const wellLinkedRate =
        sample.filter((p) => p.internalLinks >= 3).length / sample.length;
      const avgInternal =
        sample.reduce((s, p) => s + Math.min(p.internalLinks, 15), 0) / sample.length;
      const avgScore = Math.min(100, Math.round((avgInternal / 8) * 100));

      return Math.round(wellLinkedRate * 100 * 0.55 + avgScore * 0.45);
    },
  },
  {
    id: "orphan-pages",
    category: "onpage",
    weight: 6,
    score: (ctx) => {
      if (ctx.pages.length <= 1) return 100;
      const orphanRate = ctx.orphanPageCount / ctx.pages.length;
      if (orphanRate === 0) return 100;
      if (orphanRate <= 0.2) return 75;
      if (orphanRate <= 0.4) return 50;
      return 25;
    },
  },
  {
    id: "friendly-anchors",
    category: "onpage",
    weight: 4,
    score: (ctx) => {
      const withGeneric = ctx.pages.filter((p) => p.genericLinkCount > 0).length;
      const ratio = withGeneric / Math.max(ctx.pages.length, 1);
      return Math.round((1 - ratio) * 100);
    },
  },

  // Backlinks (external sites linking to you — SEOptimer-style)
  {
    id: "referring-domains",
    category: "links",
    weight: 40,
    score: (ctx) => scoreBacklinkProfile(ctx.backlinks).referringDomainsScore,
  },
  {
    id: "domain-authority",
    category: "links",
    weight: 35,
    score: (ctx) => scoreBacklinkProfile(ctx.backlinks).domainRankScore,
  },
  {
    id: "backlink-volume",
    category: "links",
    weight: 25,
    score: (ctx) => scoreBacklinkProfile(ctx.backlinks).backlinkVolumeScore,
  },

  // Usability
  {
    id: "viewport",
    category: "usability",
    weight: 18,
    score: (ctx) => homepageWeightedScore(ctx, (p) => p.hasViewport, 0.75),
  },
  {
    id: "lang",
    category: "usability",
    weight: 12,
    score: (ctx) => homepageWeightedScore(ctx, (p) => p.hasLang, 0.7),
  },
  {
    id: "favicon",
    category: "usability",
    weight: 8,
    score: (ctx) => homepageWeightedScore(ctx, (p) => p.hasFavicon, 0.8),
  },
  {
    id: "alt-text",
    category: "usability",
    weight: 14,
    score: (ctx) => {
      let total = 0;
      let missing = 0;
      for (const p of ctx.pages) {
        total += p.imagesWithoutAlt + (p.imagesWithoutAlt === 0 ? 0 : 0);
        missing += p.imagesWithoutAlt;
      }
      // Estimate from pages with images missing alt
      const pagesWithMissing = ctx.pages.filter((p) => p.imagesWithoutAlt > 0);
      if (pagesWithMissing.length === 0) return 100;
      const avgMissing =
        pagesWithMissing.reduce((s, p) => s + p.imagesWithoutAlt, 0) / pagesWithMissing.length;
      if (avgMissing <= 1) return 85;
      if (avgMissing <= 3) return 65;
      return 40;
    },
  },
  {
    id: "no-flash",
    category: "usability",
    weight: 6,
    score: (ctx) => (ctx.pages.some((p) => p.hasFlash) ? 0 : 100),
  },
  {
    id: "iframes",
    category: "usability",
    weight: 6,
    score: (ctx) => {
      const heavy = ctx.pages.filter((p) => p.iframeCount > 3).length;
      return Math.round((1 - heavy / Math.max(ctx.pages.length, 1)) * 100);
    },
  },
  {
    id: "security-headers",
    category: "usability",
    weight: 10,
    score: (ctx) => {
      if (ctx.observatory?.available) return gradeToScore(ctx.observatory.grade);
      const home = getHomepage(ctx);
      if (!home) return 60;
      const sh = home.securityHeaders;
      const checks = [
        sh.hsts && home.isHttps,
        sh.xContentType,
        sh.xFrameOptions || sh.csp,
        sh.referrerPolicy,
      ];
      const passed = checks.filter(Boolean).length;
      return Math.round((passed / checks.length) * 100);
    },
  },
  {
    id: "email-auth",
    category: "onpage",
    weight: 5,
    score: (ctx) => ctx.dns?.emailAuthScore ?? 70,
  },
  {
    id: "html-validity",
    category: "onpage",
    weight: 5,
    score: (ctx) => {
      if (!ctx.w3c) return 75;
      if (ctx.w3c.valid) return 100;
      if (ctx.w3c.errorCount <= 2) return 80;
      if (ctx.w3c.errorCount <= 5) return 60;
      return 40;
    },
  },
  {
    id: "lighthouse-accessibility",
    category: "usability",
    weight: 25,
    score: (ctx) => ctx.pageSpeed?.accessibilityScore ?? 70,
  },
  {
    id: "lighthouse-best-practices",
    category: "usability",
    weight: 15,
    score: (ctx) => ctx.pageSpeed?.bestPracticesScore ?? 70,
  },

  // Performance
  // When Lighthouse is available, it dominates performance with a heavy 60% weight.
  // Without it, our local checks (load-time, compression, page-size) carry the score.
  {
    id: "load-time",
    category: "performance",
    weight: 8,
    score: (ctx) => {
      const home = getHomepage(ctx);
      if (!home || home.loadTimeMs <= 0) return 70;
      const ms = home.loadTimeMs;
      if (ms <= 1500) return 100;
      if (ms <= 2500) return 85;
      if (ms <= 3500) return 65;
      if (ms <= 5000) return 45;
      return 25;
    },
  },
  {
    id: "compression",
    category: "performance",
    weight: 5,
    score: (ctx) => {
      const home = getHomepage(ctx);
      if (!home) return 70;
      return home.compression ? 100 : 60;
    },
  },
  {
    id: "page-size",
    category: "performance",
    weight: 5,
    score: (ctx) => {
      const home = getHomepage(ctx);
      if (!home) return 70;
      const kb = home.htmlSizeBytes / 1024;
      if (kb <= 200) return 100;
      if (kb <= 500) return 85;
      if (kb <= 1000) return 65;
      return 40;
    },
  },
  {
    id: "lighthouse-performance",
    category: "performance",
    weight: 40,
    score: (ctx) => {
      if (!ctx.pageSpeed) return 70; // unknown when no API key
      return ctx.pageSpeed.performanceScore;
    },
  },
  {
    id: "cwv-lcp",
    category: "performance",
    weight: 12,
    score: (ctx) => {
      if (!ctx.pageSpeed?.lcpMs) return 70;
      const lcp = ctx.pageSpeed.lcpMs;
      if (lcp <= 2500) return 100;
      if (lcp <= 4000) return 60;
      return 30;
    },
  },
  {
    id: "cwv-cls",
    category: "performance",
    weight: 8,
    score: (ctx) => {
      if (ctx.pageSpeed?.cls === null || ctx.pageSpeed?.cls === undefined) return 70;
      const cls = ctx.pageSpeed.cls;
      if (cls <= 0.1) return 100;
      if (cls <= 0.25) return 60;
      return 25;
    },
  },
  {
    id: "cwv-inp",
    category: "performance",
    weight: 6,
    score: (ctx) => {
      if (!ctx.pageSpeed?.inpMs) return 70;
      const inp = ctx.pageSpeed.inpMs;
      if (inp <= 200) return 100;
      if (inp <= 500) return 60;
      return 30;
    },
  },
  {
    id: "crux-field-data",
    category: "performance",
    weight: 15,
    score: (ctx) => {
      if (!ctx.crux?.available) return 70;
      const ratings = [ctx.crux.lcp.rating, ctx.crux.cls.rating, ctx.crux.inp.rating];
      const poor = ratings.filter((r) => r === "POOR").length;
      const needs = ratings.filter((r) => r === "NEEDS_IMPROVEMENT").length;
      if (poor >= 2) return 35;
      if (poor === 1) return 55;
      if (needs >= 2) return 65;
      if (needs === 1) return 80;
      const allGood = ratings.every((r) => r === "GOOD");
      return allGood ? 100 : 75;
    },
  },

  // Social
  {
    id: "open-graph",
    category: "social",
    weight: 25,
    score: (ctx) => homepageWeightedScore(ctx, (p) => p.hasSocialTags, 0.8),
  },
  {
    id: "og-image",
    category: "social",
    weight: 15,
    score: (ctx) => homepageWeightedScore(ctx, (p) => Boolean(p.ogImage), 0.8),
  },
  {
    id: "twitter-card",
    category: "social",
    weight: 15,
    score: (ctx) => homepageWeightedScore(ctx, (p) => p.hasTwitterCard, 0.75),
  },
  {
    id: "social-profiles",
    category: "social",
    weight: 10,
    score: (ctx) => {
      const home = getHomepage(ctx);
      if (!home) return 50;
      const hasAny =
        home.hasLinkedInLink ||
        home.hasFacebookLink ||
        home.hasInstagramLink ||
        home.hasYoutubeLink;
      return hasAny ? 100 : 55;
    },
  },
  {
    id: "og-coverage",
    category: "social",
    weight: 15,
    score: (ctx) => Math.round(passRate(ctx.pages, (p) => p.hasSocialTags) * 100),
  },
];

const CATEGORIES: Category[] = ["onpage", "links", "usability", "performance", "social"];

export function calculateCategoryScoresFromChecks(ctx: ScoringContext): Record<Category, number> {
  const scores = {} as Record<Category, number>;

  // Hard failure floors: only drop below 25 if a fundamental check fails
  const home = getHomepage(ctx);
  const hardFailure = !home || home.statusCode >= 500 || (home && !home.isHttps);

  for (const cat of CATEGORIES) {
    const checks = CHECKS.filter((c) => c.category === cat);
    const totalWeight = checks.reduce((s, c) => s + c.weight, 0);
    let weighted =
      checks.reduce((s, c) => s + c.score(ctx) * c.weight, 0) / Math.max(totalWeight, 1);

    // SPA-shell forgiveness: cap on-page deduction to 25 points
    if (ctx.isSpaShell && (cat === "onpage" || cat === "social")) {
      weighted = Math.max(weighted, 60);
    }

    // Apply floor for non-fundamental categories (links excluded — should reflect real issues)
    if (!hardFailure && cat !== "onpage" && cat !== "links") {
      weighted = Math.max(weighted, 25);
    }

    scores[cat] = Math.round(Math.min(100, Math.max(0, weighted)));
  }

  return scores;
}

export function calculateOverallScore(categoryScores: Record<Category, number>): number {
  const values = Object.values(categoryScores);
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

export { CHECKS };
