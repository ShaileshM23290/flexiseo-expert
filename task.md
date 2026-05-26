Update the FlexiSeo-Expert MVP requirements to include OpenAI-powered SEO expert recommendations.

Project name:
FlexiSeo-Expert

Important new requirement:
FlexiSeo-Expert must not only detect SEO issues. It must behave like an AI SEO expert that explains each issue and gives practical, clear, page-specific recommendations to fix it.

We already have an OpenAI API key.

Add OpenAI integration:
Use OpenAI API to generate expert-level SEO recommendations, summaries, issue explanations, priority actions, and improvement plans.

Environment variable:
OPENAI_API_KEY=

Also keep:
DATABASE_URL=
PAGESPEED_API_KEY=
NEXT_PUBLIC_APP_URL=

Install:
npm install openai

Create:
src/lib/ai/openai.ts
src/lib/ai/seo-recommendations.ts
src/lib/ai/prompts.ts
src/lib/ai/schemas.ts

Main AI goals:
1. Generate expert SEO recommendations for every detected issue.
2. Generate an executive SEO summary for the full audit.
3. Generate category-wise recommendations.
4. Generate prioritized action plan.
5. Generate page-specific fix suggestions.
6. Generate plain-English explanations for non-technical users.
7. Generate developer-friendly fix instructions where needed.
8. Make the report feel like it was reviewed by a professional SEO consultant.

Important:
Use OpenAI as much as possible, but safely and efficiently.
Do not send full raw HTML of all pages to OpenAI.
Send only extracted SEO signals, issue data, page metadata, and compact summaries.
Do not expose OPENAI_API_KEY on frontend.
All OpenAI calls must happen server-side only.
Use structured JSON output where possible.
Cache/store AI outputs in database so we do not regenerate every time the page reloads.
If OpenAI fails, fall back to rule-based recommendations.

Use OpenAI Structured Outputs / JSON style responses where possible so generated recommendations are predictable and easy to render in UI.

Add AI fields to database.

Update Audit model:
- aiSummary JSON optional
- aiActionPlan JSON optional
- aiGeneratedAt DateTime optional

Update AuditIssue model:
- aiRecommendation JSON optional
- aiPriority String optional
- aiEffort String optional
- aiImpact String optional
- aiGeneratedAt DateTime optional

Update AuditPage model:
- aiPageSummary JSON optional
- aiRecommendations JSON optional

Add AIRecommendation model if cleaner:
AIRecommendation:
- id
- auditId
- pageId optional
- issueId optional
- type
- title
- summary
- whyItMatters
- howToFix
- developerNotes
- priority
- impact
- effort
- category
- createdAt

Priority values:
- high
- medium
- low

Impact values:
- high
- medium
- low

Effort values:
- quick
- moderate
- advanced

AI recommendation structure for each issue:
{
  "title": "string",
  "summary": "string",
  "whyItMatters": "string",
  "howToFix": "string",
  "developerNotes": "string",
  "priority": "high | medium | low",
  "impact": "high | medium | low",
  "effort": "quick | moderate | advanced",
  "exampleFix": "string",
  "recommendedTool": "string | null"
}

Example:
Issue:
Missing meta description

AI output:
Title:
Add a focused meta description

Summary:
This page does not provide a meta description, so search engines may generate an automatic snippet that may not match your business message.

Why it matters:
A clear meta description can improve search result relevance and click-through rate.

How to fix:
Write a 120 to 160 character description that explains the page topic, includes the primary keyword naturally, and gives users a reason to visit.

Developer notes:
Add a meta description in the page head using the Next.js metadata object or generateMetadata function.

Example fix:
export const metadata = {
  description: "Your optimized page description here."
}

Priority:
high

Impact:
medium

Effort:
quick

Create AI functions:

1. generateAuditExecutiveSummary(auditData)
Input:
- website URL
- overall score
- category scores
- total issues
- critical issues
- warnings
- pages crawled
- top detected problems
- social presence summary
- schema summary
- performance summary

Output:
{
  "headline": "string",
  "summary": "string",
  "overallAssessment": "string",
  "topStrengths": ["string"],
  "topWeaknesses": ["string"],
  "businessImpact": "string",
  "nextBestActions": ["string"]
}

2. generateIssueRecommendation(issue, pageData, siteContext)
Input:
- issue title
- severity
- category
- affected URL
- page title
- meta description
- h1
- word count
- technical signals
- social/schema signals

Output:
AI recommendation JSON.

3. generateCategoryRecommendations(category, categoryScore, relatedIssues)
Output:
{
  "category": "string",
  "score": number,
  "summary": "string",
  "priority": "high | medium | low",
  "recommendations": [
    {
      "title": "string",
      "description": "string",
      "impact": "high | medium | low",
      "effort": "quick | moderate | advanced"
    }
  ]
}

4. generatePrioritizedActionPlan(auditData)
Output:
{
  "quickWins": [],
  "technicalFixes": [],
  "contentImprovements": [],
  "strategicImprovements": [],
  "sevenDayPlan": [],
  "thirtyDayPlan": []
}

5. generatePageSeoSummary(pageData, pageIssues)
Output:
{
  "pageUrl": "string",
  "summary": "string",
  "mainProblems": [],
  "recommendedFixes": [],
  "priority": "high | medium | low"
}

AI usage strategy:
- Use AI after rule-based audit is completed.
- First run crawler and deterministic SEO analyzer.
- Then pass compact audit result to OpenAI.
- Generate:
  - Full audit executive summary
  - Category recommendations
  - Recommendations for critical and warning issues
  - Page summaries for important pages
