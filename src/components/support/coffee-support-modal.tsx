"use client";

import { useEffect, useState } from "react";
import { CoffeeSupportDialog } from "@/components/support/coffee-support-dialog";
import { isCoffeeCheckoutAvailable } from "@/components/support/use-coffee-checkout";
import { coffeeSupportCopy } from "@/lib/payments/support-copy";

const DISMISS_KEY = "flexiseo_coffee_dismissed";
const COUNT_KEY = "flexiseo_coffee_prompt_count";
const MAX_PROMPTS = 2;
const PROMPT_DELAY_MS = 5000;

function sessionPromptKey(auditId: string) {
  return `flexiseo_coffee_prompt_${auditId}`;
}

type CoffeeSupportModalProps = {
  auditId: string;
  auditUrl: string;
};

export function CoffeeSupportModal({ auditId, auditUrl }: CoffeeSupportModalProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isCoffeeCheckoutAvailable()) return;
    if (typeof window === "undefined") return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;
    if (sessionStorage.getItem(sessionPromptKey(auditId)) === "1") return;

    const shownCount = Number(localStorage.getItem(COUNT_KEY) ?? "0");
    if (shownCount >= MAX_PROMPTS) return;

    const timer = window.setTimeout(() => {
      setOpen(true);
      sessionStorage.setItem(sessionPromptKey(auditId), "1");
      localStorage.setItem(COUNT_KEY, String(shownCount + 1));
    }, PROMPT_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [auditId]);

  if (!isCoffeeCheckoutAvailable()) return null;

  return (
    <CoffeeSupportDialog
      open={open}
      onClose={() => setOpen(false)}
      auditId={auditId}
      description={coffeeSupportCopy.descriptionAuditModal(auditUrl)}
      showDismissActions
      onDismiss={(permanent) => {
        if (permanent) localStorage.setItem(DISMISS_KEY, "1");
      }}
    />
  );
}
