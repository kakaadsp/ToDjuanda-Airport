import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// In-memory sliding window rate limiter untuk edge middleware
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 menit
const MAX_PUBLIC_API_REQUESTS = 180; // Maksimum 180 request/menit per IP untuk rute publik

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || entry.resetAt <= now) {
    // Bersihkan entri lama secara berkala jika ukuran map sudah besar
    if (rateLimitMap.size > 5000) {
      for (const [k, v] of rateLimitMap.entries()) {
        if (v.resetAt <= now) rateLimitMap.delete(k);
      }
    }
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_PUBLIC_API_REQUESTS;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip =
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "127.0.0.1";

  // 1. Rate Limiting pada API publik untuk memitigasi serangan brute-force & DDoS
  if (pathname.startsWith("/api/")) {
    if (isRateLimited(ip)) {
      return new NextResponse(
        JSON.stringify({
          error: "Terlalu banyak permintaan (Rate limit exceeded). Silakan coba lagi beberapa saat.",
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": "60",
          },
        }
      );
    }
  }

  // 2. Proteksi Halaman Admin & API Admin di level Edge
  // Catatan: /api/admin/map-objects (GET) diizinkan publik untuk render peta interaktif
  const isAdminPage = pathname.startsWith("/admin");
  const isAdminApi =
    pathname.startsWith("/api/admin") &&
    !(pathname === "/api/admin/map-objects" && request.method === "GET");

  if (isAdminPage || isAdminApi) {
    const sessionToken =
      request.cookies.get("__Secure-authjs.session-token")?.value ||
      request.cookies.get("authjs.session-token")?.value ||
      request.cookies.get("__Secure-next-auth.session-token")?.value ||
      request.cookies.get("next-auth.session-token")?.value;

    if (!sessionToken) {
      if (isAdminApi) {
        return new NextResponse(
          JSON.stringify({ error: "Akses ditolak: Autentikasi sesi diperlukan." }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }
      const signInUrl = new URL("/auth/signin", request.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};

export default proxy;
