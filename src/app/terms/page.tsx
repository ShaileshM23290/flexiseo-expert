import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/config";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Terms of Service",
  description:
    `Terms for using ${siteConfig.name} — free SEO audits. We do not sell or misuse your data.`,
  path: "/terms",
});

const sections = [
  {
    title: "Agreement",
    body: [
      `By using ${siteConfig.name}, you agree to these Terms of Service. If you do not agree, please do not use the tool.`,
      `${siteConfig.name} is provided free of charge by ${siteConfig.company.name} as an SEO analysis service.`,
    ],
  },
  {
    title: "What the service does",
    body: [
      `${siteConfig.name} crawls publicly accessible pages of a website you submit, runs technical SEO checks, and generates a report with scores, findings, and optional AI recommendations.`,
      "You must only submit URLs you own or have permission to analyze. Do not use this tool to probe systems you are not authorized to test.",
    ],
  },
  {
    title: "No account required",
    body: [
      `You can use ${siteConfig.name} without creating an account. We do not collect personal information such as your name, email, or payment details to run an audit.`,
    ],
  },
  {
    title: "Data use and privacy",
    body: [
      "We do not sell, rent, or misuse your data. Information associated with an audit — including the URL you submit and the technical results we generate — is used only to analyze that website and deliver your report.",
      "We do not use audit data for advertising, profiling, or any purpose unrelated to providing the SEO audit service.",
    ],
    linkToPrivacy: true,
  },
  {
    title: "Third-party analysis",
    body: [
      "Audits may rely on third-party APIs (e.g. Google Lighthouse, Chrome UX Report, Mozilla Observatory, OpenAI) to enrich results. These services receive the submitted URL and data necessary to perform their analysis. We do not authorize third parties to use your data for their own marketing.",
    ],
  },
  {
    title: "AI recommendations",
    body: [
      "When OpenAI is enabled, audit findings may be sent to generate AI summaries and fix suggestions. AI output is advisory only — always verify recommendations before applying changes to a live website.",
      "We do not guarantee ranking improvements, traffic increases, or specific SEO outcomes.",
    ],
  },
  {
    title: "Acceptable use",
    body: [
      "You agree not to:",
    ],
    list: [
      "Submit URLs you do not have the right to analyze",
      "Attempt to overload, reverse-engineer, or disrupt the service",
      "Use the tool for unlawful purposes",
      "Misrepresent audit results as official guarantees from Google or any search engine",
    ],
  },
  {
    title: "Disclaimer",
    body: [
      `${siteConfig.name} is provided "as is" without warranties of any kind. Audit results are based on automated checks and may not capture every SEO issue. We are not liable for decisions you make based on the report.`,
    ],
  },
  {
    title: "Changes and availability",
    body: [
      "We may modify, suspend, or discontinue the service at any time. We may update these Terms; continued use after changes means you accept the updated Terms.",
    ],
  },
  {
    title: "Contact",
    body: [
      `Questions about these Terms? Contact ${siteConfig.company.name} at ${siteConfig.company.url.replace("https://", "")}.`,
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">
          Legal
        </p>
        <h1 className="mt-3 text-4xl font-bold text-slate-900">Terms of Service</h1>
        <p className="mt-4 text-slate-600">
          Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </p>

        <div className="mt-10 rounded-xl border border-brand-100 bg-brand-50/60 p-5">
          <p className="text-sm font-medium text-brand-800">
            By using {siteConfig.name}, you agree that we use submitted data only to analyze
            websites — never to sell, rent, or misuse it.
          </p>
        </div>

        <div className="mt-10 space-y-10">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-xl font-semibold text-slate-900">{section.title}</h2>
              {section.body.map((paragraph) => (
                <p key={paragraph.slice(0, 40)} className="mt-3 leading-relaxed text-slate-600">
                  {paragraph}
                </p>
              ))}
              {section.list && (
                <ul className="mt-3 list-disc space-y-1.5 pl-5 text-slate-600">
                  {section.list.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
              {"linkToPrivacy" in section && section.linkToPrivacy && (
                <p className="mt-3 text-slate-600">
                  For full details, read our{" "}
                  <Link href="/privacy" className="font-medium text-brand-600 hover:text-brand-700">
                    Privacy Policy
                  </Link>
                  .
                </p>
              )}
            </section>
          ))}
        </div>

        <p className="mt-12 text-sm text-slate-500">
          See also our{" "}
          <Link href="/privacy" className="font-medium text-brand-600 hover:text-brand-700">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
