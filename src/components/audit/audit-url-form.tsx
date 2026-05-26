"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Globe, Loader2 } from "lucide-react";
import { auditLoadingSteps } from "@/lib/config";
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
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError("");
    setStepIndex(0);

    const stepInterval = setInterval(() => {
      setStepIndex((prev) => Math.min(prev + 1, auditLoadingSteps.length - 1));
    }, 4000);

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
          clearInterval(stepInterval);
          router.push(`/audits/${id}`);
        } else if (audit.status === "failed") {
          clearInterval(stepInterval);
          setError(formatPublicAuditError(audit.errorMessage));
          setLoading(false);
        } else {
          setTimeout(poll, 2000);
        }
      };

      setTimeout(poll, 2000);
    } catch (err) {
      clearInterval(stepInterval);
      setError(toPublicAuditError(err));
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div
        className={cn(
          "rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm",
          variant === "hero" && "p-8",
          className
        )}
      >
        <Loader2 className="mx-auto h-9 w-9 animate-spin text-brand-600" />
        <p className="mt-4 text-base font-medium text-slate-900">
          Analyzing your website…
        </p>
        <p className="mt-1 animate-pulse-soft text-sm text-brand-600">
          {auditLoadingSteps[stepIndex]}
        </p>
        {stepIndex >= auditLoadingSteps.length - 1 && (
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            Finishing PageSpeed and API checks — usually 1–3 minutes for most sites.
          </p>
        )}
        <div className="mx-auto mt-6 max-w-sm">
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-brand-600 transition-all duration-500"
              style={{
                width: `${((stepIndex + 1) / auditLoadingSteps.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  const isHero = variant === "hero";

  return (
    <form onSubmit={handleSubmit} className={cn("w-full", className)}>
      {variant === "default" && (
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
          Website URL
        </label>
      )}

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
        <p className="mt-3 text-xs text-slate-500">
          Free instant audit · No signup · Results in under 2 minutes
        </p>
      )}
    </form>
  );
}
