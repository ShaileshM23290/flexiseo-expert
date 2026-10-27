import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Code2,
  Gauge,
  ListChecks,
  Megaphone,
  ScanSearch,
  Shield,
  Sparkles,
  Trophy,
} from "lucide-react";
import { AuditUrlForm } from "@/components/audit/audit-url-form";
import { auditFaqs } from "@/components/audit/audit-page-content";
import { CtaBand } from "@/components/marketing/cta-band";
import { SectionHeading } from "@/components/marketing/page-hero";
import { ProductPreview } from "@/components/marketing/product-preview";
import { Reveal } from "@/components/marketing/reveal";
import { JsonLd } from "@/components/seo/json-ld";
import { pageMetadata, webPageJsonLd } from "@/lib/seo";
import { siteConfig } from "@/lib/config";

const homeTitle = "Free AI SEO Audit Tool for Any Website";
const homeDescription =
  "Analyze any website with a free AI SEO audit — Lighthouse scores, Core Web Vitals, security headers, DNS checks, and prioritized fix recommendations. No signup required.";

export const metadata: Metadata = pageMetadata({
  title: homeTitle,
  description: homeDescription,
  path: "/",
  absoluteTitle: true,
});

const dataSources = [
  "Google Lighthouse",
  "Chrome UX Report",
  "Mozilla Observatory",
  "Google Safe Browsing",
  "W3C Validator",
  "Open PageRank",
];

const vitals = [
  { name: "LCP", value: "2.1s", label: "Largest Contentful Paint", good: 78, status: "Good", tone: "text-emerald-700" },
  { name: "INP", value: "240ms", label: "Interaction to Next Paint", good: 61, status: "Needs work", tone: "text-amber-700" },
  { name: "CLS", value: "0.04", label: "Cumulative Layout Shift", good: 92, status: "Good", tone: "text-emerald-700" },
];

const securityChecks = [
  { label: "HTTPS & HSTS", ok: true },
  { label: "SPF & DMARC records", ok: true },
  { label: "Safe Browsing clean", ok: true },
  { label: "Content-Security-Policy", ok: false },
];

