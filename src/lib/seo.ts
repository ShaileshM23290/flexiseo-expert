import type { Metadata } from "next";
import { siteConfig } from "./config";

const siteUrl = siteConfig.url.replace(/\/$/, "");

export const seoDefaults = {
  siteName: siteConfig.name,
  siteUrl,
  title: `Free AI SEO Audit | ${siteConfig.name}`,
  description: siteConfig.description,
  ogImage: "/logo.png",
  ogImageAlt: `${siteConfig.name} — ${siteConfig.tagline}`,
  keywords: [
    "SEO audit",
    "free SEO checker",
    "website SEO analysis",
    "Lighthouse audit",
    "Core Web Vitals",
    "AI SEO recommendations",
    "technical SEO",
    "on-page SEO",
  ],
  twitterHandle: "@flexodynsolutions",
};

type PageSeo = {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
  noIndex?: boolean;
};

export function pageMetadata({
  title,
  description,
  path = "",
  keywords,
  noIndex = false,
}: PageSeo): Metadata {
  const url = `${siteUrl}${path}`;
  const fullTitle = path === "" || path === "/" ? title : `${title} | ${siteConfig.name}`;

  return {
    title,
    description,
    keywords: keywords ?? seoDefaults.keywords,
    ...(noIndex ? {} : { alternates: { canonical: url } }),
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true, googleBot: { index: true, follow: true } },
    openGraph: {
      type: "website",
      locale: "en_US",
      url,
      siteName: siteConfig.name,
      title: fullTitle,
      description,
      images: [
        {
          url: seoDefaults.ogImage,
          width: 1133,
          height: 394,
          alt: seoDefaults.ogImageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [seoDefaults.ogImage],
    },
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteUrl,
    description: siteConfig.description,
    publisher: { "@id": `${siteUrl}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/audit?url={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: siteConfig.company.name,
    url: siteConfig.company.url,
    sameAs: [siteConfig.company.instagram, siteConfig.company.linkedin],
  };
}

export function softwareApplicationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: siteConfig.name,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    description: siteConfig.description,
    url: `${siteUrl}/audit`,
  };
}

export function faqJsonLd(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export const staticRoutes = [
  { path: "/", priority: 1, changeFrequency: "weekly" as const },
  { path: "/audit", priority: 0.95, changeFrequency: "weekly" as const },
  { path: "/features", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/how-it-works", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/about", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" as const },
];
