import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth/require-staff";

/** @deprecated Use requireStaff() or requireAdminRole() */
export async function requireAdmin() {
  return requireStaff();
}
