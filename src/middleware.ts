import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { canAccessAdmin, canManageUsers } from "@/lib/auth/roles";
import { siteConfig } from "@/lib/config";

function canonicalHostRedirect(request: NextRequest): NextResponse | null {
  const configured = siteConfig.url.replace(/\/$/, "");
  let canonical: URL;

  try {
    canonical = new URL(configured);
  } catch {
    return null;
  }

  if (canonical.hostname === "localhost" || canonical.hostname === "127.0.0.1") {
    return null;
  }

  const host = request.headers.get("host");
  if (!host || host === canonical.host) return null;

  const stripWww = (value: string) => value.replace(/^www\./i, "");
  if (stripWww(host) !== stripWww(canonical.host)) return null;

  const url = request.nextUrl.clone();
  url.protocol = canonical.protocol;
  url.host = canonical.host;
  return NextResponse.redirect(url, 308);
}

export async function middleware(request: NextRequest) {
  const hostRedirect = canonicalHostRedirect(request);
  if (hostRedirect) return hostRedirect;

  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin/login")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const session = token ? await verifySessionToken(token) : null;

    if (!session || !canAccessAdmin(session.role)) {
      if (pathname.startsWith("/api/admin")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const adminOnlyPath =
      pathname.startsWith("/admin/users") || pathname.startsWith("/api/admin/users");
    if (adminOnlyPath && !canManageUsers(session.role)) {
      if (pathname.startsWith("/api/admin")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|txt|xml)$).*)",
  ],
};
