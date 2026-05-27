"use client";

import { useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import {
  COFFEE_MIN_AMOUNT_INR,
  COFFEE_MAX_AMOUNT_INR,
  coffeeAmountOptions,
  parseCoffeeAmountInr,
} from "@/lib/payments/config";
import { cn } from "@/lib/utils";

type CoffeeAmountPickerProps = {
  onPay: (amountPaise: number) => void;
  loadingAmount: number | null;
  disabled?: boolean;
  compact?: boolean;
};

export function CoffeeAmountPicker({
  onPay,
  loadingAmount,
  disabled = false,
  compact = false,
}: CoffeeAmountPickerProps) {
  const [customAmount, setCustomAmount] = useState("");
  const [customError, setCustomError] = useState("");

  function handleCustomPay() {
    const parsed = parseCoffeeAmountInr(customAmount);
    if (!parsed.ok) {
      setCustomError(parsed.error);
      return;
    }
    setCustomError("");
    onPay(parsed.amountPaise);
  }

  function handleCustomChange(value: string) {
    setCustomAmount(value.replace(/[^\d]/g, ""));
    if (customError) setCustomError("");
  }

  const isBusy = disabled || loadingAmount !== null;
  const isCustomLoading =
    loadingAmount !== null && !coffeeAmountOptions.some((option) => option.amountPaise === loadingAmount);

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {coffeeAmountOptions.map((option) => {
          const isLoading = loadingAmount === option.amountPaise;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onPay(option.amountPaise)}
              disabled={isBusy}
              title={option.description}
              className={cn(
                "inline-flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-amber-200 bg-amber-50 px-2 py-3 text-sm font-semibold text-slate-800 transition hover:border-amber-300 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60",
                compact ? "py-2.5" : "py-3"
              )}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
              ) : (
                <Heart className="h-3.5 w-3.5 text-amber-600" />
              )}
              {option.label}
            </button>
          );
        })}
      </div>

      <div className={cn("border-t border-slate-100", compact ? "mt-3 pt-3" : "mt-4 pt-4")}>
        <label htmlFor="coffee-custom-amount" className="text-xs font-medium text-slate-600">
          Custom amount · ₹{COFFEE_MIN_AMOUNT_INR}–₹{COFFEE_MAX_AMOUNT_INR.toLocaleString("en-IN")}
        </label>
        <div className="mt-2 flex gap-2">
          <div className="relative min-w-0 flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
              ₹
            </span>
            <input
              id="coffee-custom-amount"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={customAmount}
              onChange={(event) => handleCustomChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleCustomPay();
                }
              }}
              placeholder={String(COFFEE_MIN_AMOUNT_INR)}
              disabled={isBusy}
              aria-invalid={customError ? true : undefined}
              aria-describedby={customError ? "coffee-custom-amount-error" : undefined}
              className="w-full rounded-lg border border-slate-200 py-2 pl-7 pr-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>
          <button
            type="button"
            onClick={handleCustomPay}
            disabled={isBusy || !customAmount.trim()}
            className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCustomLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Pay
          </button>
        </div>
        {customError && (
          <p id="coffee-custom-amount-error" className="mt-1.5 text-xs text-rose-600">
            {customError}
          </p>
        )}
      </div>
    </div>
  );
}