const grades = [
  { label: "On-Page", grade: "A-", tone: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  { label: "Performance", grade: "C", tone: "bg-amber-50 text-amber-700 ring-amber-200" },
  { label: "Usability", grade: "A", tone: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  { label: "Backlinks", grade: "B-", tone: "bg-sky-50 text-sky-700 ring-sky-200" },
  { label: "Social", grade: "D+", tone: "bg-rose-50 text-rose-700 ring-rose-200" },
];

const plan = [
  { when: "Today", title: "6 quick wins", detail: "Meta descriptions, alt text, OG image" },
  { when: "7 days", title: "Technical fixes", detail: "Image compression, preload, CSP header" },
  { when: "30 days", title: "Growth work", detail: "Content depth and internal linking" },
];

const steps = [
  {
    icon: ScanSearch,
    title: "Enter your URL",
    description: "No account or credit card. Paste your website address and the audit starts instantly.",
  },
  {
    icon: Gauge,
    title: "Deep analysis",
    description: "We crawl up to 15 pages, run 50+ checks and query Google, Mozilla and DNS services.",
  },
  {
    icon: Sparkles,
    title: "Your action plan",
    description: "Grades, prioritized issues and AI-written fixes — plus a PDF you can share with your team.",
  },
];

const stats = [
  { value: "50+", label: "Checks per audit" },
  { value: "15", label: "Pages crawled" },
  { value: "6", label: "Data sources" },
  { value: "~2 min", label: "Time to report" },
];

const audiences = [
  {
    icon: Briefcase,
    title: "Business owners",
    description: "Plain-English summaries of what's costing you traffic, and the business impact of fixing it.",
  },
  {
    icon: Megaphone,
    title: "Marketers & agencies",
    description: "Category grades and 7/30-day roadmaps to plan SEO work and report progress to clients.",
  },
  {
    icon: Code2,
    title: "Developers",
    description: "Affected URLs, technical detail and code-level fix notes your team can ship the same day.",
  },
];

function BentoCard({
  className = "",
  icon: Icon,
  title,
  description,
  children,
  delay,
}: {
  className?: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <Reveal delay={delay} className={`mk-card mk-card-hover flex flex-col overflow-hidden ${className}`}>
      <div className="p-6 pb-0">
        <div className="flex items-center gap-2 text-sm font-semibold text-brand-700">
          <Icon className="h-4 w-4" />
          {title}
        </div>
        <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{description}</p>
      </div>
      <div className="mt-6 flex-1 px-6 pb-6">{children}</div>
    </Reveal>
  );
}

export default function HomePage() {
  return (
    <>
      <JsonLd
        data={webPageJsonLd({
          path: "/",
          title: homeTitle,
          description: homeDescription,
        })}
      />

      {/* Hero */}
      <section className="mk-mesh relative isolate overflow-hidden px-4 pt-16 sm:px-6 sm:pt-24">
        <div className="mk-dots absolute inset-0 -z-10" aria-hidden />
        <div className="mx-auto max-w-3xl text-center">
          <Link
            href="/features"
            className="group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 py-1 pl-1 pr-3 text-[13px] text-slate-600 shadow-sm backdrop-blur transition-colors hover:border-slate-300"
          >
            <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[11px] font-semibold text-white">New</span>
            AI action plans with 7 and 30-day roadmaps
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>

          <h1 className="mt-7 font-heading text-[2.6rem] font-bold leading-[1.06] tracking-[-0.03em] text-slate-900 sm:text-6xl lg:text-[4.25rem]">
            The SEO audit that tells you{" "}
            <span className="relative whitespace-nowrap text-brand-600">
              what to fix first
              <svg
                viewBox="0 0 300 12"
                className="absolute -bottom-2 left-0 h-3 w-full text-brand-200"
                preserveAspectRatio="none"
                aria-hidden
              >
                <path d="M2 9C60 3 150 1 298 7" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
              </svg>
            </span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-slate-600 sm:text-xl">
            {siteConfig.name} combines real Google data, security scans and AI analysis into one
            consultant-grade report — free, in about two minutes.
          </p>

          <div className="mx-auto mt-9 max-w-2xl text-left">
            <AuditUrlForm variant="hero" inputId="hero-audit-url" />
          </div>

          <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-600">
            {["No signup required", "50+ checks", "AI fix recommendations", "PDF export"].map((item) => (
              <li key={item} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <Reveal className="mx-auto mt-16 max-w-6xl sm:mt-20">
          <ProductPreview />
        </Reveal>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white to-transparent" aria-hidden />
      </section>

      {/* Data sources */}
      <section className="bg-white px-4 pb-16 pt-12 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <p className="text-center text-sm text-slate-500">
            Every report is built on data from the sources search engines and security teams trust
          </p>
          <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {dataSources.map((source) => (
              <li key={source} className="font-heading text-[15px] font-semibold tracking-tight text-slate-400">
                {source}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Bento features */}
      <section className="border-t border-slate-200 bg-slate-50/60 px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <SectionHeading
              align="center"
              eyebrow="Everything in one report"
              title="A full technical SEO lab, not just a checklist"
              description="Most free tools stop at title tags. We go deeper — performance, security, structure and content — then explain every finding like a senior consultant."
            />
          </Reveal>

          <div className="mt-16 grid gap-5 lg:grid-cols-6">
            <BentoCard
              className="lg:col-span-4"
              icon={Gauge}
              title="Real-user Core Web Vitals"
              description="Lighthouse lab scores combined with field data from the Chrome UX Report — what your actual visitors experience."
            >
              <div className="grid gap-3 sm:grid-cols-3">
                {vitals.map((v) => (
                  <div key={v.name} className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-baseline justify-between">
                      <span className="font-heading text-sm font-bold text-slate-900">{v.name}</span>
                      <span className={`text-[11px] font-semibold ${v.tone}`}>{v.status}</span>
                    </div>
                    <p className="mt-2 font-heading text-2xl font-bold text-slate-900">{v.value}</p>
                    <p className="text-[11px] text-slate-500">{v.label}</p>
                    <div className="mt-3 flex h-1.5 overflow-hidden rounded-full">
                      <span className="bg-emerald-500" style={{ width: `${v.good}%` }} />
                      <span className="bg-amber-400" style={{ width: `${(100 - v.good) * 0.65}%` }} />
                      <span className="flex-1 bg-rose-400" />
                    </div>
                  </div>
                ))}
              </div>
            </BentoCard>

            <BentoCard
              className="lg:col-span-2"
              icon={Shield}
              title="Security & trust"
              description="Headers, Safe Browsing, email authentication and HTML validity."
              delay={80}
            >
              <ul className="space-y-2">
                {securityChecks.map((c) => (
                  <li
                    key={c.label}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-700"
                  >
                    {c.label}
                    {c.ok ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-200">
                        Fix
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </BentoCard>

            <BentoCard
              className="lg:col-span-2"
              icon={Trophy}
              title="Clear letter grades"
              description="Five categories graded A+ to F, so you see where you win and lose."
            >
              <div className="flex flex-wrap gap-2">
                {grades.map((g) => (
                  <span
                    key={g.label}
                    className={`inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] font-medium ring-1 ${g.tone}`}
                  >
                    {g.label}
                    <span className="font-heading font-bold">{g.grade}</span>
                  </span>
                ))}
              </div>
            </BentoCard>

            <BentoCard
              className="lg:col-span-2"
              icon={Sparkles}
              title="AI fix guidance"
              description="Why it matters, how to fix it, and the code to do it."
              delay={80}
            >
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-[13px] font-semibold text-slate-900">Add a meta description to /pricing</p>
                <p className="mt-1 text-[12px] leading-relaxed text-slate-600">
                  Write 140–160 characters with your primary keyword to lift click-through rate.
                </p>
                <div className="mt-3 flex gap-1.5">
                  <span className="rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700 ring-1 ring-rose-200">
                    High impact
                  </span>
                  <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                    Quick fix
                  </span>
                </div>
              </div>
            </BentoCard>

            <BentoCard
              className="lg:col-span-2"
              icon={ListChecks}
              title="Prioritized roadmap"
              description="Ordered by impact and effort, so the biggest wins come first."
              delay={160}
            >
              <ol className="relative space-y-3 border-l border-slate-200 pl-4">
                {plan.map((p) => (
                  <li key={p.when} className="relative">
                    <span className="absolute -left-[1.3rem] top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-brand-600 ring-1 ring-brand-200" />
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{p.when}</p>
                    <p className="text-[13px] font-semibold text-slate-900">{p.title}</p>
                    <p className="text-[12px] text-slate-500">{p.detail}</p>
                  </li>
                ))}
              </ol>
            </BentoCard>
          </div>
        </div>
      </section>

      {/* How it works — dark */}
      <section className="mk-section-dark overflow-hidden px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <Reveal className="max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-[0.1em] text-brand-300">How it works</span>
            <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-white sm:text-[2.5rem] sm:leading-tight">
              From URL to action plan in about two minutes
            </h2>
            <p className="mt-4 text-lg text-slate-400">
              No installs, no tracking scripts, no account. Just a clear picture of your site&apos;s health.
            </p>
          </Reveal>

          <ol className="mt-14 grid gap-5 md:grid-cols-3">
            {steps.map((step, i) => (
              <Reveal as="li" key={step.title} delay={i * 100} className="mk-card-on-dark p-6">
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.06] ring-1 ring-white/10">
                    <step.icon className="h-5 w-5 text-brand-300" />
                  </span>
                  <span className="font-mono text-sm text-slate-500">0{i + 1}</span>
                </div>
                <h3 className="mt-6 font-heading text-lg font-semibold text-white">{step.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-slate-400">{step.description}</p>
              </Reveal>
            ))}
          </ol>

          <dl className="mt-14 grid grid-cols-2 gap-y-8 border-t border-white/10 pt-10 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label}>
                <dt className="text-sm text-slate-400">{s.label}</dt>
                <dd className="mt-1 font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Audiences */}
      <section className="bg-white px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <SectionHeading
              align="center"
              eyebrow="Built for your whole team"
              title="One report, written for everyone who touches your site"
            />
          </Reveal>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {audiences.map((a, i) => (
              <Reveal key={a.title} delay={i * 80} className="mk-card mk-card-hover p-7">
                <div className="mk-icon-tile">
                  <a.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-heading text-lg font-semibold text-slate-900">{a.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{a.description}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-slate-200 bg-slate-50/60 px-4 py-24 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1fr_1.6fr]">
          <Reveal>
            <SectionHeading
              eyebrow="FAQ"
              title="Questions, answered"
              description="Still curious? Run an audit — it's free and takes about two minutes."
            />
            <Link href="/audit" className="mk-btn-primary mt-8">
              Start free audit <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
          <div className="space-y-3">
            {auditFaqs.map((faq) => (
              <details key={faq.question} className="mk-card group p-5 open:shadow-sm">
                <summary className="flex list-none items-center justify-between gap-4 font-heading font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
                  {faq.question}
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-[15px] leading-relaxed text-slate-600">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
