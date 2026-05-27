"use client";

import { useCallback, useState } from "react";
import { siteConfig } from "@/lib/config";
import { coffeeAmountOptions } from "@/lib/payments/config";
import type { RazorpayCheckoutResponse } from "@/lib/payments/razorpay-checkout";

function loadRazorpayScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.Razorpay) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Razorpay")));
      if (window.Razorpay) resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay"));
    document.body.appendChild(script);
  });
}

export function isCoffeeCheckoutAvailable(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID);
}

export function useCoffeeCheckout(auditId?: string) {
  const [loadingAmount, setLoadingAmount] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const pay = useCallback(
    async (amountPaise: number) => {
      if (!isCoffeeCheckoutAvailable()) {
        setError("Payments are not available right now.");
        return;
      }

      setLoadingAmount(amountPaise);
      setError("");
      setSuccess(false);

      try {
        await loadRazorpayScript();
        if (!window.Razorpay) {
          throw new Error("Payment gateway failed to load");
        }

        const orderRes = await fetch("/api/support/coffee/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amountPaise, auditId }),
        });
        const orderData = await orderRes.json();
        if (!orderRes.ok) {
          throw new Error(orderData.error ?? "Could not start payment");
        }

        await new Promise<void>((resolve, reject) => {
          const checkout = new window.Razorpay!({
            key: orderData.keyId,
            amount: orderData.amountPaise,
            currency: orderData.currency,
            name: siteConfig.name,
            description: orderData.description,
            order_id: orderData.orderId,
            theme: { color: "#2563eb" },
            handler: async (response: RazorpayCheckoutResponse) => {
              try {
                const verifyRes = await fetch("/api/support/coffee/verify", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(response),
                });
                const verifyData = await verifyRes.json();
                if (!verifyRes.ok || !verifyData.success) {
                  throw new Error(verifyData.error ?? "Payment verification failed");
                }
                setSuccess(true);
                resolve();
              } catch (err) {
                reject(err);
              }
            },
            modal: {
              ondismiss: () => reject(new Error("Payment cancelled")),
            },
          });

          checkout.on("payment.failed", (response) => {
            reject(new Error(response.error?.description ?? "Payment failed"));
          });

          checkout.open();
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Payment failed";
        if (message !== "Payment cancelled") {
          setError(message);
        }
      } finally {
        setLoadingAmount(null);
      }
    },
    [auditId]
  );

  return {
    pay,
    loadingAmount,
    error,
    success,
    amounts: coffeeAmountOptions,
    available: isCoffeeCheckoutAvailable(),
  };
}
