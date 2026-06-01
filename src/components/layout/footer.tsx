import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FooterLogo } from "@/components/layout/footer-logo";
import { BuyCoffeeButton } from "@/components/support/buy-coffee-button";
import { siteConfig } from "@/lib/config";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

const exploreLinks = [...siteConfig.nav];

const legalLinks = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
];

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
      <div className="mt-2.5">{children}</div>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-300">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4 sm:gap-x-8">
          {/* Col 1 — brand */}
          <div className="col-span-2 sm:col-span-1">
            <FooterLogo />
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              {siteConfig.tagline} — Lighthouse, CrUX, security scans, and AI fix recommendations.
            </p>
            
          </div>

          {/* Col 2 — explore */}
          <FooterColumn title="Explore">
            <ul className="space-y-1.5">
              {exploreLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="cursor-pointer text-sm text-slate-300 transition-colors hover:text-brand-400"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </FooterColumn>

          {/* Col 3 — legal */}
          <FooterColumn title="Legal">
            <ul className="space-y-1.5">
              {legalLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="cursor-pointer text-sm text-slate-300 transition-colors hover:text-brand-400"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </FooterColumn>

          {/* Col 4 — CTA */}
          <FooterColumn title="Get started">
            <p className="text-sm text-slate-300">Free audit. No signup.</p>
            <div className="mt-3 flex w-full flex-col gap-3">
              <Link
                href="/audit"
                className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-500"
              >
                Analyze your site
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <BuyCoffeeButton variant="footer" />
            </div>
            <div className="mt-3 flex gap-2">
              <a
                href={siteConfig.company.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-slate-700 text-slate-300 transition-colors hover:border-brand-500 hover:text-brand-400"
                aria-label="Instagram"
              >
                <InstagramIcon className="h-3.5 w-3.5" />
              </a>
              <a
                href={siteConfig.company.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-slate-700 text-slate-300 transition-colors hover:border-brand-500 hover:text-brand-400"
                aria-label="LinkedIn"
              >
                <LinkedInIcon className="h-3.5 w-3.5" />
              </a>
            </div>
          </FooterColumn>
        </div>

        <div className="mt-6 flex flex-col gap-1 border-t border-slate-800 pt-4 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.</p>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Link href="/llms.txt" className="cursor-pointer text-slate-400 hover:text-brand-300">
              llms.txt
            </Link>
            <span aria-hidden>·</span>
            <Link href="/ai.txt" className="cursor-pointer text-slate-400 hover:text-brand-300">
              ai.txt
            </Link>
            <span aria-hidden>·</span>
            Powered by{" "}
            <a
              href={siteConfig.company.url}
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer text-slate-300 hover:text-brand-400"
            >
              {siteConfig.company.name}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
