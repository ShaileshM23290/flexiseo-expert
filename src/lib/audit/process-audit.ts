import { prisma } from "@/lib/db";
import { runAudit } from "@/lib/audit/runner";
import { generateAIRecommendations } from "@/lib/audit/ai-service";
import { toPublicAuditError } from "@/lib/audit/public-errors";
import { isOpenAIAvailable, isOpenAIAutoGenerateEnabled } from "@/lib/ai/seo-recommendations";

export async function resetAuditForRerun(auditId: string) {
  await prisma.aIRecommendation.deleteMany({ where: { auditId } });
  await prisma.auditIssue.deleteMany({ where: { auditId } });
  await prisma.auditPage.deleteMany({ where: { auditId } });

  await prisma.audit.update({
    where: { id: auditId },
    data: {
      status: "running",
      overallScore: 0,
      categoryScores: "{}",
      pagesCrawled: 0,
      totalIssues: 0,
      criticalCount: 0,
      warningCount: 0,
      noticeCount: 0,
      passedCount: 0,
      performanceData: null,
      socialSummary: null,
      schemaSummary: null,
      aiSummary: null,
      aiActionPlan: null,
      aiCategoryInsights: null,
      aiGeneratedAt: null,
      errorMessage: null,
      completedAt: null,
    },
  });
}

export async function processAudit(auditId: string, url: string) {
  try {
    const result = await runAudit(url);

    const pageRecords = await Promise.all(
      result.pages.map((page) =>
        prisma.auditPage.create({
          data: {
            auditId,
            url: page.url,
            title: page.title,
            metaDescription: page.metaDescription,
            h1: page.h1,
            h1Count: page.h1Count,
            wordCount: page.wordCount,
            canonical: page.canonical,
            isIndexable: page.isIndexable,
            hasSocialTags: page.hasSocialTags,
            hasSchema: page.hasSchema,
            statusCode: page.statusCode,
            loadTimeMs: page.loadTimeMs,
          },
        })
      )
    );

    const pageUrlToId = new Map(pageRecords.map((p) => [p.url, p.id]));

    for (const issue of result.issues) {
      await prisma.auditIssue.create({
        data: {
          auditId,
          pageId: pageUrlToId.get(issue.affectedUrl) ?? null,
          category: issue.category,
          severity: issue.severity,
          issueKey: issue.key,
          title: issue.title,
          description: issue.description,
          recommendation: issue.recommendation,
          affectedUrl: issue.affectedUrl,
        },
      });
    }

    await prisma.audit.update({
      where: { id: auditId },
      data: {
        status: "completed",
        overallScore: result.overallScore,
        categoryScores: JSON.stringify(result.categoryScores),
        pagesCrawled: result.pagesCrawled,
        totalIssues: result.issues.length,
        criticalCount: result.criticalCount,
        warningCount: result.warningCount,
        noticeCount: result.noticeCount,
        passedCount: 0,
        socialSummary: JSON.stringify(result.socialSummary),
        schemaSummary: JSON.stringify(result.schemaSummary),
        performanceData: JSON.stringify(result.performanceData),
        completedAt: new Date(),
      },
    });

    if (isOpenAIAvailable() && isOpenAIAutoGenerateEnabled()) {
      try {
        await generateAIRecommendations(auditId);
      } catch (aiError) {
        console.error(
          `[Audit ${auditId}] AI generation failed — audit remains completed:`,
          aiError
        );
      }
    } else if (isOpenAIAvailable()) {
      console.info("[AI] Skipped — OPENAI_AUTO_GENERATE=false");
    } else {
      console.info("[AI] Skipping — no API key");
    }
  } catch (error) {
    console.error(`[Audit ${auditId}] Processing failed:`, error);
    await prisma.audit.update({
      where: { id: auditId },
      data: {
        status: "failed",
        errorMessage: toPublicAuditError(error),
      },
    });
  }
}
