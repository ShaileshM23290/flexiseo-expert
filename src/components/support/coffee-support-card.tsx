"use client";

import { Coffee } from "lucide-react";
import { CoffeeAmountPicker } from "@/components/support/coffee-amount-picker";
import { useCoffeeCheckout } from "@/components/support/use-coffee-checkout";
import { coffeeSupportCopy } from "@/lib/payments/support-copy";
import { cn } from "@/lib/utils";

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
  const { pay, loadingAmount, error, success, available } = useCoffeeCheckout(auditId);

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
            Built with care, kept free on purpose
          </p>
          <h3 className="mt-1 text-lg font-bold text-slate-900">
            {success ? coffeeSupportCopy.titleSuccess : coffeeSupportCopy.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {success
              ? coffeeSupportCopy.success
              : auditUrl
                ? coffeeSupportCopy.descriptionAudit(auditUrl)
                : coffeeSupportCopy.description}
          </p>

          {!success && (
            <div className="mt-4">
              <CoffeeAmountPicker
                onPay={pay}
                loadingAmount={loadingAmount}
                disabled={loadingAmount !== null}
              />
            </div>
          )}

          {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
          {!success && (
            <p className="mt-3 text-xs text-slate-500">{coffeeSupportCopy.footerNote}</p>
          )}
        </div>
      </div>
    </div>
  );
}
