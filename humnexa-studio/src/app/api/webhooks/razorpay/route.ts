import crypto from "crypto";
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { sendPaymentFailedEmail, sendPaymentSuccessEmail, sendWelcomeEmail } from "@/lib/email/send";
import { captureServerEvent } from "@/lib/analytics/posthog-server";

export const preferredRegion = "bom1";

type RazorpayEntity = Record<string, unknown> & {
  id?: string;
  order_id?: string;
  amount?: number;
  currency?: string;
  status?: string;
  plan_id?: string;
  notes?: {
    user_id?: string;
    plan_id?: string;
  };
  charge_at?: number;
  current_end?: number;
  cancel_at_cycle_end?: boolean;
};

type RazorpayWebhookEvent = {
  id?: string;
  event?: string;
  payload?: {
    payment?: { entity?: RazorpayEntity };
    order?: { entity?: RazorpayEntity };
    subscription?: { entity?: RazorpayEntity };
    refund?: { entity?: RazorpayEntity };
  };
};

type DbClient = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => Promise<{ data: Record<string, unknown> | null }>;
      };
    };
    insert: (values: Record<string, unknown>) => Promise<{ error: { message?: string } | null }>;
    update: (values: Record<string, unknown>) => {
      eq: (column: string, value: string) => Promise<{ error: { message?: string } | null }>;
    };
  };
};

function ok(body: Record<string, unknown>): NextResponse {
  return NextResponse.json(body, { status: 200 });
}

function secureCompareSignature(rawBody: Buffer, signature: string, secret: string): boolean {
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
}

async function addCreditsForPlan(
  db: DbClient,
  userId: string,
  planId: string | null,
  reason: string,
  metadata: Record<string, unknown>,
): Promise<void> {
  if (!planId) return;
  const planResult = await db.from("plans").select("monthly_credits").eq("id", planId).maybeSingle();
  const monthlyCredits = Number(planResult.data?.monthly_credits ?? 0);
  if (monthlyCredits <= 0) return;

  const profileResult = await db.from("profiles").select("credits_balance").eq("id", userId).maybeSingle();
  const currentBalance = Number(profileResult.data?.credits_balance ?? 0);

  await db.from("profiles").update({ credits_balance: currentBalance + monthlyCredits, plan_id: planId }).eq("id", userId);
  await db.from("credit_transactions").insert({
    user_id: userId,
    amount: monthlyCredits,
    type: "purchase",
    reason,
    metadata,
  });
}

async function handlePaymentCaptured(
  db: DbClient,
  payment: RazorpayEntity,
): Promise<void> {
  const orderId = String(payment.order_id ?? "");
  const paymentId = String(payment.id ?? "");
  if (!orderId || !paymentId) return;

  const orderResult = await db
    .from("payment_orders")
    .select("id,user_id,amount,metadata")
    .eq("razorpay_order_id", orderId)
    .maybeSingle();
  const paymentOrder = orderResult.data;
  if (!paymentOrder) return;

  await db
    .from("payment_orders")
    .update({ status: "paid", razorpay_payment_id: paymentId })
    .eq("id", String(paymentOrder.id));

  const userId = String(paymentOrder.user_id);
  const amountPaise = Number(paymentOrder.amount ?? payment.amount ?? 0);
  const amountInr = Math.round(amountPaise / 100);
  const planId = String((paymentOrder.metadata as { plan_id?: string } | null)?.plan_id ?? "");

  await addCreditsForPlan(
    db,
    userId,
    planId || null,
    `Razorpay payment captured (${amountInr} INR)`,
    {
      order_id: orderId,
      payment_id: paymentId,
      amount_inr: amountInr,
      plan_id: planId || null,
    },
  );

  const profile = await db.from("profiles").select("email,full_name").eq("id", userId).maybeSingle();
  const toEmail = String(profile.data?.email ?? "");
  if (toEmail) {
    await sendPaymentSuccessEmail({
      to: toEmail,
      customerName: String(profile.data?.full_name ?? "Builder"),
      amountInr,
      planName: planId ? "Subscription Plan" : "Payment",
      creditsAdded: Number((await db.from("plans").select("monthly_credits").eq("id", planId).maybeSingle()).data?.monthly_credits ?? 0),
      gst: {
        gstin: "27AAPFP0000A1Z5",
        sacCode: "9983",
        taxableAmount: amountInr,
      },
    });
  }
}

