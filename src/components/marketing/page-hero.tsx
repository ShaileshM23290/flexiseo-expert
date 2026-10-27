import { cn } from "@/lib/utils";

interface PageHeroProps {
  eyebrow: string;
  title: React.ReactNode;
  description: React.ReactNode;
  children?: React.ReactNode;
  align?: "center" | "left";
  className?: string;
}

export function PageHero({
  eyebrow,
  title,
  description,
  children,
  align = "center",
  className,
}: PageHeroProps) {
  const centered = align === "center";

  return (
    <section className={cn("mk-hero overflow-hidden px-4 pb-16 pt-16 sm:px-6 sm:pb-20 sm:pt-20", className)}>
      <div className="mk-grid-light absolute inset-0 -z-10" aria-hidden />
      <div className={cn("mx-auto max-w-3xl", centered && "text-center")}>
        <span className="mk-eyebrow">{eyebrow}</span>
        <h1 className="mt-4 font-heading text-4xl font-bold leading-[1.12] tracking-tight text-slate-900 sm:text-5xl">
          {title}
        </h1>
        <p
          className={cn(
            "mt-5 text-lg leading-relaxed text-slate-600",
            centered && "mx-auto max-w-2xl"
          )}
        >
          {description}
        </p>
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "center" | "left";
  className?: string;
}) {
  const centered = align === "center";

  return (
    <div className={cn("max-w-2xl", centered && "mx-auto text-center", className)}>
      {eyebrow && <span className="mk-eyebrow">{eyebrow}</span>}
      <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-slate-900 sm:text-[2.25rem] sm:leading-tight">
        {title}
      </h2>
      {description && <p className="mt-4 text-lg leading-relaxed text-slate-600">{description}</p>}
    </div>
  );
}
