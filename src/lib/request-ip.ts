export function getClientIp(request: Request): string | null {
  const headers = request.headers;

  const candidates = [
    headers.get("cf-connecting-ip"),
    headers.get("x-vercel-forwarded-for"),
    headers.get("x-real-ip"),
    headers.get("true-client-ip"),
    headers.get("x-forwarded-for"),
  ];

  for (const value of candidates) {
    if (!value) continue;
    const ip = value.split(",")[0]?.trim();
    if (ip && isValidIp(ip)) return ip;
  }

  return null;
}

function isValidIp(ip: string): boolean {
  if (ip === "unknown" || ip === "::1" || ip === "127.0.0.1") return false;
  return /^[\d.a-fA-F:]+$/.test(ip);
}

export function resolveClientIp(
  request: Request,
  reportedIp?: string | null
): string | null {
  const fromHeaders = getClientIp(request);
  if (fromHeaders) return fromHeaders;

  if (reportedIp && isValidIp(reportedIp.trim())) {
    return reportedIp.trim();
  }

  return null;
}
