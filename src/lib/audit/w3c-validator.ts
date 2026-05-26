/**
 * W3C Nu HTML Validator — markup quality check.
 * Free public service; we validate the homepage only to stay polite.
 * https://validator.w3.org/nu/
 */

import { crawlerUserAgent } from "../config";

export interface W3cValidationResult {
  url: string;
  valid: boolean;
  errorCount: number;
  warningCount: number;
  /** Top issues for display */
  topIssues: Array<{ type: string; message: string; line: number | null }>;
}

export async function validateHtml(url: string): Promise<W3cValidationResult | null> {
  try {
    const params = new URLSearchParams({ out: "json", doc: url });
    const res = await fetch(`https://validator.w3.org/nu/?${params}`, {
      headers: {
        "User-Agent": crawlerUserAgent(),
      },
      signal: AbortSignal.timeout(30000),
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      console.warn(`[W3C] HTTP ${res.status}`);
      return null;
    }

    const data = await res.json();
    const messages = Array.isArray(data.messages) ? data.messages : [];

    const errors = messages.filter((m: { type?: string }) => m.type === "error");
    const warnings = messages.filter((m: { type?: string }) => m.type === "info" || m.type === "warning");

    const topIssues = messages
      .filter((m: { type?: string }) => m.type === "error" || m.type === "warning")
      .slice(0, 6)
      .map((m: { type?: string; message?: string; lastLine?: number }) => ({
        type: m.type ?? "info",
        message: typeof m.message === "string" ? m.message : "Validation issue",
        line: typeof m.lastLine === "number" ? m.lastLine : null,
      }));

    return {
      url,
      valid: errors.length === 0,
      errorCount: errors.length,
      warningCount: warnings.length,
      topIssues,
    };
  } catch (err) {
    console.warn("[W3C] failed:", err instanceof Error ? err.message : err);
    return null;
  }
}
