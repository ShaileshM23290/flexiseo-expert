/**
 * Google PageSpeed Insights v5 client.
 * Uses Lighthouse under the hood — gives us real, Google-authoritative scoring
 * for Performance, Accessibility, Best Practices, and SEO.
 *
 * Get a free key: https://developers.google.com/speed/docs/insights/v5/get-started
 */

export interface LighthouseAuditFinding {
  id: string;
  title: string;
  description: string;
  scoreDisplayMode: string;
  score: number | null;
  displayValue: string | null;
}

export interface LighthouseStrategyResult {
  strategy: "mobile" | "desktop";
  performanceScore: number;
  accessibilityScore: number;
  bestPracticesScore: number;
  seoScore: number;
  lcpMs: number | null;
  cls: number | null;
  inpMs: number | null;
  fcpMs: number | null;
  ttfbMs: number | null;
  tbtMs: number | null;
  speedIndexMs: number | null;
  failedAudits: LighthouseAuditFinding[];
}

export interface PageSpeedResult {
  /** Mobile-first metrics (Google's default) */
  performanceScore: number;
  accessibilityScore: number;
  bestPracticesScore: number;
  seoScore: number;
  lcpMs: number | null;
  cls: number | null;
  inpMs: number | null;
  fcpMs: number | null;
  ttfbMs: number | null;
  /** Both strategies for richer analysis */
  mobile: LighthouseStrategyResult | null;
  desktop: LighthouseStrategyResult | null;
  /** Unified list of significant failed audits across strategies */
  topFailedAudits: LighthouseAuditFinding[];
}

const FETCH_TIMEOUT_MS = 120_000; // PSI can take a while; desktop especially

/** Lighthouse audit IDs we care about, mapped to category for our own categorisation */
const AUDIT_CATEGORY_MAP: Record<string, "performance" | "usability" | "onpage" | "social"> = {
  // Performance
  "render-blocking-resources": "performance",
  "unused-css-rules": "performance",
  "unused-javascript": "performance",
  "modern-image-formats": "performance",
  "uses-optimized-images": "performance",
  "uses-text-compression": "performance",
  "uses-responsive-images": "performance",
  "efficient-animated-content": "performance",
  "duplicated-javascript": "performance",
  "legacy-javascript": "performance",
  "total-byte-weight": "performance",
  "dom-size": "performance",
  "bootup-time": "performance",
  "mainthread-work-breakdown": "performance",
  "third-party-summary": "performance",
  "server-response-time": "performance",
  "offscreen-images": "performance",
  "uses-rel-preconnect": "performance",
  "font-display": "performance",
  // Accessibility / Usability
  "color-contrast": "usability",
  "image-alt": "usability",
  "link-name": "usability",
  "button-name": "usability",
  "label": "usability",
  "tap-targets": "usability",
  "viewport": "usability",
  "font-size": "usability",
  "html-has-lang": "usability",
  "html-lang-valid": "usability",
  "meta-viewport": "usability",
  "aria-required-attr": "usability",
  "aria-valid-attr": "usability",
  "heading-order": "usability",
  // Best Practices (we file under usability)
  "is-on-https": "usability",
  "no-vulnerable-libraries": "usability",
  "csp-xss": "usability",
  "errors-in-console": "usability",
  "image-aspect-ratio": "usability",
  "no-document-write": "usability",
  // SEO
  "document-title": "onpage",
  "meta-description": "onpage",
  "http-status-code": "onpage",
  "link-text": "onpage",
  "crawlable-anchors": "onpage",
  "is-crawlable": "onpage",
  "robots-txt": "onpage",
  "hreflang": "onpage",
  "canonical": "onpage",
  "structured-data": "onpage",
};

function parseAudit(audit: unknown, id: string): LighthouseAuditFinding | null {
  if (!audit || typeof audit !== "object") return null;
  const a = audit as Record<string, unknown>;
  const score = typeof a.score === "number" ? a.score : a.score === null ? null : null;
  const mode = typeof a.scoreDisplayMode === "string" ? a.scoreDisplayMode : "binary";

  // Skip non-actionable modes
  if (mode === "notApplicable" || mode === "manual" || mode === "informative") return null;

  return {
    id,
    title: typeof a.title === "string" ? a.title : id,
    description: typeof a.description === "string" ? a.description : "",
    scoreDisplayMode: mode,
    score,
    displayValue: typeof a.displayValue === "string" ? a.displayValue : null,
  };
}

