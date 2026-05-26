import type { MetadataRoute } from "next";
import { seoDefaults } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/audits/", "/admin/"],
    },
    sitemap: `${seoDefaults.siteUrl}/sitemap.xml`,
  };
}
