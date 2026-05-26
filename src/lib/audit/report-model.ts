import type {
  ActionPlan,
  CategoryRecommendation,
  ExecutiveSummary,
  IssueRecommendation,
} from "@/lib/ai/schemas";
import { parseJsonField } from "@/lib/parse-json";
import { categoryLabels, categories, normalizeCategory, type Category } from "@/lib/config";
import { overallVerdict, scoreToGrade } from "@/lib/grades";

export type AuditIssueRecord = {
  id: string;
  category: string;
  severity: string;
  title: string;
  description: string;
  recommendation: string | null;
  affectedUrl: string | null;
  aiRecommendation: string | null;
  pageId: string | null;
};

export type AuditPageRecord = {
  id: string;
  url: string;
  title: string | null;
  wordCount: number;
  statusCode: number;
  aiPageSummary: string | null;
};

export type AuditReportRecord = {
  id: string;
  url: string;
  domain: string;
  status: string;
  overallScore: number;
  categoryScores: string;
  pagesCrawled: number;
  totalIssues: number;
  criticalCount: number;
  warningCount: number;
  noticeCount: number;
  aiSummary: string | null;
  aiActionPlan: string | null;
  aiCategoryInsights: string | null;
  performanceData: string | null;
  schemaSummary?: string | null;
  completedAt?: Date | string | null;
  pages: AuditPageRecord[];
  issues: AuditIssueRecord[];
};

export interface GroupedIssue {
  title: string;
  category: Category;
  severity: string;
  description: string;
  recommendation: string | null;
  affectedUrls: string[];
  aiRecommendation: string | null;
}

const SEVERITY_RANK: Record<string, number> = { critical: 0, warning: 1, notice: 2 };

export function groupAuditIssues(issues: AuditIssueRecord[]): GroupedIssue[] {
  const map = new Map<string, GroupedIssue>();

  for (const issue of issues) {
    const cat = normalizeCategory(issue.category);
    const key = `${cat}::${issue.title.toLowerCase().trim()}`;
    const url = issue.affectedUrl ?? "";
    const existing = map.get(key);

    if (existing) {
      if (url && !existing.affectedUrls.includes(url)) existing.affectedUrls.push(url);
      if (SEVERITY_RANK[issue.severity] < SEVERITY_RANK[existing.severity]) {
        existing.severity = issue.severity;
      }
      if (!existing.aiRecommendation && issue.aiRecommendation) {
        existing.aiRecommendation = issue.aiRecommendation;
      }
    } else {
      map.set(key, {
        title: issue.title,
        category: cat,
        severity: issue.severity,
        description: issue.description,
        recommendation: issue.recommendation,
        affectedUrls: url ? [url] : [],
        aiRecommendation: issue.aiRecommendation,
      });
    }
  }

  return [...map.values()].sort((a, b) => {
    const sev = (SEVERITY_RANK[a.severity] ?? 99) - (SEVERITY_RANK[b.severity] ?? 99);
    if (sev !== 0) return sev;
    return b.affectedUrls.length - a.affectedUrls.length;
  });
}

function parseCategoryScores(raw: string): Record<Category, number> {
  const parsed = parseJsonField<Record<string, number>>(raw, {});
  const scores = {} as Record<Category, number>;
  for (const cat of categories) {
    scores[cat] = parsed[cat] ?? 100;
  }
  return scores;
}

export interface PageIssueDetail {
  title: string;
  severity: string;
  description: string;
  recommendation: string | null;
}

export function buildPageIssuesMap(
  pages: AuditPageRecord[],
  issues: AuditIssueRecord[]
): Map<string, PageIssueDetail[]> {
  const urlToPageId = new Map(pages.map((p) => [p.url, p.id]));
  const byPageId = new Map<string, PageIssueDetail[]>();

  for (const issue of issues) {
    const pageId =
      issue.pageId ?? (issue.affectedUrl ? urlToPageId.get(issue.affectedUrl) : undefined);
    if (!pageId) continue;

    const list = byPageId.get(pageId) ?? [];
    list.push({
      title: issue.title,
      severity: issue.severity,
      description: issue.description,
      recommendation: issue.recommendation,
    });
    byPageId.set(pageId, list);
  }

  return byPageId;
}

export interface AuditReportModel {
  id: string;
  url: string;
  domain: string;
  overallScore: number;
  overallGrade: string;
  verdict: { title: string; description: string };
  categoryScores: Record<Category, number>;
  stats: {
    critical: number;
    warning: number;
    notice: number;
    pagesCrawled: number;
    totalUnique: number;
  };
  executiveSummary: ExecutiveSummary | null;
  actionPlan: ActionPlan | null;
  categoryInsights: Record<string, CategoryRecommendation>;
  groupedIssues: GroupedIssue[];
  pages: Array<AuditPageRecord & { issueCount: number }>;
  completedAt: Date | null;
  reportUrl: string;
}

export function buildAuditReportModel(audit: AuditReportRecord): AuditReportModel {
  const categoryScores = parseCategoryScores(audit.categoryScores);
  const groupedIssues = groupAuditIssues(audit.issues);
  const executiveSummary = parseJsonField<ExecutiveSummary | null>(audit.aiSummary, null);
  const actionPlan = parseJsonField<ActionPlan | null>(audit.aiActionPlan, null);
  const categoryInsights = parseJsonField<Record<string, CategoryRecommendation>>(
    audit.aiCategoryInsights,
    {}
  );

  const pageIssueCounts = new Map<string, number>();
  for (const issue of audit.issues) {
    if (!issue.pageId) continue;
    pageIssueCounts.set(issue.pageId, (pageIssueCounts.get(issue.pageId) ?? 0) + 1);
  }

  const siteUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const completedAt = audit.completedAt ? new Date(audit.completedAt) : null;

  return {
    id: audit.id,
    url: audit.url,
    domain: audit.domain,
    overallScore: audit.overallScore,
    overallGrade: scoreToGrade(audit.overallScore),
    verdict: overallVerdict(audit.overallScore),
    categoryScores,
    stats: {
      critical: groupedIssues.filter((g) => g.severity === "critical").length,
      warning: groupedIssues.filter((g) => g.severity === "warning").length,
      notice: groupedIssues.filter((g) => g.severity === "notice").length,
      pagesCrawled: audit.pagesCrawled,
      totalUnique: groupedIssues.length,
    },
    executiveSummary,
    actionPlan,
    categoryInsights,
    groupedIssues,
    pages: audit.pages.map((p) => ({
      ...p,
      issueCount: pageIssueCounts.get(p.id) ?? 0,
    })),
    completedAt,
    reportUrl: `${siteUrl}/audits/${audit.id}`,
  };
}

export function parseIssueAiRecommendation(raw: string | null): IssueRecommendation | null {
  return parseJsonField<IssueRecommendation | null>(raw, null);
}

export { categoryLabels, categories };
