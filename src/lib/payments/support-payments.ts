import crypto from "crypto";
import { prisma } from "@/lib/db";
import {
  createRazorpayOrder,
  fetchRazorpayPayment,
  verifyCheckoutSignature,
} from "@/lib/payments/razorpay";
import {
  getCoffeeAmountOption,
  type SupportPaymentStatus,
  type SupportPaymentType,
} from "@/lib/payments/config";

type CreateCoffeeOrderInput = {
  amountPaise: number;
  auditId?: string | null;
  clientIp?: string | null;
  userAgent?: string | null;
};

export async function createCoffeeOrder(input: CreateCoffeeOrderInput) {
  const option = getCoffeeAmountOption(input.amountPaise);
  if (!option) {
    throw new Error("Invalid amount");
  }

  if (input.auditId) {
    const audit = await prisma.audit.findUnique({
      where: { id: input.auditId },
      select: { id: true },
    });
    if (!audit) {
      throw new Error("Audit not found");
    }
  }

  const pending = await prisma.supportPayment.create({
    data: {
      type: "coffee",
      status: "pending",
      amountPaise: input.amountPaise,
      currency: "INR",
      razorpayOrderId: `temp_${crypto.randomUUID()}`,
      auditId: input.auditId ?? null,
      clientIp: input.clientIp ?? null,
      userAgent: input.userAgent ?? null,
      metadata: JSON.stringify({ amountLabel: option.label }),
    },
  });

  try {
    const order = await createRazorpayOrder({
      amountPaise: input.amountPaise,
      receipt: pending.id,
      notes: {
        supportPaymentId: pending.id,
        type: "coffee",
        auditId: input.auditId ?? "",
        amountLabel: option.label,
      },
    });

    const updated = await prisma.supportPayment.update({
      where: { id: pending.id },
      data: {
        razorpayOrderId: order.id,
        metadata: JSON.stringify({
          amountLabel: option.label,
          orderStatus: order.status,
        }),
      },
    });

    return { payment: updated, order };
  } catch (error) {
    await prisma.supportPayment.update({
      where: { id: pending.id },
      data: {
        status: "failed",
        errorDescription: error instanceof Error ? error.message : "Order creation failed",
      },
    });
    throw error;
  }
}

export async function verifyAndCaptureCoffeePayment(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}) {
  if (!verifyCheckoutSignature(params)) {
    throw new Error("Invalid payment signature");
  }

  const existing = await prisma.supportPayment.findUnique({
    where: { razorpayOrderId: params.orderId },
  });

  if (!existing) {
    throw new Error("Payment record not found");
  }

  if (existing.status === "captured" && existing.razorpayPaymentId === params.paymentId) {
    return existing;
  }

  const duplicatePayment = await prisma.supportPayment.findFirst({
    where: {
      razorpayPaymentId: params.paymentId,
      NOT: { id: existing.id },
    },
    select: { id: true },
  });
  if (duplicatePayment) {
    throw new Error("Payment already recorded");
  }

  const razorpayPayment = await fetchRazorpayPayment(params.paymentId);
  const payerEmail =
    typeof razorpayPayment.email === "string" ? razorpayPayment.email : null;
  const payerContact =
    typeof razorpayPayment.contact === "string" ? razorpayPayment.contact : null;
  const payerName =
    razorpayPayment.notes &&
    typeof razorpayPayment.notes === "object" &&
    !Array.isArray(razorpayPayment.notes) &&
    typeof (razorpayPayment.notes as Record<string, unknown>).payerName === "string"
      ? ((razorpayPayment.notes as Record<string, string>).payerName ?? null)
      : null;

  const isSuccess = razorpayPayment.status === "captured" || razorpayPayment.status === "authorized";

  return prisma.supportPayment.update({
    where: { id: existing.id },
    data: {
      status: isSuccess ? "captured" : "failed",
      razorpayPaymentId: params.paymentId,
      payerEmail,
      payerContact,
      payerName,
      paymentMethod: typeof razorpayPayment.method === "string" ? razorpayPayment.method : null,
      paidAt: isSuccess ? new Date() : null,
      errorCode:
        !isSuccess && typeof razorpayPayment.error_code === "string"
          ? razorpayPayment.error_code
          : null,
      errorDescription:
        !isSuccess && typeof razorpayPayment.error_description === "string"
          ? razorpayPayment.error_description
          : null,
      metadata: JSON.stringify({
        razorpayStatus: razorpayPayment.status,
        verifiedVia: "checkout",
      }),
    },
  });
}

