import Link from "next/link";
import { LogoMark } from "@/components/layout/logo-mark";
import { siteConfig } from "@/lib/config";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  variant?: "header" | "footer";
  showTagline?: boolean;
  href?: string | false;
  className?: string;
}

export function BrandLogo({
  variant = "header",
  showTagline = false,
  href = "/",
  className,
}: BrandLogoProps) {
  const isFooter = variant === "footer";

  const mark = (
    <div className={cn("flex items-center gap-3", className)}>
      <LogoMark gradientId={`flexiseo-logo-${variant}`} className="h-10 w-10 rounded-2xl sm:h-11 sm:w-11" />
      <div className="leading-none">
        <p
          className={cn(
            "font-bold tracking-tight",
            isFooter ? "text-xl sm:text-2xl" : "text-xl sm:text-2xl md:text-[1.65rem]"
          )}
        >
          <span className={isFooter ? "text-brand-400" : "text-brand-600"}>Flexi</span>
          <span className={isFooter ? "text-white" : "text-slate-900"}>Seo</span>
        </p>
        <p
          className={cn(
            "mt-1 flex items-center gap-1.5 font-semibold uppercase tracking-[0.2em]",
            isFooter ? "text-[10px] text-brand-400 sm:text-[11px]" : "text-[10px] text-brand-600 sm:text-[11px]"
          )}
        >
          <span
            className={cn("h-px w-3 sm:w-4", isFooter ? "bg-brand-400" : "bg-brand-600")}
            aria-hidden
          />
          Expert
          <span
            className={cn("h-px w-3 sm:w-4", isFooter ? "bg-brand-400" : "bg-brand-600")}
            aria-hidden
          />
        </p>
        {showTagline && (
          <p className="mt-1.5 text-[11px] font-medium tracking-wide text-slate-500 sm:text-xs">
            {siteConfig.tagline}
          </p>
        )}
      </div>
    </div>
  );

  if (href === false) return mark;

  return (
    <Link href={href} className="inline-block w-fit cursor-pointer" aria-label={`${siteConfig.name} home`}>
      {mark}
    </Link>
  );
}
