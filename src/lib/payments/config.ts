export const supportPaymentTypes = ["coffee"] as const;
export type SupportPaymentType = (typeof supportPaymentTypes)[number];

export const supportPaymentStatuses = [
  "pending",
  "captured",
  "failed",
  "refunded",
] as const;
export type SupportPaymentStatus = (typeof supportPaymentStatuses)[number];

export type CoffeeAmountOption = {
  id: string;
  label: string;
  amountPaise: number;
  description: string;
};

export const coffeeAmountOptions: CoffeeAmountOption[] = [
  {
    id: "chai",
    label: "₹49",
    amountPaise: 4900,
    description: "A chai — thank you!",
  },
  {
    id: "coffee",
    label: "₹99",
    amountPaise: 9900,
    description: "Buy us a coffee",
  },
  {
    id: "snack",
    label: "₹149",
    amountPaise: 14900,
    description: "Buy us a snack",
  },
  {
    id: "lunch",
    label: "₹199",
    amountPaise: 19900,
    description: "Help keep audits free",
  },
  {
    id: "boost",
    label: "₹299",
    amountPaise: 29900,
    description: "Give us a boost",
  },
  {
    id: "hero",
    label: "₹499",
    amountPaise: 49900,
    description: "You're our hero",
  },
];

export const COFFEE_MIN_AMOUNT_PAISE = 4900;
export const COFFEE_MAX_AMOUNT_PAISE = 1_000_000;
export const COFFEE_MIN_AMOUNT_INR = COFFEE_MIN_AMOUNT_PAISE / 100;
export const COFFEE_MAX_AMOUNT_INR = COFFEE_MAX_AMOUNT_PAISE / 100;

export function formatInrFromPaise(amountPaise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amountPaise / 100);
}

export function getCoffeeAmountOption(amountPaise: number): CoffeeAmountOption | undefined {
  return coffeeAmountOptions.find((option) => option.amountPaise === amountPaise);
}

export function validateCoffeeAmountPaise(amountPaise: number): string | null {
  if (!Number.isInteger(amountPaise) || amountPaise <= 0) {
    return "Enter a valid amount in rupees.";
  }
  if (amountPaise < COFFEE_MIN_AMOUNT_PAISE) {
    return `Minimum amount is ₹${COFFEE_MIN_AMOUNT_INR}.`;
  }
  if (amountPaise > COFFEE_MAX_AMOUNT_PAISE) {
    return `Maximum amount is ₹${COFFEE_MAX_AMOUNT_INR.toLocaleString("en-IN")}.`;
  }
  return null;
}

export function parseCoffeeAmountInr(
  input: string
): { ok: true; amountPaise: number } | { ok: false; error: string } {
  const trimmed = input.trim();
  if (!trimmed) {
    return { ok: false, error: "Enter an amount." };
  }
  if (!/^\d+$/.test(trimmed)) {
    return { ok: false, error: "Use whole rupees only (no decimals or symbols)." };
  }
  const rupees = Number(trimmed);
  if (!Number.isSafeInteger(rupees)) {
    return { ok: false, error: "Amount is too large." };
  }
  const amountPaise = rupees * 100;
  const validationError = validateCoffeeAmountPaise(amountPaise);
  if (validationError) {
    return { ok: false, error: validationError };
  }
  return { ok: true, amountPaise };
}

export function getCoffeeAmountLabel(amountPaise: number): string {
  return getCoffeeAmountOption(amountPaise)?.label ?? formatInrFromPaise(amountPaise);
}

export function isRazorpayConfigured(): boolean {
  return Boolean(
    process.env.RAZORPAY_KEY_ID &&
      process.env.RAZORPAY_KEY_SECRET &&
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
  );
}

export function getPublicRazorpayKeyId(): string | null {
  return process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? process.env.RAZORPAY_KEY_ID ?? null;
}
