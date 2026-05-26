import { getDomain } from "../utils";

export type BacklinkProfile = {
  available: boolean;
  source: "openpagerank" | null;
  referringDomains: number | null;
  totalBacklinks: number | null;
  /** Normalized 0–100 authority score from Open PageRank */
  domainRank: number | null;
  message?: string;
};

function normalizeDomain(input: string): string {
  try {
    return getDomain(input.startsWith("http") ? input : `https://${input}`);
  } catch {
    return input.replace(/^www\./, "").toLowerCase();
  }
}

function scoreFromDomainRank(rank: number): number {
  return Math.min(100, Math.max(0, Math.round(rank)));
}

/** Public helper used by Links category scoring */
export function scoreBacklinkProfile(profile: BacklinkProfile | null): {
  referringDomainsScore: number;
  domainRankScore: number;
  backlinkVolumeScore: number;
} {
  if (!profile?.available || profile.domainRank === null) {
    return {
      referringDomainsScore: 50,
      domainRankScore: 50,
      backlinkVolumeScore: 50,
    };
  }

  const score = scoreFromDomainRank(profile.domainRank);
  return {
    referringDomainsScore: score,
    domainRankScore: score,
    backlinkVolumeScore: score,
  };
}

async function fetchOpenPageRank(domain: string): Promise<BacklinkProfile> {
  const apiKey = process.env.OPENPAGERANK_API_KEY;
  const empty: BacklinkProfile = {
    available: false,
    source: null,
    referringDomains: null,
    totalBacklinks: null,
    domainRank: null,
    message:
      "Set OPENPAGERANK_API_KEY (free) to score inbound link authority for the Links category.",
  };

  if (!apiKey) return empty;

  const trimmedKey = apiKey.trim();
  if (!trimmedKey) return empty;

  try {
    const url = new URL("https://openpagerank.com/api/v1.0/getPageRank");
    url.searchParams.append("domains[]", domain);

    const res = await fetch(url.toString(), {
      headers: { "API-OPR": trimmedKey },
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    });

    const data = (await res.json()) as {
      status_code?: number;
      response?:
        | string
        | Array<{
            status_code?: number;
            error?: string;
            page_rank_integer?: number;
            page_rank_decimal?: number;
            domain?: string;
          }>;
    };

    if (!res.ok || data.status_code === 400) {
      const detail =
        typeof data.response === "string"
          ? data.response
          : `HTTP ${res.status}`;
      return { ...empty, message: `Open PageRank API error: ${detail}` };
    }

    const entries = Array.isArray(data.response) ? data.response : [];
    const entry = entries[0];
    if (!entry) {
      return { ...empty, message: "No PageRank data returned for this domain." };
    }

    const pr = entry.page_rank_integer ?? entry.page_rank_decimal;
    if (typeof pr !== "number") {
      return {
        ...empty,
        message: entry.error || "No PageRank data returned for this domain.",
      };
    }

    const domainRank = Math.min(100, Math.round(pr <= 10 ? pr * 10 : pr));

    return {
      available: true,
      source: "openpagerank",
      referringDomains: null,
      totalBacklinks: null,
      domainRank,
      message:
        entry.status_code === 404
          ? "Domain not in Open PageRank index — scored as 0 authority."
          : "Domain authority from Open PageRank (free API).",
    };
  } catch (error) {
    return {
      ...empty,
      message: error instanceof Error ? error.message : "Open PageRank request failed",
    };
  }
}

export async function fetchBacklinkProfile(siteUrl: string): Promise<BacklinkProfile> {
  const domain = normalizeDomain(siteUrl);
  return fetchOpenPageRank(domain);
}

export function isBacklinkApiConfigured(): boolean {
  return Boolean(process.env.OPENPAGERANK_API_KEY);
}
