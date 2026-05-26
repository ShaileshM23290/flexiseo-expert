import * as cheerio from "cheerio";
import type { Category } from "../config";
import { AUDIT_CATEGORY_MAP, type LighthouseAuditFinding, type PageSpeedResult } from "./pagespeed";

export interface SecurityHeaders {
  hsts: boolean;
  csp: boolean;
  xContentType: boolean;
  xFrameOptions: boolean;
  referrerPolicy: boolean;
  permissionsPolicy: boolean;
}

export interface PageSignals {
  url: string;
  title: string | null;
  metaDescription: string | null;
  h1: string | null;
  h1Count: number;
  h2Count: number;
  h3Count: number;
  wordCount: number;
  canonical: string | null;
  isIndexable: boolean;
  hasSocialTags: boolean;
  hasSchema: boolean;
  schemaValid: boolean;
  statusCode: number;
  loadTimeMs: number;
  htmlSizeBytes: number;
  hasViewport: boolean;
  hasLang: boolean;
  hasHreflang: boolean;
  hreflangCount: number;
  hasFavicon: boolean;
  isHttps: boolean;
  imageCount: number;
  imagesWithoutAlt: number;
  internalLinks: number;
  externalLinks: number;
  internalLinkTargets: string[];
  genericLinkCount: number;
  iframeCount: number;
  scriptCount: number;
  hasFlash: boolean;
  hasLinkedInLink: boolean;
  hasFacebookLink: boolean;
  hasInstagramLink: boolean;
  hasYoutubeLink: boolean;
  hasEmailPlaintext: boolean;
  compression: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  hasTwitterCard: boolean;
  schemaTypes: string[];
  isHomepage?: boolean;
  // New signals
  xRobotsNoindex: boolean;
  mixedContent: boolean;
  looksLikeSpaShell: boolean;
  securityHeaders: SecurityHeaders;
  responseHeaders: Record<string, string>;
}

export interface DetectedIssue {
  /** Stable key used to group identical findings across pages */
  key: string;
  category: Category;
  severity: "critical" | "warning" | "notice";
  title: string;
  description: string;
  recommendation: string;
  affectedUrl: string;
}

export interface IssueGroup {
  key: string;
  category: Category;
  severity: "critical" | "warning" | "notice";
  title: string;
  description: string;
  recommendation: string;
  affectedUrls: string[];
  count: number;
}

export function groupIssues(issues: DetectedIssue[]): IssueGroup[] {
  const map = new Map<string, IssueGroup>();
  for (const issue of issues) {
    const existing = map.get(issue.key);
    if (existing) {
      if (!existing.affectedUrls.includes(issue.affectedUrl)) {
        existing.affectedUrls.push(issue.affectedUrl);
      }
      existing.count += 1;
      const order = { critical: 0, warning: 1, notice: 2 } as const;
      if (order[issue.severity] < order[existing.severity]) {
        existing.severity = issue.severity;
      }
    } else {
      map.set(issue.key, {
        key: issue.key,
        category: issue.category,
        severity: issue.severity,
        title: issue.title,
        description: issue.description,
        recommendation: issue.recommendation,
        affectedUrls: [issue.affectedUrl],
        count: 1,
      });
    }
  }
  const order = { critical: 0, warning: 1, notice: 2 } as const;
  return [...map.values()].sort((a, b) => {
    if (order[a.severity] !== order[b.severity]) return order[a.severity] - order[b.severity];
    return b.affectedUrls.length - a.affectedUrls.length;
  });
}

const GENERIC_LINK_TEXT = /^(click here|read more|learn more|here|more|link)$/i;

export function normalizeInternalUrl(href: string, pageUrl: string): string | null {
  try {
    const u = new URL(href, pageUrl);
    u.hash = "";
    if (u.pathname.length > 1 && u.pathname.endsWith("/")) {
      u.pathname = u.pathname.slice(0, -1);
    }
    return u.toString();
  } catch {
    return null;
  }
}

export function sameSiteHost(a: string, b: string): boolean {
  try {
    return (
      new URL(a).hostname.replace(/^www\./, "").toLowerCase() ===
      new URL(b).hostname.replace(/^www\./, "").toLowerCase()
    );
  } catch {
    return false;
  }
}

