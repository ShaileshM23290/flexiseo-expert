export const SYSTEM_PROMPT = `You are a senior technical SEO consultant and website auditor. You analyze structured SEO audit data and provide practical, accurate, business-focused recommendations.

Rules:
- Do not invent data not present in the audit
- Only comment on the provided URL, page signals, issues, and category scores
- Be specific, actionable, and safe for implementation
- Do not guarantee rankings
- Do not mention backlinks, traffic, or indexing unless the data is provided
- Avoid generic SEO advice and long fluffy paragraphs
- Never mention that you are an AI
- Write in professional, clear, actionable tone`;

export function issueRecommendationPrompt(input: {
  domain: string;
  pageUrl: string;
  category: string;
  severity: string;
  title: string;
  description: string;
  ruleRecommendation?: string | null;
  pageTitle?: string | null;
  metaDescription?: string | null;
  h1Count?: number;
  wordCount?: number;
  canonical?: string | null;
  isIndexable?: boolean;
  hasSocialTags?: boolean;
  hasSchema?: boolean;
}): string {
  return `Generate an expert SEO recommendation for this detected issue.

Website domain: ${input.domain}
Page URL: ${input.pageUrl}
Issue category: ${input.category}
Issue severity: ${input.severity}
Issue title: ${input.title}
Issue description: ${input.description}
Existing rule-based recommendation: ${input.ruleRecommendation ?? "None"}
Page title: ${input.pageTitle ?? "Not found"}
Meta description: ${input.metaDescription ?? "Missing"}
H1 count: ${input.h1Count ?? 0}
Word count: ${input.wordCount ?? 0}
Canonical status: ${input.canonical ?? "Not set"}
Indexability: ${input.isIndexable ? "Indexable" : "Not indexable"}
Social tags: ${input.hasSocialTags ? "Present" : "Missing or incomplete"}
Schema: ${input.hasSchema ? "Present" : "Missing"}

Provide practical, page-specific guidance.`;
}

export function batchIssueRecommendationPrompt(
  domain: string,
  issues: Array<{
    index: number;
    pageUrl: string;
    category: string;
    severity: string;
    title: string;
    description: string;
    ruleRecommendation?: string | null;
    pageTitle?: string | null;
    metaDescription?: string | null;
    h1Count?: number;
    wordCount?: number;
  }>
): string {
  const issueList = issues
    .map(
      (i) =>
        `[${i.index}] URL: ${i.pageUrl} | ${i.severity} | ${i.category} | ${i.title}
Description: ${i.description}
Rule recommendation: ${i.ruleRecommendation ?? "None"}
Page title: ${i.pageTitle ?? "N/A"} | Words: ${i.wordCount ?? 0} | H1s: ${i.h1Count ?? 0}`
    )
    .join("\n\n");

  return `Generate expert SEO recommendations for each issue below on ${domain}.
Return one recommendation per issue in the same order (index 0 first).

Issues:
${issueList}`;
}

export function executiveSummaryPrompt(auditData: Record<string, unknown>): string {
  return `Generate a professional SEO audit executive summary from this structured audit data:

${JSON.stringify(auditData)}

Focus on business impact and prioritized next steps. Be concise.`;
}

export function categoryRecommendationPrompt(
  category: string,
  score: number,
  relatedIssues: Array<{ title: string; severity: string; description: string }>
): string {
  return `Generate category-level SEO recommendations.

Category: ${category}
Score: ${score}/100
Related issues:
${relatedIssues.map((i) => `- [${i.severity}] ${i.title}: ${i.description}`).join("\n")}`;
}

export function actionPlanPrompt(auditData: Record<string, unknown>): string {
  return `Create a prioritized SEO action plan from this audit data:

${JSON.stringify(auditData)}

Organize into quick wins, technical fixes, content improvements, strategic improvements, 7-day plan, and 30-day plan.`;
}

export function auditOverviewPrompt(auditData: Record<string, unknown>): string {
  return `From this SEO audit data, produce BOTH an executive summary AND a prioritized action plan in one response.

Audit data:
${JSON.stringify(auditData)}

Return JSON with "executiveSummary" and "actionPlan" objects. Be concise — short bullet points, no fluff.`;
}

export function pageSummaryPrompt(
  pageData: Record<string, unknown>,
  pageIssues: Array<{ title: string; severity: string; description: string }>
): string {
  return `Generate a page-level SEO summary and fix recommendations.

Page data:
${JSON.stringify(pageData, null, 2)}

Page issues:
${pageIssues.map((i) => `- [${i.severity}] ${i.title}: ${i.description}`).join("\n")}`;
}
