/** OpenAI usage controls — tune via .env to manage cost. */

const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";

/** Chat model for structured audit recommendations (override with OPENAI_MODEL). */
export function getOpenAIModel(): string {
  const raw = process.env.OPENAI_MODEL?.trim();
  return raw || DEFAULT_OPENAI_MODEL;
}

/** GPT-5+ and o-series reasoning models reject `temperature` unless reasoning is off. */
export function isReasoningModel(model: string): boolean {
  return /^(o\d|gpt-(5|6|7|8|9))/i.test(model);
}

/** When false, skips the single AI pass that runs after each audit completes. */
export function isOpenAIAutoGenerateEnabled(): boolean {
  return process.env.OPENAI_AUTO_GENERATE !== "false";
}

export function isOpenAIRetryEnabled(): boolean {
  return process.env.OPENAI_RETRY === "true";
}

function envInt(name: string, fallback: number, max: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n) || n < 0) return fallback;
  return Math.min(max, n);
}

/** Hard caps to prevent runaway spend */
export const aiLimits = {
  /** Max critical/warning issues sent to OpenAI per audit */
  maxIssues: envInt("OPENAI_MAX_ISSUES", 8, 20),
  /** Per-page AI summaries (0 = disabled — biggest token saver) */
  maxPages: envInt("OPENAI_MAX_PAGES", 0, 5),
  /** Skip category AI when score is at or above this */
  categoryScoreThreshold: envInt("OPENAI_CATEGORY_THRESHOLD", 75, 100),
  /** Issues per single batched API request */
  issueBatchSize: envInt("OPENAI_ISSUE_BATCH_SIZE", 8, 10),
  /** Max output tokens per completion */
  maxTokens: envInt("OPENAI_MAX_TOKENS", 1200, 4096),
};

/** Batch issue JSON is large — scale output cap so responses are not truncated mid-string. */
export function maxTokensForBatchIssues(issueCount: number): number {
  const perIssue = 520;
  const floor = aiLimits.maxTokens;
  const scaled = 150 + Math.max(1, issueCount) * perIssue;
  return Math.min(4096, Math.max(floor, scaled));
}

export const maxIssuesForAI = aiLimits.maxIssues;
export const maxPagesForAISummary = aiLimits.maxPages;
