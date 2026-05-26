import { generateStructuredResponse, isOpenAIAvailable } from "./openai";
import { aiLimits } from "./config";
import {
  SYSTEM_PROMPT,
  actionPlanPrompt,
  auditOverviewPrompt,
  batchIssueRecommendationPrompt,
  categoryRecommendationPrompt,
  executiveSummaryPrompt,
  issueRecommendationPrompt,
  pageSummaryPrompt,
} from "./prompts";
import {
  type ActionPlan,
  type AuditOverview,
  type CategoryRecommendation,
  type ExecutiveSummary,
  type IssueRecommendation,
  type PageSummary,
  actionPlanSchema,
  auditOverviewSchema,
  batchIssueRecommendationsSchema,
  categoryRecommendationSchema,
  executiveSummarySchema,
  issueRecommendationSchema,
  pageSummarySchema,
} from "./schemas";
import {
  ISSUE_RECOMMENDATION_JSON_TEMPLATE,
  PAGE_SUMMARY_JSON_TEMPLATE,
  EXECUTIVE_SUMMARY_JSON_TEMPLATE,
  ACTION_PLAN_JSON_TEMPLATE,
  CATEGORY_RECOMMENDATION_JSON_TEMPLATE,
  AUDIT_OVERVIEW_JSON_TEMPLATE,
  BATCH_ISSUE_RECOMMENDATIONS_JSON_TEMPLATE,
  normalizeIssueRecommendation,
  normalizePageSummary,
  normalizeExecutiveSummary,
  normalizeActionPlan,
  normalizeCategoryRecommendation,
  normalizeAuditOverview,
  normalizeBatchIssueRecommendations,
} from "./normalize";

export { isOpenAIAvailable } from "./openai";
export { isOpenAIAutoGenerateEnabled, maxIssuesForAI, maxPagesForAISummary, aiLimits } from "./config";

function fallbackIssueRecommendation(issue: {
  title: string;
  description: string;
  recommendation?: string | null;
}): IssueRecommendation {
  return {
    title: `Fix: ${issue.title}`,
    summary: issue.description,
    whyItMatters: "This issue can affect search visibility and user experience.",
    howToFix: issue.recommendation ?? "Review and address the detected SEO issue on this page.",
    developerNotes: "Apply the fix in your CMS or codebase and re-run the audit to verify.",
    priority: "medium",
    impact: "medium",
    effort: "moderate",
    exampleFix: issue.recommendation ?? "",
    recommendedTool: null,
  };
}

function defaultExecutiveSummary(): ExecutiveSummary {
  return {
    headline: "SEO Audit Complete",
    summary: "Your website has been analyzed. Review the issues and action plan below.",
    overallAssessment: "See category scores and issue list for detailed findings.",
    topStrengths: ["Audit completed successfully"],
    topWeaknesses: ["Review detected issues in the report"],
    businessImpact: "Addressing SEO issues can improve discoverability and user experience.",
    nextBestActions: ["Fix critical issues first", "Implement quick wins", "Monitor progress"],
  };
}

function defaultActionPlan(): ActionPlan {
  return {
    quickWins: ["Fix missing meta descriptions", "Add alt text to images"],
    technicalFixes: ["Review canonical tags", "Fix broken internal links"],
    contentImprovements: ["Expand thin content pages", "Improve heading structure"],
    strategicImprovements: ["Develop content strategy", "Improve site architecture"],
    sevenDayPlan: ["Address all critical issues", "Fix top 5 warnings"],
    thirtyDayPlan: ["Complete remaining warnings", "Optimize performance scores"],
  };
}

export function localCategoryRecommendation(
  category: string,
  categoryScore: number,
  relatedIssues: Array<{ title: string; severity: string; description: string }>
): CategoryRecommendation {
  return {
    category,
    score: categoryScore,
    summary: `This category scored ${categoryScore}/100 with ${relatedIssues.length} related issue(s).`,
    priority: categoryScore < 60 ? "high" : categoryScore < 80 ? "medium" : "low",
    recommendations: relatedIssues.slice(0, 5).map((issue) => ({
      title: issue.title,
      description: issue.description,
      impact: issue.severity === "critical" ? ("high" as const) : ("medium" as const),
      effort: "moderate" as const,
    })),
  };
}

/** One API call for executive summary + action plan (saves ~50% vs two separate calls). */
export async function generateAuditOverview(
  auditData: Record<string, unknown>
): Promise<AuditOverview> {
  const fallback: AuditOverview = {
    executiveSummary: defaultExecutiveSummary(),
    actionPlan: defaultActionPlan(),
  };

  return generateStructuredResponse({
    schema: auditOverviewSchema,
    schemaName: "audit_overview",
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: `${auditOverviewPrompt(auditData)}

Return exactly this JSON shape:
${AUDIT_OVERVIEW_JSON_TEMPLATE}`,
    fallback,
    normalize: normalizeAuditOverview,
  });
}

export async function generateAuditExecutiveSummary(
  auditData: Record<string, unknown>
): Promise<ExecutiveSummary> {
  const fallback = defaultExecutiveSummary();

  return generateStructuredResponse({
    schema: executiveSummarySchema,
    schemaName: "executive_summary",
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: `${executiveSummaryPrompt(auditData)}

Return exactly this JSON shape with all fields filled:
${EXECUTIVE_SUMMARY_JSON_TEMPLATE}`,
    fallback,
    normalize: normalizeExecutiveSummary,
  });
}

