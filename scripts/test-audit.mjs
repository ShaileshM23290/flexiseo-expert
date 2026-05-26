import { runAudit } from "../src/lib/audit/runner.ts";

const url = process.argv[2] || "https://google.co.in";
console.log("Auditing", url, "...\n");

const result = await runAudit(url);
console.log("Overall:", result.overallScore);
console.log("Categories:", result.categoryScores);
console.log("Pages crawled:", result.pagesCrawled, result.pages.map((p) => p.url));
console.log("Issues:", result.totalIssues ?? result.issues.length);
console.log("  critical:", result.criticalCount);
console.log("  warning:", result.warningCount);
console.log("  notice:", result.noticeCount);
