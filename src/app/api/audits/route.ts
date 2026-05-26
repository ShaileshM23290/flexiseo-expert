import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { formatUrl, getDomain } from "@/lib/utils";
import { scheduleAudit } from "@/lib/audit/schedule-audit";
import { resolveClientIp } from "@/lib/request-ip";

/** Vercel Pro allows up to 300s for background audit work (crawl + APIs + AI). */
export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const url = formatUrl(body.url ?? "");

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const clientIp = resolveClientIp(request, typeof body.clientIp === "string" ? body.clientIp : null);
    const userAgent = request.headers.get("user-agent");

    const audit = await prisma.audit.create({
      data: {
        url,
        domain: getDomain(url),
        status: "running",
        clientIp,
        userAgent,
      },
    });

    scheduleAudit(audit.id, url);

    return NextResponse.json({ id: audit.id, status: "running" });
  } catch (error) {
    console.error("Create audit error:", error);
    return NextResponse.json({ error: "Failed to start audit" }, { status: 500 });
  }
}

export async function GET() {
  const audits = await prisma.audit.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      url: true,
      domain: true,
      status: true,
      overallScore: true,
      totalIssues: true,
      createdAt: true,
      completedAt: true,
    },
  });
  return NextResponse.json(audits);
}
