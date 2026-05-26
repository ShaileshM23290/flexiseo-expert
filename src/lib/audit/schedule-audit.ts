import { after } from "next/server";
import { processAudit } from "@/lib/audit/process-audit";
import { generateAIRecommendations } from "@/lib/audit/ai-service";
import { isOpenAIAvailable, isOpenAIAutoGenerateEnabled } from "@/lib/ai/seo-recommendations";

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

/** Run AI enrichment after the audit is already marked completed — report shows immediately. */
export function scheduleAIGeneration(auditId: string) {
  if (!isOpenAIAvailable() || !isOpenAIAutoGenerateEnabled()) return;

  after(async () => {
    try {
      await generateAIRecommendations(auditId);
    } catch (error) {
      console.error(`[Audit ${auditId}] AI generation failed:`, error);
    }
  });
}
