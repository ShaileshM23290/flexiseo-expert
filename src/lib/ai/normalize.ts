import {
  type ActionPlan,
  type CategoryRecommendation,
  type ExecutiveSummary,
  type IssueRecommendation,
  type PageSummary,
} from "./schemas";

const PRIORITIES = ["high", "medium", "low"] as const;
const IMPACTS = ["high", "medium", "low"] as const;
const EFFORTS = ["quick", "moderate", "advanced"] as const;

function text(value: unknown, fb: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fb;
}

function list(value: unknown, fb: string[]) {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : fb;
}

function pick<T extends string>(value: unknown, options: readonly T[], fb: T) {
  return options.includes(value as T) ? (value as T) : fb;
}

function num(value: unknown, fb: number) {
  return typeof value === "number" && !Number.isNaN(value) ? value : fb;
}

/** Unwrap common nested response shapes from the model */
export function unwrapPayload(raw: unknown, keys: string[]): Record<string, unknown> {
  if (!raw || typeof raw !== "object") return {};
  let current: unknown = raw;

  for (let depth = 0; depth < 3; depth++) {
    if (!current || typeof current !== "object") break;
    const o = current as Record<string, unknown>;

    for (const key of keys) {
      if (o[key] && typeof o[key] === "object" && !Array.isArray(o[key])) {
        current = o[key];
        break;
      }
    }

    if (current === o) return o;
  }

  return (current as Record<string, unknown>) ?? {};
}

export function normalizeIssueRecommendation(
  raw: unknown,
  fallback: IssueRecommendation
): IssueRecommendation {
  const o = unwrapPayload(raw, ["recommendation", "issue_recommendation", "data"]);

  return {
    title: text(o.title, fallback.title),
    summary: text(o.summary, fallback.summary),
    whyItMatters: text(o.whyItMatters ?? o.why_it_matters, fallback.whyItMatters),
    howToFix: text(o.howToFix ?? o.how_to_fix, fallback.howToFix),
    developerNotes: text(o.developerNotes ?? o.developer_notes, fallback.developerNotes),
    priority: pick(o.priority, PRIORITIES, fallback.priority),
    impact: pick(o.impact, IMPACTS, fallback.impact),
    effort: pick(o.effort, EFFORTS, fallback.effort),
    exampleFix: text(o.exampleFix ?? o.example_fix, fallback.exampleFix),
    recommendedTool:
      typeof o.recommendedTool === "string"
        ? o.recommendedTool
        : o.recommendedTool === null
          ? null
          : typeof o.recommended_tool === "string"
            ? o.recommended_tool
            : fallback.recommendedTool,
  };
}

export function normalizeExecutiveSummary(
  raw: unknown,
  fallback: ExecutiveSummary
): ExecutiveSummary {
  const o = unwrapPayload(raw, [
    "executive_summary",
    "executiveSummary",
    "summary",
    "audit_summary",
    "data",
  ]);

  return {
    headline: text(o.headline ?? o.title, fallback.headline),
    summary: text(o.summary ?? o.overview, fallback.summary),
    overallAssessment: text(
      o.overallAssessment ?? o.overall_assessment ?? o.assessment,
      fallback.overallAssessment
    ),
    topStrengths: list(o.topStrengths ?? o.top_strengths ?? o.strengths, fallback.topStrengths),
    topWeaknesses: list(o.topWeaknesses ?? o.top_weaknesses ?? o.weaknesses, fallback.topWeaknesses),
    businessImpact: text(o.businessImpact ?? o.business_impact, fallback.businessImpact),
    nextBestActions: list(
      o.nextBestActions ?? o.next_best_actions ?? o.actions,
      fallback.nextBestActions
    ),
  };
}

export function normalizeActionPlan(raw: unknown, fallback: ActionPlan): ActionPlan {
  const o = unwrapPayload(raw, ["action_plan", "actionPlan", "plan", "data"]);

  return {
    quickWins: list(o.quickWins ?? o.quick_wins, fallback.quickWins),
    technicalFixes: list(o.technicalFixes ?? o.technical_fixes, fallback.technicalFixes),
    contentImprovements: list(
      o.contentImprovements ?? o.content_improvements,
      fallback.contentImprovements
    ),
    strategicImprovements: list(
      o.strategicImprovements ?? o.strategic_improvements,
      fallback.strategicImprovements
    ),
    sevenDayPlan: list(o.sevenDayPlan ?? o.seven_day_plan, fallback.sevenDayPlan),
    thirtyDayPlan: list(o.thirtyDayPlan ?? o.thirty_day_plan, fallback.thirtyDayPlan),
  };
}

