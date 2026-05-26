import { NextResponse } from "next/server";
import { getAdminOverview } from "@/lib/admin/stats";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const overview = await getAdminOverview();
  return NextResponse.json(overview);
}
