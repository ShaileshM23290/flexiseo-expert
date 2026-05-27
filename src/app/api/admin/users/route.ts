import { NextResponse } from "next/server";
import { z } from "zod";
import { listAdminUsers } from "@/lib/admin/users";
import { hashPassword } from "@/lib/auth/password";
import { ADMIN_ROLES } from "@/lib/auth/roles";
import { requireAdminSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(ADMIN_ROLES),
});

export async function GET() {
  try {
    await requireAdminSession();
    const users = await listAdminUsers();
    return NextResponse.json({
      users: users.map((u) => ({
        ...u,
        createdAt: u.createdAt.toISOString(),
      })),
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminSession();
    const body = createUserSchema.parse(await request.json());
    const email = body.email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await hashPassword(body.password),
        role: body.role,
      },
      select: { id: true, email: true, role: true, createdAt: true },
    });

    return NextResponse.json({
      user: { ...user, createdAt: user.createdAt.toISOString() },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Create admin user error:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
