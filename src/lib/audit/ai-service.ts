import { prisma } from "../db";
import {
  aiLimits,
  generateAuditOverview,
  generateBatchIssueRecommendations,
  generateCategoryRecommendations,
  generatePageSeoSummary,
  isOpenAIAvailable,
  localCategoryRecommendation,
  maxIssuesForAI,
  maxPagesForAISummary,
} from "../ai/seo-recommendations";
import type { CategoryRecommendation, ExecutiveSummary, ActionPlan, PageSummary } from "../ai/schemas";
import { categories, categoryLabels, type Category } from "../config";

type GenerateOptions = {
  force?: boolean;
};

function compactAuditPayload(audit: {
  url: string;
  domain: string;
  overallScore: number;
  categoryScores: string;
  totalIssues: number;
  criticalCount: number;
  warningCount: number;
  pagesCrawled: number;
  issues: Array<{ title: string; severity: string; category: string }>;
}) {
  const categoryScores = JSON.parse(audit.categoryScores) as Record<Category, number>;

  return {
    url: audit.url,
    domain: audit.domain,
    overallScore: audit.overallScore,
    categoryScores,
    totalIssues: audit.totalIssues,
    criticalIssues: audit.criticalCount,
    warnings: audit.warningCount,
    pagesCrawled: audit.pagesCrawled,
    topProblems: audit.issues
      .filter((i) => i.severity === "critical" || i.severity === "warning")
      .slice(0, 8)
      .map((i) => ({ title: i.title, severity: i.severity, category: i.category })),
  };
}

export async function generateAIRecommendations(auditId: string, options: GenerateOptions = {}) {
  if (!isOpenAIAvailable()) {
    console.info("[AI] OPENAI_API_KEY not configured — skipping AI generation");
    return null;
  }

  const audit = await prisma.audit.findUnique({
    where: { id: auditId },
    include: {
      pages: true,
      issues: { include: { page: true } },
    },
  });

  if (!audit || audit.status !== "completed") {
    throw new Error("Audit not found or not completed");
  }

  if (audit.aiGeneratedAt && !options.force) {
    console.info(`[AI] Audit ${auditId} already has AI output — skipping (use force to regenerate)`);
    return null;
  }

  const categoryScores = JSON.parse(audit.categoryScores) as Record<Category, number>;
  const compactAuditData = compactAuditPayload(audit);

  console.info(
    `[AI] Generating for audit ${auditId} — max ${maxIssuesForAI} issues, ${maxPagesForAISummary} pages`
  );

  const { executiveSummary, actionPlan } = await generateAuditOverview(compactAuditData);

  const categoryInsights: Record<string, CategoryRecommendation> = {};
  for (const cat of categories) {
    const score = categoryScores[cat] ?? 100;
    const relatedIssues = audit.issues
      .filter((i) => i.category === cat && (i.severity === "critical" || i.severity === "warning"))
      .slice(0, 5)
      .map((i) => ({ title: i.title, severity: i.severity, description: i.description }));

    if (relatedIssues.length === 0) {
      categoryInsights[cat] = localCategoryRecommendation(categoryLabels[cat], score, []);
      continue;
    }

    if (score >= aiLimits.categoryScoreThreshold) {
      categoryInsights[cat] = localCategoryRecommendation(
        categoryLabels[cat],
        score,
        relatedIssues
      );
      continue;
    }

    categoryInsights[cat] = await generateCategoryRecommendations(
      categoryLabels[cat],
      score,
      relatedIssues
    );
  }

  const sortedIssues = [...audit.issues]
    .filter((i) => i.severity === "critical" || i.severity === "warning")
    .sort((a, b) => {
      const order = { critical: 0, warning: 1, notice: 2 };
      return (order[a.severity as keyof typeof order] ?? 3) - (order[b.severity as keyof typeof order] ?? 3);
    });

  const issuesForAI = sortedIssues.slice(0, maxIssuesForAI);
  const batchSize = aiLimits.issueBatchSize;

  for (let i = 0; i < issuesForAI.length; i += batchSize) {
    const batch = issuesForAI.slice(i, i + batchSize);
    const batchInput = batch.map((issue) => ({
      issue: {
        title: issue.title,
        description: issue.description,
        severity: issue.severity,
        category: issue.category,
        recommendation: issue.recommendation,
        affectedUrl: issue.affectedUrl,
      },
      pageData: issue.page
        ? {
            title: issue.page.title,
            metaDescription: issue.page.metaDescription,
            h1Count: issue.page.h1Count,
            wordCount: issue.page.wordCount,
            url: issue.page.url,
          }
        : null,
    }));

    const recommendations = await generateBatchIssueRecommendations(audit.domain, batchInput);

    for (let j = 0; j < batch.length; j++) {
      const issue = batch[j];
      const aiRec = recommendations[j];
      if (!aiRec) continue;

      try {
        await prisma.auditIssue.update({
          where: { id: issue.id },
          data: {
            aiRecommendation: JSON.stringify(aiRec),
            aiPriority: aiRec.priority,
            aiEffort: aiRec.effort,
            aiImpact: aiRec.impact,
            aiGeneratedAt: new Date(),
          },
        });
      } catch (err) {
        console.warn(`[AI] Could not update issue ${issue.id}:`, err);
      }
    }
  }

  if (maxPagesForAISummary > 0) {
    const pagesForSummary = audit.pages
      .filter((p) =>
        audit.issues.some(
          (i) => i.pageId === p.id && (i.severity === "critical" || i.severity === "warning")
        )
      )
      .slice(0, maxPagesForAISummary);

    for (const page of pagesForSummary) {
      const pageIssues = audit.issues
        .filter((i) => i.pageId === page.id)
        .map((i) => ({ title: i.title, severity: i.severity, description: i.description }));

      const summary: PageSummary = await generatePageSeoSummary(
        {
          url: page.url,
          title: page.title,
          metaDescription: page.metaDescription,
          h1Count: page.h1Count,
          wordCount: page.wordCount,
        },
        pageIssues
      );

      try {
        await prisma.auditPage.update({
          where: { id: page.id },
          data: {
            aiPageSummary: JSON.stringify(summary),
            aiRecommendations: JSON.stringify(summary.recommendedFixes),
          },
        });
      } catch (err) {
        console.warn(`[AI] Could not update page ${page.id}:`, err);
      }
    }
  }

  await prisma.audit.update({
    where: { id: auditId },
    data: {
      aiSummary: JSON.stringify(executiveSummary),
      aiActionPlan: JSON.stringify(actionPlan),
      aiCategoryInsights: JSON.stringify(categoryInsights),
      aiGeneratedAt: new Date(),
    },
  });

  return { executiveSummary, actionPlan, categoryInsights };
}

export type { ExecutiveSummary, ActionPlan, CategoryRecommendation, PageSummary };
