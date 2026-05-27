import crypto from "crypto";
import Razorpay from "razorpay";
import { siteConfig } from "@/lib/config";

let client: Razorpay | null = null;

export function getRazorpayClient(): Razorpay {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay is not configured");
  }

  if (!client) {
    client = new Razorpay({ key_id: keyId, key_secret: keySecret });
  }

  return client;
}

export function verifyCheckoutSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;

  const body = `${params.orderId}|${params.paymentId}`;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  return expected === params.signature;
}

export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return expected === signature;
}

export async function createRazorpayOrder(params: {
  amountPaise: number;
  receipt: string;
  notes?: Record<string, string>;
}) {
  const razorpay = getRazorpayClient();

  return razorpay.orders.create({
    amount: params.amountPaise,
    currency: "INR",
    receipt: params.receipt,
    notes: params.notes,
  });
}

export async function fetchRazorpayPayment(paymentId: string) {
  const razorpay = getRazorpayClient();
  return razorpay.payments.fetch(paymentId);
}

export function buildCheckoutPrefill(notes?: Record<string, string>) {
  return {
    name: notes?.payerName,
    email: notes?.payerEmail,
    contact: notes?.payerContact,
  };
}

export function buildCheckoutDescription(auditUrl?: string | null) {
  if (auditUrl) {
    return `Support ${siteConfig.name} — thanks for auditing ${auditUrl}`;
  }
  return `Support ${siteConfig.name} — keep free SEO audits running`;
}
