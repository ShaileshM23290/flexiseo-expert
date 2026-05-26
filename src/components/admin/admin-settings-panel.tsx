"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import type { AdminSettingsInfo } from "@/lib/admin/settings";
import { formatAdminDateShort } from "@/lib/admin/format";

export function AdminSettingsPanel({ settings }: { settings: AdminSettingsInfo }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to update password.");
        return;
      }
      setSuccess("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="glass-card rounded-xl p-6">
        <h2 className="text-base font-semibold text-slate-900">Account</h2>
        <p className="mt-1 text-sm text-slate-500">Your admin profile details.</p>
        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Email</dt>
            <dd className="mt-1 text-sm font-medium text-slate-900">{settings.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Role</dt>
            <dd className="mt-1 text-sm font-medium capitalize text-slate-900">{settings.role}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Member since</dt>
            <dd className="mt-1 text-sm text-slate-700">{formatAdminDateShort(settings.memberSince)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">App URL</dt>
            <dd className="mt-1 text-sm text-slate-700">{settings.appUrl}</dd>
          </div>
        </dl>
      </section>

      <section className="glass-card rounded-xl p-6">
        <h2 className="text-base font-semibold text-slate-900">Change password</h2>
        <p className="mt-1 text-sm text-slate-500">Use a strong password you don&apos;t use elsewhere.</p>

        <form onSubmit={handlePasswordChange} className="mt-5 max-w-md space-y-4">
          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          {success && (
            <p className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {success}
            </p>
          )}

          <div>
            <label htmlFor="current-password" className="block text-sm font-medium text-slate-700">
              Current password
            </label>
            <input
              id="current-password"
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-slate-700">
              New password
            </label>
            <input
              id="new-password"
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-700">
              Confirm new password
            </label>
            <input
              id="confirm-password"
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Update password
          </button>
        </form>
      </section>

      <section className="glass-card rounded-xl p-6">
        <h2 className="text-base font-semibold text-slate-900">System status</h2>
        <p className="mt-1 text-sm text-slate-500">Integration health for the audit engine.</p>
        <ul className="mt-5 space-y-3">
          <StatusRow label="OpenAI (AI recommendations)" ok={settings.openAiConfigured} />
          <StatusRow
            label="OpenAI auto-generate on every audit"
            ok={settings.openAiAutoGenerate}
            note={settings.openAiAutoGenerate ? "Runs once per audit" : "Disabled — set OPENAI_AUTO_GENERATE=false"}
          />
          <StatusRow label="Google PageSpeed / CrUX / Safe Browsing" ok={settings.pageSpeedConfigured} />
          <StatusRow label="Open PageRank API (Links category)" ok={settings.backlinkApiConfigured} />
          <StatusRow label="IP restriction rules" ok={false} note="Coming soon" />
        </ul>
      </section>
    </div>
  );
}

function StatusRow({ label, ok, note }: { label: string; ok: boolean; note?: string }) {
  return (
    <li className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
      <span className="text-sm text-slate-700">{label}</span>
      {note ? (
        <span className="text-xs font-medium text-slate-400">{note}</span>
      ) : (
        <span
          className={`text-xs font-semibold ${ok ? "text-emerald-600" : "text-amber-600"}`}
        >
          {ok ? "Configured" : "Not configured"}
        </span>
      )}
    </li>
  );
}
