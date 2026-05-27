import { redirect } from "next/navigation";
import { getSession, type SessionPayload } from "@/lib/auth/session";
import { canAccessAdmin, canManageUsers, type AdminRole } from "@/lib/auth/roles";

export async function requireStaff(): Promise<SessionPayload & { role: AdminRole }> {
  const session = await getSession();
  if (!session || !canAccessAdmin(session.role)) {
    redirect("/admin/login");
  }
  return session as SessionPayload & { role: AdminRole };
}

export async function requireAdminRole(): Promise<SessionPayload & { role: "admin" }> {
  const session = await requireStaff();
  if (session.role !== "admin") {
    redirect("/admin");
  }
  return session as SessionPayload & { role: "admin" };
}

export { canManageUsers };
