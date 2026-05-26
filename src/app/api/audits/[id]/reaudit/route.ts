import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resetAuditForRerun } from "@/lib/audit/process-audit";
import { scheduleAudit } from "@/lib/audit/schedule-audit";

/** Vercel Pro allows up to 300s for background audit work (crawl + APIs + AI). */
export const maxDuration = 300;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const audit = await prisma.audit.findUnique({ where: { id } });
  if (!audit) {
    return NextResponse.json({ error: "Audit not found" }, { status: 404 });
  }

  if (audit.status === "running") {
    return NextResponse.json({ error: "Audit is already running" }, { status: 409 });
  }

  try {
    await resetAuditForRerun(id);
    scheduleAudit(id, audit.url);

    return NextResponse.json({ id, status: "running" });
  } catch (error) {
    console.error("Re-audit error:", error);
    return NextResponse.json({ error: "Failed to start re-audit" }, { status: 500 });
  }
}
