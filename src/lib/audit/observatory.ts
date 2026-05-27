/**
 * MDN HTTP Observatory — security header grading.
 * Uses the v2 API (the v1 API was shut down Oct 2024).
 * Falls back to live header fetch when the API is unavailable.
 *
 * @see https://github.com/mdn/mdn-http-observatory
 * @see https://developer.mozilla.org/en-US/observatory/
 */

import { crawlerUserAgent } from "../config";
import type { SecurityHeaders } from "./analyzer";

export interface ObservatoryTest {
  name: string;
  pass: boolean;
  scoreModifier: number;
  scoreDescription: string;
}

export interface ObservatoryResult {
  available: boolean;
  source: "mozilla" | "local";
  grade: string;
  score: number;
  testsPassed: number;
  testsFailed: number;
  testsQuantity: number;
  state: string;
  failedTests: ObservatoryTest[];
  detailsUrl?: string;
  message?: string;
}

const API_BASE = "https://observatory-api.mdn.mozilla.net/api/v2";

function unavailable(message: string): ObservatoryResult {
  return {
    available: false,
    source: "local",
    grade: "—",
    score: 0,
    testsPassed: 0,
    testsFailed: 0,
    testsQuantity: 0,
    state: "UNAVAILABLE",
    failedTests: [],
    message,
  };
}

function scoreToGrade(score: number): string {
  if (score >= 95) return "A+";
  if (score >= 90) return "A";
  if (score >= 85) return "A-";
  if (score >= 80) return "B+";
  if (score >= 75) return "B";
  if (score >= 70) return "B-";
  if (score >= 65) return "C+";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "F";
}

export function gradeSecurityHeadersLocally(
  headers: SecurityHeaders,
  isHttps: boolean,
  liveFetch = false
): ObservatoryResult {
  const tests: ObservatoryTest[] = [
    {
      name: "strict-transport-security",
      pass: Boolean(headers.hsts && isHttps),
      scoreModifier: headers.hsts ? 0 : -20,
      scoreDescription: headers.hsts
        ? "Strict-Transport-Security header set"
        : "HSTS header not set",
    },
    {
      name: "content-security-policy",
      pass: headers.csp,
      scoreModifier: headers.csp ? 0 : -20,
      scoreDescription: headers.csp
        ? "Content-Security-Policy header set"
        : "CSP header not set",
    },
    {
      name: "x-frame-options",
      pass: headers.xFrameOptions || headers.csp,
      scoreModifier: headers.xFrameOptions || headers.csp ? 0 : -15,
      scoreDescription:
        headers.xFrameOptions || headers.csp
          ? "Clickjacking protection present"
          : "No X-Frame-Options or CSP frame protection",
    },
    {
      name: "x-content-type-options",
      pass: headers.xContentType,
      scoreModifier: headers.xContentType ? 0 : -10,
      scoreDescription: headers.xContentType
        ? "X-Content-Type-Options set"
        : "X-Content-Type-Options missing",
    },
    {
      name: "referrer-policy",
      pass: headers.referrerPolicy,
      scoreModifier: headers.referrerPolicy ? 0 : -10,
      scoreDescription: headers.referrerPolicy
        ? "Referrer-Policy header set"
        : "Referrer-Policy header missing",
    },
    {
      name: "permissions-policy",
      pass: headers.permissionsPolicy,
      scoreModifier: headers.permissionsPolicy ? 0 : -5,
      scoreDescription: headers.permissionsPolicy
        ? "Permissions-Policy header set"
        : "Permissions-Policy header missing",
    },
  ];

  const testsPassed = tests.filter((t) => t.pass).length;
  const testsFailed = tests.length - testsPassed;
  const score = Math.round((testsPassed / tests.length) * 100);
  const failedTests = tests.filter((t) => !t.pass);

  return {
    available: true,
    source: "local",
    grade: scoreToGrade(score),
    score,
    testsPassed,
    testsFailed,
    testsQuantity: tests.length,
    state: "FINISHED",
    failedTests,
    message: liveFetch
      ? "MDN Observatory unavailable — graded from live HTTP response headers."
      : "MDN Observatory unavailable — graded from headers captured during crawl.",
  };
}

function parseSecurityHeaders(headers: Headers): SecurityHeaders {
  return {
    hsts: headers.has("strict-transport-security"),
    csp: headers.has("content-security-policy"),
    xContentType: headers.get("x-content-type-options")?.toLowerCase() === "nosniff",
    xFrameOptions: headers.has("x-frame-options"),
    referrerPolicy: headers.has("referrer-policy"),
    permissionsPolicy: headers.has("permissions-policy"),
  };
}

