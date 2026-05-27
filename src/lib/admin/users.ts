import { prisma } from "@/lib/db";

export type AdminUserListItem = {
  id: string;
  email: string;
  role: string;
  createdAt: Date;
};

export async function listAdminUsers(): Promise<AdminUserListItem[]> {
  return prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });
}
