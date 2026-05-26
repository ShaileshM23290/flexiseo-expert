/**
 * DNS checks via Google Public DNS (dns.google) — free, no API key.
 * Validates SPF, DMARC, and MX records for email deliverability signals.
 */

export interface DnsResult {
  domain: string;
  hasSpf: boolean;
  spfRecord: string | null;
  hasDmarc: boolean;
  dmarcRecord: string | null;
  dmarcPolicy: "none" | "quarantine" | "reject" | null;
  hasMx: boolean;
  mxRecords: string[];
  hasIpv6: boolean;
  /** 0–100 email auth readiness score */
  emailAuthScore: number;
}

interface DnsAnswer {
  data?: string;
}

async function resolveTxt(name: string): Promise<string[]> {
  try {
    const res = await fetch(
      `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=TXT`,
      { signal: AbortSignal.timeout(8000), next: { revalidate: 0 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const answers = Array.isArray(data.Answer) ? data.Answer : [];
    return answers
      .map((a: DnsAnswer) => (typeof a.data === "string" ? a.data.replace(/^"|"$/g, "") : ""))
      .filter(Boolean);
  } catch {
    return [];
  }
}

async function resolveMx(name: string): Promise<string[]> {
  try {
    const res = await fetch(
      `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=MX`,
      { signal: AbortSignal.timeout(8000), next: { revalidate: 0 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const answers = Array.isArray(data.Answer) ? data.Answer : [];
    return answers
      .map((a: DnsAnswer) => (typeof a.data === "string" ? a.data : ""))
      .filter(Boolean);
  } catch {
    return [];
  }
}

async function hasAaaa(name: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=AAAA`,
      { signal: AbortSignal.timeout(8000), next: { revalidate: 0 } }
    );
    if (!res.ok) return false;
    const data = await res.json();
    return Array.isArray(data.Answer) && data.Answer.length > 0;
  } catch {
    return false;
  }
}

function parseDmarcPolicy(record: string): DnsResult["dmarcPolicy"] {
  const match = record.match(/;\s*p\s*=\s*(none|quarantine|reject)/i);
  return (match?.[1]?.toLowerCase() as DnsResult["dmarcPolicy"]) ?? null;
}

export async function fetchDnsChecks(url: string): Promise<DnsResult | null> {
  let domain: string;
  try {
    domain = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }

  try {
    const [rootTxt, dmarcTxt, mxRecords, ipv6] = await Promise.all([
      resolveTxt(domain),
      resolveTxt(`_dmarc.${domain}`),
      resolveMx(domain),
      hasAaaa(domain),
    ]);

    const spfRecord = rootTxt.find((r) => r.toLowerCase().startsWith("v=spf1")) ?? null;
    const dmarcRecord = dmarcTxt.find((r) => r.toLowerCase().startsWith("v=dmarc1")) ?? null;
    const dmarcPolicy = dmarcRecord ? parseDmarcPolicy(dmarcRecord) : null;

    let emailAuthScore = 0;
    if (spfRecord) emailAuthScore += 40;
    if (dmarcRecord) emailAuthScore += 40;
    if (dmarcPolicy === "quarantine" || dmarcPolicy === "reject") emailAuthScore += 20;
    if (mxRecords.length > 0) emailAuthScore += 10;

    return {
      domain,
      hasSpf: Boolean(spfRecord),
      spfRecord,
      hasDmarc: Boolean(dmarcRecord),
      dmarcRecord,
      dmarcPolicy,
      hasMx: mxRecords.length > 0,
      mxRecords: mxRecords.slice(0, 5),
      hasIpv6: ipv6,
      emailAuthScore: Math.min(100, emailAuthScore),
    };
  } catch (err) {
    console.warn("[DNS] failed:", err instanceof Error ? err.message : err);
    return null;
  }
}
