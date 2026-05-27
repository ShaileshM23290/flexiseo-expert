"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Trash2, UserPlus } from "lucide-react";
import { ADMIN_ROLES, roleLabel, type AdminRole } from "@/lib/auth/roles";
import { formatAdminDateShort } from "@/lib/admin/format";

type UserRow = {
  id: string;
  email: string;
  role: AdminRole;
  createdAt: string;
};

export function AdminUsersPanel({
  users: initialUsers,
  currentUserId,
}: {
  users: UserRow[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AdminRole>("viewer");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setCreating(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create user");
        return;
      }
      setUsers((prev) => [...prev, data.user]);
      setEmail("");
      setPassword("");
      setRole("viewer");
      setSuccess(`Added ${data.user.email} as ${roleLabel(data.user.role as AdminRole)}.`);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  async function handleRoleChange(userId: string, newRole: AdminRole) {
    setBusyId(userId);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to update role");
        return;
      }
      setUsers((prev) => prev.map((u) => (u.id === userId ? data.user : u)));
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(userId: string, userEmail: string) {
    if (!window.confirm(`Remove ${userEmail} from admin access?`)) return;

    setBusyId(userId);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to delete user");
        return;
      }
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setSuccess(`Removed ${userEmail}.`);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-brand-600" />
          <h2 className="text-base font-semibold text-slate-900">Add admin user</h2>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Grant access to the admin panel with Admin, Moderator, or Viewer role.
        </p>

        <form onSubmit={handleCreate} className="mt-5 grid gap-4 sm:grid-cols-2">
          {error && (
            <p className="sm:col-span-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          {success && (
            <p className="sm:col-span-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {success}
            </p>
          )}

          <div className="sm:col-span-2">
            <label htmlFor="user-email" className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="user-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <label htmlFor="user-password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="user-password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <label htmlFor="user-role" className="block text-sm font-medium text-slate-700">
              Role
            </label>
            <select
              id="user-role"
              value={role}
              onChange={(e) => setRole(e.target.value as AdminRole)}
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              {ADMIN_ROLES.map((r) => (
                <option key={r} value={r}>
                  {roleLabel(r)}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {creating && <Loader2 className="h-4 w-4 animate-spin" />}
              Add user
            </button>
          </div>
        </form>

        <dl className="mt-6 grid gap-3 rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="font-semibold text-slate-900">Admin</dt>
            <dd className="mt-1 text-slate-600">Full access, manage users, delete audits, system settings.</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-900">Moderator</dt>
            <dd className="mt-1 text-slate-600">View all data, delete audits, change own password.</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-900">Viewer</dt>
            <dd className="mt-1 text-slate-600">Read-only access to audits and IP usage.</dd>
          </div>
        </dl>
      </section>

      <section className="glass-card overflow-hidden rounded-xl">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">Admin users</h2>
          <p className="mt-1 text-sm text-slate-500">{users.length} user{users.length === 1 ? "" : "s"} with admin access</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Added</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => {
                const isSelf = user.id === currentUserId;
                const busy = busyId === user.id;
                return (
                  <tr key={user.id} className="text-slate-700">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {user.email}
                      {isSelf && (
                        <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                          You
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={user.role}
                        disabled={busy || (isSelf && user.role === "admin")}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as AdminRole)}
                        className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm disabled:opacity-60"
                      >
                        {ADMIN_ROLES.map((r) => (
                          <option key={r} value={r}>
                            {roleLabel(r)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{formatAdminDateShort(user.createdAt)}</td>
                    <td className="px-6 py-4 text-right">
                      {!isSelf && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleDelete(user.id, user.email)}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                        >
                          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
