import type { CruxResult } from "./crux";
import type { DnsResult } from "./dns";
import type { ObservatoryResult } from "./observatory";
import type { SafeBrowsingResult } from "./safe-browsing";
import type { W3cValidationResult } from "./w3c-validator";
import type { BacklinkProfile } from "./backlinks";
import { buildSiteIssue, type DetectedIssue } from "./analyzer";

function gradeToScore(grade: string): number {
  const map: Record<string, number> = {
    "A+": 100,
    A: 95,
    "A-": 90,
    "B+": 85,
    B: 80,
    "B-": 75,
    "C+": 70,
    C: 65,
    "C-": 60,
    D: 50,
    F: 25,
  };
  return map[grade] ?? 60;
}

export function analyzeCrux(baseUrl: string, crux: CruxResult): DetectedIssue[] {
  if (!crux.available) {
    return [
      buildSiteIssue(
        "crux-no-data",
        "performance",
        "notice",
        "No Chrome UX Report data for this origin",
        "Google does not have enough real-user traffic data for this site in CrUX yet.",
        "Focus on lab metrics (PageSpeed) and grow organic traffic to accumulate field data.",
        baseUrl
      ),
    ];
  }

  const issues: DetectedIssue[] = [];

  if (crux.lcp.rating === "POOR") {
    issues.push(
      buildSiteIssue(
        "crux-lcp-poor",
        "performance",
        "critical",
        "Real users experience slow LCP",
        `CrUX field data shows LCP p75 at ${((crux.lcp.p75 ?? 0) / 1000).toFixed(1)}s — rated Poor by Google.`,
        "Optimize hero images, server response time, and render-blocking resources.",
        baseUrl
      )
    );
  } else if (crux.lcp.rating === "NEEDS_IMPROVEMENT") {
    issues.push(
      buildSiteIssue(
        "crux-lcp-needs-improvement",
        "performance",
        "warning",
        "Real-user LCP needs improvement",
        `CrUX field data LCP p75: ${((crux.lcp.p75 ?? 0) / 1000).toFixed(1)}s.`,
        "Improve largest contentful paint for real visitors, not just lab tests.",
        baseUrl
      )
    );
  }

  if (crux.cls.rating === "POOR" || crux.cls.rating === "NEEDS_IMPROVEMENT") {
    issues.push(
      buildSiteIssue(
        "crux-cls",
        "performance",
        crux.cls.rating === "POOR" ? "critical" : "warning",
        "Real users see layout shifts",
        `CrUX CLS p75: ${(crux.cls.p75 ?? 0).toFixed(3)} (${crux.cls.rating.replace("_", " ").toLowerCase()}).`,
        "Set explicit dimensions on images/ads and avoid inserting content above existing content.",
        baseUrl
      )
    );
  }

  if (crux.inp.rating === "POOR" || crux.inp.rating === "NEEDS_IMPROVEMENT") {
    issues.push(
      buildSiteIssue(
        "crux-inp",
        "performance",
        crux.inp.rating === "POOR" ? "warning" : "notice",
        "Real-user interactivity is slow",
        `CrUX INP p75: ${crux.inp.p75}ms.`,
        "Reduce JavaScript execution and break up long main-thread tasks.",
        baseUrl
      )
    );
  }

  return issues;
}

export function analyzeObservatory(baseUrl: string, obs: ObservatoryResult): DetectedIssue[] {
  if (!obs.available) {
    return [
      buildSiteIssue(
        "observatory-unavailable",
        "usability",
        "notice",
        "Security headers scan incomplete",
        obs.message ?? "Mozilla Observatory did not return results.",
        "Click Refresh on the Security Headers card to retry without a full audit.",
        baseUrl
      ),
    ];
  }

  const issues: DetectedIssue[] = [];
  const score = gradeToScore(obs.grade);

  if (score < 70) {
    issues.push(
      buildSiteIssue(
        "observatory-grade-low",
        "usability",
        score < 50 ? "warning" : "notice",
        `Security headers grade: ${obs.grade}`,
        `Mozilla Observatory scored ${obs.score}/100 (${obs.testsFailed} failed tests).`,
        "Add HSTS, CSP, X-Frame-Options, and Referrer-Policy headers.",
        baseUrl
      )
    );
  }

  for (const test of obs.failedTests.slice(0, 4)) {
    issues.push(
      buildSiteIssue(
        `observatory-${test.name}`,
        "usability",
        "notice",
        `Security: ${test.name.replace(/-/g, " ")}`,
        test.scoreDescription || `Failed Observatory check: ${test.name}.`,
        "Review Mozilla Observatory recommendations and update server headers.",
        baseUrl
      )
    );
  }

  return issues;
}

export function analyzeSafeBrowsing(baseUrl: string, sb: SafeBrowsingResult): DetectedIssue[] {
  if (!sb.available) {
    return [
      buildSiteIssue(
        "safe-browsing-unavailable",
        "links",
        "notice",
        "Safe Browsing check not completed",
        sb.message ?? "Google Safe Browsing did not return results.",
        "Enable Safe Browsing API in Google Cloud, then Refresh this card.",
        baseUrl
      ),
    ];
  }

  if (sb.safe) return [];

  return [
    buildSiteIssue(
      "safe-browsing-threat",
      "links",
      "critical",
      "Site flagged by Google Safe Browsing",
      `Threat types detected: ${sb.threats.join(", ") || "unknown"}.`,
      "Investigate malware/phishing immediately and request a review in Google Search Console.",
      baseUrl
    ),
  ];
}

