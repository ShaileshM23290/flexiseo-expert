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
import { CtaBand } from "@/components/marketing/cta-band";
import { PageHero, SectionHeading } from "@/components/marketing/page-hero";
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
      <PageHero
        eyebrow="Features"
        title={
          <>
            Everything a professional SEO audit needs — <span className="mk-accent">for free</span>
          </>
        }
        description={`${siteConfig.name} combines deep crawling with Google's own APIs, Mozilla security scanning, DNS validation, and AI expert guidance — reports that rival paid audit platforms.`}
      >
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/audit" className="mk-btn-primary">
            Audit my site free <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/how-it-works" className="mk-btn-secondary">
            How it works
          </Link>
        </div>
      </PageHero>

    <div className="px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featureList.map((feature) => (
            <div key={feature.title} className="mk-card mk-card-hover p-6">
              <div className="mk-icon-tile">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 font-heading text-base font-bold text-slate-900">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-28">
          <SectionHeading
            eyebrow="Coverage"
            title="What we check in each category"
            description="Five pillars enriched with Google CrUX field data, Mozilla Observatory, Safe Browsing, and W3C validation."
          />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => (
              <div key={cat} className="mk-card p-6">
                <h3 className="font-heading text-lg font-bold text-slate-900">{categoryLabels[cat]}</h3>
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
            className="w-full rounded-3xl shadow-2xl ring-1 ring-slate-200/70"
          />
          <div>
            <span className="mk-eyebrow">For everyone</span>
            <h2 className="mt-4 font-heading text-3xl font-extrabold tracking-tight text-slate-900">
              Built for teams and founders
            </h2>
            <p className="mt-4 leading-relaxed text-slate-600">
              Developers get technical fix notes and code examples. Marketers get prioritized
              action plans. Business owners get plain-English impact summaries. Everyone gets
              the same professional-grade report.
            </p>
            <Link href="/audit" className="mk-btn-primary mt-8">
              Try It Free <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
      <CtaBand />
    </>
  );
}
