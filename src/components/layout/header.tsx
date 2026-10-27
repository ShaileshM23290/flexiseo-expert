"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Menu, X } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { BuyCoffeeButton } from "@/components/support/buy-coffee-button";
import { siteConfig } from "@/lib/config";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b bg-white/85 backdrop-blur-xl transition-shadow duration-300",
        scrolled
          ? "border-slate-200/80 shadow-[0_8px_30px_-12px_rgba(15,23,42,0.18)]"
          : "border-transparent"
      )}
    >
      <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between gap-4 px-4 sm:h-20 sm:px-6">
        <Logo />

        <nav className="hidden items-center gap-1 rounded-full border border-slate-200/80 bg-slate-50/80 p-1 md:flex">
          {siteConfig.nav.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
                  active
                    ? "bg-white text-brand-700 shadow-sm ring-1 ring-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <BuyCoffeeButton variant="header" />
          <Link href="/audit" className="mk-btn-primary hidden rounded-xl px-4 py-2 text-sm md:inline-flex">
            Start Free Audit
            <ArrowRight className="h-4 w-4" />
          </Link>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-100 bg-white px-4 py-4 shadow-lg md:hidden">
          <nav className="flex flex-col gap-1">
            {siteConfig.nav.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "rounded-xl px-3 py-2.5 text-sm font-medium",
                    active ? "bg-brand-50 text-brand-700" : "text-slate-700 hover:bg-slate-50"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
            <BuyCoffeeButton
              variant="header"
              className="mt-1 inline-flex w-full justify-center sm:hidden"
              onOpen={() => setMobileOpen(false)}
            />
            <Link
              href="/audit"
              onClick={() => setMobileOpen(false)}
              className="mk-btn-primary mt-2 w-full rounded-xl py-3 text-sm"
            >
              Start Free Audit
              <ArrowRight className="h-4 w-4" />
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
