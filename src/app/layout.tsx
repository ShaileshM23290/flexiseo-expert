import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AppShell } from "@/components/layout/app-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { siteConfig } from "@/lib/config";
import { organizationJsonLd, seoDefaults, websiteJsonLd } from "@/lib/seo";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#a51c1c",
};

export const metadata: Metadata = {
  metadataBase: new URL(seoDefaults.siteUrl),
  title: {
    default: seoDefaults.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: seoDefaults.description,
  keywords: seoDefaults.keywords,
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.company.name, url: siteConfig.company.url }],
  creator: siteConfig.company.name,
  publisher: siteConfig.company.name,
  category: "technology",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: seoDefaults.siteName,
    title: seoDefaults.title,
    description: seoDefaults.description,
    images: [
      {
        url: seoDefaults.ogImage,
        width: seoDefaults.ogImageWidth,
        height: seoDefaults.ogImageHeight,
        alt: seoDefaults.ogImageAlt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: seoDefaults.twitterHandle,
    creator: seoDefaults.twitterHandle,
    title: seoDefaults.title,
    description: seoDefaults.description,
    images: [seoDefaults.ogImage],
  },
  alternates: {
    canonical: seoDefaults.siteUrl,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={inter.variable}>
      <body className="min-h-screen antialiased">
        <JsonLd data={websiteJsonLd()} />
        <JsonLd data={organizationJsonLd()} />
        <div className="flex min-h-screen flex-col">
          <AppShell>{children}</AppShell>
        </div>
      </body>
    </html>
  );
}
