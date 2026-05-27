"use client";

import { useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { Coffee, Heart, Loader2, X } from "lucide-react";
import { useCoffeeCheckout } from "@/components/support/use-coffee-checkout";

type CoffeeSupportDialogProps = {
  open: boolean;
  onClose: () => void;
  auditId?: string;
  description?: string;
  showDismissActions?: boolean;
  onDismiss?: (permanent: boolean) => void;
};

export function CoffeeSupportDialog({
  open,
  onClose,
  auditId,
  description,
  showDismissActions = false,
  onDismiss,
}: CoffeeSupportDialogProps) {
  const titleId = useId();
  const { pay, loadingAmount, error, success, amounts } = useCoffeeCheckout(auditId);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && loadingAmount === null) onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, loadingAmount, onClose]);

  if (!open || typeof document === "undefined") return null;

  const copy =
    description ??
    "FlexiSeo Expert is free — no signup, no limits. A small tip helps cover API costs.";

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]"
        onClick={() => {
          if (loadingAmount === null) onClose();
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl sm:p-6"
      >
        <button
          type="button"
          onClick={onClose}
          disabled={loadingAmount !== null}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
          aria-label="Close dialog"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 text-amber-700">
          <Coffee className="h-4 w-4" />
          <p id={titleId} className="text-sm font-semibold">
            {success ? "Thank you!" : "Buy us a coffee"}
          </p>
        </div>

        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {success
            ? "Your support helps keep FlexiSeo Expert free for everyone."
            : copy}
        </p>

        {!success && (
          <div className="mt-4 flex flex-wrap gap-2">
            {amounts.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => pay(option.amountPaise)}
                disabled={loadingAmount !== null}
                className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-amber-100 disabled:opacity-60"
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
          <p className="mt-3 text-xs text-slate-500">
            Secure payment via Razorpay. Optional — always free to use.
          </p>
        )}

        {showDismissActions && !success && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => {
                onDismiss?.(false);
                onClose();
              }}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Maybe later
            </button>
            <button
              type="button"
              onClick={() => {
                onDismiss?.(true);
                onClose();
              }}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100"
            >
              Don&apos;t show again
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
