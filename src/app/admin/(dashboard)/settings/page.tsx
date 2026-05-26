import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminSettingsPanel } from "@/components/admin/admin-settings-panel";
import { getAdminSettingsInfo } from "@/lib/admin/settings";
import { requireAdmin } from "@/lib/auth/require-admin";
import { siteConfig } from "@/lib/config";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Admin Settings",
  description: `${siteConfig.name} admin settings`,
  path: "/admin/settings",
  noIndex: true,
});

export default async function AdminSettingsPage() {
  const session = await requireAdmin();
  const settings = await getAdminSettingsInfo(session.sub);
  if (!settings) notFound();

  return (
    <div className="w-full max-w-4xl">
      <AdminSettingsPanel settings={settings} />
    </div>
  );
}