export function analyzeDns(baseUrl: string, dns: DnsResult): DetectedIssue[] {
  const issues: DetectedIssue[] = [];

  if (!dns.hasSpf) {
    issues.push(
      buildSiteIssue(
        "dns-no-spf",
        "onpage",
        "notice",
        "No SPF record found",
        `No SPF TXT record detected for ${dns.domain}.`,
        "Add an SPF record to prevent email spoofing and improve deliverability.",
        baseUrl
      )
    );
  }

  if (!dns.hasDmarc) {
    issues.push(
      buildSiteIssue(
        "dns-no-dmarc",
        "onpage",
        "notice",
        "No DMARC record found",
        `No DMARC policy at _dmarc.${dns.domain}.`,
        "Publish a DMARC record (start with p=none, then tighten to quarantine/reject).",
        baseUrl
      )
    );
  } else if (dns.dmarcPolicy === "none") {
    issues.push(
      buildSiteIssue(
        "dns-dmarc-none",
        "onpage",
        "notice",
        "DMARC policy is set to none",
        "DMARC exists but only monitors — it does not protect against spoofing.",
        "Gradually move DMARC policy to quarantine or reject.",
        baseUrl
      )
    );
  }

  if (!dns.hasMx) {
    issues.push(
      buildSiteIssue(
        "dns-no-mx",
        "onpage",
        "notice",
        "No MX records found",
        `No mail exchange records for ${dns.domain}.`,
        "Add MX records if this domain sends/receives email.",
        baseUrl
      )
    );
  }

  if (!dns.hasIpv6) {
    issues.push(
      buildSiteIssue(
        "dns-no-ipv6",
        "onpage",
        "notice",
        "No IPv6 (AAAA) record",
        "Domain has no AAAA record — IPv6-only users may have connectivity issues.",
        "Consider adding an AAAA record if your host supports IPv6.",
        baseUrl
      )
    );
  }

  return issues;
}

export function analyzeW3c(baseUrl: string, w3c: W3cValidationResult): DetectedIssue[] {
  if (w3c.valid && w3c.warningCount === 0) return [];

  const severity: DetectedIssue["severity"] =
    w3c.errorCount > 5 ? "warning" : w3c.errorCount > 0 ? "notice" : "notice";

  const topMsg = w3c.topIssues[0]?.message ?? "See W3C validator for details.";

  return [
    buildSiteIssue(
      "w3c-html-errors",
      "onpage",
      severity,
      w3c.errorCount > 0 ? "HTML markup validation errors" : "HTML markup warnings",
      `${w3c.errorCount} error(s), ${w3c.warningCount} warning(s). Example: ${topMsg}`,
      "Fix invalid HTML nesting, attributes, and deprecated elements.",
      baseUrl
    ),
  ];
}

export { gradeToScore };

export function analyzeBacklinks(baseUrl: string, profile: BacklinkProfile): DetectedIssue[] {
  if (!profile.available) {
    return [
      buildSiteIssue(
        "backlinks-not-configured",
        "links",
        "notice",
        "Link authority not analyzed",
        profile.message ??
          "Set OPENPAGERANK_API_KEY (free) to score inbound link strength for the Links category.",
        "Sign up at domcop.com/openpagerank for a free API key and add it to your environment.",
        baseUrl
      ),
    ];
  }

  const issues: DetectedIssue[] = [];
  const rank = profile.domainRank ?? 0;

  if (profile.domainRank !== null && rank < 15) {
    issues.push(
      buildSiteIssue(
        "weak-link-profile",
        "links",
        "critical",
        "Very weak inbound link profile",
        `Domain authority is ${rank}/100 (Open PageRank) — similar to a low Links grade on SEOptimer.`,
        "Build quality backlinks from relevant sites via content, PR, directories, and partnerships.",
        baseUrl
      )
    );
  } else if (profile.domainRank !== null && rank < 35) {
    issues.push(
      buildSiteIssue(
        "low-domain-authority",
        "links",
        "warning",
        "Low domain authority / link strength",
        `Domain authority score is ${rank}/100 based on inbound link signals (Open PageRank).`,
        "Earn links from higher-authority sites in your niche to improve trust signals.",
        baseUrl
      )
    );
  }

  return issues;
}

export interface ExternalInsightsSummary {
  crux: CruxResult | null;
  observatory: ObservatoryResult | null;
  safeBrowsing: SafeBrowsingResult | null;
  dns: DnsResult | null;
  w3c: W3cValidationResult | null;
  backlinks: BacklinkProfile | null;
}

export function buildExternalIssues(
  baseUrl: string,
  summary: ExternalInsightsSummary
): DetectedIssue[] {
  const issues: DetectedIssue[] = [];
  if (summary.crux) issues.push(...analyzeCrux(baseUrl, summary.crux));
  if (summary.observatory) issues.push(...analyzeObservatory(baseUrl, summary.observatory));
  if (summary.safeBrowsing) issues.push(...analyzeSafeBrowsing(baseUrl, summary.safeBrowsing));
  if (summary.dns) issues.push(...analyzeDns(baseUrl, summary.dns));
  if (summary.w3c) issues.push(...analyzeW3c(baseUrl, summary.w3c));
  if (summary.backlinks) issues.push(...analyzeBacklinks(baseUrl, summary.backlinks));
  return issues;
}
