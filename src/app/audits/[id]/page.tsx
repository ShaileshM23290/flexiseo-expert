import type { Metadata } from "next";
import AuditReport from "@/components/audit/audit-report";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "SEO Audit Report",
  description: "View your website SEO audit results.",
  noIndex: true,
});

export default async function AuditResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AuditReport auditId={id} />;
}