export function normalizeCategoryRecommendation(
  raw: unknown,
  fallback: CategoryRecommendation
): CategoryRecommendation {
  const o = unwrapPayload(raw, [
    "category_recommendations",
    "categoryRecommendations",
    "category",
    "data",
  ]);

  const recsRaw = o.recommendations ?? o.items ?? o.fixes;
  const recommendations = Array.isArray(recsRaw)
    ? recsRaw.map((item, i) => {
        const rec = (item ?? {}) as Record<string, unknown>;
        const fb = fallback.recommendations[i] ?? fallback.recommendations[0] ?? {
          title: "Improvement",
          description: "Address detected issues in this category.",
          impact: "medium" as const,
          effort: "moderate" as const,
        };
        return {
          title: text(rec.title, fb.title),
          description: text(rec.description ?? rec.summary, fb.description),
          impact: pick(rec.impact, IMPACTS, fb.impact),
          effort: pick(rec.effort, EFFORTS, fb.effort),
        };
      })
    : fallback.recommendations;

  return {
    category: text(o.category, fallback.category),
    score: num(o.score, fallback.score),
    summary: text(o.summary, fallback.summary),
    priority: pick(o.priority, PRIORITIES, fallback.priority),
    recommendations: recommendations.length ? recommendations : fallback.recommendations,
  };
}

export function normalizePageSummary(raw: unknown, fallback: PageSummary): PageSummary {
  const o = unwrapPayload(raw, ["page_summary", "pageSummary", "summary", "data"]);

  return {
    pageUrl: text(o.pageUrl ?? o.page_url ?? o.url, fallback.pageUrl),
    summary: text(o.summary, fallback.summary),
    mainProblems: list(o.mainProblems ?? o.main_problems ?? o.problems, fallback.mainProblems),
    recommendedFixes: list(
      o.recommendedFixes ?? o.recommended_fixes ?? o.fixes,
      fallback.recommendedFixes
    ),
    priority: pick(o.priority, PRIORITIES, fallback.priority),
  };
}

export const ISSUE_RECOMMENDATION_JSON_TEMPLATE = `{
  "title": "string",
  "summary": "string",
  "whyItMatters": "string",
  "howToFix": "string",
  "developerNotes": "string",
  "priority": "high",
  "impact": "medium",
  "effort": "quick",
  "exampleFix": "string",
  "recommendedTool": null
}`;

export const EXECUTIVE_SUMMARY_JSON_TEMPLATE = `{
  "headline": "string",
  "summary": "string",
  "overallAssessment": "string",
  "topStrengths": ["string"],
  "topWeaknesses": ["string"],
  "businessImpact": "string",
  "nextBestActions": ["string"]
}`;

export const ACTION_PLAN_JSON_TEMPLATE = `{
  "quickWins": ["string"],
  "technicalFixes": ["string"],
  "contentImprovements": ["string"],
  "strategicImprovements": ["string"],
  "sevenDayPlan": ["string"],
  "thirtyDayPlan": ["string"]
}`;

export const CATEGORY_RECOMMENDATION_JSON_TEMPLATE = `{
  "category": "string",
  "score": 0,
  "summary": "string",
  "priority": "high",
  "recommendations": [
    { "title": "string", "description": "string", "impact": "high", "effort": "quick" }
  ]
}`;

export const PAGE_SUMMARY_JSON_TEMPLATE = `{
  "pageUrl": "string",
  "summary": "string",
  "mainProblems": ["string"],
  "recommendedFixes": ["string"],
  "priority": "high"
}`;

export const AUDIT_OVERVIEW_JSON_TEMPLATE = `{
  "executiveSummary": ${EXECUTIVE_SUMMARY_JSON_TEMPLATE},
  "actionPlan": ${ACTION_PLAN_JSON_TEMPLATE}
}`;

export const BATCH_ISSUE_RECOMMENDATIONS_JSON_TEMPLATE = `{
  "recommendations": [${ISSUE_RECOMMENDATION_JSON_TEMPLATE}]
}`;

export function normalizeAuditOverview(
  raw: unknown,
  fallback: { executiveSummary: ExecutiveSummary; actionPlan: ActionPlan }
): { executiveSummary: ExecutiveSummary; actionPlan: ActionPlan } {
  const o = unwrapPayload(raw, ["audit_overview", "overview", "data"]);
  const summaryRaw = o.executiveSummary ?? o.executive_summary ?? o.summary;
  const planRaw = o.actionPlan ?? o.action_plan ?? o.plan;

  return {
    executiveSummary: normalizeExecutiveSummary(summaryRaw, fallback.executiveSummary),
    actionPlan: normalizeActionPlan(planRaw, fallback.actionPlan),
  };
}

export function normalizeBatchIssueRecommendations(
  raw: unknown,
  fallbacks: IssueRecommendation[]
): IssueRecommendation[] {
  const o = unwrapPayload(raw, ["recommendations", "batch_issue_recommendations", "data"]);
  const arr = Array.isArray(o.recommendations)
    ? o.recommendations
    : Array.isArray(raw)
      ? raw
      : [];

  return fallbacks.map((fb, i) => normalizeIssueRecommendation(arr[i], fb));
}