async function fetchLiveSecurityHeaders(
  url: string
): Promise<{ headers: SecurityHeaders; isHttps: boolean } | null> {
  const attempt = async (method: "HEAD" | "GET") => {
    const res = await fetch(url, {
      method,
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
      cache: "no-store",
      headers: { "User-Agent": crawlerUserAgent("(security-header-check)") },
    });
    if (!res.ok && method === "HEAD") return null;
    const finalUrl = res.url || url;
    return {
      headers: parseSecurityHeaders(res.headers),
      isHttps: finalUrl.startsWith("https://"),
    };
  };

  try {
    return (await attempt("HEAD")) ?? (await attempt("GET"));
  } catch {
    return null;
  }
}

async function resolveLocalHeaders(
  url: string,
  localHeaders?: SecurityHeaders | null,
  isHttps = true
): Promise<{ headers: SecurityHeaders; isHttps: boolean; liveFetch: boolean } | null> {
  if (localHeaders) {
    return { headers: localHeaders, isHttps, liveFetch: false };
  }
  const live = await fetchLiveSecurityHeaders(url);
  if (!live) return null;
  return { ...live, liveFetch: true };
}

type MdnScanResponse = {
  grade?: string;
  score?: number;
  tests_passed?: number;
  tests_failed?: number;
  tests_quantity?: number;
  details_url?: string;
  error?: string | null;
};

async function fetchMdnObservatoryScan(host: string): Promise<ObservatoryResult | null> {
  try {
    const res = await fetch(`${API_BASE}/scan?host=${encodeURIComponent(host)}`, {
      method: "POST",
      headers: { "Content-Length": "0" },
      signal: AbortSignal.timeout(30000),
      cache: "no-store",
    });

    if (!res.ok) return null;

    const data = (await res.json()) as MdnScanResponse;
    if (data.error) return null;
    if (!data.grade) return null;

    return {
      available: true,
      source: "mozilla",
      grade: data.grade,
      score: typeof data.score === "number" ? data.score : 0,
      testsPassed: typeof data.tests_passed === "number" ? data.tests_passed : 0,
      testsFailed: typeof data.tests_failed === "number" ? data.tests_failed : 0,
      testsQuantity: typeof data.tests_quantity === "number" ? data.tests_quantity : 0,
      state: "FINISHED",
      failedTests: [],
      detailsUrl: data.details_url,
    };
  } catch (err) {
    console.warn("[Observatory] MDN v2 failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

export async function fetchObservatoryScan(
  url: string,
  localHeaders?: SecurityHeaders | null,
  isHttps = true,
  options?: { refresh?: boolean; previous?: ObservatoryResult | null }
): Promise<ObservatoryResult> {
  let host: string;
  try {
    host = new URL(url).hostname;
  } catch {
    return unavailable("Invalid URL for HTTP Observatory scan.");
  }

  const useLocalFallback = async (liveFetch: boolean) => {
    const local = await resolveLocalHeaders(url, liveFetch ? null : localHeaders, isHttps);
    if (!local) {
      return unavailable(
        "MDN Observatory is unavailable and we could not fetch your site's HTTP headers."
      );
    }
    return gradeSecurityHeadersLocally(local.headers, local.isHttps, local.liveFetch);
  };

  if (options?.refresh) {
    const live = await resolveLocalHeaders(url, null, isHttps);
    if (live) {
      const liveResult = gradeSecurityHeadersLocally(live.headers, live.isHttps, true);
      const mdn = await fetchMdnObservatoryScan(host);
      const previous = options.previous;

      if (
        mdn &&
        (!previous ||
          mdn.grade !== previous.grade ||
          mdn.score !== previous.score ||
          previous.source !== "mozilla")
      ) {
        return mdn;
      }

      return liveResult;
    }
  }

  const local = await resolveLocalHeaders(url, localHeaders, isHttps);

  const mdn = await fetchMdnObservatoryScan(host);
  if (mdn) return mdn;

  if (!local) {
    return unavailable(
      "MDN Observatory is unavailable and we could not fetch your site's HTTP headers."
    );
  }
  return gradeSecurityHeadersLocally(local.headers, local.isHttps, local.liveFetch);
}