async function handleSubscriptionEvent(
  db: DbClient,
  eventType: string,
  subscription: RazorpayEntity,
): Promise<void> {
  const subscriptionId = String(subscription.id ?? "");
  if (!subscriptionId) return;

  const existingResult = await db
    .from("subscriptions")
    .select("id,user_id,plan_id,status")
    .eq("razorpay_subscription_id", subscriptionId)
    .maybeSingle();
  const existing = existingResult.data;

  const notes = subscription.notes ?? {};
  const userId = String(existing?.user_id ?? notes.user_id ?? "");
  const planId = String(existing?.plan_id ?? notes.plan_id ?? subscription.plan_id ?? "");
  if (!userId || !planId) return;

  if (existing) {
    await db
      .from("subscriptions")
      .update({
        status: subscription.status ?? eventType.split(".")[1] ?? "active",
        plan_id: planId,
        razorpay_plan_id: subscription.plan_id ?? null,
        next_billing_at: subscription.current_end
          ? new Date(Number(subscription.current_end) * 1000).toISOString()
          : subscription.charge_at
            ? new Date(Number(subscription.charge_at) * 1000).toISOString()
            : null,
        cancel_at_cycle_end: Boolean(subscription.cancel_at_cycle_end ?? false),
      })
      .eq("id", String(existing.id));
  } else {
    await db.from("subscriptions").insert({
      user_id: userId,
      plan_id: planId,
      razorpay_subscription_id: subscriptionId,
      razorpay_plan_id: subscription.plan_id ?? null,
      status: subscription.status ?? "active",
      start_date: new Date().toISOString(),
      next_billing_at: subscription.current_end
        ? new Date(Number(subscription.current_end) * 1000).toISOString()
        : null,
      cancel_at_cycle_end: Boolean(subscription.cancel_at_cycle_end ?? false),
    });
  }

  if (eventType === "subscription.charged") {
    await addCreditsForPlan(
      db,
      userId,
      planId,
      "Subscription charged and credits added",
      {
        subscription_id: subscriptionId,
        plan_id: planId,
      },
    );
    await captureServerEvent("subscription_started", {
      userId,
      plan: planId,
      amount_inr: Number(subscription.amount ?? 0) / 100,
    });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const signature = request.headers.get("x-razorpay-signature");
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!signature || !secret) {
      return ok({ success: true, ignored: true, reason: "missing_signature_or_secret" });
    }

    const rawBody = Buffer.from(await request.arrayBuffer());
    if (!secureCompareSignature(rawBody, signature, secret)) {
      return ok({ success: true, ignored: true, reason: "invalid_signature" });
    }

    const event = JSON.parse(rawBody.toString("utf-8")) as RazorpayWebhookEvent;
    const eventId = String(event.id ?? "");
    const eventType = String(event.event ?? "");
    if (!eventId || !eventType) {
      return ok({ success: true, ignored: true, reason: "invalid_payload" });
    }

    const supabase = createSupabaseAdmin();
    const db = supabase as unknown as DbClient;

    const duplicate = await db
      .from("processed_webhook_events")
      .select("id")
      .eq("event_id", eventId)
      .maybeSingle();
    if (duplicate.data?.id) {
      return ok({ success: true, duplicate: true });
    }

    const payment = event.payload?.payment?.entity ?? {};
    const subscription = event.payload?.subscription?.entity ?? {};
    const refund = event.payload?.refund?.entity ?? {};
    const order = event.payload?.order?.entity ?? {};

    switch (eventType) {
      case "payment.authorized":
        if (payment.order_id) {
          await db
            .from("payment_orders")
            .update({ status: "authorized", razorpay_payment_id: payment.id ?? null })
            .eq("razorpay_order_id", String(payment.order_id));
        }
        break;
      case "payment.captured":
      case "order.paid":
        await handlePaymentCaptured(db, payment.order_id ? payment : { ...payment, order_id: order.id });
        break;
      case "payment.failed": {
        if (payment.order_id) {
          await db
            .from("payment_orders")
            .update({ status: "failed", razorpay_payment_id: payment.id ?? null })
            .eq("razorpay_order_id", String(payment.order_id));
        }
        const orderResult = payment.order_id
          ? await db
              .from("payment_orders")
              .select("user_id")
              .eq("razorpay_order_id", String(payment.order_id))
              .maybeSingle()
          : { data: null as Record<string, unknown> | null };
        const userId = String(orderResult.data?.user_id ?? "");
        if (userId) {
          const profile = await db.from("profiles").select("email,full_name").eq("id", userId).maybeSingle();
          const toEmail = String(profile.data?.email ?? "");
          if (toEmail) {
            await sendPaymentFailedEmail({
              to: toEmail,
              customerName: String(profile.data?.full_name ?? "Builder"),
              reason: String(payment.status ?? "Payment authorization failed"),
            });
          }
        }
        break;
      }
      case "subscription.authenticated":
      case "subscription.activated":
      case "subscription.charged":
      case "subscription.completed":
      case "subscription.updated":
      case "subscription.pending":
      case "subscription.halted":
      case "subscription.cancelled":
        await handleSubscriptionEvent(db, eventType, subscription);
        break;
      case "refund.created":
        if (refund.id) {
          await db
            .from("payment_orders")
            .update({ status: "refund_created" })
            .eq("razorpay_payment_id", String(refund.payment_id ?? ""));
        }
        break;
      case "refund.processed":
        if (refund.id) {
          await db
            .from("payment_orders")
            .update({ status: "refunded" })
            .eq("razorpay_payment_id", String(refund.payment_id ?? ""));
        }
        break;
      case "refund.failed":
        if (refund.id) {
          await db
            .from("payment_orders")
            .update({ status: "refund_failed" })
            .eq("razorpay_payment_id", String(refund.payment_id ?? ""));
        }
        break;
      default:
        break;
    }

    if (eventType === "payment.captured" || eventType === "order.paid") {
      const orderId = String(payment.order_id ?? order.id ?? "");
      if (orderId) {
        const paidOrder = await db
          .from("payment_orders")
          .select("user_id")
          .eq("razorpay_order_id", orderId)
          .maybeSingle();
        const userId = String(paidOrder.data?.user_id ?? "");
        if (userId) {
          const profile = await db
            .from("profiles")
            .select("email,full_name")
            .eq("id", userId)
            .maybeSingle();
          const toEmail = String(profile.data?.email ?? "");
          const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://studio.humnexa.com";
          if (toEmail) {
            await sendWelcomeEmail({
              to: toEmail,
              customerName: String(profile.data?.full_name ?? "Builder"),
              appUrl,
            });
          }
        }
      }
    }

    await db.from("processed_webhook_events").insert({
      event_id: eventId,
      event_type: eventType,
    });

    return ok({ success: true });
  } catch (error) {
    Sentry.captureException(error);
    return ok({ success: true, logged: true });
  }
}