async function runStrategy(
  url: string,
  apiKey: string,
  strategy: "mobile" | "desktop"
): Promise<LighthouseStrategyResult | null> {
  try {
    const params = new URLSearchParams({ url, key: apiKey, strategy });
    params.append("category", "performance");
    params.append("category", "accessibility");
    params.append("category", "best-practices");
    params.append("category", "seo");

    const res = await fetch(
      `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params}`,
      {
        next: { revalidate: 0 },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      }
    );
    if (!res.ok) {
      console.warn(`[PageSpeed:${strategy}] HTTP ${res.status}`);
      return null;
    }

    const data = await res.json();
    const cats = data.lighthouseResult?.categories ?? {};
    const audits = data.lighthouseResult?.audits ?? {};

    const metric = (id: string): number | null => {
      const v = audits[id]?.numericValue;
      return typeof v === "number" ? Math.round(v) : null;
    };

    const failedAudits: LighthouseAuditFinding[] = [];
    for (const [id, auditData] of Object.entries(audits)) {
      const parsed = parseAudit(auditData, id);
      if (!parsed) continue;
      if (parsed.score === null || parsed.score >= 0.9) continue;
      // Keep only audits we have a category mapping for OR that scored badly across the board
      if (AUDIT_CATEGORY_MAP[id] || parsed.score < 0.5) {
        failedAudits.push(parsed);
      }
    }
    failedAudits.sort((a, b) => (a.score ?? 1) - (b.score ?? 1));

    return {
      strategy,
      performanceScore: Math.round((cats.performance?.score ?? 0) * 100),
      accessibilityScore: Math.round((cats.accessibility?.score ?? 0) * 100),
      bestPracticesScore: Math.round((cats["best-practices"]?.score ?? 0) * 100),
      seoScore: Math.round((cats.seo?.score ?? 0) * 100),
      lcpMs: metric("largest-contentful-paint"),
      cls: typeof audits["cumulative-layout-shift"]?.numericValue === "number"
        ? audits["cumulative-layout-shift"].numericValue
        : null,
      inpMs: metric("interaction-to-next-paint") ?? metric("experimental-interaction-to-next-paint"),
      fcpMs: metric("first-contentful-paint"),
      ttfbMs: metric("server-response-time"),
      tbtMs: metric("total-blocking-time"),
      speedIndexMs: metric("speed-index"),
      failedAudits,
    };
  } catch (err) {
    console.warn(`[PageSpeed:${strategy}] failed:`, err instanceof Error ? err.message : err);
    return null;
  }
}

export async function fetchPageSpeedInsights(url: string): Promise<PageSpeedResult | null> {
  const apiKey = process.env.PAGESPEED_API_KEY;
  if (!apiKey) return null;

  const includeDesktop = process.env.PAGESPEED_DESKTOP === "true";

  // Mobile is Google's primary signal; desktop doubles API time (~2 min on serverless).
  const [mobile, desktop] = await Promise.all([
    runStrategy(url, apiKey, "mobile"),
    includeDesktop ? runStrategy(url, apiKey, "desktop") : Promise.resolve(null),
  ]);

  if (!mobile && !desktop) return null;

  // Prefer mobile as the headline scores (Google does the same)
  const primary = mobile ?? desktop!;

  // Merge top failed audits across strategies, dedup by id, prioritise the worst score
  const merged = new Map<string, LighthouseAuditFinding>();
  for (const a of [...(mobile?.failedAudits ?? []), ...(desktop?.failedAudits ?? [])]) {
    const existing = merged.get(a.id);
    if (!existing || (a.score ?? 1) < (existing.score ?? 1)) merged.set(a.id, a);
  }
  const topFailedAudits = [...merged.values()]
    .sort((a, b) => (a.score ?? 1) - (b.score ?? 1))
    .slice(0, 25);

  return {
    performanceScore: primary.performanceScore,
    accessibilityScore: primary.accessibilityScore,
    bestPracticesScore: primary.bestPracticesScore,
    seoScore: primary.seoScore,
    lcpMs: primary.lcpMs,
    cls: primary.cls,
    inpMs: primary.inpMs,
    fcpMs: primary.fcpMs,
    ttfbMs: primary.ttfbMs,
    mobile,
    desktop,
    topFailedAudits,
  };
}

export { AUDIT_CATEGORY_MAP };
