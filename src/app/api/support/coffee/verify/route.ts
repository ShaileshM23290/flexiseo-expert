import { NextResponse } from "next/server";
import { z } from "zod";
import { isRazorpayConfigured } from "@/lib/payments/config";
import { verifyAndCaptureCoffeePayment } from "@/lib/payments/support-payments";

const bodySchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

export async function POST(request: Request) {
  if (!isRazorpayConfigured()) {
    return NextResponse.json({ error: "Payments are not configured yet" }, { status: 503 });
  }

  try {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const payment = await verifyAndCaptureCoffeePayment({
      orderId: parsed.data.razorpay_order_id,
      paymentId: parsed.data.razorpay_payment_id,
      signature: parsed.data.razorpay_signature,
    });

    return NextResponse.json({
      success: payment.status === "captured",
      status: payment.status,
      paymentId: payment.id,
    });
  } catch (error) {
    console.error("Verify coffee payment error:", error);
    const message = error instanceof Error ? error.message : "Verification failed";
    const status =
      message === "Invalid payment signature" || message === "Payment record not found" ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
