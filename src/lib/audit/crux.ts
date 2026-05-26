/**
 * Chrome UX Report (CrUX) API — real-user Core Web Vitals from Google.
 * Free with a Google Cloud API key (same project as PageSpeed).
 * https://developer.chrome.com/docs/crux/api
 */

export type CruxRating = "GOOD" | "NEEDS_IMPROVEMENT" | "POOR" | "UNKNOWN";

export interface CruxMetric {
  p75: number | null;
  rating: CruxRating;
}

export interface CruxResult {
  available: boolean;
  origin: string;
  /** Field data from real Chrome users */
  lcp: CruxMetric;
  cls: CruxMetric;
  inp: CruxMetric;
  fcp: CruxMetric;
  ttfb: CruxMetric;
  /** Overall field-data quality signal */
  overallRating: CruxRating;
}

function rateLcp(ms: number): CruxRating {
  if (ms <= 2500) return "GOOD";
  if (ms <= 4000) return "NEEDS_IMPROVEMENT";
  return "POOR";
}

function rateCls(value: number): CruxRating {
  if (value <= 0.1) return "GOOD";
  if (value <= 0.25) return "NEEDS_IMPROVEMENT";
  return "POOR";
}

function rateInp(ms: number): CruxRating {
  if (ms <= 200) return "GOOD";
  if (ms <= 500) return "NEEDS_IMPROVEMENT";
  return "POOR";
}

function rateFcp(ms: number): CruxRating {
  if (ms <= 1800) return "GOOD";
  if (ms <= 3000) return "NEEDS_IMPROVEMENT";
  return "POOR";
}

function rateTtfb(ms: number): CruxRating {
  if (ms <= 800) return "GOOD";
  if (ms <= 1800) return "NEEDS_IMPROVEMENT";
  return "POOR";
}

function parseMetric(
  metrics: Record<string, unknown> | undefined,
  id: string,
  rate: (v: number) => CruxRating,
  /** CrUX returns CLS as a fraction; others in ms */
  isFraction = false
): CruxMetric {
  const raw = metrics?.[id] as { percentiles?: { p75?: number } } | undefined;
  const p75 = typeof raw?.percentiles?.p75 === "number" ? raw.percentiles.p75 : null;
  if (p75 === null) return { p75: null, rating: "UNKNOWN" };
  const value = isFraction ? p75 : p75;
  return { p75: value, rating: rate(value) };
}

function worstRating(...ratings: CruxRating[]): CruxRating {
  const order: CruxRating[] = ["POOR", "NEEDS_IMPROVEMENT", "GOOD", "UNKNOWN"];
  for (const r of order) {
    if (ratings.includes(r)) return r;
  }
  return "UNKNOWN";
}

export async function fetchCruxData(url: string): Promise<CruxResult | null> {
  const apiKey = process.env.PAGESPEED_API_KEY;
  if (!apiKey) return null;

  let origin: string;
  try {
    const u = new URL(url);
    origin = `${u.protocol}//${u.hostname}`;
  } catch {
    return null;
  }

  try {
    const res = await fetch(
      `https://chromeuxreport.googleapis.com/v1/records:queryRecord?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin }),
        signal: AbortSignal.timeout(15000),
        next: { revalidate: 0 },
      }
    );

    if (!res.ok) {
      if (res.status === 404) {
        return {
          available: false,
          origin,
          lcp: { p75: null, rating: "UNKNOWN" },
          cls: { p75: null, rating: "UNKNOWN" },
          inp: { p75: null, rating: "UNKNOWN" },
          fcp: { p75: null, rating: "UNKNOWN" },
          ttfb: { p75: null, rating: "UNKNOWN" },
          overallRating: "UNKNOWN",
        };
      }
      console.warn(`[CrUX] HTTP ${res.status}`);
      return null;
    }

    const data = await res.json();
    const metrics = data.record?.metrics as Record<string, unknown> | undefined;

    const lcp = parseMetric(metrics, "largest_contentful_paint", rateLcp);
    const cls = parseMetric(metrics, "cumulative_layout_shift", rateCls, true);
    const inp = parseMetric(metrics, "interaction_to_next_paint", rateInp);
    const fcp = parseMetric(metrics, "first_contentful_paint", rateFcp);
    const ttfb = parseMetric(metrics, "experimental_time_to_first_byte", rateTtfb);

    return {
      available: true,
      origin,
      lcp,
      cls,
      inp,
      fcp,
      ttfb,
      overallRating: worstRating(lcp.rating, cls.rating, inp.rating),
    };
  } catch (err) {
    console.warn("[CrUX] failed:", err instanceof Error ? err.message : err);
    return null;
  }
}
