import { NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword } from "@/lib/auth/password";
import { ADMIN_ROLES } from "@/lib/auth/roles";
import { requireAdminSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

const updateUserSchema = z.object({
  role: z.enum(ADMIN_ROLES).optional(),
  password: z.string().min(8).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminSession();
    const { id } = await params;
    const body = updateUserSchema.parse(await request.json());

    if (!body.role && !body.password) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (body.role && user.id === session.sub && body.role !== "admin") {
      return NextResponse.json({ error: "You cannot demote your own admin account" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(body.role ? { role: body.role } : {}),
        ...(body.password ? { passwordHash: await hashPassword(body.password) } : {}),
      },
      select: { id: true, email: true, role: true, createdAt: true },
    });

    return NextResponse.json({
      user: { ...updated, createdAt: updated.createdAt.toISOString() },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Update admin user error:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminSession();
    const { id } = await params;

    if (id === session.sub) {
      return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Delete admin user error:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
