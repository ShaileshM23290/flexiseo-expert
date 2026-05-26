import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/config";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy",
  description:
    `${siteConfig.name} privacy policy — we do not sell your data. Audit data is used only to analyze websites you submit.`,
  path: "/privacy",
});

const sections = [
  {
    title: "Our commitment",
    body: [
      `${siteConfig.name} is a free SEO audit tool operated by ${siteConfig.company.name}. We built it so you can analyze a website without creating an account or sharing personal details.`,
      "We do not sell your data. We do not rent it, trade it, or use it for advertising. Information you provide is used solely to run the SEO audit and generate your report.",
    ],
  },
  {
    title: "What we collect",
    body: [
      "When you submit a URL for analysis, we store only what is needed to perform and display the audit:",
    ],
    list: [
      "The website URL you enter",
      "Technical SEO findings from publicly accessible pages (titles, meta tags, links, performance metrics, etc.)",
      "Generated audit scores, issues, and AI recommendations tied to that audit",
      "Basic timestamps (when the audit was created and completed)",
    ],
    after: [
      "We do not ask for your name, email address, phone number, payment details, or any other personal information. No signup is required.",
    ],
  },
  {
    title: "What we do not collect",
    body: [
      "We do not intentionally collect private user data from the websites we crawl — only publicly available page content and headers needed for SEO analysis.",
      "We do not track you across other websites, build advertising profiles, or store cookies for marketing purposes.",
    ],
  },
  {
    title: "How your data is used",
    body: [
      "All data we store is used exclusively to:",
    ],
    list: [
      "Crawl and analyze the website you submitted",
      "Calculate SEO scores and generate your report",
      "Optionally produce AI-powered recommendations when OpenAI is enabled",
      "Let you return to your saved report via its unique link",
    ],
    after: [
      "We do not use audit data for any other purpose.",
    ],
  },
  {
    title: "Third-party services",
    body: [
      "To deliver accurate audits, we may send the submitted URL and related technical data to trusted third-party APIs strictly for analysis — for example Google PageSpeed Insights, Chrome UX Report, Mozilla Observatory, and (when configured) OpenAI for AI recommendations.",
      "These services process data according to their own privacy policies. We do not share your data with third parties for their marketing or resale.",
    ],
  },
  {
    title: "Data retention",
    body: [
      "Audit reports are stored in our database so you can view them again using the report link. We retain audit data only as long as needed to operate the service. We may remove old audits periodically to manage storage.",
    ],
  },
  {
    title: "Your choices",
    body: [
      "You choose which URL to analyze. If you do not want an audit stored, simply do not use the tool.",
      "If you have questions about a specific audit or would like it removed, contact us through Flexodyn Solutions Private Limited.",
    ],
  },
  {
    title: "Changes to this policy",
    body: [
      "We may update this Privacy Policy from time to time. The latest version will always be available on this page.",
    ],
  },
  {
    title: "Contact",
    body: [
      `Questions about privacy? Reach out via ${siteConfig.company.name} at ${siteConfig.company.url.replace("https://", "")}.`,
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">
          Legal
        </p>
        <h1 className="mt-3 text-4xl font-bold text-slate-900">Privacy Policy</h1>
        <p className="mt-4 text-slate-600">
          Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </p>

        <div className="mt-10 rounded-xl border border-brand-100 bg-brand-50/60 p-5">
          <p className="text-sm font-medium text-brand-800">
            In short: we don&apos;t collect personal information, we don&apos;t sell or misuse your
            data, and everything we store is used only to analyze the website you submit.
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
              {section.after?.map((paragraph) => (
                <p key={paragraph.slice(0, 40)} className="mt-3 leading-relaxed text-slate-600">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>

        <p className="mt-12 text-sm text-slate-500">
          See also our{" "}
          <Link href="/terms" className="font-medium text-brand-600 hover:text-brand-700">
            Terms of Service
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
