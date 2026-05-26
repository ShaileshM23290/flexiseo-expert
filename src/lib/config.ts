export const siteConfig = {
  name: "FlexiSeo Expert",
  tagline: "Free AI SEO Audit",
  description:
    "Free AI-powered SEO audits with Lighthouse, CrUX field data, security scans, DNS checks, and expert fix recommendations.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  company: {
    name: "Flexodyn Solutions Private Limited",
    url: "https://www.flexodynsolutions.com",
    instagram: "https://www.instagram.com/flexodynsolutions/",
    linkedin: "https://www.linkedin.com/company/flexodyn-solutions/",
  },
  nav: [
    { label: "Home", href: "/" },
    { label: "Features", href: "/features" },
    { label: "How It Works", href: "/how-it-works" },
    { label: "About", href: "/about" },
  ],
};

/** Crawler / API client user-agent — includes public site URL from env. */
export function crawlerUserAgent(suffix?: string): string {
  const site = siteConfig.url.replace(/\/$/, "");
  const base = `${siteConfig.name}/1.0 (+${site})`;
  return suffix ? `${base} ${suffix}` : base;
}

export const auditLoadingSteps = [
  "Validating website",
  "Reading robots.txt & sitemap",
  "Crawling pages",
  "Checking on-page SEO & site structure",
  "Checking link authority (Open PageRank)",
  "Running Google Lighthouse (PageSpeed)",
  "Fetching real-user CrUX data",
  "Scanning security headers (Mozilla)",
  "Checking Safe Browsing & DNS",
  "Validating HTML markup (W3C)",
  "Preparing your report",
];

export { maxIssuesForAI, maxPagesForAISummary } from "./ai/config";

/** SEOptimer-aligned report categories */
export const categories = [
  "onpage",
  "links",
  "usability",
  "performance",
  "social",
] as const;

export type Category = (typeof categories)[number];

export const categoryLabels: Record<Category, string> = {
  onpage: "On-Page SEO",
  links: "Backlinks",
  usability: "Usability",
  performance: "Performance",
  social: "Social",
};

export const categoryDescriptions: Record<Category, string> = {
  onpage:
    "Title tags, meta descriptions, headings, internal links, broken links, canonical, indexability, schema, robots & sitemap.",
  links:
    "Inbound link authority via Open PageRank (free) — domain strength signal used by SEO audit tools.",
  usability:
    "Mobile viewport, language, favicon, alt text, device readiness, and accessibility basics.",
  performance: "Page load time, page size, compression, and Core Web Vitals (when available).",
  social: "Open Graph, Twitter Cards, and visible social profile links.",
};

/** Map legacy category values stored in older audits */
export const legacyCategoryMap: Record<string, Category> = {
  technical: "onpage",
  content: "onpage",
  accessibility: "usability",
  schema: "onpage",
  onpage: "onpage",
  links: "links",
  usability: "usability",
  performance: "performance",
  social: "social",
};

export function normalizeCategory(category: string): Category {
  return legacyCategoryMap[category] ?? "onpage";
}
