import { AdminShell } from "@/components/admin/admin-shell";
import { requireStaff } from "@/lib/auth/require-staff";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireStaff();

  return (
    <AdminShell adminEmail={session.email} adminRole={session.role}>
      {children}
    </AdminShell>
  );
}
