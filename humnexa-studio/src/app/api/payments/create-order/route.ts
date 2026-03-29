import { z, ZodError } from "zod";
import * as Sentry from "@sentry/nextjs";
import { createSupabaseServer } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  planId: z.string().uuid(),
  amount_inr: z.number().positive(),
});

type RazorpayOrderResponse = {
  id: string;
  amount: number;
  currency: string;
  status?: string;
};

export async function POST(request: Request): Promise<Response> {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      return Response.json(
        { error: "Razorpay credentials not configured" },
        { status: 500 },
      );
    }

    const supabase = createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const paymentRate = checkRateLimit(user.id, 10, 60_000);
    if (!paymentRate.success) {
      return Response.json(
        {
          error: "Rate limit exceeded. Please wait before retrying",
          retryAfter: 60,
        },
        { status: 429 },
      );
    }

    const body = await request.json();
    const input = schema.parse(body);
    const amountPaise = Math.round(input.amount_inr * 100);
    const receipt = `receipt_${Date.now()}`;

    const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
    const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: "INR",
        receipt,
        notes: {
          plan_id: input.planId,
          user_id: user.id,
        },
      }),
    });

    if (!razorpayResponse.ok) {
      const bodyText = await razorpayResponse.text();
      return Response.json(
        { error: `Razorpay order create failed: ${bodyText}` },
        { status: 400 },
      );
    }

    const order = (await razorpayResponse.json()) as RazorpayOrderResponse;
    const db = supabase as unknown as {
      from: (table: string) => {
        insert: (values: Record<string, unknown>) => Promise<{
          error: { message?: string } | null;
        }>;
      };
    };
    const { error } = await db.from("payment_orders").insert({
      user_id: user.id,
      razorpay_order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      status: order.status ?? "created",
      metadata: {
        plan_id: input.planId,
        amount_inr: input.amount_inr,
        receipt,
      },
    });
    if (error) throw error;

    return Response.json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: "Validation failed" }, { status: 400 });
    }
    Sentry.captureException(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
