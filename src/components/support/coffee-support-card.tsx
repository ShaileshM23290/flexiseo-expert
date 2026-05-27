"use client";

import { Coffee, Heart, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCoffeeCheckout } from "@/components/support/use-coffee-checkout";

type CoffeeSupportCardProps = {
  auditId?: string;
  auditUrl?: string;
  variant?: "inline" | "compact";
  className?: string;
};

export function CoffeeSupportCard({
  auditId,
  auditUrl,
  variant = "inline",
  className,
}: CoffeeSupportCardProps) {
  const { pay, loadingAmount, error, success, amounts, available } = useCoffeeCheckout(auditId);

  if (!available) return null;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-brand-50",
        variant === "compact" ? "p-4 sm:p-5" : "p-5 sm:p-6",
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
          <Coffee className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
            Keep it free for everyone
          </p>
          <h3 className="mt-1 text-lg font-bold text-slate-900">
            {success ? "Thank you for your support!" : "Buy us a coffee"}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {success
              ? "Your contribution helps cover API costs and keeps FlexiSeo Expert free."
              : auditUrl
                ? `This audit for ${auditUrl} uses real Lighthouse, CrUX, and AI calls. If it helped, a small tip keeps the tool free for others.`
                : "FlexiSeo Expert is free — no signup, no limits. A coffee helps us cover API costs."}
          </p>

          {!success && (
            <div className="mt-4 flex flex-wrap gap-2">
              {amounts.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => pay(option.amountPaise)}
                  disabled={loadingAmount !== null}
                  className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-amber-300 hover:bg-amber-50 disabled:opacity-60"
                >
                  {loadingAmount === option.amountPaise ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Heart className="h-4 w-4 text-amber-600" />
                  )}
                  {option.label}
                </button>
              ))}
            </div>
          )}

          {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
          {!success && (
            <p className="mt-3 text-xs text-slate-500">Secure payment via Razorpay. Optional — always free to use.</p>
          )}
        </div>
      </div>
    </div>
  );
}
