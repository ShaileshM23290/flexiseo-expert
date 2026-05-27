import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminSettingsPanel } from "@/components/admin/admin-settings-panel";
import { getAdminSettingsInfo } from "@/lib/admin/settings";
import { requireStaff } from "@/lib/auth/require-staff";
import { siteConfig } from "@/lib/config";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Admin Settings",
  description: `${siteConfig.name} admin settings`,
  path: "/admin/settings",
  noIndex: true,
});

export default async function AdminSettingsPage() {
  const session = await requireStaff();
  const settings = await getAdminSettingsInfo(session.sub);
  if (!settings) notFound();

  return (
    <div className="w-full max-w-4xl">
      <AdminSettingsPanel settings={settings} showSystemStatus={session.role !== "viewer"} />
    </div>
  );
}
