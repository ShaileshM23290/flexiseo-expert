/** PDF hex palette aligned with Tailwind classes used on the audit report page */

export const PDF_BRAND = {
  primary: "#a51c1c",
  dark: "#7b1414",
  light: "#fef2f2",
  muted: "#fee2e2",
  soft: "#fff5f5",
};

export const PDF_SLATE = {
  900: "#0f172a",
  700: "#334155",
  600: "#475569",
  500: "#64748b",
  400: "#94a3b8",
  200: "#e2e8f0",
  100: "#f1f5f9",
  50: "#f8fafc",
  white: "#ffffff",
};

export const PDF_SEVERITY = {
  critical: {
    bg: "#fff1f2",
    border: "#fecdd3",
    text: "#be123c",
    badge: "#e11d48",
    accent: "#f43f5e",
  },
  warning: {
    bg: "#fffbeb",
    border: "#fde68d",
    text: "#b45309",
    badge: "#d97706",
    accent: "#f59e0b",
  },
  notice: {
    bg: "#f0f9ff",
    border: "#bae6fd",
    text: "#0369a1",
    badge: "#0284c7",
    accent: "#0ea5e9",
  },
} as const;

export const PDF_STATS = {
  critical: { bg: "#fff1f2", border: "#fecdd3", text: "#e11d48" },
  warning: { bg: "#fffbeb", border: "#fde68d", text: "#d97706" },
  notice: { bg: "#f0f9ff", border: "#bae6fd", text: "#0284c7" },
  pages: { bg: "#f8fafc", border: "#e2e8f0", text: "#334155" },
} as const;

export const PDF_PRIORITY = {
  high: { bg: "#fff1f2", border: "#fecdd3", text: "#be123c" },
  medium: { bg: "#fffbeb", border: "#fde68d", text: "#b45309" },
  low: { bg: "#f1f5f9", border: "#e2e8f0", text: "#475569" },
} as const;

export const PDF_ACTION_PLAN = {
  quickWins: { title: "#7b1414", bg: "#fef2f2", border: "#fecaca" },
  technicalFixes: { title: "#0369a1", bg: "#f0f9ff", border: "#bae6fd" },
  contentImprovements: { title: "#b45309", bg: "#fffbeb", border: "#fde68d" },
  strategicImprovements: { title: "#6d28d9", bg: "#f5f3ff", border: "#ddd6fe" },
  sevenDayPlan: { title: "#7b1414", bg: "#fef2f2", border: "#fecaca" },
  thirtyDayPlan: { title: "#7b1414", bg: "#fef2f2", border: "#fecaca" },
} as const;

export const PDF_TECH_ACCENT = {
  violet: { bg: "#f5f3ff", border: "#ddd6fe", header: "#6d28d9" },
  sky: { bg: "#f0f9ff", border: "#bae6fd", header: "#0284c7" },
  amber: { bg: "#fffbeb", border: "#fde68d", header: "#d97706" },
  brand: { bg: "#fef2f2", border: "#fecaca", header: "#a51c1c" },
  rose: { bg: "#fff1f2", border: "#fecdd3", header: "#e11d48" },
  slate: { bg: "#f8fafc", border: "#e2e8f0", header: "#475569" },
} as const;

export function pdfGradePalette(grade: string) {
  if (grade.startsWith("A")) return { bg: "#fef2f2", border: "#fecaca", text: "#a51c1c", bar: "#c53030" };
  if (grade.startsWith("B")) return { bg: "#f7fee7", border: "#d9f99d", text: "#65a30d", bar: "#84cc16" };
  if (grade.startsWith("C")) return { bg: "#fffbeb", border: "#fde68d", text: "#d97706", bar: "#f59e0b" };
  if (grade.startsWith("D")) return { bg: "#fff7ed", border: "#fdba74", text: "#ea580c", bar: "#f97316" };
  return { bg: "#fff1f2", border: "#fecdd3", text: "#e11d48", bar: "#f43f5e" };
}

export function pdfScoreBarHex(score: number): string {
  if (score >= 80) return "#10b981";
  if (score >= 60) return "#f59e0b";
  return "#f43f5e";
}

export function pdfSeverityPalette(severity: string) {
  if (severity === "critical") return PDF_SEVERITY.critical;
  if (severity === "warning") return PDF_SEVERITY.warning;
  return PDF_SEVERITY.notice;
}

export function pdfPriorityPalette(priority: string) {
  if (priority === "high") return PDF_PRIORITY.high;
  if (priority === "medium") return PDF_PRIORITY.medium;
  return PDF_PRIORITY.low;
}
