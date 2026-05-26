import { NextResponse } from "next/server";
import {
  INTEGRATION_IDS,
  isIntegrationId,
  refreshAuditIntegration,
} from "@/lib/audit/integration-refresh";
import { toPublicAuditError } from "@/lib/audit/public-errors";
import { REFRESH_MAX_DURATION } from "@/lib/audit/schedule-audit";

export const maxDuration = REFRESH_MAX_DURATION;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const integration = typeof body.integration === "string" ? body.integration : "";

    if (!isIntegrationId(integration)) {
      return NextResponse.json(
        { error: `Invalid integration. Use one of: ${INTEGRATION_IDS.join(", ")}` },
        { status: 400 }
      );
    }

    const result = await refreshAuditIntegration(id, integration);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error(`[Refresh] Audit integration refresh failed:`, error);
    const message = toPublicAuditError(error);
    const status = error instanceof Error && error.message.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
