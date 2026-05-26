import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, Target, Users } from "lucide-react";
import { siteConfig } from "@/lib/config";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "About",
  description:
    `Learn about ${siteConfig.name} — a free AI-powered SEO audit tool powered by Flexodyn Solutions Private Limited for founders, marketers, and developers.`,
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
    <div className="px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-brand-600">
            About
          </p>
          <h1 className="mt-3 text-4xl font-bold text-slate-900 sm:text-5xl">
            Professional SEO audits, powered by AI
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-slate-600">
            {siteConfig.name} was built to bridge the gap between automated SEO tools
            and expensive consultant reports. We combine rigorous technical analysis
            with AI-generated expert guidance so you get the best of both worlds.
          </p>
        </div>

        <div className="mt-16 glass-card rounded-xl p-8 sm:p-10">
          <h2 className="text-2xl font-semibold text-slate-900">Our mission</h2>
          <p className="mt-4 leading-relaxed text-slate-600">
            Most SEO tools tell you what is wrong but not how to fix it — or why it
            matters for your business. {siteConfig.name} acts like a senior technical
            SEO consultant: explaining each issue, prioritizing actions by impact and
            effort, and delivering page-specific fix suggestions you can implement
            today.
          </p>
          <p className="mt-4 leading-relaxed text-slate-600">
            The tool crawls your website and runs deterministic checks across On-Page
            SEO, Links, Usability, Performance, and Social — the same five categories
            used by leading audit platforms. Then, when configured with OpenAI, it
            generates executive summaries, category insights, and detailed
            recommendations that make your report feel professionally reviewed.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {values.map((value) => (
            <div key={value.title} className="glass-card rounded-xl p-6 text-center">
              <value.icon className="mx-auto h-7 w-7 text-brand-600" />
              <h3 className="mt-4 font-semibold text-slate-900">{value.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{value.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 glass-card rounded-xl p-8 text-center">
          <p className="text-sm uppercase tracking-widest text-brand-600">
            Powered by
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">
            {siteConfig.company.name}
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-slate-600">
            Flexodyn Solutions Private Limited ships production-ready websites, AI integrations, and
            digital marketing solutions for clients worldwide. {siteConfig.name} is our
            free tool to help businesses understand and improve their SEO.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <a
              href={siteConfig.company.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm text-slate-700 hover:border-brand-300 hover:text-brand-600"
            >
              Visit Flexodyn Solutions Private Limited
            </a>
            <Link
              href="/audit"
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Try {siteConfig.name} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
