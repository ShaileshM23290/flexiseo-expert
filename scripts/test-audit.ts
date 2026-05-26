import { runAudit } from "../src/lib/audit/runner";

async function main() {
const urls = process.argv.slice(2);
const targets = urls.length > 0 ? urls : ["https://google.co.in", "https://flexodynsolutions.com"];

for (const url of targets) {
  console.log("\n===", url, "===");
  try {
    const r = await runAudit(url);
    console.log("Overall:", r.overallScore);
    console.log("Categories:", JSON.stringify(r.categoryScores));
    console.log("Pages crawled:", r.pagesCrawled);
    console.log("Unique findings:", r.issueGroups.length, "raw:", r.issues.length);
    console.log("  critical groups:", r.criticalCount);
    console.log("  warning groups:", r.warningCount);
    console.log("  notice groups:", r.noticeCount);
    console.log("  SPA shell?", r.isSpaShell);
    console.log("Top 5 groups:");
    for (const g of r.issueGroups.slice(0, 8)) {
      console.log(`  [${g.severity}] ${g.title} (${g.affectedUrls.length} URLs)`);
    }
  } catch (e) {
    console.error("FAILED:", e instanceof Error ? e.message : e);
  }
}
}

main();
