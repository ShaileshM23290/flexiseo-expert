import Link from "next/link";
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
  showTagline = variant === "header",
  href = "/",
  className,
}: BrandLogoProps) {
  const isFooter = variant === "footer";

  const mark = (
    <div className={cn("leading-none", className)}>
      <p
        className={cn(
          "font-bold tracking-tight",
          isFooter ? "text-xl sm:text-2xl" : "text-xl sm:text-2xl md:text-[1.65rem]"
        )}
      >
        <span className={isFooter ? "text-brand-500" : "text-brand-600"}>Flexi</span>
        <span className={isFooter ? "text-white" : "text-slate-900"}>Seo</span>
      </p>
      <p
        className={cn(
          "mt-1 flex items-center gap-1.5 font-semibold uppercase tracking-[0.2em]",
          isFooter ? "text-[10px] text-brand-500 sm:text-[11px]" : "text-[10px] text-brand-600 sm:text-[11px]"
        )}
      >
        <span
          className={cn("h-px w-3 sm:w-4", isFooter ? "bg-brand-500" : "bg-brand-600")}
          aria-hidden
        />
        Expert
        <span
          className={cn("h-px w-3 sm:w-4", isFooter ? "bg-brand-500" : "bg-brand-600")}
          aria-hidden
        />
      </p>
      {showTagline && (
        <p className="mt-1.5 text-[11px] font-medium tracking-wide text-slate-500 sm:text-xs">
          {siteConfig.tagline}
        </p>
      )}
    </div>
  );

  if (href === false) return mark;

  return (
    <Link href={href} className="inline-block w-fit" aria-label={`${siteConfig.name} home`}>
      {mark}
    </Link>
  );
}