type WebhookPaymentEntity = {
  id?: string;
  order_id?: string;
  email?: string;
  contact?: string;
  method?: string;
  status?: string;
  error_code?: string;
  error_description?: string;
  notes?: Record<string, string>;
};

export async function handleSupportPaymentWebhook(params: {
  event: string;
  payload: unknown;
}) {
  const payment = extractPaymentEntity(params.payload);
  if (!payment?.order_id) return null;

  const existing = await prisma.supportPayment.findUnique({
    where: { razorpayOrderId: payment.order_id },
  });

  if (!existing) return null;

  if (params.event === "payment.captured" || params.event === "payment.authorized") {
    if (existing.status === "captured") return existing;

    return prisma.supportPayment.update({
      where: { id: existing.id },
      data: {
        status: "captured",
        razorpayPaymentId: payment.id ?? existing.razorpayPaymentId,
        payerEmail: payment.email ?? existing.payerEmail,
        payerContact: payment.contact ?? existing.payerContact,
        paymentMethod: payment.method ?? existing.paymentMethod,
        paidAt: new Date(),
        webhookEvent: params.event,
        metadata: JSON.stringify({
          razorpayStatus: payment.status,
          verifiedVia: "webhook",
        }),
      },
    });
  }

  if (params.event === "payment.failed") {
    if (existing.status === "captured") return existing;

    return prisma.supportPayment.update({
      where: { id: existing.id },
      data: {
        status: "failed",
        razorpayPaymentId: payment.id ?? existing.razorpayPaymentId,
        payerEmail: payment.email ?? existing.payerEmail,
        payerContact: payment.contact ?? existing.payerContact,
        paymentMethod: payment.method ?? existing.paymentMethod,
        errorCode: payment.error_code ?? null,
        errorDescription: payment.error_description ?? "Payment failed",
        webhookEvent: params.event,
        metadata: JSON.stringify({
          razorpayStatus: payment.status,
          verifiedVia: "webhook",
        }),
      },
    });
  }

  if (params.event === "refund.processed") {
    return prisma.supportPayment.update({
      where: { id: existing.id },
      data: {
        status: "refunded" satisfies SupportPaymentStatus,
        webhookEvent: params.event,
        metadata: JSON.stringify({
          verifiedVia: "webhook",
          refundPaymentId: payment.id,
        }),
      },
    });
  }

  await prisma.supportPayment.update({
    where: { id: existing.id },
    data: {
      webhookEvent: params.event,
      metadata: JSON.stringify({
        verifiedVia: "webhook",
        event: params.event,
      }),
    },
  });

  return existing;
}

function extractPaymentEntity(payload: unknown): WebhookPaymentEntity | null {
  if (!payload || typeof payload !== "object") return null;
  const root = payload as Record<string, unknown>;
  const payment = root.payment;
  if (!payment || typeof payment !== "object") return null;
  const entity = (payment as Record<string, unknown>).entity;
  if (!entity || typeof entity !== "object") return null;
  return entity as WebhookPaymentEntity;
}

export type SupportPaymentRecord = {
  id: string;
  type: SupportPaymentType;
  status: SupportPaymentStatus;
  amountPaise: number;
  currency: string;
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
  auditId: string | null;
  clientIp: string | null;
  payerEmail: string | null;
  payerName: string | null;
  payerContact: string | null;
  paymentMethod: string | null;
  errorDescription: string | null;
  createdAt: Date;
  paidAt: Date | null;
};
