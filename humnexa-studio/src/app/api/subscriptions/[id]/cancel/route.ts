import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

export const preferredRegion = "bom1";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function POST(
  _request: Request,
  { params }: RouteContext,
): Promise<NextResponse> {
  try {
    const supabase = createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rate = checkRateLimit(user.id, 10, 60_000);
    if (!rate.success) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Please wait before retrying",
          retryAfter: rate.retryAfter,
        },
        {
          status: 429,
          headers: { "Retry-After": String(rate.retryAfter) },
        },
      );
    }

    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("id,user_id,razorpay_subscription_id")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .maybeSingle();
    const typedSub = subscription as
      | {
          id: string;
          razorpay_subscription_id?: string | null;
        }
      | null;
    if (!typedSub) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const razorpaySubId = typedSub.razorpay_subscription_id ?? "";

    if (keyId && keySecret && razorpaySubId) {
      const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
      await fetch(`https://api.razorpay.com/v1/subscriptions/${razorpaySubId}/cancel`, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cancel_at_cycle_end: 1 }),
      });
    }

    const { error } = await supabase
      .from("subscriptions")
      .update({
        cancel_at_cycle_end: true,
        status: "cancelled_pending",
      })
      .eq("id", typedSub.id)
      .eq("user_id", user.id);
    if (error) {
      throw new Error(error.message ?? "Failed to update subscription");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to cancel subscription" },
      { status: 500 },
    );
  }
}
