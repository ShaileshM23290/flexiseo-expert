import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function sanitizeText(text: string): string {
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/javascript:/gi, "")
    .trim();
}

export function formatUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

export function getDomain(url: string): string {
  try {
    return new URL(formatUrl(url)).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-amber-600";
  return "text-rose-600";
}

export function scoreBarColor(score: number): string {
  if (score >= 80) return "#10b981";
  if (score >= 60) return "#f59e0b";
  return "#f43f5e";
}

export function severityColor(severity: string): string {
  switch (severity) {
    case "critical":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "warning":
      return "bg-amber-50 text-amber-800 border-amber-200";
    default:
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
}

export function priorityColor(priority: string): string {
  switch (priority) {
    case "high":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "medium":
      return "bg-amber-50 text-amber-800 border-amber-200";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}
