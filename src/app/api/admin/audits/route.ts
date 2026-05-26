import { NextResponse } from "next/server";
import { getAuditsPaginated } from "@/lib/admin/stats";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const result = await getAuditsPaginated({
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
  });

  return NextResponse.json(result);
}

export async function DELETE() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await prisma.audit.deleteMany({});
    return NextResponse.json({ deleted: result.count });
  } catch (error) {
    console.error("Bulk delete audits error:", error);
    return NextResponse.json({ error: "Failed to delete audits" }, { status: 500 });
  }
}
