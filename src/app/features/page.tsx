import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  FileText,
  Globe,
  Gauge,
  ListChecks,
  Shield,
  Sparkles,
} from "lucide-react";
import { categoryLabels, categories } from "@/lib/config";
import { JsonLd } from "@/components/seo/json-ld";
import { pageMetadata, webPageJsonLd } from "@/lib/seo";
import { siteConfig } from "@/lib/config";

const featuresTitle = "SEO Audit Features & Data Sources";
const featuresDescription =
  "Explore FlexiSeo Expert features: multi-page crawling, Google Lighthouse and CrUX, Open PageRank link authority, Mozilla security grading, W3C validation, and AI fix recommendations.";

export const metadata: Metadata = pageMetadata({
  title: featuresTitle,
  description: featuresDescription,
  path: "/features",
});

const featureList = [
  {
    icon: Globe,
    title: "Multi-Page Crawling",
    description:
      "Crawls your homepage, sitemap URLs, and key pages — up to 15 URLs per audit with broken-link sampling.",
  },
  {
    icon: Gauge,
    title: "Google Lighthouse + CrUX",
    description:
      "Lab scores from PageSpeed Insights plus real-user Core Web Vitals from Chrome UX Report.",
  },
  {
    icon: Shield,
    title: "Security & Trust Scans",
    description:
      "Mozilla Observatory security grade, Google Safe Browsing, SPF/DMARC DNS checks, and W3C HTML validation.",
  },
  {
    icon: Bot,
    title: "AI Expert Recommendations",
    description:
      "OpenAI generates consultant-grade explanations, fix steps, and developer notes for each issue.",
  },
  {
    icon: FileText,
    title: "Executive Summary",
    description:
      "AI-generated headline, assessment, strengths, weaknesses, business impact, and next best actions.",
  },
  {
    icon: ListChecks,
    title: "Prioritized Action Plan",
    description:
      "Quick wins, technical fixes, content improvements, and 7-day / 30-day roadmaps.",
  },
  {
    icon: BarChart3,
    title: "SEOptimer-Style Grades",
    description:
      "Five category letter grades, severity breakdowns, and overall score at a glance.",
  },
  {
    icon: Sparkles,
    title: "Page-Level Insights",
    description:
      "Expandable page breakdowns with AI summaries, main problems, and recommended fixes.",
  },
];

const categoryChecks: Record<(typeof categories)[number], string[]> = {
  onpage: [
    "Title & meta tags",
    "H1–H6 structure",
    "Internal linking & orphan pages",
    "Broken & redirect link checks",
    "Canonical & noindex",
    "Schema markup + W3C HTML",
    "Robots.txt & sitemap",
    "SPF/DMARC email auth",
    "SSL/HTTPS & redirects",
  ],
  links: [
    "Domain authority (Open PageRank)",
    "Inbound link strength score",
    "Google Safe Browsing",
  ],
  usability: [
    "Mobile viewport",
    "Mozilla security grade",
    "Security headers (HSTS, CSP)",
    "Alt text & language",
    "Lighthouse accessibility",
  ],
  performance: [
    "Lighthouse performance score",
    "CrUX real-user CWV",
    "LCP, CLS, INP metrics",
    "Page load & compression",
  ],
  social: [
    "Open Graph tags",
    "Twitter cards",
    "Social profile links",
    "Share image quality",
  ],
};

export default function FeaturesPage() {
  return (
    <>
      <JsonLd
        data={webPageJsonLd({
          path: "/features",
          title: featuresTitle,
          description: featuresDescription,
        })}
      />
    <div className="px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">
            Features
          </p>
          <h1 className="mt-3 text-4xl font-bold text-slate-900 sm:text-5xl">
            Everything a professional SEO audit needs — for free
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">
            {siteConfig.name} combines deterministic crawling with Google&apos;s own APIs,
            Mozilla security scanning, DNS validation, and AI expert guidance — delivering
            reports that rival paid audit platforms.
          </p>
        </div>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featureList.map((feature) => (
            <div key={feature.title} className="glass-card card-hover rounded-xl p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
                <feature.icon className="h-5 w-5 text-brand-600" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-24">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            What we check in each category
          </h2>
          <p className="mt-3 max-w-2xl text-slate-600">
            Five SEOptimer-aligned pillars — now enriched with Google CrUX field data,
            Mozilla Observatory, Safe Browsing, and W3C validation.
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => (
              <div key={cat} className="glass-card rounded-xl p-6">
                <h3 className="font-semibold text-slate-900">{categoryLabels[cat]}</h3>
                <ul className="mt-4 space-y-2">
                  {categoryChecks[cat].map((check) => (
                    <li key={check} className="flex items-start gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                      {check}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-24 grid items-center gap-12 lg:grid-cols-2">
          <Image
            src="/images/feature-analysis.svg"
            alt="SEO analysis features"
            width={560}
            height={420}
            className="w-full rounded-2xl shadow-lg ring-1 ring-slate-200/60"
          />
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Built for teams and founders</h2>
            <p className="mt-4 leading-relaxed text-slate-600">
              Developers get technical fix notes and code examples. Marketers get prioritized
              action plans. Business owners get plain-English impact summaries. Everyone gets
              the same professional-grade report.
            </p>
            <Link
              href="/audit"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
            >
              Try It Free <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
