import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import {
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle2,
  Globe,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react";
import { AuditUrlForm } from "@/components/audit/audit-url-form";
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

const features = [
  {
    icon: Brain,
    title: "AI SEO Consultant",
    description:
      "Every issue gets why-it-matters context, step-by-step fixes, developer notes, and priority badges — not generic tips.",
  },
  {
    icon: BarChart3,
    title: "SEOptimer-Style Grades",
    description:
      "Five categories — On-Page, Links, Usability, Performance, Social — each with letter grades from A+ to F.",
  },
  {
    icon: Globe,
    title: "Google-Powered Metrics",
    description:
      "Lighthouse lab scores plus real-user CrUX field data, Safe Browsing, and Mozilla security grading.",
  },
  {
    icon: Shield,
    title: "Trust & Security Scan",
    description:
      "SPF/DMARC email auth, security headers, malware checks, and W3C HTML validation — all included free.",
  },
  {
    icon: Zap,
    title: "Prioritized Action Plans",
    description:
      "Quick wins, 7-day and 30-day roadmaps sorted by impact and effort so you fix what matters first.",
  },
  {
    icon: Sparkles,
    title: "Page-Level Breakdown",
    description:
      "See every crawled page with issue counts, AI summaries, and targeted recommendations per URL.",
  },
];

const dataSources = [
  "Google Lighthouse",
  "Chrome UX Report",
  "Mozilla Observatory",
  "Safe Browsing",
  "W3C Validator",
  "DNS (SPF/DMARC)",
];

const steps = [
  "Paste your URL — no signup required",
  "We crawl up to 15 pages and run 50+ checks",
  "Free APIs enrich your report with field data & security",
  "AI writes your executive summary and fix plan",
];

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
      <section className="hero-glow hero-grid relative overflow-hidden px-4 pb-24 pt-16 sm:px-6 sm:pt-28">
        <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-2">
          <div className="animate-fade-up">
            <div className="mb-5 flex flex-wrap gap-2">
              <span className="stat-pill">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                Free · No signup
              </span>
              <span className="stat-pill">50+ SEO checks</span>
              <span className="stat-pill">AI-powered fixes</span>
            </div>
            <h1 className="font-display text-4xl font-bold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.25rem]">
              Professional SEO audits,{" "}
              <span className="gradient-text">powered by real data</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
              Paste your URL and get a consultant-grade report in minutes — Lighthouse scores,
              real-user Core Web Vitals, security grading, DNS checks, and AI fix recommendations.
            </p>

            <div className="mt-8 max-w-xl">
              <AuditUrlForm variant="hero" inputId="hero-audit-url" />
            </div>

            <ul className="mt-8 space-y-2">
              {steps.map((step) => (
                <li key={step} className="flex items-start gap-2 text-sm text-slate-600">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                  {step}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative hidden lg:block">
            <div className="absolute -inset-6 rounded-3xl bg-gradient-to-br from-brand-100/80 via-white to-slate-100 blur-2xl" />
            <Image
              src="/images/hero-seo-audit.svg"
              alt="SEO audit dashboard visualization"
              width={640}
              height={480}
              className="relative w-full rounded-2xl shadow-xl ring-1 ring-slate-200/60"
              priority
            />
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-500">
            Trusted data sources
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {dataSources.map((source) => (
              <span key={source} className="text-sm font-medium text-slate-600">
                {source}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">
              Why {siteConfig.name}
            </p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
              More than a crawler — a full technical SEO lab
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Most free tools stop at title tags. We combine deterministic crawling with
              Google&apos;s own APIs, security scanners, and AI to deliver reports that
              agencies charge hundreds for.
            </p>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="glass-card card-hover rounded-xl p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50">
                  <feature.icon className="h-5 w-5 text-brand-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 px-4 py-20 sm:px-6">
        <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-2">
          <Image
            src="/images/feature-ai-expert.svg"
            alt="AI SEO expert recommendations"
            width={560}
            height={420}
            className="w-full rounded-2xl shadow-lg ring-1 ring-slate-200/60"
          />
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">
              AI Expert Layer
            </p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900">
              Fixes explained like a senior consultant would
            </h2>
            <p className="mt-4 leading-relaxed text-slate-600">
              Each issue includes why it matters for rankings and conversions, how to fix it
              in plain English, developer notes with code examples, and impact/effort badges.
              Plus executive summaries, category insights, and 7/30-day action plans.
            </p>
            <Link
              href="/features"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            >
              Explore all features <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="glass-card overflow-hidden rounded-2xl">
            <div className="grid lg:grid-cols-2">
              <div className="p-8 sm:p-10">
                <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                  Ready to see where you stand?
                </h2>
                <p className="mt-3 text-slate-600">
                  Run a free audit in under two minutes. Results are saved — come back anytime
                  to track improvements.
                </p>
                <div className="mt-8">
                  <AuditUrlForm inputId="footer-audit-url" />
                </div>
              </div>
              <div className="hidden bg-gradient-to-br from-brand-600 to-brand-700 p-8 text-white lg:flex lg:flex-col lg:justify-center lg:p-10">
                <p className="text-sm font-medium uppercase tracking-widest text-white/80">
                  What you get
                </p>
                <ul className="mt-4 space-y-3">
                  {[
                    "Overall letter grade + 5 category scores",
                    "CrUX real-user speed data",
                    "Security & DNS configuration report",
                    "AI executive summary & action plan",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-white">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-white/80" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
