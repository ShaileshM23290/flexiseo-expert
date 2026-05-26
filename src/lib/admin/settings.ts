import { prisma } from "@/lib/db";
import { isBacklinkApiConfigured } from "@/lib/audit/backlinks";
import { isOpenAIAvailable, isOpenAIAutoGenerateEnabled } from "@/lib/ai/seo-recommendations";
import { siteConfig } from "@/lib/config";

export type AdminSettingsInfo = {
  email: string;
  role: string;
  memberSince: Date;
  appUrl: string;
  openAiConfigured: boolean;
  openAiAutoGenerate: boolean;
  pageSpeedConfigured: boolean;
  backlinkApiConfigured: boolean;
};

export async function getAdminSettingsInfo(userId: string): Promise<AdminSettingsInfo | null> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  return {
    email: user.email,
    role: user.role,
    memberSince: user.createdAt,
    appUrl: siteConfig.url,
    openAiConfigured: isOpenAIAvailable(),
    openAiAutoGenerate: isOpenAIAutoGenerateEnabled(),
    pageSpeedConfigured: Boolean(process.env.PAGESPEED_API_KEY),
    backlinkApiConfigured: isBacklinkApiConfigured(),
  };
}
