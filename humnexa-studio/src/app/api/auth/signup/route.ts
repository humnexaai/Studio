import { z, ZodError } from "zod";
import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { checkRateLimitByIp, getClientIpFromHeaders } from "@/lib/rate-limit";

export const preferredRegion = "bom1";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  fullName: z.string().min(1).max(80).optional(),
  honeypot: z.string().max(0).optional(),
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const ip = getClientIpFromHeaders(request.headers);
    const rate = checkRateLimitByIp(ip, 5, 60_000);
    if (!rate.success) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Please wait before retrying",
          retryAfter: rate.retryAfter,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rate.retryAfter),
          },
        },
      );
    }

    const parsed = schema.parse(await request.json());
    if ((parsed.honeypot ?? "").trim().length > 0) {
      return NextResponse.json({ error: "Bot detected" }, { status: 400 });
    }

    const supabase = createSupabaseServer();
    const { error } = await supabase.auth.signUp({
      email: parsed.email,
      password: parsed.password,
      options: {
        data: {
          full_name: parsed.fullName ?? null,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://studio.humnexa.com"}/auth/callback`,
      },
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Validation failed" }, { status: 400 });
    }
    Sentry.captureException(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
