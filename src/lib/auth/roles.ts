export const ADMIN_ROLES = ["admin", "moderator", "viewer"] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export function isAdminRole(role: string): role is AdminRole {
  return (ADMIN_ROLES as readonly string[]).includes(role);
}

export function canAccessAdmin(role: string): boolean {
  return isAdminRole(role);
}

export function canManageUsers(role: AdminRole): boolean {
  return role === "admin";
}

export function canDeleteAllAudits(role: AdminRole): boolean {
  return role === "admin" || role === "moderator";
}

export function canViewSystemSettings(role: AdminRole): boolean {
  return role === "admin" || role === "moderator";
}

export function roleLabel(role: AdminRole): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}
