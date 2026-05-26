import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { formatPublicAuditError } from "@/lib/audit/public-errors";

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

  return NextResponse.json({
    ...audit,
    errorMessage: audit.errorMessage
      ? formatPublicAuditError(audit.errorMessage)
      : null,
  });
}