export async function generateIssueRecommendation(
  issue: {
    title: string;
    description: string;
    severity: string;
    category: string;
    recommendation?: string | null;
    affectedUrl?: string | null;
  },
  pageData?: {
    title?: string | null;
    metaDescription?: string | null;
    h1Count?: number;
    wordCount?: number;
    canonical?: string | null;
    isIndexable?: boolean;
    hasSocialTags?: boolean;
    hasSchema?: boolean;
    url?: string;
  } | null,
  siteContext?: { domain: string }
): Promise<IssueRecommendation> {
  const fallback = fallbackIssueRecommendation(issue);

  return generateStructuredResponse({
    schema: issueRecommendationSchema,
    schemaName: "issue_recommendation",
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: `${issueRecommendationPrompt({
      domain: siteContext?.domain ?? "unknown",
      pageUrl: pageData?.url ?? issue.affectedUrl ?? siteContext?.domain ?? "",
      category: issue.category,
      severity: issue.severity,
      title: issue.title,
      description: issue.description,
      ruleRecommendation: issue.recommendation,
      pageTitle: pageData?.title,
      metaDescription: pageData?.metaDescription,
      h1Count: pageData?.h1Count,
      wordCount: pageData?.wordCount,
      canonical: pageData?.canonical,
      isIndexable: pageData?.isIndexable,
      hasSocialTags: pageData?.hasSocialTags,
      hasSchema: pageData?.hasSchema,
    })}

Return exactly this JSON shape with all fields filled:
${ISSUE_RECOMMENDATION_JSON_TEMPLATE}`,
    fallback,
    normalize: normalizeIssueRecommendation,
  });
}

export async function generateCategoryRecommendations(
  category: string,
  categoryScore: number,
  relatedIssues: Array<{ title: string; severity: string; description: string }>
): Promise<CategoryRecommendation> {
  const fallback = localCategoryRecommendation(category, categoryScore, relatedIssues);

  return generateStructuredResponse({
    schema: categoryRecommendationSchema,
    schemaName: "category_recommendations",
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: `${categoryRecommendationPrompt(category, categoryScore, relatedIssues)}

Return exactly this JSON shape with all fields filled:
${CATEGORY_RECOMMENDATION_JSON_TEMPLATE}`,
    fallback,
    normalize: normalizeCategoryRecommendation,
  });
}

export async function generatePrioritizedActionPlan(
  auditData: Record<string, unknown>
): Promise<ActionPlan> {
  const fallback = defaultActionPlan();

  return generateStructuredResponse({
    schema: actionPlanSchema,
    schemaName: "action_plan",
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: `${actionPlanPrompt(auditData)}

Return exactly this JSON shape with all fields filled:
${ACTION_PLAN_JSON_TEMPLATE}`,
    fallback,
    normalize: normalizeActionPlan,
  });
}

export async function generatePageSeoSummary(
  pageData: Record<string, unknown>,
  pageIssues: Array<{ title: string; severity: string; description: string }>
): Promise<PageSummary> {
  const url = String(pageData.url ?? "");
  const fallback: PageSummary = {
    pageUrl: url,
    summary: `This page has ${pageIssues.length} SEO issue(s) to address.`,
    mainProblems: pageIssues.slice(0, 5).map((i) => i.title),
    recommendedFixes: pageIssues.slice(0, 5).map((i) => i.description),
    priority: pageIssues.some((i) => i.severity === "critical") ? "high" : "medium",
  };

  return generateStructuredResponse({
    schema: pageSummarySchema,
    schemaName: "page_summary",
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: `${pageSummaryPrompt(pageData, pageIssues)}

Return exactly this JSON shape with all fields filled:
${PAGE_SUMMARY_JSON_TEMPLATE}`,
    fallback,
    normalize: normalizePageSummary,
  });
}

/** True batch — one API call for up to issueBatchSize issues (was one call per issue). */
export async function generateBatchIssueRecommendations(
  domain: string,
  issues: Array<{
    issue: {
      title: string;
      description: string;
      severity: string;
      category: string;
      recommendation?: string | null;
      affectedUrl?: string | null;
    };
    pageData?: {
      title?: string | null;
      metaDescription?: string | null;
      h1Count?: number;
      wordCount?: number;
      url?: string;
    } | null;
  }>
): Promise<IssueRecommendation[]> {
  if (issues.length === 0) return [];

  const fallbacks = issues.map(({ issue }) => fallbackIssueRecommendation(issue));

  if (issues.length === 1) {
    return [
      await generateIssueRecommendation(issues[0].issue, issues[0].pageData, { domain }),
    ];
  }

  const batchInput = issues.map(({ issue, pageData }, index) => ({
    index,
    pageUrl: pageData?.url ?? issue.affectedUrl ?? domain,
    category: issue.category,
    severity: issue.severity,
    title: issue.title,
    description: issue.description,
    ruleRecommendation: issue.recommendation,
    pageTitle: pageData?.title,
    metaDescription: pageData?.metaDescription,
    h1Count: pageData?.h1Count,
    wordCount: pageData?.wordCount,
  }));

  const result = await generateStructuredResponse({
    schema: batchIssueRecommendationsSchema,
    schemaName: "batch_issue_recommendations",
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: `${batchIssueRecommendationPrompt(domain, batchInput)}

Return exactly ${issues.length} recommendations in order:
${BATCH_ISSUE_RECOMMENDATIONS_JSON_TEMPLATE}`,
    fallback: { recommendations: fallbacks },
    normalize: (raw) => ({
      recommendations: normalizeBatchIssueRecommendations(raw, fallbacks),
    }),
  });

  return result.recommendations;
}