import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { processAudit, resetAuditForRerun } from "@/lib/audit/process-audit";

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
    processAudit(id, audit.url).catch((err) => {
      console.error("Re-audit processing failed:", err);
    });

    return NextResponse.json({ id, status: "running" });
  } catch (error) {
    console.error("Re-audit error:", error);
    return NextResponse.json({ error: "Failed to start re-audit" }, { status: 500 });
  }
}
