import type { Metadata } from "next";
import { AdminUsersPanel } from "@/components/admin/admin-users-panel";
import { listAdminUsers } from "@/lib/admin/users";
import { requireAdminRole } from "@/lib/auth/require-staff";
import type { AdminRole } from "@/lib/auth/roles";
import { siteConfig } from "@/lib/config";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Admin Users",
  description: `${siteConfig.name} admin user management`,
  path: "/admin/users",
  noIndex: true,
});

export default async function AdminUsersPage() {
  const session = await requireAdminRole();
  const users = await listAdminUsers();

  return (
    <div className="w-full max-w-4xl">
      <AdminUsersPanel
        currentUserId={session.sub}
        users={users.map((user) => ({
          id: user.id,
          email: user.email,
          role: user.role as AdminRole,
          createdAt: user.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