- For MVP, limit AI generation:
  - Max 30 issue recommendations per audit
  - Prioritize critical issues first
  - Then warnings
  - Then notices only if capacity remains
- Do not generate AI text for every passed check.

AI prompt style:
The AI should act as:
"Senior technical SEO consultant, website auditor, and growth-focused SEO strategist."

Tone:
- Professional
- Clear
- Actionable
- Non-generic
- Practical
- Business-focused
- Developer-friendly where needed

Avoid:
- Generic SEO advice
- Long fluffy paragraphs
- Keyword stuffing recommendations
- Fake guarantees
- Claims like "this will rank you #1"
- Unverified backlink or traffic claims
- Mentioning that an AI generated the recommendation

System prompt:
You are a senior technical SEO consultant and website auditor. You analyze structured SEO audit data and provide practical, accurate, business-focused recommendations. You must not invent data that is not present in the audit. You must only comment on the provided URL, page signals, issues, and category scores. Your recommendations must be specific, actionable, and safe for implementation. Do not guarantee rankings. Do not mention backlinks, traffic, or indexing unless the data is provided.

Issue recommendation user prompt:
Generate an expert SEO recommendation for this detected issue.

Input:
- Website domain
- Page URL
- Issue category
- Issue severity
- Issue title
- Issue description
- Existing recommendation from rule-based analyzer
- Page title
- Meta description
- H1 count
- Word count
- Canonical status
- Indexability status
- Social tags status
- Schema status

Return only valid JSON:
{
  "title": "",
  "summary": "",
  "whyItMatters": "",
  "howToFix": "",
  "developerNotes": "",
  "priority": "high",
  "impact": "medium",
  "effort": "quick",
  "exampleFix": "",
  "recommendedTool": null
}

Executive summary prompt:
Generate a professional SEO audit executive summary from the provided structured audit data.

Return only valid JSON:
{
  "headline": "",
  "summary": "",
  "overallAssessment": "",
  "topStrengths": [],
  "topWeaknesses": [],
  "businessImpact": "",
  "nextBestActions": []
}

UI updates:

On audit result page, add AI SEO Expert sections.

1. AI Executive Summary Card
Place near the top after score section.
Show:
- AI-generated headline
- Summary
- Overall assessment
- Top strengths
- Top weaknesses
- Business impact
- Next best actions

Label:
AI SEO Expert Summary

2. AI Priority Action Plan
Show after category charts.
Sections:
- Quick Wins
- Technical Fixes
- Content Improvements
- Strategic Improvements
- 7-Day Plan
- 30-Day Plan

3. AI Recommendations inside issue list
Each issue card should show:
- Issue title
- Severity
- Rule-based description
- AI recommendation
- Why it matters
- How to fix
- Developer notes
- Impact badge
- Effort badge
- Priority badge

4. AI Category Insights
Inside every tab:
- Technical SEO
- On-page SEO
- Content
- Performance
- Accessibility
- Social
- Schema

Show:
- AI category summary
- Top fixes
- Expected business impact
- Recommended priority

5. AI Page-Level Recommendations
In page breakdown table, add expandable row.
When expanded, show:
- AI page summary
- Main problems
- Recommended fixes
- Page priority

Loading state updates:
During audit loading, include AI steps:
- Validating website
- Reading robots.txt
- Finding sitemap
- Crawling pages
- Extracting SEO signals
- Calculating scores
- Generating AI SEO recommendations
- Preparing expert report

Add professional loading text:
FlexiSeo-Expert is analyzing your website and generating expert SEO recommendations.

API updates:

Create route:
POST /api/audits/[id]/ai

Purpose:
Generate AI recommendations for a completed audit.

Flow:
- Fetch audit with pages and issues.
- Build compact payload.
- Generate executive summary.
- Generate priority action plan.
- Generate category recommendations.
- Generate issue recommendations for top issues.
- Save results to database.
- Return updated audit.

Audit completion flow:
After rule-based audit completes:
- Automatically trigger AI recommendation generation if OPENAI_API_KEY exists.
- If OPENAI_API_KEY is missing:
  - Use rule-based recommendations only.
  - Show a small note in admin/dev logs only, not in public UI.

Frontend:
The user should not see a broken AI section if OpenAI is unavailable.
Show rule-based recommendations normally.
If AI exists, enhance the report with AI SEO Expert content.

Cost control:
- Limit OpenAI calls.
- Batch issues where possible.
- Use compact JSON inputs.
- Do not send raw HTML.
- Store outputs.
- Reuse saved outputs.
- Add maxIssuesForAI = 30.
- Add maxPagesForAISummary = 10.

Error handling:
- If AI response fails validation, retry once.
- If still invalid, use fallback rule-based recommendation.
- Do not fail the full audit because AI failed.
- Log AI errors server-side.

Security:
- Never expose OPENAI_API_KEY to client.
- Never include secret env values in logs.
- Sanitize all AI-generated content before rendering.
- Render as text, not raw HTML.
- Validate AI JSON before saving.

README updates:
Add section:
OpenAI AI SEO Expert Recommendations

Explain:
- Add OPENAI_API_KEY in .env
- AI recommendations are optional but recommended
- Without OpenAI key, the app still works using rule-based recommendations
- AI is used to generate expert summaries, fix recommendations, action plans, and category insights

Final requirement:
FlexiSeo-Expert should feel like an AI-powered SEO expert, not just a crawler. The final report must combine deterministic SEO checks with OpenAI-generated expert recommendations, visual graphs, category scores, and practical action plans.