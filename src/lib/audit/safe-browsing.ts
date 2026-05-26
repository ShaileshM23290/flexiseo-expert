/**
 * Google Safe Browsing API v4 — malware/phishing reputation check.
 * Free tier available; uses the same Google Cloud API key.
 * Enable "Safe Browsing API" in Google Cloud Console.
 */

export interface SafeBrowsingResult {
  available: boolean;
  safe: boolean;
  threats: string[];
  checkedUrl: string;
  scannedFor: string[];
  checkedAt: string;
  message?: string;
}

const SCANNED_FOR = [
  "Malware",
  "Phishing / social engineering",
  "Unwanted software",
  "Potentially harmful apps",
];

function unavailable(url: string, message: string): SafeBrowsingResult {
  return {
    available: false,
    safe: true,
    threats: [],
    checkedUrl: url,
    scannedFor: SCANNED_FOR,
    checkedAt: new Date().toISOString(),
    message,
  };
}

export async function checkSafeBrowsing(url: string): Promise<SafeBrowsingResult> {
  const apiKey = process.env.PAGESPEED_API_KEY;
  if (!apiKey) {
    return unavailable(
      url,
      "Set PAGESPEED_API_KEY and enable Safe Browsing API in Google Cloud to run this check."
    );
  }

  try {
    const res = await fetch(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client: { clientId: "tryseoaudit", clientVersion: "1.0" },
          threatInfo: {
            threatTypes: [
              "MALWARE",
              "SOCIAL_ENGINEERING",
              "UNWANTED_SOFTWARE",
              "POTENTIALLY_HARMFUL_APPLICATION",
            ],
            platformTypes: ["ANY_PLATFORM"],
            threatEntryTypes: ["URL"],
            threatEntries: [{ url }],
          },
        }),
        signal: AbortSignal.timeout(10000),
        cache: "no-store",
      }
    );

    if (!res.ok) {
      console.warn(`[SafeBrowsing] HTTP ${res.status}`);
      let message = `Safe Browsing API returned HTTP ${res.status}. Click Refresh to retry.`;

      try {
        const errBody = (await res.json()) as {
          error?: {
            message?: string;
            details?: Array<{ reason?: string }>;
          };
        };
        const reason = errBody.error?.details?.find((d) => d.reason)?.reason;
        if (reason === "API_KEY_SERVICE_BLOCKED" || res.status === 403) {
          message =
            "Your Google API key blocks Safe Browsing — in Cloud Console go to Credentials → your key → API restrictions → add “Safe Browsing API”, then Refresh.";
        } else if (errBody.error?.message) {
          message = `${errBody.error.message} Click Refresh after fixing API key settings.`;
        }
      } catch {
        if (res.status === 403) {
          message =
            "Your Google API key blocks Safe Browsing — add “Safe Browsing API” to the key’s allowed APIs in Cloud Console → Credentials, then Refresh.";
        }
      }

      return unavailable(url, message);
    }

    const data = await res.json();
    const matches = Array.isArray(data.matches) ? data.matches : [];
    const rawThreats: string[] = [];
    for (const m of matches as Array<{ threatType?: string }>) {
      if (typeof m.threatType === "string" && !rawThreats.includes(m.threatType)) {
        rawThreats.push(m.threatType);
      }
    }

    return {
      available: true,
      safe: rawThreats.length === 0,
      threats: rawThreats,
      checkedUrl: url,
      scannedFor: SCANNED_FOR,
      checkedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.warn("[SafeBrowsing] failed:", err instanceof Error ? err.message : err);
    return unavailable(url, "Safe Browsing request failed. Click Refresh to retry.");
  }
}
