import { cn, scoreColor, scoreBarColor, severityColor, priorityColor, sanitizeText } from "@/lib/utils";
import { gradeColor, gradeBg, scoreToGrade } from "@/lib/grades";
import { categoryLabels, type Category } from "@/lib/config";
import type { IssueRecommendation, ExecutiveSummary } from "@/lib/ai/schemas";
import { Sparkles } from "lucide-react";

export function GradeBadge({ score, size = "lg" }: { score: number; size?: "sm" | "lg" }) {
  const grade = scoreToGrade(score);
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-xl border font-bold",
        gradeBg(grade),
        gradeColor(grade),
        size === "lg" ? "h-24 w-24 text-4xl" : "h-14 w-14 text-xl"
      )}
    >
      {grade}
    </div>
  );
}

export function ScoreRing({ score, size = "lg" }: { score: number; size?: "sm" | "lg" }) {
  const dim = size === "lg" ? 120 : 72;
  const stroke = size === "lg" ? 7 : 5;
  const radius = (dim - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className={cn("relative inline-flex", size === "lg" ? "h-[120px] w-[120px]" : "h-[72px] w-[72px]")}>
      <svg width={dim} height={dim} className="-rotate-90">
        <circle cx={dim / 2} cy={dim / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={radius}
          fill="none"
          stroke={scoreBarColor(score)}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("font-bold", scoreColor(score), size === "lg" ? "text-3xl" : "text-lg")}>
          {score}
        </span>
        {size === "lg" && <span className="text-xs text-slate-500">/ 100</span>}
      </div>
    </div>
  );
}

