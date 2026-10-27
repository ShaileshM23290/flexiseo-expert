import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  FileText,
  Gauge,
  LayoutDashboard,
  Link2,
  Share2,
  Shield,
  Smartphone,
  Sparkles,
} from "lucide-react";

const categories = [
  { label: "On-Page", grade: "A-", score: 86, icon: BarChart3, tone: "text-emerald-700 bg-emerald-50 ring-emerald-200" },
  { label: "Performance", grade: "C", score: 64, icon: Gauge, tone: "text-amber-700 bg-amber-50 ring-amber-200" },
  { label: "Usability", grade: "A", score: 91, icon: Smartphone, tone: "text-emerald-700 bg-emerald-50 ring-emerald-200" },
  { label: "Backlinks", grade: "B-", score: 72, icon: Link2, tone: "text-sky-700 bg-sky-50 ring-sky-200" },
  { label: "Social", grade: "D+", score: 58, icon: Share2, tone: "text-rose-700 bg-rose-50 ring-rose-200" },
];

const issues = [
  { severity: "Critical", tone: "bg-rose-50 text-rose-700 ring-rose-200", title: "LCP is 3.8s on mobile", page: "/", effort: "Quick" },
  { severity: "Warning", tone: "bg-amber-50 text-amber-700 ring-amber-200", title: "Missing meta description", page: "/pricing", effort: "Quick" },
  { severity: "Warning", tone: "bg-amber-50 text-amber-700 ring-amber-200", title: "No Open Graph image", page: "/blog", effort: "Quick" },
  { severity: "Notice", tone: "bg-slate-100 text-slate-600 ring-slate-200", title: "Missing Content-Security-Policy", page: "Site-wide", effort: "Moderate" },
];

const nav = [
  { icon: LayoutDashboard, label: "Overview", active: true },
  { icon: AlertTriangle, label: "Issues" },
  { icon: Gauge, label: "Performance" },
  { icon: Shield, label: "Security" },
  { icon: Sparkles, label: "AI action plan" },
  { icon: FileText, label: "PDF report" },
];

const SCORE = 82;
const RING_LENGTH = 289;

export function ProductPreview() {
  const ringOffset = RING_LENGTH - (RING_LENGTH * SCORE) / 100;

  return (
    <div className="mk-frame" aria-hidden>
      <div className="mk-frame-inner">
        <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          </div>
          <div className="mx-auto flex w-full max-w-sm items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1 font-mono text-[11px] text-slate-500">
            <Shield className="h-3 w-3 text-emerald-600" />
            flexiseo.expert/audits/yoursite.com
          </div>
          <span className="w-12" />
        </div>

        <div className="grid md:grid-cols-[11rem_1fr]">
          <aside className="hidden border-r border-slate-200 bg-slate-50/60 p-3 md:block">
            <p className="px-2 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Report</p>
            <ul className="space-y-0.5">
              {nav.map((item) => (
                <li
                  key={item.label}
                  className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs ${
                    item.active ? "bg-white font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200" : "text-slate-500"
                  }`}
                >
                  <item.icon className={`h-3.5 w-3.5 ${item.active ? "text-brand-600" : ""}`} />
                  {item.label}
                </li>
              ))}
            </ul>
          </aside>

          <div className="space-y-4 p-4 sm:p-5">
            <div className="grid gap-4 lg:grid-cols-[15rem_1fr]">
              <div className="flex items-center gap-4 rounded-xl border border-slate-200 p-4">
                <div className="relative h-20 w-20 shrink-0">
                  <svg viewBox="0 0 110 110" className="h-full w-full -rotate-90">
                    <circle cx="55" cy="55" r="46" fill="none" stroke="#eef2f6" strokeWidth="10" />
                    <circle
                      cx="55"
                      cy="55"
                      r="46"
                      fill="none"
                      stroke="#a51c1c"
                      strokeWidth="10"
                      strokeLinecap="round"
                      className="mk-ring-progress"
                      style={{ ["--ring-offset" as string]: ringOffset }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-heading text-xl font-bold text-slate-900">B+</span>
                    <span className="text-[10px] text-slate-500">{SCORE}/100</span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Overall</p>
                  <p className="font-heading text-sm font-bold text-slate-900">Good, clear upside</p>
                  <p className="mt-1 text-[11px] text-emerald-700">+18 pts with quick wins</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {categories.map((c) => (
                  <div key={c.label} className="rounded-xl border border-slate-200 p-3">
                    <div className="flex items-center justify-between">
                      <c.icon className="h-3.5 w-3.5 text-slate-400" />
                      <span className={`rounded-md px-1.5 py-0.5 font-heading text-[11px] font-bold ring-1 ${c.tone}`}>
                        {c.grade}
                      </span>
                    </div>
                    <p className="mt-3 text-[11px] text-slate-500">{c.label}</p>
                    <p className="font-heading text-lg font-bold text-slate-900">{c.score}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_17rem]">
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/60 px-4 py-2.5">
                  <p className="text-xs font-semibold text-slate-900">Top issues</p>
                  <p className="text-[11px] text-slate-500">12 found · sorted by impact</p>
                </div>
                <ul className="divide-y divide-slate-100">
                  {issues.map((issue) => (
                    <li key={issue.title} className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-3 px-4 py-2.5 text-xs">
                      <span className={`w-fit rounded-md px-1.5 py-0.5 text-[10px] font-semibold ring-1 ${issue.tone}`}>
                        {issue.severity}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-slate-800">{issue.title}</span>
                        <span className="font-mono text-[10px] text-slate-400">{issue.page}</span>
                      </span>
                      <span className="text-[11px] text-slate-500">{issue.effort}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-brand-100 bg-gradient-to-b from-brand-50/70 to-white p-4">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-brand-700">
                  <Sparkles className="h-3.5 w-3.5" /> AI recommendation
                </p>
                <p className="mt-2 font-heading text-sm font-bold text-slate-900">Compress and preload the hero image</p>
                <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600">
                  Serve WebP at 1200px and add a preload hint. Expected LCP gain of about 1.6s on mobile.
                </p>
                <div className="mt-3 rounded-md bg-slate-900 px-2.5 py-2 font-mono text-[10px] leading-relaxed text-slate-300">
                  {'<link rel="preload" as="image" href="/hero.webp">'}
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {["Impact: High", "Effort: Quick"].map((t) => (
                    <span key={t} className="inline-flex items-center gap-1 rounded-md bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-600 ring-1 ring-slate-200">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
