import { llmsTxtContent } from "@/lib/seo";

export const dynamic = "force-static";
export const revalidate = 86400;

export function GET() {
  return new Response(llmsTxtContent(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
