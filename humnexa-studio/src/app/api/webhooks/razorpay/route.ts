import crypto from "crypto";
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

type RazorpayWebhookEvent = {
  event?: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        amount?: number;
        currency?: string;
      };
    };
  };
};

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const signature = request.headers.get("x-razorpay-signature");
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }
    if (!secret) {
      return NextResponse.json(
        { error: "RAZORPAY_KEY_SECRET missing" },
        { status: 500 },
      );
    }

    const rawBody = await request.text();
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");
    if (expectedSignature !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody) as RazorpayWebhookEvent;
    if (event.event !== "payment.captured") {
      return NextResponse.json({ success: true, ignored: true });
    }

    const payment = event.payload?.payment?.entity;
    const orderId = payment?.order_id;
    const paymentId = payment?.id;
    if (!orderId || !paymentId) {
      return NextResponse.json(
        { error: "Missing order/payment identifiers" },
        { status: 400 },
      );
    }

    const supabase = createSupabaseAdmin();
    const db = supabase as unknown as {
      from: (table: string) => {
        select: (columns: string) => {
          eq: (column: string, value: string) => {
            maybeSingle: () => Promise<{
              data: {
                id: string;
                user_id: string;
                amount: number;
                metadata: { plan_id?: string } | null;
              } | null;
              error: { message?: string } | null;
            }>;
          };
        };
        update: (values: Record<string, unknown>) => {
          eq: (column: string, value: string) => Promise<{
            error: { message?: string } | null;
          }>;
        };
        insert: (values: Record<string, unknown>) => Promise<{
          error: { message?: string } | null;
        }>;
      };
    };

    const { data: paymentOrder, error: orderError } = await db
      .from("payment_orders")
      .select("id,user_id,amount,metadata")
      .eq("razorpay_order_id", orderId)
      .maybeSingle();
    if (orderError || !paymentOrder) {
      return NextResponse.json({ error: "Payment order not found" }, { status: 404 });
    }

    const { error: updateOrderError } = await db
      .from("payment_orders")
      .update({
        status: "paid",
        razorpay_payment_id: paymentId,
      })
      .eq("id", paymentOrder.id);
    if (updateOrderError) {
      return NextResponse.json({ error: "Failed to mark order paid" }, { status: 400 });
    }

    const planId = paymentOrder.metadata?.plan_id ?? null;
    let monthlyCredits = 0;
    if (planId) {
      const planResult = await (supabase as unknown as {
        from: (table: string) => {
          select: (columns: string) => {
            eq: (column: string, value: string) => {
              maybeSingle: () => Promise<{
                data: { monthly_credits?: number | null } | null;
              }>;
            };
          };
        };
      })
        .from("plans")
        .select("monthly_credits")
        .eq("id", planId)
        .maybeSingle();
      monthlyCredits = planResult.data?.monthly_credits ?? 0;
    }

    const profileResult = await (supabase as unknown as {
      from: (table: string) => {
        select: (columns: string) => {
          eq: (column: string, value: string) => {
            maybeSingle: () => Promise<{
              data: { credits_balance?: number | null } | null;
            }>;
          };
        };
      };
    })
      .from("profiles")
      .select("credits_balance")
      .eq("id", paymentOrder.user_id)
      .maybeSingle();
    const currentBalance = profileResult.data?.credits_balance ?? 0;
    const nextBalance = currentBalance + monthlyCredits;

    const { error: profileUpdateError } = await db
      .from("profiles")
      .update({
        plan_id: planId,
        credits_balance: nextBalance,
      })
      .eq("id", paymentOrder.user_id);
    if (profileUpdateError) {
      return NextResponse.json({ error: "Failed to update profile plan" }, { status: 400 });
    }

    const amountInr = Math.round((paymentOrder.amount ?? 0) / 100);
    await db.from("credit_transactions").insert({
      user_id: paymentOrder.user_id,
      amount: monthlyCredits,
      type: "purchase",
      reason: `Razorpay payment captured (${amountInr} INR)`,
      metadata: {
        order_id: orderId,
        payment_id: paymentId,
        plan_id: planId,
        amount_inr: amountInr,
      },
    });

    await db.from("notifications").insert({
      user_id: paymentOrder.user_id,
      title: "Payment successful",
      body: `Payment captured. ${monthlyCredits} credits added.`,
      type: "payment_success",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}
