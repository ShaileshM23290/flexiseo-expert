"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { BuyCoffeeButton } from "@/components/support/buy-coffee-button";
import { siteConfig } from "@/lib/config";
import { cn } from "@/lib/utils";

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-lg">
      <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between gap-4 px-4 sm:h-20 sm:px-6">
        <Logo />

        <nav className="hidden items-center gap-8 md:flex">
          {siteConfig.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-brand-600"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <BuyCoffeeButton variant="header" />
          <Link
            href="/audit"
            className="hidden rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 hover:shadow md:inline-flex"
          >
            Start Free Audit
          </Link>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-100 bg-white px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {siteConfig.nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {item.label}
              </Link>
            ))}
            <BuyCoffeeButton
              variant="header"
              className="mt-1 inline-flex w-full justify-center sm:hidden"
              onOpen={() => setMobileOpen(false)}
            />
            <Link
              href="/audit"
              onClick={() => setMobileOpen(false)}
              className={cn(
                "mt-2 rounded-lg bg-brand-600 px-3 py-2.5 text-center text-sm font-semibold text-white"
              )}
            >
              Start Free Audit
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
