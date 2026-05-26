import type { Metadata } from "next";
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

export const metadata: Metadata = {
  metadataBase: new URL(seoDefaults.siteUrl),
  title: {
    default: seoDefaults.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: seoDefaults.description,
  keywords: seoDefaults.keywords,
  authors: [{ name: "Flexodyn Solutions Private Limited", url: "https://www.flexodynsolutions.com" }],
  creator: "Flexodyn Solutions Private Limited",
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
        width: 1133,
        height: 394,
        alt: seoDefaults.ogImageAlt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: seoDefaults.title,
    description: seoDefaults.description,
    images: [seoDefaults.ogImage],
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