export function extractPageSignals(
  url: string,
  html: string,
  statusCode: number,
  loadTimeMs: number,
  headers?: Headers
): PageSignals {
  const $ = cheerio.load(html);
  const title = $("title").first().text().trim() || null;
  const metaDescription =
    $('meta[name="description"]').attr("content")?.trim() ||
    $('meta[property="og:description"]').attr("content")?.trim() ||
    null;
  const h1Elements = $("h1");
  const h1 = h1Elements.first().text().trim() || null;
  const h2Count = $("h2").length;
  const h3Count = $("h3").length;
  const bodyText = $("body").text().replace(/\s+/g, " ").trim();
  const wordCount = bodyText ? bodyText.split(" ").filter(Boolean).length : 0;
  const canonical = $('link[rel="canonical"]').attr("href")?.trim() || null;
  const robotsMeta = $('meta[name="robots"]').attr("content")?.toLowerCase() ?? "";
  const isIndexable = !robotsMeta.includes("noindex");
  const ogTitle = $('meta[property="og:title"]').attr("content")?.trim() || null;
  const ogDescription = $('meta[property="og:description"]').attr("content")?.trim() || null;
  const ogImage = $('meta[property="og:image"]').attr("content")?.trim() || null;
  const hasSocialTags = Boolean(ogTitle && ogDescription);
  const hasTwitterCard = Boolean(
    $('meta[name="twitter:card"]').attr("content")?.trim() ||
      $('meta[name="twitter:title"]').attr("content")?.trim()
  );
  const schemaScripts = $('script[type="application/ld+json"]');
  const schemaTypes: string[] = [];
  schemaScripts.each((_, el) => {
    try {
      const json = JSON.parse($(el).html() ?? "");
      if (json["@type"]) schemaTypes.push(String(json["@type"]));
      if (Array.isArray(json["@graph"])) {
        json["@graph"].forEach((item: { "@type"?: string }) => {
          if (item["@type"]) schemaTypes.push(String(item["@type"]));
        });
      }
    } catch {
      /* ignore */
    }
  });
  let schemaValid = false;
  schemaScripts.each((_, el) => {
    try {
      const raw = $(el).html() ?? "";
      const json = JSON.parse(raw);
      if (json && (json["@context"] || (Array.isArray(json["@graph"]) && json["@graph"][0]?.["@context"]))) {
        schemaValid = true;
      }
    } catch {
      /* ignore */
    }
  });
  const hasSchema = schemaTypes.length > 0;
  const hasViewport = $('meta[name="viewport"]').length > 0;
  const hasLang = Boolean($("html").attr("lang"));
  const hreflangLinks = $('link[rel="alternate"][hreflang]');
  const hasHreflang = hreflangLinks.length > 0;
  const hreflangCount = hreflangLinks.length;
  const hasFavicon = $('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]').length > 0;
  const isHttps = url.startsWith("https://");

  let imageCount = 0;
  let imagesWithoutAlt = 0;
  $("img").each((_, el) => {
    imageCount++;
    const alt = $(el).attr("alt");
    if (alt === undefined || alt === null) imagesWithoutAlt++;
  });

  const baseHost = new URL(url).hostname;
  let internalLinks = 0;
  let externalLinks = 0;
  let genericLinkCount = 0;
  const internalLinkTargets: string[] = [];
  const htmlLower = html.toLowerCase();

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    const text = $(el).text().trim();
    if (GENERIC_LINK_TEXT.test(text)) genericLinkCount++;
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:"))
      return;
    try {
      const linkUrl = new URL(href, url);
      if (linkUrl.hostname.replace(/^www\./, "") === baseHost.replace(/^www\./, "")) {
        internalLinks++;
        const normalized = normalizeInternalUrl(href, url);
        if (normalized) internalLinkTargets.push(normalized);
      } else {
        externalLinks++;
      }
    } catch {
      /* ignore */
    }
  });

  const iframeCount = $("iframe").length;
  const scriptCount = $("script").length;
  const hasFlash = htmlLower.includes("<object") || htmlLower.includes("application/x-shockwave-flash");
  const hasEmailPlaintext = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(bodyText);

  // Mixed content: HTTPS page including http:// subresources
  const mixedContent =
    isHttps &&
    (/<(?:img|script|link|iframe|source|video|audio)[^>]+(?:src|href)=["']http:\/\//i.test(html));

  // SPA shell heuristic: very low body text + known root divs / heavy script count
  const looksLikeSpaShell =
    wordCount < 80 &&
    (/<div[^>]+id=["'](?:root|__next|app|__nuxt|svelte)["']/i.test(html) || scriptCount >= 5);

  const socialPatterns = {
    linkedin: /linkedin\.com\/(?:in|company|school)/i,
    facebook: /facebook\.com\/(?!sharer|share)[^"'\s<>]+/i,
    instagram: /instagram\.com\/[^"'\s<>]+/i,
    youtube: /youtube\.com\/(?:c|channel|user|@)/i,
  };

  let compression: string | null = null;
  let xRobotsNoindex = false;
  const responseHeaders: Record<string, string> = {};
  const securityHeaders: SecurityHeaders = {
    hsts: false,
    csp: false,
    xContentType: false,
    xFrameOptions: false,
    referrerPolicy: false,
    permissionsPolicy: false,
  };

  if (headers) {
    const enc = headers.get("content-encoding")?.toLowerCase();
    if (enc?.includes("br")) compression = "brotli";
    else if (enc?.includes("gzip")) compression = "gzip";
    else if (enc?.includes("zstd")) compression = "zstd";

    const xRobots = headers.get("x-robots-tag")?.toLowerCase() ?? "";
    if (xRobots.includes("noindex")) xRobotsNoindex = true;

    securityHeaders.hsts = headers.has("strict-transport-security");
    securityHeaders.csp = headers.has("content-security-policy");
    securityHeaders.xContentType =
      headers.get("x-content-type-options")?.toLowerCase() === "nosniff";
    securityHeaders.xFrameOptions = headers.has("x-frame-options");
    securityHeaders.referrerPolicy = headers.has("referrer-policy");
    securityHeaders.permissionsPolicy = headers.has("permissions-policy");

    for (const [k, v] of headers.entries()) {
      responseHeaders[k.toLowerCase()] = v;
    }
  }

  return {
    url,
    title,
    metaDescription,
    h1,
    h1Count: h1Elements.length,
    h2Count,
    h3Count,
    wordCount,
    canonical,
    isIndexable: isIndexable && !xRobotsNoindex,
    hasSocialTags,
    hasSchema,
    schemaValid,
    statusCode,
    loadTimeMs,
    htmlSizeBytes: Buffer.byteLength(html, "utf8"),
    hasViewport,
    hasLang,
    hasHreflang,
    hreflangCount,
    hasFavicon,
    isHttps,
    imageCount,
    imagesWithoutAlt,
    internalLinks,
    externalLinks,
    internalLinkTargets,
    genericLinkCount,
    iframeCount,
    scriptCount,
    hasFlash,
    hasLinkedInLink: socialPatterns.linkedin.test(html),
    hasFacebookLink: socialPatterns.facebook.test(html),
    hasInstagramLink: socialPatterns.instagram.test(html),
    hasYoutubeLink: socialPatterns.youtube.test(html),
    hasEmailPlaintext,
    compression,
    ogTitle,
    ogDescription,
    ogImage,
    hasTwitterCard,
    schemaTypes,
    xRobotsNoindex,
    mixedContent,
    looksLikeSpaShell,
    securityHeaders,
    responseHeaders,
  };
}

function isHomepageUrl(url: string): boolean {
  try {
    const path = new URL(url).pathname.replace(/\/$/, "") || "/";
    return path === "/";
  } catch {
    return false;
  }
}

type IssueInput = Omit<DetectedIssue, "affectedUrl"> & { affectedUrl: string };
function mkIssue(input: IssueInput): DetectedIssue {
  return input;
}

export function analyzePage(signals: PageSignals): DetectedIssue[] {
  const issues: DetectedIssue[] = [];
  const url = signals.url;
  const isHomepage = isHomepageUrl(url);
  const isSpaShell = signals.looksLikeSpaShell;

  if (!signals.isHttps) {
    issues.push(mkIssue({
      key: "ssl-not-enabled", category: "onpage", severity: "critical",
      title: "SSL not enabled",
      description: "Page is not served over HTTPS.",
      recommendation: "Enable SSL and redirect all HTTP traffic to HTTPS.",
      affectedUrl: url,
    }));
  }

  if (!signals.title) {
    issues.push(mkIssue({
      key: "missing-title", category: "onpage", severity: "critical",
      title: "Missing page title",
      description: "This page has no title tag.",
      recommendation: "Add a unique title between 10 and 70 characters.",
      affectedUrl: url,
    }));
  } else if (signals.title.length < 10) {
    issues.push(mkIssue({
      key: "title-too-short", category: "onpage", severity: isHomepage ? "notice" : "warning",
      title: "Title tag too short",
      description: `Title is only ${signals.title.length} characters (optimal: 10–70).`,
      recommendation: "Expand the title with primary keywords and brand context.",
      affectedUrl: url,
    }));
  } else if (signals.title.length > 70) {
    issues.push(mkIssue({
      key: "title-too-long", category: "onpage", severity: "notice",
      title: "Title tag too long",
      description: `Title is ${signals.title.length} characters and may truncate in SERPs.`,
      recommendation: "Shorten the title to under 70 characters.",
      affectedUrl: url,
    }));
  }

  if (!signals.metaDescription && !isSpaShell) {
    issues.push(mkIssue({
      key: "meta-description-missing", category: "onpage",
      severity: isHomepage ? "warning" : "critical",
      title: "Meta description missing",
      description: "No meta description tag found.",
      recommendation: "Add a 120–160 character meta description with a clear value proposition.",
      affectedUrl: url,
    }));
  } else if (signals.metaDescription && signals.metaDescription.length < 70) {
    issues.push(mkIssue({
      key: "meta-description-short", category: "onpage", severity: "warning",
      title: "Meta description too short",
      description: `Meta description is ${signals.metaDescription.length} chars.`,
      recommendation: "Expand to 120–160 characters.",
      affectedUrl: url,
    }));
  }

  if (signals.h1Count === 0 && !isSpaShell) {
    issues.push(mkIssue({
      key: "missing-h1", category: "onpage",
      severity: isHomepage ? "notice" : "critical",
      title: "Missing H1 tag",
      description: "No H1 heading found.",
      recommendation: "Add one descriptive H1 per page.",
      affectedUrl: url,
    }));
  } else if (signals.h1Count > 1) {
    issues.push(mkIssue({
      key: "multiple-h1", category: "onpage", severity: "warning",
      title: "Multiple H1 tags",
      description: `Found ${signals.h1Count} H1 elements.`,
      recommendation: "Use a single H1; structure subtopics with H2–H6.",
      affectedUrl: url,
    }));
  }

  if (signals.h2Count === 0 && signals.wordCount > 300) {
    issues.push(mkIssue({
      key: "no-h2", category: "onpage", severity: "warning",
      title: "Poor header tag usage",
      description: "Content page has no H2 subheadings.",
      recommendation: "Break content into sections with H2/H3 headings.",
      affectedUrl: url,
    }));
  }

  if (!isHomepage && !isSpaShell && signals.wordCount < 300 && signals.wordCount > 0) {
    issues.push(mkIssue({
      key: "low-content", category: "onpage", severity: "warning",
      title: "Low content amount",
      description: `Only ${signals.wordCount} words detected.`,
      recommendation: "Add substantive content that covers the topic in depth.",
      affectedUrl: url,
    }));
  }

  if (!signals.isIndexable) {
    issues.push(mkIssue({
      key: "noindex", category: "onpage", severity: "critical",
      title: "Noindex tag detected",
      description: signals.xRobotsNoindex
        ? "Page is blocked via X-Robots-Tag header."
        : "Page is blocked from search engine indexing.",
      recommendation: "Remove noindex if this page should rank.",
      affectedUrl: url,
    }));
  }

  if (!signals.canonical) {
    issues.push(mkIssue({
      key: "missing-canonical", category: "onpage", severity: "warning",
      title: "Missing canonical tag",
      description: "No canonical URL specified.",
      recommendation: "Add a self-referencing canonical link element.",
      affectedUrl: url,
    }));
  }

  if (!signals.hasSchema) {
    issues.push(mkIssue({
      key: "no-schema", category: "onpage", severity: "notice",
      title: "Schema.org structured data missing",
      description: "No JSON-LD structured data found.",
      recommendation: "Add Organization, WebPage, or relevant schema markup.",
      affectedUrl: url,
    }));
  } else if (signals.hasSchema && !signals.schemaValid) {
    issues.push(mkIssue({
      key: "invalid-schema", category: "onpage", severity: "warning",
      title: "Structured data has parse errors",
      description: "JSON-LD blocks present but missing @context or invalid.",
      recommendation: "Validate with Google's Rich Results Test and fix JSON-LD syntax.",
      affectedUrl: url,
    }));
  }

  if (signals.mixedContent) {
    issues.push(mkIssue({
      key: "mixed-content", category: "onpage", severity: "warning",
      title: "Mixed HTTP/HTTPS content",
      description: "Page loads insecure HTTP subresources over an HTTPS connection.",
      recommendation: "Update all image, script, and link URLs to https://.",
      affectedUrl: url,
    }));
  }

  if (signals.genericLinkCount > 2) {
    issues.push(mkIssue({
      key: "generic-anchors", category: "onpage",
      severity: signals.genericLinkCount > 6 ? "warning" : "notice",
      title: "Unfriendly link text",
      description: `${signals.genericLinkCount} link(s) use generic anchor text like "click here".`,
      recommendation: "Use descriptive anchor text that explains the destination.",
      affectedUrl: url,
    }));
  }

  if (signals.internalLinks < 3 && signals.wordCount > 200) {
    issues.push(mkIssue({
      key: "low-internal-linking", category: "onpage", severity: "notice",
      title: "Low internal linking",
      description: `Only ${signals.internalLinks} internal link(s) on this page.`,
      recommendation: "Add contextual links to related pages.",
      affectedUrl: url,
    }));
  }

  if (!signals.hasViewport) {
    issues.push(mkIssue({
      key: "no-viewport", category: "usability",
      severity: isHomepage ? "warning" : "critical",
      title: "Mobile viewport not set",
      description: "Missing viewport meta tag for mobile rendering.",
      recommendation: 'Add <meta name="viewport" content="width=device-width, initial-scale=1">.',
      affectedUrl: url,
    }));
  }

  if (!signals.hasLang) {
    issues.push(mkIssue({
      key: "no-lang", category: "usability", severity: "warning",
      title: "Lang attribute missing",
      description: "HTML element has no lang attribute.",
      recommendation: 'Add lang="en" (or appropriate language).',
      affectedUrl: url,
    }));
  }

  if (!signals.hasFavicon) {
    issues.push(mkIssue({
      key: "no-favicon", category: "usability", severity: "notice",
      title: "Favicon not detected",
      description: "No favicon link found in the page head.",
      recommendation: "Add a favicon for brand recognition in browser tabs.",
      affectedUrl: url,
    }));
  }

  if (signals.imagesWithoutAlt > 0 && signals.imageCount > 0) {
    const ratio = signals.imagesWithoutAlt / signals.imageCount;
    issues.push(mkIssue({
      key: "missing-alt", category: "usability",
      severity: ratio > 0.5 ? "warning" : "notice",
      title: "Images missing alt attributes",
      description: `${signals.imagesWithoutAlt} of ${signals.imageCount} images lack alt text.`,
      recommendation: "Add descriptive alt text to meaningful images; alt=\"\" for decorative.",
      affectedUrl: url,
    }));
  }

  if (signals.iframeCount > 2) {
    issues.push(mkIssue({
      key: "heavy-iframes", category: "usability", severity: "notice",
      title: "Heavy iframe usage",
      description: `${signals.iframeCount} iframes detected which can affect usability.`,
      recommendation: "Reduce iframe usage or lazy-load embedded content.",
      affectedUrl: url,
    }));
  }

  if (signals.hasFlash) {
    issues.push(mkIssue({
      key: "flash", category: "usability", severity: "critical",
      title: "Flash content detected",
      description: "Flash is deprecated and not supported by modern browsers.",
      recommendation: "Replace Flash with HTML5 alternatives.",
      affectedUrl: url,
    }));
  }

  if (signals.hasEmailPlaintext) {
    issues.push(mkIssue({
      key: "plain-email", category: "usability", severity: "notice",
      title: "Email address exposed in plain text",
      description: "Email visible in page content may attract spam.",
      recommendation: "Use a contact form or obfuscate email addresses.",
      affectedUrl: url,
    }));
  }

  if (signals.loadTimeMs > 2000) {
    issues.push(mkIssue({
      key: "slow-load", category: "performance",
      severity: signals.loadTimeMs > 3500 ? "warning" : "notice",
      title: "Slow page load speed",
      description: `Page loaded in ${(signals.loadTimeMs / 1000).toFixed(1)}s.`,
      recommendation: "Optimize images, enable caching, and reduce blocking resources.",
      affectedUrl: url,
    }));
  }

  if (signals.htmlSizeBytes > 500_000) {
    issues.push(mkIssue({
      key: "large-html", category: "performance", severity: "warning",
      title: "Large page download size",
      description: `HTML payload is ${Math.round(signals.htmlSizeBytes / 1024)}KB.`,
      recommendation: "Reduce page weight by minifying HTML/CSS/JS and optimizing assets.",
      affectedUrl: url,
    }));
  }

  if (!signals.compression) {
    issues.push(mkIssue({
      key: "no-compression", category: "performance", severity: "notice",
      title: "Compression not detected",
      description: "No gzip/brotli compression detected on HTML response.",
      recommendation: "Enable Brotli or Gzip compression on your web server.",
      affectedUrl: url,
    }));
  }

  if (!signals.hasSocialTags) {
    issues.push(mkIssue({
      key: "no-og", category: "social", severity: isHomepage ? "warning" : "notice",
      title: "Incomplete Open Graph tags",
      description: "Missing og:title or og:description.",
      recommendation: "Add complete Open Graph tags for social sharing.",
      affectedUrl: url,
    }));
  }

  if (signals.hasSocialTags && !signals.ogImage) {
    issues.push(mkIssue({
      key: "no-og-image", category: "social", severity: "warning",
      title: "Missing og:image",
      description: "Social shares may lack a preview image.",
      recommendation: "Add og:image (recommended 1200×630px).",
      affectedUrl: url,
    }));
  }

  if (!signals.hasTwitterCard) {
    issues.push(mkIssue({
      key: "no-twitter-card", category: "social", severity: "notice",
      title: "X (Twitter) Card tags missing",
      description: "No twitter:card meta tags found.",
      recommendation: "Add Twitter Card meta tags.",
      affectedUrl: url,
    }));
  }

  if (signals.statusCode >= 400) {
    issues.push(mkIssue({
      key: `http-${signals.statusCode}`, category: "onpage", severity: "critical",
      title: `HTTP ${signals.statusCode} error`,
      description: `Page returned status ${signals.statusCode}.`,
      recommendation: "Fix the broken URL or update links pointing here.",
      affectedUrl: url,
    }));
  }

  // Homepage-only: security header checks
  if (isHomepage) {
    const sh = signals.securityHeaders;
    if (!sh.hsts && signals.isHttps) {
      issues.push(mkIssue({
        key: "no-hsts", category: "usability", severity: "notice",
        title: "HSTS header missing",
        description: "Strict-Transport-Security header not set.",
        recommendation: "Add Strict-Transport-Security: max-age=31536000; includeSubDomains.",
        affectedUrl: url,
      }));
    }
    if (!sh.xContentType) {
      issues.push(mkIssue({
        key: "no-xcto", category: "usability", severity: "notice",
        title: "X-Content-Type-Options header missing",
        description: "Header not set to nosniff.",
        recommendation: "Add X-Content-Type-Options: nosniff.",
        affectedUrl: url,
      }));
    }
    if (!sh.xFrameOptions && !sh.csp) {
      issues.push(mkIssue({
        key: "no-frame-protection", category: "usability", severity: "notice",
        title: "Clickjacking protection missing",
        description: "No X-Frame-Options or CSP frame-ancestors directive.",
        recommendation: "Add X-Frame-Options: SAMEORIGIN or Content-Security-Policy frame-ancestors.",
        affectedUrl: url,
      }));
    }
  }

  if (isSpaShell && isHomepage) {
    issues.push(mkIssue({
      key: "spa-shell", category: "performance", severity: "notice",
      title: "JavaScript-rendered site detected",
      description: "Homepage HTML contains very little content — site renders client-side. Some SEO checks may underestimate content quality.",
      recommendation: "Add server-side rendering, prerendering, or SSG so crawlers see meaningful HTML.",
      affectedUrl: url,
    }));
  }

  return issues;
}

export function analyzePageSpeed(baseUrl: string, ps: PageSpeedResult): DetectedIssue[] {
  const issues: DetectedIssue[] = [];

  if (ps.performanceScore < 50) {
    issues.push(mkIssue({
      key: "pagespeed-poor", category: "performance", severity: "critical",
      title: "Poor Core Web Vitals / PageSpeed score",
      description: `Google PageSpeed performance score: ${ps.performanceScore}/100.`,
      recommendation: "Improve LCP, reduce CLS, and optimize JavaScript delivery.",
      affectedUrl: baseUrl,
    }));
  } else if (ps.performanceScore < 90) {
    issues.push(mkIssue({
      key: "pagespeed-improve", category: "performance", severity: "warning",
      title: "PageSpeed score needs improvement",
      description: `Mobile PageSpeed performance: ${ps.performanceScore}/100.`,
      recommendation: "Address render-blocking resources and image optimization.",
      affectedUrl: baseUrl,
    }));
  }

  if (ps.lcpMs && ps.lcpMs > 2500) {
    issues.push(mkIssue({
      key: "cwv-lcp", category: "performance", severity: ps.lcpMs > 4000 ? "critical" : "warning",
      title: "Largest Contentful Paint too slow",
      description: `LCP is ${(ps.lcpMs / 1000).toFixed(1)}s (target: under 2.5s).`,
      recommendation: "Optimize hero images and server response time.",
      affectedUrl: baseUrl,
    }));
  }

  if (ps.cls !== null && ps.cls > 0.1) {
    issues.push(mkIssue({
      key: "cwv-cls", category: "performance", severity: ps.cls > 0.25 ? "critical" : "warning",
      title: "Cumulative Layout Shift too high",
      description: `CLS is ${ps.cls.toFixed(3)} (target: under 0.1).`,
      recommendation: "Set explicit dimensions on images and avoid layout-shifting ads.",
      affectedUrl: baseUrl,
    }));
  }

  if (ps.inpMs && ps.inpMs > 200) {
    issues.push(mkIssue({
      key: "cwv-inp", category: "performance", severity: ps.inpMs > 500 ? "warning" : "notice",
      title: "Interaction to Next Paint too slow",
      description: `INP is ${ps.inpMs}ms (target: under 200ms).`,
      recommendation: "Reduce JavaScript execution and break up long tasks.",
      affectedUrl: baseUrl,
    }));
  }

  if (ps.accessibilityScore && ps.accessibilityScore < 90) {
    issues.push(mkIssue({
      key: "lh-a11y", category: "usability",
      severity: ps.accessibilityScore < 70 ? "warning" : "notice",
      title: "Accessibility issues detected",
      description: `Lighthouse accessibility score: ${ps.accessibilityScore}/100.`,
      recommendation: "Fix color contrast, ARIA labels, and form labels per Lighthouse audit.",
      affectedUrl: baseUrl,
    }));
  }

  if (ps.bestPracticesScore && ps.bestPracticesScore < 90) {
    issues.push(mkIssue({
      key: "lh-best-practices", category: "usability",
      severity: ps.bestPracticesScore < 70 ? "warning" : "notice",
      title: "Best Practices issues detected",
      description: `Lighthouse best-practices score: ${ps.bestPracticesScore}/100.`,
      recommendation: "Address HTTPS, vulnerable libraries, console errors, and CSP per Lighthouse.",
      affectedUrl: baseUrl,
    }));
  }

  if (ps.seoScore && ps.seoScore < 90) {
    issues.push(mkIssue({
      key: "lh-seo", category: "onpage",
      severity: ps.seoScore < 70 ? "warning" : "notice",
      title: "Lighthouse SEO score below 90",
      description: `Lighthouse SEO score: ${ps.seoScore}/100.`,
      recommendation: "Resolve crawlability, meta tag, and structured-data issues flagged by Lighthouse.",
      affectedUrl: baseUrl,
    }));
  }

  // Lighthouse audits we deliberately skip — our own rule-based analyzer covers them
  // (and emits cleaner, more contextual titles).
  const SUPPRESSED_LH_AUDITS = new Set([
    "document-title",          // we have "Missing page title"
    "meta-description",        // we have "Meta description missing"
    "is-on-https",             // we have "SSL not enabled"
    "viewport",                // we have "Mobile viewport not set"
    "meta-viewport",
    "html-has-lang",           // we have "Lang attribute missing"
    "html-lang-valid",
    "canonical",               // we have "Missing canonical tag"
    "robots-txt",              // we have "Robots.txt missing or inaccessible"
    "is-crawlable",
    "crawlable-anchors",
    "image-alt",               // we have "Images missing alt attributes"
    "http-status-code",        // we have HTTP status checks
    "hreflang",
    "link-text",               // we have "Unfriendly link text"
    "structured-data",         // we have schema checks
    // Pure-informational diagnostics with no clear fix
    "network-dependency-tree-insight",
    "network-dependency-tree",
    "lcp-discovery-insight",
    "critical-request-chains",
    "resource-summary",
    "third-party-summary",
    "diagnostics",
    "metrics",
    "screenshot-thumbnails",
    "final-screenshot",
    "main-thread-tasks",
    "user-timings",
    "network-requests",
    "network-rtt",
    "network-server-latency",
    "bootup-time-insight",
    "lcp-discovery",
    "render-blocking-insight",
    "third-parties-insight",
    "viewport-insight",
    "document-latency-insight",
    "forced-reflow-insight",
    "interaction-to-next-paint-insight",
    // Metric audits — we emit our own cleaner LCP/CLS/INP issues
    "largest-contentful-paint",
    "cumulative-layout-shift",
    "interaction-to-next-paint",
    "first-contentful-paint",
    "speed-index",
    "total-blocking-time",
    "max-potential-fid",
    "experimental-interaction-to-next-paint",
    "server-response-time",
    "interactive",
  ]);

  // Convert specific failed Lighthouse audits into individual, actionable issues.
  // Severity is conservative — only score 0 with real impact = critical.
  let lhIssuesAdded = 0;
  for (const audit of ps.topFailedAudits) {
    if (SUPPRESSED_LH_AUDITS.has(audit.id)) continue;
    if (lhIssuesAdded >= 15) break; // cap to keep the report digestible

    const category = AUDIT_CATEGORY_MAP[audit.id] ?? "performance";
    const score = audit.score ?? 0;
    const severity: DetectedIssue["severity"] =
      score === 0 && lighthouseHighImpact(audit.id)
        ? "critical"
        : score < 0.5
          ? "warning"
          : "notice";

    issues.push(mkIssue({
      key: `lh-${audit.id}`,
      category,
      severity,
      title: cleanAuditTitle(audit.title),
      description: audit.displayValue
        ? `${stripMarkdown(audit.description).slice(0, 260)} (Current: ${audit.displayValue})`
        : stripMarkdown(audit.description).slice(0, 300),
      recommendation: lighthouseFixHint(audit.id) ?? "See Lighthouse documentation for remediation steps.",
      affectedUrl: baseUrl,
    }));
    lhIssuesAdded++;
  }

  return issues;
}

function cleanAuditTitle(title: string): string {
  return stripMarkdown(title).replace(/\s+/g, " ").trim();
}

/** Lighthouse audits that genuinely indicate critical-impact problems when score=0 */
function lighthouseHighImpact(id: string): boolean {
  return [
    "color-contrast",
    "render-blocking-resources",
    "uses-text-compression",
    "no-vulnerable-libraries",
    "csp-xss",
    "errors-in-console",
    "server-response-time",
    "tap-targets",
    "font-size",
    "modern-image-formats",
    "uses-optimized-images",
  ].includes(id);
}

function stripMarkdown(s: string): string {
  return s.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[`*_]/g, "").trim();
}

function lighthouseFixHint(id: string): string | null {
  const hints: Record<string, string> = {
    "render-blocking-resources": "Inline critical CSS and defer non-critical JS/CSS.",
    "unused-css-rules": "Remove or split unused CSS; use code-splitting per route.",
    "unused-javascript": "Tree-shake unused JS; split bundles by route.",
    "modern-image-formats": "Serve images in AVIF or WebP with proper fallbacks.",
    "uses-optimized-images": "Compress images and serve appropriately sized variants.",
    "uses-text-compression": "Enable Brotli or Gzip on text-based resources.",
    "offscreen-images": "Lazy-load offscreen images with loading=\"lazy\".",
    "uses-responsive-images": "Serve appropriately sized images using srcset.",
    "color-contrast": "Increase text-to-background contrast to meet WCAG AA (4.5:1).",
    "image-alt": "Add descriptive alt attributes to all meaningful images.",
    "link-name": "Give every link discernible text or aria-label.",
    "button-name": "Give every button accessible text or aria-label.",
    "tap-targets": "Ensure interactive elements are at least 48×48px with spacing.",
    "font-size": "Use 16px or larger body text for readability on mobile.",
    "meta-description": "Add a unique 120–160 character meta description.",
    "document-title": "Add a unique, descriptive <title> 10–70 characters long.",
    "canonical": "Add a self-referencing <link rel=\"canonical\">.",
    "structured-data": "Validate JSON-LD with Google's Rich Results Test.",
    "is-on-https": "Migrate the entire site to HTTPS.",
    "no-vulnerable-libraries": "Upgrade JavaScript libraries flagged as having known CVEs.",
    "csp-xss": "Add a strict Content-Security-Policy header.",
    "errors-in-console": "Fix JavaScript runtime errors visible in DevTools console.",
    "server-response-time": "Reduce server response time below 600ms (caching, faster DB, CDN).",
    "total-byte-weight": "Reduce total page weight under 1.6MB by compressing assets.",
    "dom-size": "Reduce DOM nodes under 1500 by simplifying markup.",
    "bootup-time": "Reduce JavaScript execution time; split bundles, lazy-load.",
  };
  return hints[id] ?? null;
}

export function buildSiteIssue(
  key: string,
  category: Category,
  severity: DetectedIssue["severity"],
  title: string,
  description: string,
  recommendation: string,
  affectedUrl: string
): DetectedIssue {
  return { key, category, severity, title, description, recommendation, affectedUrl };
}

export async function checkBrokenLinks(
  pageUrl: string,
  html: string,
  limit = 25,
  alreadyChecked = new Set<string>()
): Promise<{
  issues: DetectedIssue[];
  brokenCount: number;
  redirectCount: number;
  brokenUrls: string[];
  redirectUrls: string[];
}> {
  const $ = cheerio.load(html);
  const baseHost = new URL(pageUrl).hostname.replace(/^www\./, "");
  const hrefs: string[] = [];

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:"))
      return;
    try {
      const u = new URL(href, pageUrl);
      if (u.hostname.replace(/^www\./, "") === baseHost) hrefs.push(u.toString());
    } catch {
      /* ignore */
    }
  });

  const unique = [...new Set(hrefs)].filter((link) => !alreadyChecked.has(link)).slice(0, limit);
  unique.forEach((link) => alreadyChecked.add(link));

  const broken: string[] = [];
  const redirects: string[] = [];

  await Promise.all(
    unique.map(async (link) => {
      try {
        let res = await fetch(link, {
          method: "GET",
          redirect: "manual",
          signal: AbortSignal.timeout(8000),
          headers: { Range: "bytes=0-0" },
        });
        if (res.status === 405) {
          res = await fetch(link, {
            method: "HEAD",
            redirect: "manual",
            signal: AbortSignal.timeout(8000),
          });
        }
        if (res.status >= 300 && res.status < 400) {
          redirects.push(link);
        } else if (res.status >= 400) {
          broken.push(link);
        }
      } catch {
        broken.push(link);
      }
    })
  );

  const issues: DetectedIssue[] = [];

  if (broken.length > 0) {
    issues.push(
      mkIssue({
        key: "broken-links",
        category: "onpage",
        severity: "critical",
        title: "Broken internal links detected",
        description: `${broken.length} broken link(s) found (sampled). Example: ${broken[0]}`,
        recommendation: "Fix or remove broken internal links.",
        affectedUrl: pageUrl,
      })
    );
  }

  if (redirects.length > 0) {
    issues.push(
      mkIssue({
        key: "redirect-links",
        category: "onpage",
        severity: "warning",
        title: "Internal links point to redirects",
        description: `${redirects.length} internal link(s) return 3xx redirects. Example: ${redirects[0]}`,
        recommendation: "Update links to point directly to the final destination URL.",
        affectedUrl: pageUrl,
      })
    );
  }

  return {
    brokenCount: broken.length,
    redirectCount: redirects.length,
    brokenUrls: broken,
    redirectUrls: redirects,
    issues,
  };
}

export interface SiteLinkAnalysis {
  orphanPageCount: number;
  pagesWithLowInternalLinks: number;
  issues: DetectedIssue[];
}

export function analyzeSiteLinkGraph(
  baseUrl: string,
  pages: PageSignals[]
): SiteLinkAnalysis {
  const issues: DetectedIssue[] = [];
  if (pages.length <= 1) {
    return { orphanPageCount: 0, pagesWithLowInternalLinks: 0, issues };
  }

  const crawledUrls = new Map<string, string>();
  for (const page of pages) {
    const normalized = normalizeInternalUrl(page.url, page.url);
    if (normalized) crawledUrls.set(normalized, page.url);
  }

  const inbound = new Map<string, number>();
  for (const url of crawledUrls.keys()) {
    inbound.set(url, 0);
  }

  for (const page of pages) {
    for (const target of page.internalLinkTargets) {
      if (crawledUrls.has(target) && target !== normalizeInternalUrl(page.url, page.url)) {
        inbound.set(target, (inbound.get(target) ?? 0) + 1);
      }
    }
  }

  let orphanPageCount = 0;
  for (const [normalized, originalUrl] of crawledUrls) {
    const isHome =
      normalizeInternalUrl(baseUrl, baseUrl) === normalized ||
      new URL(originalUrl).pathname.replace(/\/$/, "") === "";
    if (!isHome && (inbound.get(normalized) ?? 0) === 0) {
      orphanPageCount++;
      issues.push(
        mkIssue({
          key: "orphan-page",
          category: "onpage",
          severity: "warning",
          title: "Orphan page — no internal links from other crawled pages",
          description: `${originalUrl} was crawled but no other sampled page links to it.`,
          recommendation: "Add internal links from related pages so crawlers and users can reach this URL.",
          affectedUrl: originalUrl,
        })
      );
    }
  }

  const contentPages = pages.filter((p) => {
    try {
      const path = new URL(p.url).pathname.replace(/\/$/, "") || "/";
      return path !== "/" && p.wordCount > 150;
    } catch {
      return p.wordCount > 150;
    }
  });

  const lowLinkPages = contentPages.filter((p) => p.internalLinks < 3);
  const pagesWithLowInternalLinks = lowLinkPages.length;

  if (pagesWithLowInternalLinks > 0 && contentPages.length > 0) {
    const ratio = pagesWithLowInternalLinks / contentPages.length;
    if (ratio >= 0.5) {
      issues.push(
        mkIssue({
          key: "site-low-internal-linking",
          category: "onpage",
          severity: "warning",
          title: "Site-wide weak internal linking",
          description: `${pagesWithLowInternalLinks} of ${contentPages.length} content pages have fewer than 3 internal links.`,
          recommendation:
            "Strengthen contextual internal links between blog posts, services, and key landing pages.",
          affectedUrl: baseUrl,
        })
      );
    }
  }

  return { orphanPageCount, pagesWithLowInternalLinks, issues };
}

export function analyzeSite(
  baseUrl: string,
  pages: Array<{
    url: string;
    title: string | null;
    metaDescription: string | null;
    hasSchema: boolean;
    hasSocialTags: boolean;
  }>,
  robotsTxt: string | null,
  sitemapFound: boolean
): DetectedIssue[] {
  const issues: DetectedIssue[] = [];
  const pageCount = pages.length;

  if (!robotsTxt) {
    issues.push(mkIssue({
      key: "no-robots", category: "onpage", severity: "warning",
      title: "Robots.txt missing or inaccessible",
      description: "Could not fetch robots.txt.",
      recommendation: "Add robots.txt with sitemap reference and crawl rules.",
      affectedUrl: baseUrl,
    }));
  }

  if (!sitemapFound) {
    issues.push(mkIssue({
      key: "no-sitemap", category: "onpage", severity: "warning",
      title: "XML sitemap not found",
      description: "No sitemap discovered.",
      recommendation: "Publish sitemap.xml and reference it in robots.txt.",
      affectedUrl: baseUrl,
    }));
  }

  const titleMap = new Map<string, string[]>();
  const metaMap = new Map<string, string[]>();
  for (const page of pages) {
    if (page.title) {
      const k = page.title.toLowerCase().trim();
      titleMap.set(k, [...(titleMap.get(k) ?? []), page.url]);
    }
    if (page.metaDescription) {
      const k = page.metaDescription.toLowerCase().trim();
      metaMap.set(k, [...(metaMap.get(k) ?? []), page.url]);
    }
  }

  for (const [, urls] of titleMap) {
    if (urls.length > 1) {
      issues.push(mkIssue({
        key: "dup-titles", category: "onpage", severity: "critical",
        title: "Duplicate title tags across pages",
        description: `Same title used on ${urls.length} pages.`,
        recommendation: "Write unique titles for each indexable page.",
        affectedUrl: urls[0],
      }));
    }
  }

  for (const [, urls] of metaMap) {
    if (urls.length > 1) {
      issues.push(mkIssue({
        key: "dup-metas", category: "onpage", severity: "warning",
        title: "Duplicate meta descriptions",
        description: `Same meta description on ${urls.length} pages.`,
        recommendation: "Write unique descriptions per page.",
        affectedUrl: urls[0],
      }));
    }
  }

  if (pageCount > 0) {
    const schemaCoverage = pages.filter((p) => p.hasSchema).length / pageCount;
    if (schemaCoverage < 0.5) {
      issues.push(mkIssue({
        key: "low-schema-coverage", category: "onpage", severity: "notice",
        title: "Low structured data coverage",
        description: `${Math.round(schemaCoverage * 100)}% of pages have schema markup.`,
        recommendation: "Add JSON-LD across key page templates.",
        affectedUrl: baseUrl,
      }));
    }

    const socialCoverage = pages.filter((p) => p.hasSocialTags).length / pageCount;
    if (socialCoverage < 0.8) {
      issues.push(mkIssue({
        key: "low-og-coverage", category: "social", severity: "notice",
        title: "Inconsistent Open Graph tags",
        description: `${Math.round(socialCoverage * 100)}% of pages have complete OG tags.`,
        recommendation: "Ensure og:title, og:description, and og:image on all public pages.",
        affectedUrl: baseUrl,
      }));
    }
  }

  return issues;
}
