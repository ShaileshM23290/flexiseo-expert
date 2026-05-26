/** Resolve visitor IP for audit submission (headers first, public IP fallback for local dev). */
export async function resolveVisitorIp(): Promise<string | null> {
  try {
    const res = await fetch("/api/client-ip", { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as { ip?: string | null };
      if (data.ip) return data.ip;
    }
  } catch {
    // fall through to public IP lookup
  }

  try {
    const res = await fetch("https://api.ipify.org?format=json", {
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const data = (await res.json()) as { ip?: string };
      if (data.ip) return data.ip;
    }
  } catch {
    // ignore
  }

  return null;
}
