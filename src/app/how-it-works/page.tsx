import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Cpu, Sparkles, ScanSearch, FileBarChart } from "lucide-react";
import { auditLoadingSteps, siteConfig } from "@/lib/config";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "How It Works",
  description:
    `Learn how ${siteConfig.name} analyzes your website with Google Lighthouse, CrUX field data, security scans, and AI SEO recommendations.`,
  path: "/how-it-works",
});

const steps = [
  {
    step: "01",
    icon: ScanSearch,
    title: "Enter your website URL",
    description:
      "Paste your domain or full URL. No signup, no credit card — we validate the URL and start immediately.",
  },
  {
    step: "02",
    icon: Cpu,
    title: "Deep crawl & technical analysis",
    description:
      "We read robots.txt, discover your sitemap, crawl up to 15 pages, and run 50+ deterministic SEO checks across five categories.",
  },
  {
    step: "03",
    icon: FileBarChart,
    title: "Free API enrichment",
    description:
      "Google Lighthouse and CrUX field data, Mozilla Observatory security grade, Safe Browsing, DNS (SPF/DMARC), and W3C HTML validation.",
  },
  {
    step: "04",
    icon: Sparkles,
    title: "AI expert recommendations",
    description:
      "OpenAI analyzes your audit data to generate executive summaries, category insights, issue-level fix guidance, and action plans.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">
            How It Works
          </p>
          <h1 className="mt-3 text-4xl font-bold text-slate-900 sm:text-5xl">
            From URL to expert report in under 2 minutes
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            A multi-layer pipeline — crawl, score, enrich with Google & Mozilla APIs,
            then AI writes your fix plan.
          </p>
        </div>

        <div className="mt-16 space-y-5">
          {steps.map((item) => (
            <div key={item.step} className="glass-card card-hover flex gap-5 rounded-xl p-6 sm:gap-6 sm:p-8">
              <div className="flex shrink-0 flex-col items-center gap-3">
                <span className="font-display text-2xl font-bold text-brand-200">{item.step}</span>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
                  <item.icon className="h-5 w-5 text-brand-600" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 leading-relaxed text-slate-600">{item.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 glass-card rounded-xl p-8">
          <h2 className="text-xl font-semibold text-slate-900">During your audit</h2>
          <p className="mt-2 text-sm text-slate-600">
            Real-time progress through these steps:
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {auditLoadingSteps.map((step, i) => (
              <li key={step} className="flex items-center gap-3 text-sm text-slate-700">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-600">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/audit"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
          >
            Start Your Audit <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
