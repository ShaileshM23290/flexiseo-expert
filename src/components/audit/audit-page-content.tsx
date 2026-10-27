import Link from "next/link";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Gauge,
  Link2,
  Share2,
  Shield,
  Smartphone,
} from "lucide-react";
import { AuditUrlForm } from "@/components/audit/audit-url-form";
import { CtaBand } from "@/components/marketing/cta-band";
import { categoryDescriptions, categoryLabels, categories, siteConfig } from "@/lib/config";

const categoryIcons = {
  onpage: BarChart3,
  links: Link2,
  usability: Smartphone,
  performance: Gauge,
  social: Share2,
} as const;

const processSteps = [
  { step: "1", title: "Enter your URL", desc: "No account or credit card required." },
  { step: "2", title: "We crawl & analyze", desc: "Up to 15 pages, 50+ checks, Google APIs." },
  { step: "3", title: "Get your report", desc: "Letter grades, issues, and AI fix plan." },
];

const trustPoints = [
  "Google Lighthouse & CrUX field data",
  "Mozilla Observatory security grade",
  "Safe Browsing & SPF/DMARC checks",
  "W3C HTML validation",
  "AI executive summary & action plan",
  "Results saved — revisit anytime",
];

const sampleGrades = [
  { cat: "On-Page", grade: "B+", color: "text-sky-700 bg-sky-50 border-sky-200" },
  { cat: "Links", grade: "A-", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  { cat: "Usability", grade: "B", color: "text-sky-700 bg-sky-50 border-sky-200" },
  { cat: "Performance", grade: "C+", color: "text-amber-700 bg-amber-50 border-amber-200" },
  { cat: "Social", grade: "A", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
];

export const auditFaqs = [
  {
    question: "Is the SEO audit really free?",
    answer:
      `Yes. ${siteConfig.name} is free to use with no signup required. Enter any public website URL and receive a full technical SEO report.`,
  },
  {
    question: "What does the audit check?",
    answer:
      "We run 50+ checks across On-Page SEO, Links, Usability, Performance, and Social — including Lighthouse scores, real-user CrUX data, security headers, DNS records, and HTML validation.",
  },
  {
    question: "How long does an audit take?",
    answer:
      "Most audits complete in under two minutes. We crawl your site, call Google and Mozilla APIs, and optionally generate AI recommendations.",
  },
  {
    question: "Do I need to install anything?",
    answer:
      `No. ${siteConfig.name} runs entirely in the browser. Paste your URL and we handle crawling and analysis on our servers.`,
  },
];

export function AuditPageContent() {
  return (
    <>
      {/* Hero + form */}
      <section className="mk-hero overflow-hidden px-4 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-20">
        <div className="mk-grid-light absolute inset-0 -z-10" aria-hidden />
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div>
            <div className="mb-5 flex flex-wrap gap-2">
              <span className="mk-badge">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Free
              </span>
              <span className="mk-badge">No signup</span>
              <span className="mk-badge">Results in ~2 minutes</span>
            </div>
            <h1 className="font-heading text-4xl font-bold leading-[1.12] tracking-tight text-slate-900 sm:text-5xl">
              Free website SEO audit
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-slate-600">
              Analyze any website for on-page SEO, Core Web Vitals, security and technical
              issues — powered by Google Lighthouse, CrUX and AI expert recommendations.
            </p>

            <div className="mt-8">
              <AuditUrlForm variant="hero" inputId="audit-page-url" />
            </div>

            <ul className="mt-7 grid gap-2.5 sm:grid-cols-2">
              {trustPoints.slice(0, 4).map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Sample report preview */}
          <div className="mk-panel mx-auto w-full max-w-md overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Sample report preview
              </p>
            </div>
            <div className="p-5 sm:p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 font-heading text-2xl font-bold text-emerald-700">
                  B+
                </div>
                <div>
                  <p className="font-heading font-semibold text-slate-900">Overall SEO grade</p>
                  <p className="text-sm text-slate-500">example.com · 12 pages crawled</p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {sampleGrades.map((g) => (
                  <div key={g.cat} className={`rounded-lg border px-3 py-2 text-center ${g.color}`}>
                    <p className="text-[10px] font-medium uppercase tracking-wide opacity-80">{g.cat}</p>
                    <p className="font-heading text-lg font-bold">{g.grade}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-center gap-2 rounded-lg border border-brand-100 bg-brand-50/60 px-3 py-2.5 text-sm text-brand-700">
                <Shield className="h-4 w-4 shrink-0" />
                AI fix recommendations for every issue
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="px-4 py-14 sm:px-6" aria-labelledby="audit-categories-heading">
        <div className="mx-auto max-w-6xl">
          <h2 id="audit-categories-heading" className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Five categories, one complete picture
          </h2>
          <p className="mt-2 max-w-2xl text-slate-600">
            Every audit scores your site the way professional tools do — with letter grades
            and actionable findings in each pillar.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => {
              const Icon = categoryIcons[cat];
              return (
                <article key={cat} className="mk-card mk-card-hover p-6">
                  <div className="mk-icon-tile">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-heading text-lg font-bold text-slate-900">{categoryLabels[cat]}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                    {categoryDescriptions[cat]}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="border-y border-slate-200 bg-slate-50 px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-bold text-slate-900">How your audit runs</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {processSteps.map((item) => (
              <div key={item.step} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                  {item.step}
                </span>
                <div>
                  <h3 className="font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-8 flex items-center gap-2 text-sm text-slate-500">
            <Clock className="h-4 w-4" />
            Typical runtime: 1–2 minutes depending on site size and API response times.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 py-14 sm:px-6" aria-labelledby="audit-faq-heading">
        <div className="mx-auto max-w-3xl">
          <h2 id="audit-faq-heading" className="text-2xl font-bold text-slate-900">
            Frequently asked questions
          </h2>
          <dl className="mt-6 space-y-4">
            {auditFaqs.map((faq) => (
              <div key={faq.question} className="mk-card p-6">
                <dt className="font-semibold text-slate-900">{faq.question}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-slate-600">{faq.answer}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Bottom CTA */}
      <CtaBand
        title="Ready to see where your site stands?"
        description="Join founders and marketers who use their free report to fix what's actually holding their rankings back."
        href="#audit-page-url"
        label="Start free audit"
      />
    </>
  );
}