export function CategoryScoreGrid({ scores }: { scores: Record<string, number> }) {
  const order: Category[] = ["onpage", "links", "usability", "performance", "social"];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {order.map((key) => {
        const score = scores[key] ?? 0;
        const grade = scoreToGrade(score);
        return (
          <div key={key} className="glass-card rounded-xl p-4 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {categoryLabels[key]}
            </p>
            <p className={cn("mt-2 text-3xl font-bold", gradeColor(grade))}>{grade}</p>
            <p className={cn("mt-1 text-sm font-medium", scoreColor(score))}>{score}/100</p>
            <div className="mx-auto mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${score}%`, background: scoreBarColor(score) }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ExecutiveSummaryCard({ summary }: { summary: ExecutiveSummary }) {
  return (
    <div className="glass-card rounded-xl p-6 sm:p-8">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-brand-600" />
        <h2 className="text-lg font-semibold text-slate-900">AI SEO Expert Summary</h2>
      </div>
      <h3 className="text-2xl font-bold text-slate-900">{sanitizeText(summary.headline)}</h3>
      <p className="mt-3 text-slate-600 leading-relaxed">{sanitizeText(summary.summary)}</p>
      <p className="mt-4 text-sm text-slate-500 leading-relaxed">
        {sanitizeText(summary.overallAssessment)}
      </p>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-emerald-700">
            Top Strengths
          </h4>
          <ul className="mt-2 space-y-1">
            {summary.topStrengths.map((s, i) => (
              <li key={i} className="text-sm text-slate-600">• {sanitizeText(s)}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-amber-700">
            Top Weaknesses
          </h4>
          <ul className="mt-2 space-y-1">
            {summary.topWeaknesses.map((w, i) => (
              <li key={i} className="text-sm text-slate-600">• {sanitizeText(w)}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-lg bg-brand-50 p-4">
        <h4 className="text-sm font-semibold text-brand-700">Business Impact</h4>
        <p className="mt-1 text-sm text-slate-600">{sanitizeText(summary.businessImpact)}</p>
      </div>

      <div className="mt-4">
        <h4 className="text-sm font-semibold text-slate-900">Next Best Actions</h4>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          {summary.nextBestActions.map((a, i) => (
            <li key={i} className="text-sm text-slate-600">{sanitizeText(a)}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export function ActionPlanCard({
  plan,
}: {
  plan: {
    quickWins: string[];
    technicalFixes: string[];
    contentImprovements: string[];
    strategicImprovements: string[];
    sevenDayPlan: string[];
    thirtyDayPlan: string[];
  };
}) {
  const sections = [
    { title: "Quick Wins", items: plan.quickWins, color: "text-emerald-700" },
    { title: "Technical Fixes", items: plan.technicalFixes, color: "text-sky-700" },
    { title: "Content Improvements", items: plan.contentImprovements, color: "text-amber-700" },
    { title: "Strategic Improvements", items: plan.strategicImprovements, color: "text-violet-700" },
    { title: "7-Day Plan", items: plan.sevenDayPlan, color: "text-brand-700" },
    { title: "30-Day Plan", items: plan.thirtyDayPlan, color: "text-brand-700" },
  ];

  return (
    <div className="glass-card rounded-xl p-6 sm:p-8">
      <h2 className="text-lg font-semibold text-slate-900">AI Priority Action Plan</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => (
          <div key={section.title} className="rounded-lg bg-slate-50 p-4">
            <h3 className={cn("text-sm font-semibold", section.color)}>{section.title}</h3>
            <ul className="mt-3 space-y-2">
              {section.items.map((item, i) => (
                <li key={i} className="text-sm text-slate-600">• {sanitizeText(item)}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export function IssueCard({
  title,
  severity,
  description,
  recommendation,
  aiRecommendation,
  category,
  affectedUrls,
}: {
  title: string;
  severity: string;
  description: string;
  recommendation?: string | null;
  aiRecommendation?: IssueRecommendation | null;
  category: string;
  affectedUrls?: string[];
}) {
  const visibleUrls = (affectedUrls ?? []).slice(0, 4);
  const remainingUrls = Math.max(0, (affectedUrls?.length ?? 0) - visibleUrls.length);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h4 className="font-medium text-slate-900">{sanitizeText(title)}</h4>
        <div className="flex flex-wrap gap-2">
          <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize", severityColor(severity))}>
            {severity}
          </span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs text-slate-600 capitalize">
            {category}
          </span>
          {affectedUrls && affectedUrls.length > 1 && (
            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs text-slate-600">
              {affectedUrls.length} pages
            </span>
          )}
        </div>
      </div>
      <p className="mt-2 text-sm text-slate-600">{sanitizeText(description)}</p>
      {recommendation && (
        <p className="mt-2 text-sm text-slate-700">
          <span className="font-medium">Fix: </span>
          {sanitizeText(recommendation)}
        </p>
      )}

      {visibleUrls.length > 0 && (
        <details className="mt-3 group">
          <summary className="cursor-pointer text-xs font-medium text-slate-500 hover:text-brand-600">
            Affected URLs ({affectedUrls?.length ?? 0})
          </summary>
          <ul className="mt-2 space-y-1 pl-3">
            {visibleUrls.map((u) => (
              <li key={u} className="truncate text-xs text-slate-600" title={u}>
                <span className="text-slate-400">•</span> {u}
              </li>
            ))}
            {remainingUrls > 0 && (
              <li className="text-xs italic text-slate-500">+ {remainingUrls} more</li>
            )}
          </ul>
        </details>
      )}

      {aiRecommendation && (
        <div className="mt-4 rounded-lg border border-brand-100 bg-brand-50/50 p-4">
          <p className="text-sm font-semibold text-brand-700">{sanitizeText(aiRecommendation.title)}</p>
          <p className="mt-1 text-sm text-slate-600">{sanitizeText(aiRecommendation.summary)}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">Why it matters</p>
              <p className="text-sm text-slate-600">{sanitizeText(aiRecommendation.whyItMatters)}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">How to fix</p>
              <p className="text-sm text-slate-600">{sanitizeText(aiRecommendation.howToFix)}</p>
            </div>
          </div>
          {aiRecommendation.developerNotes && (
            <div className="mt-3">
              <p className="text-xs font-medium uppercase text-slate-500">Developer notes</p>
              <p className="text-sm font-mono text-slate-600">{sanitizeText(aiRecommendation.developerNotes)}</p>
            </div>
          )}
          {aiRecommendation.exampleFix && (
            <pre className="mt-3 overflow-x-auto rounded bg-slate-900 p-3 text-xs text-slate-100">
              {sanitizeText(aiRecommendation.exampleFix)}
            </pre>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <span className={cn("rounded-full border px-2 py-0.5 text-xs capitalize", priorityColor(aiRecommendation.priority))}>
              Priority: {aiRecommendation.priority}
            </span>
            <span className={cn("rounded-full border px-2 py-0.5 text-xs capitalize", priorityColor(aiRecommendation.impact))}>
              Impact: {aiRecommendation.impact}
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs capitalize text-slate-600">
              Effort: {aiRecommendation.effort}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
