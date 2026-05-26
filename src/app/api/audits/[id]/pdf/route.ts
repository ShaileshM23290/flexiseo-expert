import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auditPdfFilename, generateAuditPdf } from "@/lib/audit/pdf-report";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const audit = await prisma.audit.findUnique({
    where: { id },
    include: {
      pages: { orderBy: { url: "asc" } },
      issues: { orderBy: [{ severity: "asc" }, { category: "asc" }] },
    },
  });

  if (!audit) {
    return NextResponse.json({ error: "Audit not found" }, { status: 404 });
  }

  if (audit.status !== "completed") {
    return NextResponse.json(
      { error: "PDF is available once the audit is completed" },
      { status: 409 }
    );
  }

  try {
    const pdf = await generateAuditPdf(audit);
    const filename = auditPdfFilename(audit.domain);

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        "X-PDF-Generated-At": new Date().toISOString(),
        "X-PDF-Version": "2",
      },
    });
  } catch (error) {
    console.error(`[PDF] Failed to generate audit ${id}:`, error);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
