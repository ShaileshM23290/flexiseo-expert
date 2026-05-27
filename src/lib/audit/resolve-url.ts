import { crawlerUserAgent } from "../config";
import { formatUrl } from "../utils";

async function followUrl(url: string): Promise<URL | null> {
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(12000),
      headers: {
        "User-Agent": crawlerUserAgent(),
        Accept: "text/html,application/xhtml+xml",
      },
    });
    return new URL(res.url || url);
  } catch {
    try {
      return new URL(url);
    } catch {
      return null;
    }
  }
}

function registrableHost(hostname: string): string {
  return hostname.replace(/^www\./i, "").toLowerCase();
}

/**
 * Resolve www vs non-www and redirect chains so the same site always audits
 * against one canonical origin (e.g. https://example.com/ vs https://www.example.com/).
 */
export async function resolveCanonicalAuditUrl(rawUrl: string): Promise<string> {
  const formatted = formatUrl(rawUrl);
  const primary = await followUrl(formatted);
  if (!primary) return formatted;

  const registrable = registrableHost(primary.hostname);
  const protocol = primary.protocol;
  const apexUrl = `${protocol}//${registrable}/`;
  const wwwUrl = `${protocol}//www.${registrable}/`;

  const [apexFinal, wwwFinal] = await Promise.all([followUrl(apexUrl), followUrl(wwwUrl)]);

  let canonicalHost = primary.hostname.toLowerCase();

  if (apexFinal && wwwFinal) {
    const apexHost = apexFinal.hostname.toLowerCase();
    const wwwHost = wwwFinal.hostname.toLowerCase();

    if (registrableHost(apexHost) === registrableHost(wwwHost)) {
      if (apexHost === wwwHost) {
        // Both variants land on the same host — prefer apex for consistency.
        canonicalHost = registrable;
      } else if (wwwHost.startsWith("www.") && !apexHost.startsWith("www.")) {
        // Apex redirects to www.
        canonicalHost = wwwHost;
      } else if (apexHost.startsWith("www.") && !wwwHost.startsWith("www.")) {
        // www redirects to apex.
        canonicalHost = apexHost;
      } else {
        canonicalHost = registrable;
      }
    }
  } else if (apexFinal) {
    canonicalHost = apexFinal.hostname.toLowerCase();
  } else if (wwwFinal) {
    canonicalHost = wwwFinal.hostname.toLowerCase();
  }

  try {
    const input = new URL(formatted);
    const path = input.pathname.replace(/\/$/, "") || "/";
    const suffix = path !== "/" ? `${input.pathname}${input.search}` : "/";
    return `${protocol}//${canonicalHost}${suffix}`;
  } catch {
    return `${protocol}//${canonicalHost}/`;
  }
}
