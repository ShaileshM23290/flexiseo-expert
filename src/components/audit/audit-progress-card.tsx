"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { auditLoadingSteps } from "@/lib/config";
import { cn } from "@/lib/utils";

export function useAuditLoadingSteps(active: boolean) {
  const [stepIndex, setStepIndex] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);

  useEffect(() => {
    if (!active) {
      setStepIndex(0);
      setStartedAt(null);
      return;
    }

    setStartedAt(Date.now());
    setStepIndex(0);

    const stepInterval = window.setInterval(() => {
      setStepIndex((prev) => Math.min(prev + 1, auditLoadingSteps.length - 1));
    }, 4000);

    return () => window.clearInterval(stepInterval);
  }, [active]);

  return { stepIndex, startedAt };
}

function formatElapsed(startedAt: number | null, tick: number): string {
  void tick;
  if (!startedAt) return "";
  const elapsedSec = Math.floor((Date.now() - startedAt) / 1000);
  if (elapsedSec >= 60) {
    return `${Math.floor(elapsedSec / 60)}m ${elapsedSec % 60}s`;
  }
  return `${elapsedSec}s`;
}

interface AuditProgressCardProps {
  title: string;
  stepIndex: number;
  startedAt?: number | null;
  url?: string;
  className?: string;
}

export function AuditProgressCard({
  title,
  stepIndex,
  startedAt = null,
  url,
  className,
}: AuditProgressCardProps) {
  const [elapsedTick, setElapsedTick] = useState(0);
  const onFinalStep = stepIndex >= auditLoadingSteps.length - 1;
  const elapsedLabel = formatElapsed(startedAt, elapsedTick);

  useEffect(() => {
    if (!startedAt) return;
    const tick = window.setInterval(() => setElapsedTick((n) => n + 1), 1000);
    return () => window.clearInterval(tick);
  }, [startedAt]);

  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm",
        className
      )}
    >
      <Loader2 className="mx-auto h-9 w-9 animate-spin text-brand-600" />
      <p className="mt-4 text-base font-medium text-slate-900">{title}</p>
      <p className="mt-1 animate-pulse-soft text-sm text-brand-600">
        {auditLoadingSteps[stepIndex]}
      </p>
      {onFinalStep && (
        <p className="mt-2 text-xs leading-relaxed text-slate-500">
          Finishing PageSpeed, security scans, and scoring. This step often takes 1–3 minutes
          {elapsedLabel ? ` (${elapsedLabel} elapsed)` : ""}.
        </p>
      )}
      {url && <p className="mt-3 truncate text-xs text-slate-500">{url}</p>}
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
