import type { MetadataRoute } from "next";
import { seoDefaults } from "@/lib/seo";

const privatePaths = ["/api/", "/audits/", "/admin/"];

const aiCrawlers = [
  "GPTBot",
  "ChatGPT-User",
  "ClaudeBot",
  "anthropic-ai",
  "Google-Extended",
  "PerplexityBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: privatePaths,
      },
      ...aiCrawlers.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: privatePaths,
      })),
    ],
    sitemap: `${seoDefaults.siteUrl}/sitemap.xml`,
    host: seoDefaults.siteUrl.replace(/^https?:\/\//, ""),
  };
}
