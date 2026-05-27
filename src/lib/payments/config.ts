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
    id: "lunch",
    label: "₹199",
    amountPaise: 19900,
    description: "Help keep audits free",
  },
];

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
