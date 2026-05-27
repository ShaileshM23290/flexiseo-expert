import { prisma } from "@/lib/db";
import {
  buildPaginatedResult,
  type PaginatedResult,
  parsePagination,
} from "@/lib/admin/pagination";

export type AuditListItem = {
  id: string;
  url: string;
  domain: string;
  status: string;
  clientIp: string | null;
  pagesCrawled: number;
  overallScore: number;
  createdAt: Date;
};

export type IpStatRow = {
  ip: string;
  auditCount: number;
  uniqueDomains: number;
  domains: string[];
  lastSeen: Date;
  firstSeen: Date;
};

export type AdminOverviewStats = {
  totalAudits: number;
  uniqueIps: number;
  uniqueDomains: number;
  auditsToday: number;
};

const auditSelect = {
  id: true,
  url: true,
  domain: true,
  status: true,
  clientIp: true,
  pagesCrawled: true,
  overallScore: true,
  createdAt: true,
} as const;

async function enrichIpRow(row: {
  clientIp: string | null;
  _count: { id: number };
  _min: { createdAt: Date | null };
  _max: { createdAt: Date | null };
}): Promise<IpStatRow> {
  const ip = row.clientIp ?? "unknown";
  const [domainGroups, sampleDomains] = await Promise.all([
    prisma.audit.groupBy({
      where: { clientIp: row.clientIp },
      by: ["domain"],
      _count: { id: true },
    }),
    prisma.audit.findMany({
      where: { clientIp: row.clientIp },
      distinct: ["domain"],
      select: { domain: true },
      take: 8,
    }),
  ]);

  return {
    ip,
    auditCount: row._count.id,
    uniqueDomains: domainGroups.length,
    domains: sampleDomains.map((d) => d.domain),
    firstSeen: row._min.createdAt ?? new Date(),
    lastSeen: row._max.createdAt ?? new Date(),
  };
}

export async function getAdminOverviewStats(): Promise<AdminOverviewStats> {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [totalAudits, auditsToday, domainGroups, ipGroups] = await Promise.all([
    prisma.audit.count(),
    prisma.audit.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.audit.groupBy({ by: ["domain"], _count: { id: true } }),
    prisma.audit.groupBy({
      by: ["clientIp"],
      _count: { id: true },
    }),
  ]);

  const uniqueIps = ipGroups.filter((row) => row.clientIp !== null).length;

  return {
    totalAudits,
    uniqueIps,
    uniqueDomains: domainGroups.length,
    auditsToday,
  };
}

export type AdminOverview = AdminOverviewStats & {
  topIps: IpStatRow[];
  recentAudits: AuditListItem[];
};

export async function getAdminOverview(): Promise<AdminOverview> {
  const stats = await getAdminOverviewStats();

  const ipGroups = await prisma.audit.groupBy({
    by: ["clientIp"],
    _count: { id: true },
    _min: { createdAt: true },
    _max: { createdAt: true },
  });

  const topIpKeys = [...ipGroups].sort((a, b) => b._count.id - a._count.id).slice(0, 10);
  const topIps = await Promise.all(topIpKeys.map(enrichIpRow));

  const recentAudits = await prisma.audit.findMany({
    orderBy: { createdAt: "desc" },
    take: 25,
    select: auditSelect,
  });

  return {
    ...stats,
    topIps,
    recentAudits,
  };
}

export async function getAuditsPaginated(
  searchParams: { page?: string; pageSize?: string }
): Promise<PaginatedResult<AuditListItem>> {
  const { page, pageSize, skip } = parsePagination(searchParams);

  const [items, total] = await Promise.all([
    prisma.audit.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      select: auditSelect,
    }),
    prisma.audit.count(),
  ]);

  return buildPaginatedResult(items, total, page, pageSize);
}

export async function getIpUsagePaginated(
  searchParams: { page?: string; pageSize?: string }
): Promise<PaginatedResult<IpStatRow>> {
  const { page, pageSize, skip } = parsePagination(searchParams, 20);

  const ipGroups = await prisma.audit.groupBy({
    by: ["clientIp"],
    _count: { id: true },
    _min: { createdAt: true },
    _max: { createdAt: true },
  });

  const sorted = [...ipGroups].sort((a, b) => b._count.id - a._count.id);
  const total = sorted.length;
  const pageSlice = sorted.slice(skip, skip + pageSize);

  const items = await Promise.all(pageSlice.map(enrichIpRow));

  return buildPaginatedResult(items, total, page, pageSize);
}
