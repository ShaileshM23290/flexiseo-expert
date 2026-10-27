import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const reassurance = ["Free", "No signup", "Report in about 2 minutes"];

export function CtaBand({
  title = "See exactly what's holding your rankings back",
  description = "Run a free audit and get a prioritized, consultant-grade fix plan for your website.",
  href = "/audit",
  label = "Start free audit",
}: {
  title?: string;
  description?: string;
  href?: string;
  label?: string;
}) {
  return (
    <section className="px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-2xl bg-slate-900 px-6 py-14 sm:px-12">
        <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
          <div className="max-w-2xl">
            <h2 className="font-heading text-3xl font-bold tracking-tight text-white">{title}</h2>
            <p className="mt-3 text-lg text-slate-300">{description}</p>
            <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
              {reassurance.map((item) => (
                <li key={item} className="flex items-center gap-1.5 text-sm text-slate-400">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
            <Link href={href} className="mk-btn-primary">
              {label} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/how-it-works" className="mk-btn-on-dark">
              How it works
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
