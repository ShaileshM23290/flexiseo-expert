import { NextResponse } from "next/server";
import { z } from "zod";
import { isRazorpayConfigured, validateCoffeeAmountPaise } from "@/lib/payments/config";
import { buildCheckoutDescription } from "@/lib/payments/razorpay";
import { createCoffeeOrder } from "@/lib/payments/support-payments";
import { prisma } from "@/lib/db";
import { resolveClientIp } from "@/lib/request-ip";

const bodySchema = z.object({
  amountPaise: z.number().int().positive(),
  auditId: z.string().optional(),
});

function validateOrderBody(data: z.infer<typeof bodySchema>) {
  const amountError = validateCoffeeAmountPaise(data.amountPaise);
  if (amountError) return amountError;
  return null;
}

export async function POST(request: Request) {
  if (!isRazorpayConfigured()) {
    return NextResponse.json({ error: "Payments are not configured yet" }, { status: 503 });
  }

  try {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { amountPaise, auditId } = parsed.data;
    const amountError = validateOrderBody(parsed.data);
    if (amountError) {
      return NextResponse.json({ error: amountError }, { status: 400 });
    }

    const clientIp = resolveClientIp(request);
    const userAgent = request.headers.get("user-agent");

    const { payment, order } = await createCoffeeOrder({
      amountPaise,
      auditId,
      clientIp,
      userAgent,
    });

    let auditUrl: string | null = null;
    if (auditId) {
      const audit = await prisma.audit.findUnique({
        where: { id: auditId },
        select: { url: true },
      });
      auditUrl = audit?.url ?? null;
    }

    return NextResponse.json({
      paymentId: payment.id,
      orderId: order.id,
      amountPaise: payment.amountPaise,
      currency: payment.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? process.env.RAZORPAY_KEY_ID,
      description: buildCheckoutDescription(auditUrl),
      auditUrl,
    });
  } catch (error) {
    console.error("Create coffee order error:", error);
    const message = error instanceof Error ? error.message : "Failed to create order";
    const status = message === "Invalid amount" || message === "Audit not found" || message.includes("Minimum amount") || message.includes("Maximum amount") || message.includes("valid amount") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
