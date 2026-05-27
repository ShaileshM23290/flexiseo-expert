import { prisma } from "@/lib/db";
import {
  buildPaginatedResult,
  type PaginatedResult,
  parsePagination,
} from "@/lib/admin/pagination";
import { formatInrFromPaise } from "@/lib/payments/config";

export type SupportPaymentListItem = {
  id: string;
  type: string;
  status: string;
  amountPaise: number;
  amountLabel: string;
  currency: string;
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
  auditId: string | null;
  auditUrl: string | null;
  clientIp: string | null;
  payerEmail: string | null;
  payerName: string | null;
  payerContact: string | null;
  paymentMethod: string | null;
  errorDescription: string | null;
  createdAt: Date;
  paidAt: Date | null;
};

export type SupportPaymentStats = {
  totalPayments: number;
  capturedCount: number;
  capturedRevenuePaise: number;
  capturedRevenueLabel: string;
  pendingCount: number;
  failedCount: number;
  paymentsToday: number;
  revenueTodayPaise: number;
  revenueTodayLabel: string;
};

const paymentSelect = {
  id: true,
  type: true,
  status: true,
  amountPaise: true,
  currency: true,
  razorpayOrderId: true,
  razorpayPaymentId: true,
  auditId: true,
  clientIp: true,
  payerEmail: true,
  payerName: true,
  payerContact: true,
  paymentMethod: true,
  errorDescription: true,
  createdAt: true,
  paidAt: true,
} as const;

export async function getSupportPaymentStats(): Promise<SupportPaymentStats> {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [totalPayments, capturedAgg, pendingCount, failedCount, todayCaptured] =
    await Promise.all([
      prisma.supportPayment.count(),
      prisma.supportPayment.aggregate({
        where: { status: "captured" },
        _count: { id: true },
        _sum: { amountPaise: true },
      }),
      prisma.supportPayment.count({ where: { status: "pending" } }),
      prisma.supportPayment.count({ where: { status: "failed" } }),
      prisma.supportPayment.findMany({
        where: {
          status: "captured",
          paidAt: { gte: startOfToday },
        },
        select: { amountPaise: true },
      }),
    ]);

  const capturedRevenuePaise = capturedAgg._sum.amountPaise ?? 0;
  const revenueTodayPaise = todayCaptured.reduce((sum, row) => sum + row.amountPaise, 0);

  return {
    totalPayments,
    capturedCount: capturedAgg._count.id,
    capturedRevenuePaise,
    capturedRevenueLabel: formatInrFromPaise(capturedRevenuePaise),
    pendingCount,
    failedCount,
    paymentsToday: todayCaptured.length,
    revenueTodayPaise,
    revenueTodayLabel: formatInrFromPaise(revenueTodayPaise),
  };
}

export async function getSupportPaymentsPaginated(searchParams: {
  page?: string;
  pageSize?: string;
  status?: string;
}): Promise<PaginatedResult<SupportPaymentListItem>> {
  const { page, pageSize, skip } = parsePagination(searchParams);
  const status =
    searchParams.status && searchParams.status !== "all" ? searchParams.status : undefined;

  const where = status ? { status } : undefined;

  const [items, total] = await Promise.all([
    prisma.supportPayment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      select: paymentSelect,
    }),
    prisma.supportPayment.count({ where }),
  ]);

  const auditIds = [...new Set(items.map((item) => item.auditId).filter(Boolean))] as string[];
  const audits =
    auditIds.length > 0
      ? await prisma.audit.findMany({
          where: { id: { in: auditIds } },
          select: { id: true, url: true },
        })
      : [];
  const auditUrlById = new Map(audits.map((audit) => [audit.id, audit.url]));

  const enriched = items.map((item) => ({
    ...item,
    amountLabel: formatInrFromPaise(item.amountPaise),
    auditUrl: item.auditId ? (auditUrlById.get(item.auditId) ?? null) : null,
  }));

  return buildPaginatedResult(enriched, total, page, pageSize);
}

export async function getRecentSupportPayments(limit = 10): Promise<SupportPaymentListItem[]> {
  const result = await getSupportPaymentsPaginated({ page: "1", pageSize: String(limit) });
  return result.items;
}
