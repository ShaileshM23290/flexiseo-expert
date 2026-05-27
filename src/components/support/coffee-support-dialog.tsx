"use client";

import { useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { Coffee, X } from "lucide-react";
import { CoffeeAmountPicker } from "@/components/support/coffee-amount-picker";
import { useCoffeeCheckout } from "@/components/support/use-coffee-checkout";
import { coffeeSupportCopy } from "@/lib/payments/support-copy";

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
  const { pay, loadingAmount, error, success } = useCoffeeCheckout(auditId);

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

  const copy = description ?? coffeeSupportCopy.descriptionModal;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 cursor-pointer bg-slate-900/45 backdrop-blur-[2px]"
        onClick={() => {
          if (loadingAmount === null) onClose();
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl sm:max-w-md"
      >
        <button
          type="button"
          onClick={onClose}
          disabled={loadingAmount !== null}
          className="absolute right-3 top-3 cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Close dialog"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 pr-8 text-amber-700">
          <Coffee className="h-4 w-4 shrink-0" />
          <p id={titleId} className="text-sm font-semibold">
            {success ? coffeeSupportCopy.titleSuccess : coffeeSupportCopy.title}
          </p>
        </div>

        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {success ? coffeeSupportCopy.success : copy}
        </p>

        {!success && (
          <div className="mt-4">
            <CoffeeAmountPicker
              onPay={pay}
              loadingAmount={loadingAmount}
              disabled={loadingAmount !== null}
              compact
            />
          </div>
        )}

        {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
        {!success && (
          <p className="mt-3 text-center text-[11px] text-slate-400">{coffeeSupportCopy.footerNote}</p>
        )}

        {showDismissActions && !success && (
          <div className="mt-3 flex justify-center gap-4 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => {
                onDismiss?.(false);
                onClose();
              }}
              className="cursor-pointer text-sm font-medium text-slate-500 hover:text-slate-700"
            >
              Maybe later
            </button>
            <button
              type="button"
              onClick={() => {
                onDismiss?.(true);
                onClose();
              }}
              className="cursor-pointer text-sm font-medium text-slate-400 hover:text-slate-600"
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
