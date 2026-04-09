import { randomUUID } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { checkRateLimitByIp, getClientIpFromHeaders } from "@/lib/rate-limit";
import { getSupabaseUrlWithPooling } from "@/lib/supabase/url";

const protectedPrefixes = [
  "/dashboard",
  "/studio",
  "/onboarding",
  "/billing",
  "/settings",
  "/marketplace",
];

function isProtectedPath(pathname: string): boolean {
  return protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const response = NextResponse.next({ request });
  const pathname = request.nextUrl.pathname;
  const nonce = randomUUID().replace(/-/g, "");
  const ip = getClientIpFromHeaders(request.headers);

  const supabase = createServerClient<Database>(
    getSupabaseUrlWithPooling(),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    },
  );

  const isAuthPath = pathname.startsWith("/auth");
  const isPaymentPath = pathname.startsWith("/api/payments");
  const isWebhookPath = pathname.startsWith("/api/webhooks/razorpay");
  const isChatStreamPath = pathname === "/api/chat/stream";

  if (isAuthPath || isPaymentPath || isWebhookPath || isChatStreamPath) {
    const limitResult = isAuthPath
      ? checkRateLimitByIp(ip, 5, 60_000)
      : isWebhookPath
        ? checkRateLimitByIp(ip, 100, 60_000)
        : isPaymentPath
          ? checkRateLimitByIp(ip, 10, 60_000)
          : checkRateLimitByIp(ip, 120, 60_000);
    if (!limitResult.success) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Please wait before retrying",
          retryAfter: limitResult.retryAfter,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(limitResult.retryAfter),
          },
        },
      );
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isProtectedPath(pathname) && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/auth";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  if (pathname === "/auth" && user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src 'self' 'nonce-${nonce}' 'unsafe-inline'`,
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.groq.com https://api.anthropic.com https://api.openai.com https://checkout.razorpay.com https://*.ingest.sentry.io https://app.posthog.com https://us.i.posthog.com https://eu.i.posthog.com https://*.posthog.com https://sandpack.codesandbox.io https://*.codesandbox.io",
    "frame-src https://checkout.razorpay.com https://sandpack.codesandbox.io https://*.codesandbox.io",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");

  response.headers.set("x-nonce", nonce);
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload",
  );
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(self)",
  );

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json).*)"],
};
