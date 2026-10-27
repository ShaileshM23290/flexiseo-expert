import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, Target, Users } from "lucide-react";
import { siteConfig } from "@/lib/config";
import { CtaBand } from "@/components/marketing/cta-band";
import { PageHero } from "@/components/marketing/page-hero";
import { JsonLd } from "@/components/seo/json-ld";
import { pageMetadata, webPageJsonLd } from "@/lib/seo";

const aboutTitle = "About FlexiSeo Expert";
const aboutDescription =
  "FlexiSeo Expert is a free AI SEO audit tool by Flexodyn Solutions — built for founders, marketers, and developers who need actionable technical SEO insights.";

export const metadata: Metadata = pageMetadata({
  title: aboutTitle,
  description: aboutDescription,
  path: "/about",
});

const values = [
  {
    icon: Target,
    title: "Actionable Insights",
    description:
      "Every recommendation is specific, practical, and tied to your actual audit data — not generic SEO blog advice.",
  },
  {
    icon: Users,
    title: "For Every Skill Level",
    description:
      "Plain-English explanations for business owners, developer notes for engineers, and prioritized plans for marketers.",
  },
  {
    icon: Building2,
    title: "Built by Practitioners",
    description:
      "Developed by Flexodyn Solutions Private Limited — a team with 15+ years of web development and digital marketing experience.",
  },
];

export default function AboutPage() {
  return (
    <>
      <JsonLd
        data={webPageJsonLd({
          path: "/about",
          title: aboutTitle,
          description: aboutDescription,
        })}
      />
      <PageHero
        eyebrow="About us"
        title={
          <>
            Professional SEO audits, <span className="mk-accent">powered by AI</span>
          </>
        }
        description={`${siteConfig.name} bridges the gap between automated SEO tools and expensive consultant reports — rigorous technical analysis plus AI expert guidance.`}
      />

      <section className="px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:items-start">
            <div>
              <span className="mk-eyebrow">Our mission</span>
              <h2 className="mt-4 font-heading text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                Tell you what&apos;s wrong — and how to fix it
              </h2>
            </div>
            <div className="mk-card p-8 sm:p-10">
              <p className="text-lg leading-relaxed text-slate-700">
                Most SEO tools tell you what is wrong but not how to fix it — or why it matters for
                your business. {siteConfig.name} acts like a senior technical SEO consultant:
                explaining each issue, prioritizing actions by impact and effort, and delivering
                page-specific fixes you can implement today.
              </p>
              <p className="mt-4 leading-relaxed text-slate-600">
                We crawl your website and run deterministic checks across On-Page SEO, Links,
                Usability, Performance, and Social. Then AI generates executive summaries, category
                insights, and detailed recommendations that make your report feel professionally
                reviewed.
              </p>
            </div>
          </div>

          <div className="mt-20 grid gap-6 sm:grid-cols-3">
            {values.map((value) => (
              <div key={value.title} className="mk-card mk-card-hover p-7">
                <div className="mk-icon-tile">
                  <value.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-heading text-lg font-bold text-slate-900">{value.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{value.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-20 mk-card overflow-hidden p-8 text-center sm:p-12">
            <span className="mk-eyebrow">Powered by</span>
            <h2 className="mt-4 font-heading text-2xl font-extrabold text-slate-900 sm:text-3xl">
              {siteConfig.company.name}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-slate-600">
              Flexodyn Solutions ships production-ready websites, AI integrations, and digital
              marketing solutions for clients worldwide. {siteConfig.name} is our free tool to help
              businesses understand and improve their SEO.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a
                href={siteConfig.company.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mk-btn-secondary"
              >
                Visit Flexodyn Solutions
              </a>
              <Link href="/audit" className="mk-btn-primary">
                Try {siteConfig.name} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
