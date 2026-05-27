import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/payments/razorpay";
import { handleSupportPaymentWebhook } from "@/lib/payments/support-payments";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    const payload = JSON.parse(rawBody) as {
      event?: string;
      payload?: unknown;
    };

    if (!payload.event) {
      return NextResponse.json({ error: "Missing event" }, { status: 400 });
    }

    await handleSupportPaymentWebhook({
      event: payload.event,
      payload: payload.payload,
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Razorpay webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
