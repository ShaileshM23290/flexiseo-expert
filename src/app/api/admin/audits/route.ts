import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { canDeleteAllAudits } from "@/lib/auth/roles";
import { getSession } from "@/lib/auth/session";

const deleteSchema = z.object({
  ids: z.array(z.string()).min(1),
});

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session || !canDeleteAllAudits(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = deleteSchema.parse(await request.json());
    const result = await prisma.audit.deleteMany({
      where: { id: { in: body.ids } },
    });
    return NextResponse.json({ deleted: result.count });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    console.error("Bulk delete audits error:", error);
    return NextResponse.json({ error: "Failed to delete audits" }, { status: 500 });
  }
}
