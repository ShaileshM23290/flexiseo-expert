import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Cpu, Sparkles, ScanSearch, FileBarChart } from "lucide-react";
import { auditLoadingSteps } from "@/lib/config";
import { CtaBand } from "@/components/marketing/cta-band";
import { PageHero, SectionHeading } from "@/components/marketing/page-hero";
import { JsonLd } from "@/components/seo/json-ld";
import { pageMetadata, webPageJsonLd } from "@/lib/seo";

const howTitle = "How the SEO Audit Works";
const howDescription =
  "See how FlexiSeo Expert crawls your site, runs 50+ SEO checks, scores five categories, and generates AI-powered recommendations in under two minutes.";

export const metadata: Metadata = pageMetadata({
  title: howTitle,
  description: howDescription,
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
      "AI analyzes your audit data to generate executive summaries, category insights, issue-level fix guidance, and action plans.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <JsonLd
        data={webPageJsonLd({
          path: "/how-it-works",
          title: howTitle,
          description: howDescription,
        })}
      />
      <PageHero
        eyebrow="How it works"
        title={
          <>
            From URL to expert report <span className="mk-accent">in under 2 minutes</span>
          </>
        }
        description="A multi-layer pipeline — crawl, score, enrich with Google & Mozilla APIs, then AI writes your fix plan."
      >
        <Link href="/audit" className="mk-btn-primary">
          Start my audit <ArrowRight className="h-4 w-4" />
        </Link>
      </PageHero>

      <section className="px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <ol className="relative space-y-6 before:absolute before:bottom-8 before:left-7 before:top-8 before:w-px before:bg-gradient-to-b before:from-brand-300 before:via-brand-200 before:to-transparent sm:before:left-9">
            {steps.map((item) => (
              <li key={item.step} className="relative flex gap-5 sm:gap-7">
                <div className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-[0_12px_30px_-10px_rgba(165,28,28,0.7)] sm:h-[4.5rem] sm:w-[4.5rem]">
                  <item.icon className="h-6 w-6 sm:h-7 sm:w-7" />
                </div>
                <div className="mk-card mk-card-hover flex-1 p-6 sm:p-7">
                  <span className="font-heading text-sm font-bold tracking-wider text-brand-500">
                    STEP {item.step}
                  </span>
                  <h3 className="mt-1 font-heading text-xl font-bold text-slate-900">{item.title}</h3>
                  <p className="mt-2 leading-relaxed text-slate-600">{item.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <SectionHeading
            align="center"
            eyebrow="Live progress"
            title="What happens during your audit"
            description="You'll watch every stage complete in real time."
          />
          <ul className="mt-12 grid gap-3 sm:grid-cols-2">
            {auditLoadingSteps.map((step, i) => (
              <li key={step} className="mk-card flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-slate-700">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 font-heading text-xs font-bold text-brand-700">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
