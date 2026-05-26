import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { getSession } from "@/lib/auth/session";
import { siteConfig } from "@/lib/config";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Admin Login",
  description: `${siteConfig.name} admin dashboard`,
  path: "/admin/login",
  noIndex: true,
});

export default async function AdminLoginPage() {
  const session = await getSession();
  if (session?.role === "admin") {
    redirect("/admin");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Suspense fallback={<div className="text-slate-400">Loading…</div>}>
        <AdminLoginForm />
      </Suspense>
    </div>
  );
}
