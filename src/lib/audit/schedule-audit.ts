import { after } from "next/server";
import { processAudit } from "@/lib/audit/process-audit";

/**
 * Run a full audit after the HTTP response is sent.
 * Required on Vercel serverless — fire-and-forget promises are killed when the lambda freezes.
 *
 * Route handlers must export literal maxDuration values (300 audit, 120 refresh) — see vercel.json.
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
