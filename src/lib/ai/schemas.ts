import { z } from "zod";

export const prioritySchema = z.enum(["high", "medium", "low"]);
export const impactSchema = z.enum(["high", "medium", "low"]);
export const effortSchema = z.enum(["quick", "moderate", "advanced"]);

export const issueRecommendationSchema = z.object({
  title: z.string(),
  summary: z.string(),
  whyItMatters: z.string(),
  howToFix: z.string(),
  developerNotes: z.string(),
  priority: prioritySchema,
  impact: impactSchema,
  effort: effortSchema,
  exampleFix: z.string(),
  recommendedTool: z.string().nullable(),
});

export const executiveSummarySchema = z.object({
  headline: z.string(),
  summary: z.string(),
  overallAssessment: z.string(),
  topStrengths: z.array(z.string()),
  topWeaknesses: z.array(z.string()),
  businessImpact: z.string(),
  nextBestActions: z.array(z.string()),
});

export const categoryRecommendationSchema = z.object({
  category: z.string(),
  score: z.number(),
  summary: z.string(),
  priority: prioritySchema,
  recommendations: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      impact: impactSchema,
      effort: effortSchema,
    })
  ),
});

export const actionPlanSchema = z.object({
  quickWins: z.array(z.string()),
  technicalFixes: z.array(z.string()),
  contentImprovements: z.array(z.string()),
  strategicImprovements: z.array(z.string()),
  sevenDayPlan: z.array(z.string()),
  thirtyDayPlan: z.array(z.string()),
});

export const pageSummarySchema = z.object({
  pageUrl: z.string(),
  summary: z.string(),
  mainProblems: z.array(z.string()),
  recommendedFixes: z.array(z.string()),
  priority: prioritySchema,
});

export const auditOverviewSchema = z.object({
  executiveSummary: executiveSummarySchema,
  actionPlan: actionPlanSchema,
});

export const batchIssueRecommendationsSchema = z.object({
  recommendations: z.array(issueRecommendationSchema),
});

export type IssueRecommendation = z.infer<typeof issueRecommendationSchema>;
export type ExecutiveSummary = z.infer<typeof executiveSummarySchema>;
export type CategoryRecommendation = z.infer<typeof categoryRecommendationSchema>;
export type ActionPlan = z.infer<typeof actionPlanSchema>;
export type PageSummary = z.infer<typeof pageSummarySchema>;
export type AuditOverview = z.infer<typeof auditOverviewSchema>;

export const issueRecommendationJsonSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    summary: { type: "string" },
    whyItMatters: { type: "string" },
    howToFix: { type: "string" },
    developerNotes: { type: "string" },
    priority: { type: "string", enum: ["high", "medium", "low"] },
    impact: { type: "string", enum: ["high", "medium", "low"] },
    effort: { type: "string", enum: ["quick", "moderate", "advanced"] },
    exampleFix: { type: "string" },
    recommendedTool: { type: ["string", "null"] },
  },
  required: [
    "title",
    "summary",
    "whyItMatters",
    "howToFix",
    "developerNotes",
    "priority",
    "impact",
    "effort",
    "exampleFix",
    "recommendedTool",
  ],
  additionalProperties: false,
} as const;

export const executiveSummaryJsonSchema = {
  type: "object",
  properties: {
    headline: { type: "string" },
    summary: { type: "string" },
    overallAssessment: { type: "string" },
    topStrengths: { type: "array", items: { type: "string" } },
    topWeaknesses: { type: "array", items: { type: "string" } },
    businessImpact: { type: "string" },
    nextBestActions: { type: "array", items: { type: "string" } },
  },
  required: [
    "headline",
    "summary",
    "overallAssessment",
    "topStrengths",
    "topWeaknesses",
    "businessImpact",
    "nextBestActions",
  ],
  additionalProperties: false,
} as const;

export const categoryRecommendationJsonSchema = {
  type: "object",
  properties: {
    category: { type: "string" },
    score: { type: "number" },
    summary: { type: "string" },
    priority: { type: "string", enum: ["high", "medium", "low"] },
    recommendations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          impact: { type: "string", enum: ["high", "medium", "low"] },
          effort: { type: "string", enum: ["quick", "moderate", "advanced"] },
        },
        required: ["title", "description", "impact", "effort"],
        additionalProperties: false,
      },
    },
  },
  required: ["category", "score", "summary", "priority", "recommendations"],
  additionalProperties: false,
} as const;

export const actionPlanJsonSchema = {
  type: "object",
  properties: {
    quickWins: { type: "array", items: { type: "string" } },
    technicalFixes: { type: "array", items: { type: "string" } },
    contentImprovements: { type: "array", items: { type: "string" } },
    strategicImprovements: { type: "array", items: { type: "string" } },
    sevenDayPlan: { type: "array", items: { type: "string" } },
    thirtyDayPlan: { type: "array", items: { type: "string" } },
  },
  required: [
    "quickWins",
    "technicalFixes",
    "contentImprovements",
    "strategicImprovements",
    "sevenDayPlan",
    "thirtyDayPlan",
  ],
  additionalProperties: false,
} as const;

export const pageSummaryJsonSchema = {
  type: "object",
  properties: {
    pageUrl: { type: "string" },
    summary: { type: "string" },
    mainProblems: { type: "array", items: { type: "string" } },
    recommendedFixes: { type: "array", items: { type: "string" } },
    priority: { type: "string", enum: ["high", "medium", "low"] },
  },
  required: ["pageUrl", "summary", "mainProblems", "recommendedFixes", "priority"],
  additionalProperties: false,
} as const;

export const batchIssueRecommendationsJsonSchema = {
  type: "object",
  properties: {
    recommendations: {
      type: "array",
      items: issueRecommendationJsonSchema,
    },
  },
  required: ["recommendations"],
  additionalProperties: false,
} as const;
