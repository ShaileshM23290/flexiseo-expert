import { after } from "next/server";
import { processAudit } from "@/lib/audit/process-audit";

/**
 * Run a full audit after the HTTP response is sent.
 * Required on Vercel serverless — fire-and-forget promises are killed when the lambda freezes.
 */
export function scheduleAudit(auditId: string, url: string) {
  after(async () => {
    try {
      await processAudit(auditId, url);
    } catch (error) {
      console.error(`[Audit ${auditId}] Unhandled background error:`, error);
    }
  });
}

/** Max seconds for audit background work (crawl + APIs + optional AI). Vercel Pro allows up to 300. */
export const AUDIT_MAX_DURATION = 300;

/** Max seconds for single integration refresh (PageSpeed can be slow). */
export const REFRESH_MAX_DURATION = 120;
