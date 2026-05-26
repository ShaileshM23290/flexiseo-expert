const DEFAULT_MESSAGE =
  "Something went wrong during the audit. Please try again.";

const NETWORK_PATTERNS = [
  /fetch failed/i,
  /ECONNREFUSED/i,
  /ETIMEDOUT/i,
  /ENOTFOUND/i,
  /EAI_AGAIN/i,
  /network/i,
  /timeout/i,
  /abort/i,
  /socket hang up/i,
  /connection reset/i,
  /no internet/i,
  /failed to fetch/i,
  /getaddrinfo/i,
];

const TECHNICAL_PATTERNS = [
  /prisma/i,
  /invocation/i,
  /\.next[/\\]/,
  /[A-Z]:\\[^ ]+/,
  /\/(?:src|node_modules)\//,
  /auditIssue/i,
  /record.*not found/i,
  /P2025/i,
  /at async/i,
  /stack trace/i,
  /\n/,
];

function extractMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return DEFAULT_MESSAGE;
}

/** Map internal errors to safe, user-facing copy. Never expose stack traces or paths. */
export function toPublicAuditError(error: unknown): string {
  const raw = extractMessage(error).trim();
  if (!raw) return DEFAULT_MESSAGE;

  if (NETWORK_PATTERNS.some((pattern) => pattern.test(raw))) {
    return "Your internet connection was interrupted while we analyzed your site. Please check your connection and try again.";
  }

  if (TECHNICAL_PATTERNS.some((pattern) => pattern.test(raw)) || raw.length > 160) {
    return DEFAULT_MESSAGE;
  }

  return raw;
}

/** Sanitize a stored audit errorMessage before sending to the client. */
export function formatPublicAuditError(stored: string | null | undefined): string {
  if (!stored?.trim()) {
    return "The audit could not be completed. Please try again.";
  }
  return toPublicAuditError(stored);
}
