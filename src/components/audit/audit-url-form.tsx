"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Globe } from "lucide-react";
import { AuditProgressCard, useAuditLoadingSteps } from "@/components/audit/audit-progress-card";
import { resolveVisitorIp } from "@/lib/client-ip";
import { formatPublicAuditError, toPublicAuditError } from "@/lib/audit/public-errors";
import { cn } from "@/lib/utils";

interface AuditUrlFormProps {
  variant?: "hero" | "default";
  inputId?: string;
  className?: string;
}

export function AuditUrlForm({
  variant = "default",
  inputId = "audit-url",
  className,
}: AuditUrlFormProps) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { stepIndex, startedAt } = useAuditLoadingSteps(loading);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError("");

    try {
      const clientIp = await resolveVisitorIp();

      const res = await fetch("/api/audits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), clientIp }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to start audit");
      }

      const { id } = await res.json();

      const poll = async () => {
        const statusRes = await fetch(`/api/audits/${id}`);
        const audit = await statusRes.json();
        if (audit.status === "completed") {
          router.push(`/audits/${id}`);
        } else if (audit.status === "failed") {
          setError(formatPublicAuditError(audit.errorMessage));
          setLoading(false);
        } else {
          setTimeout(poll, 2000);
        }
      };

      setTimeout(poll, 2000);
    } catch (err) {
      setError(toPublicAuditError(err));
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <AuditProgressCard
        title="Analyzing your website…"
        stepIndex={stepIndex}
        startedAt={startedAt}
        url={url.trim()}
        className={cn(variant === "hero" && "p-8", className)}
      />
    );
  }

  const isHero = variant === "hero";

  return (
    <form onSubmit={handleSubmit} className={cn("w-full", className)} aria-label="Website SEO audit">
      <label
        htmlFor={inputId}
        className={cn(
          "block text-sm font-medium text-slate-700",
          isHero && "sr-only"
        )}
      >
        Website URL
      </label>

      <div
        className={cn(
          "flex gap-2 sm:gap-3",
          variant === "default" && "mt-3",
          isHero &&
            "flex-col rounded-xl border border-slate-200 bg-white p-2 shadow-sm sm:flex-row sm:items-center sm:p-2"
        )}
      >
        <div className="relative min-w-0 flex-1">
          <Globe
            className={cn(
              "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400",
              isHero && "left-4 h-5 w-5"
            )}
          />
          <input
            id={inputId}
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter your website — e.g. https://yoursite.com"
            className={cn(
              "w-full rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400",
              "focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20",
              isHero
                ? "border-0 py-3.5 pl-11 pr-4 text-base shadow-none focus:ring-0 sm:py-4"
                : "py-3 pl-10 pr-4 text-sm"
            )}
            required
            autoComplete="url"
            spellCheck={false}
          />
        </div>
        <button
          type="submit"
          className={cn(
            "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-600 font-semibold text-white transition-colors hover:bg-brand-700",
            isHero ? "px-6 py-3.5 text-sm sm:px-8" : "px-6 py-3 text-sm"
          )}
        >
          Analyze Free
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}

      {isHero && !error && (
        <p className="mt-3 text-xs text-slate-600">
          Free instant audit · No signup · Results in under 2 minutes
        </p>
      )}
    </form>
  );
}
