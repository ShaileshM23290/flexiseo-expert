"use client";

import { useState } from "react";
import { Coffee } from "lucide-react";
import { CoffeeSupportDialog } from "@/components/support/coffee-support-dialog";
import { isCoffeeCheckoutAvailable } from "@/components/support/use-coffee-checkout";
import { cn } from "@/lib/utils";

type BuyCoffeeButtonProps = {
  variant?: "header" | "footer" | "footer-inline";
  className?: string;
  onOpen?: () => void;
};

export function BuyCoffeeButton({
  variant = "header",
  className,
  onOpen,
}: BuyCoffeeButtonProps) {
  const [open, setOpen] = useState(false);

  if (!isCoffeeCheckoutAvailable()) return null;

  function handleOpen() {
    setOpen(true);
    onOpen?.();
  }

  const triggerClass =
    variant === "header"
      ? "hidden items-center gap-1.5 rounded-lg border border-amber-200/90 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900 transition hover:border-amber-300 hover:bg-amber-100 sm:inline-flex"
      : variant === "footer-inline"
        ? "inline-flex items-center gap-1.5 text-sm text-amber-300 transition-colors hover:text-amber-200"
        : "inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-200 transition hover:border-amber-400/60 hover:bg-amber-500/20";

  return (
    <>
      <button type="button" onClick={handleOpen} className={cn(triggerClass, className)}>
        <Coffee className="h-3.5 w-3.5 shrink-0" />
        Buy a coffee
      </button>

      <CoffeeSupportDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
