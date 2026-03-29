import * as Sentry from "@sentry/nextjs";
import { z, ZodError } from "zod";
import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { checkRateLimitByIp, getClientIpFromHeaders } from "@/lib/rate-limit";

export const preferredRegion = "bom1";

const schema = z.object({
  email: z.string().email(),
  website: z.string().max(0).optional().default(""),
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const ip = getClientIpFromHeaders(request.headers);
    const ipRate = checkRateLimitByIp(ip, 5, 60_000);
    if (!ipRate.success) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Please wait before retrying",
          retryAfter: ipRate.retryAfter,
        },
        {
          status: 429,
          headers: { "Retry-After": String(ipRate.retryAfter) },
        },
      );
    }

    const parsed = schema.parse(await request.json());
    if (parsed.website) {
      return NextResponse.json({ success: true });
    }

    const supabase = createSupabaseServer();
    const redirectTo = `${
      process.env.NEXT_PUBLIC_APP_URL ?? "https://studio.humnexa.com"
    }/auth`;
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.email, {
      redirectTo,
    });
    if (error) {
      return NextResponse.json(
        { error: error.message ?? "Unable to send password reset link" },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Validation failed" }, { status: 400 });
    }
    Sentry.captureException(error);
    return NextResponse.json(
      { error: "Password reset request failed" },
      { status: 500 },
    );
  }
}
