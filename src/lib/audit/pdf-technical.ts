import type { BacklinkProfile } from "@/lib/audit/backlinks";
import type { CruxResult } from "@/lib/audit/crux";
import type { DnsResult } from "@/lib/audit/dns";
import type { ObservatoryResult } from "@/lib/audit/observatory";
import type { PageSpeedResult } from "@/lib/audit/pagespeed";
import type { SafeBrowsingResult } from "@/lib/audit/safe-browsing";
import type { W3cValidationResult } from "@/lib/audit/w3c-validator";
import { parseJsonField } from "@/lib/parse-json";

import type { PDF_TECH_ACCENT } from "@/lib/audit/pdf-colors";

export interface PdfTextBlock {
  title: string;
  lines: string[];
  accent: keyof typeof PDF_TECH_ACCENT;
}

function ratingLabel(rating?: string): string {
  if (!rating || rating === "UNKNOWN") return "";
  return rating.replace(/_/g, " ");
}

export function buildTechnicalPdfBlocks(
  performanceDataRaw: string | null,
  schemaSummaryRaw: string | null
): PdfTextBlock[] {
  const performanceData = parseJsonField<Record<string, unknown> | null>(performanceDataRaw, null);
  const schemaSummary = parseJsonField<Record<string, unknown> | null>(schemaSummaryRaw, null);

  const crux = (performanceData?.crux as CruxResult | null) ?? null;
  const pageSpeed = (performanceData?.pageSpeed as PageSpeedResult | null) ?? null;
  const trust = (performanceData?.trust as {
    observatory?: ObservatoryResult | null;
    safeBrowsing?: SafeBrowsingResult | null;
    dns?: DnsResult | null;
  } | null) ?? null;
  const w3c = (schemaSummary?.w3c as W3cValidationResult | null) ?? null;
  const backlinks = (performanceData?.backlinks as BacklinkProfile | null) ?? null;

  const blocks: PdfTextBlock[] = [];

  if (backlinks?.available && backlinks.domainRank !== null) {
    blocks.push({
      title: "Link Authority (Open PageRank)",
      accent: "violet",
      lines: [
        `Domain authority: ${backlinks.domainRank}/100`,
        backlinks.message ?? "Estimates inbound link strength from public PageRank data.",
      ],
    });
  } else if (backlinks?.message) {
    blocks.push({
      title: "Link Authority (Open PageRank)",
      accent: "violet",
      lines: [backlinks.message],
    });
  }

  const vitalsLines: string[] = [];
  if (crux?.available) {
    vitalsLines.push(
      `LCP (field): ${crux.lcp.p75 ? `${(crux.lcp.p75 / 1000).toFixed(1)}s` : "—"}${ratingLabel(crux.lcp.rating) ? ` · ${ratingLabel(crux.lcp.rating)}` : ""}`,
      `CLS (field): ${crux.cls.p75 !== null ? crux.cls.p75.toFixed(3) : "—"}${ratingLabel(crux.cls.rating) ? ` · ${ratingLabel(crux.cls.rating)}` : ""}`,
      `INP (field): ${crux.inp.p75 ? `${crux.inp.p75}ms` : "—"}${ratingLabel(crux.inp.rating) ? ` · ${ratingLabel(crux.inp.rating)}` : ""}`
    );
  } else if (crux) {
    vitalsLines.push("No Chrome UX Report data yet — site needs more real-user traffic for field metrics.");
  }
  if (pageSpeed) {
    vitalsLines.push(
      `Lighthouse performance: ${pageSpeed.performanceScore}/100`,
      `Lighthouse accessibility: ${pageSpeed.accessibilityScore}/100`,
      `Lighthouse best practices: ${pageSpeed.bestPracticesScore}/100`,
      `Lighthouse SEO: ${pageSpeed.seoScore}/100`
    );
  }
  if (vitalsLines.length > 0) {
    blocks.push({ title: "Core Web Vitals & Lighthouse", accent: "sky", lines: vitalsLines });
  }

  if (trust?.observatory?.available) {
    const obs = trust.observatory;
    const lines = [
      `Security grade: ${obs.grade} (${obs.score}/100)`,
      `${obs.testsPassed} passed · ${obs.testsFailed} failed`,
      obs.source === "local" ? "Source: local scan" : "Source: MDN HTTP Observatory",
    ];
    for (const test of obs.failedTests.slice(0, 8)) {
      lines.push(`• ${test.scoreDescription || test.name.replace(/-/g, " ")}`);
    }
    if (obs.message) lines.push(obs.message);
    blocks.push({ title: "Security Headers", accent: "violet", lines });
  } else if (trust?.observatory?.message) {
    blocks.push({ title: "Security Headers", accent: "violet", lines: [trust.observatory.message] });
  }

  if (trust?.safeBrowsing?.available) {
    const sb = trust.safeBrowsing;
    const lines = [
      sb.safe
        ? "Not on Google's threat lists"
        : `Flagged: ${sb.threats.join(", ") || "threat detected"}`,
      `URL checked: ${sb.checkedUrl}`,
      `Threat types found: ${sb.threats.length === 0 ? "None" : String(sb.threats.length)}`,
    ];
    blocks.push({ title: "Google Safe Browsing", accent: sb.safe ? "brand" : "rose", lines });
  } else if (trust?.safeBrowsing?.message) {
    blocks.push({ title: "Google Safe Browsing", accent: "brand", lines: [trust.safeBrowsing.message] });
  }

  if (trust?.dns) {
    const dns = trust.dns;
    blocks.push({
      title: "Email & DNS",
      accent: "brand",
      lines: [
        `SPF: ${dns.hasSpf ? "Present" : "Missing"}`,
        `DMARC: ${dns.hasDmarc ? "Present" : "Missing"}${dns.dmarcPolicy ? ` (p=${dns.dmarcPolicy})` : ""}`,
        `MX: ${dns.hasMx ? "Present" : "Missing"}`,
        `IPv6: ${dns.hasIpv6 ? "Present" : "Missing"}`,
        `Email auth score: ${dns.emailAuthScore}/100`,
      ],
    });
  }

  if (w3c) {
    const lines = [
      w3c.valid ? "Valid markup" : `${w3c.errorCount} error(s)`,
      `${w3c.warningCount} warning(s)`,
    ];
    for (const issue of w3c.topIssues.slice(0, 8)) {
      lines.push(`${issue.line ? `Line ${issue.line}: ` : ""}${issue.message}`);
    }
    blocks.push({ title: "HTML Validation (W3C)", accent: "amber", lines });
  }

  if (performanceData?.averageLoadTimeMs != null) {
    blocks.push({
      title: "Crawl Performance",
      accent: "sky",
      lines: [
        `Average load time: ${Math.round(Number(performanceData.averageLoadTimeMs))}ms`,
        `Slow pages: ${String(performanceData.slowPages ?? 0)}`,
      ],
    });
  }

  return blocks;
}
