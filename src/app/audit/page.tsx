import type { Metadata } from "next";
import { AuditPageContent } from "@/components/audit/audit-page-content";
import { auditFaqs } from "@/components/audit/audit-page-content";
import { JsonLd } from "@/components/seo/json-ld";
import { faqJsonLd, pageMetadata, softwareApplicationJsonLd, webPageJsonLd } from "@/lib/seo";

const auditTitle = "Free Website SEO Audit";
const auditDescription =
  "Run a free SEO audit on any website. Get Lighthouse scores, Core Web Vitals, security checks, letter grades, and AI-powered fix recommendations — no signup required.";

export const metadata: Metadata = pageMetadata({
  title: auditTitle,
  description: auditDescription,
  path: "/audit",
  keywords: [
    "free website SEO audit",
    "SEO checker",
    "website analyzer",
    "Lighthouse SEO test",
    "Core Web Vitals checker",
    "technical SEO audit free",
  ],
});

export default function AuditPage() {
  return (
    <>
      <JsonLd data={webPageJsonLd({ path: "/audit", title: auditTitle, description: auditDescription })} />
      <JsonLd data={softwareApplicationJsonLd()} />
      <JsonLd data={faqJsonLd(auditFaqs)} />
      <AuditPageContent />
    </>
  );
}
