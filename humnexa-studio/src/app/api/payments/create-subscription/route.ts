import { z, ZodError } from "zod";
import * as Sentry from "@sentry/nextjs";
import { createSupabaseServer } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

export const preferredRegion = "bom1";

const schema = z.object({
  planId: z.string().uuid(),
  totalCount: z.number().int().positive().optional(),
});

type RazorpayPlanResponse = {
  id: string;
};

type RazorpaySubscriptionResponse = {
  id: string;
  status: string;
  current_end?: number;
};

export async function POST(request: Request): Promise<Response> {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      return Response.json({ error: "Razorpay credentials not configured" }, { status: 500 });
    }

    const supabase = createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rate = checkRateLimit(user.id, 10, 60_000);
    if (!rate.success) {
      return Response.json(
        { error: "Rate limit exceeded. Please wait before retrying", retryAfter: rate.retryAfter },
        { status: 429, headers: { "Retry-After": String(rate.retryAfter) } },
      );
    }

    const parsed = schema.parse(await request.json());

    const { data: plan } = await supabase
      .from("plans")
      .select("id,name,price_inr")
      .eq("id", parsed.planId)
      .maybeSingle();
    const typedPlan = plan as { id: string; name: string; price_inr: number } | null;
    if (!typedPlan || typedPlan.price_inr <= 0) {
      return Response.json({ error: "Invalid paid plan selected" }, { status: 400 });
    }

    const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
    const amountPaise = Math.round(typedPlan.price_inr * 100);

    const planResponse = await fetch("https://api.razorpay.com/v1/plans", {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        period: "monthly",
        interval: 1,
        item: {
          name: `${typedPlan.name} Monthly Plan`,
          amount: amountPaise,
          currency: "INR",
          description: `${typedPlan.name} subscription for Humnexa Studio`,
        },
      }),
    });
    if (!planResponse.ok) {
      const text = await planResponse.text();
      return Response.json({ error: `Failed to create Razorpay plan: ${text}` }, { status: 400 });
    }
    const razorpayPlan = (await planResponse.json()) as RazorpayPlanResponse;

    const subResponse = await fetch("https://api.razorpay.com/v1/subscriptions", {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        plan_id: razorpayPlan.id,
        total_count: parsed.totalCount ?? 12,
        customer_notify: 1,
        notes: {
          user_id: user.id,
          plan_id: typedPlan.id,
          payment_method: "upi_autopay",
        },
      }),
    });
    if (!subResponse.ok) {
      const text = await subResponse.text();
      return Response.json(
        { error: `Failed to create Razorpay subscription: ${text}` },
        { status: 400 },
      );
    }
    const subscription = (await subResponse.json()) as RazorpaySubscriptionResponse;

    await supabase.from("subscriptions").insert({
      user_id: user.id,
      plan_id: typedPlan.id,
      razorpay_subscription_id: subscription.id,
      razorpay_plan_id: razorpayPlan.id,
      status: subscription.status ?? "created",
      start_date: new Date().toISOString(),
      next_billing_at: subscription.current_end
        ? new Date(subscription.current_end * 1000).toISOString()
        : null,
      cancel_at_cycle_end: false,
    });

    return Response.json({
      success: true,
      data: {
        subscriptionId: subscription.id,
        planId: razorpayPlan.id,
        keyId,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: "Validation failed" }, { status: 400 });
    }
    Sentry.captureException(error);
    return Response.json({ error: "Failed to create subscription" }, { status: 500 });
  }
}

export const runtime = "nodejs";
