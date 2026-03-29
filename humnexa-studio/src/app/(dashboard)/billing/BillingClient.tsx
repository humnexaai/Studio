"use client";

import { useMemo, useState } from "react";
import { formatInr } from "@/lib/utils";
import { GSTInvoice } from "@/components/india/GSTInvoice";
import { generateGSTInvoice } from "@/lib/billing/gst-invoice";

type PlanRow = {
  id: string;
  code: string;
  name: string;
  price_inr: number;
  monthly_credits: number;
};

type TransactionRow = {
  id: string;
  amount: number;
  type: "usage" | "purchase" | "refund" | "bonus";
  reason: string | null;
  metadata?: {
    amount_inr?: number;
    order_id?: string;
    payment_id?: string;
    plan_id?: string;
  } | null;
  created_at: string;
};

type SubscriptionRow = {
  id: string;
  plan_id: string;
  plan_name?: string | null;
  status: string;
  next_billing_at?: string | null;
  cancel_at_cycle_end?: boolean | null;
  razorpay_subscription_id?: string | null;
};

type CreateSubscriptionResponse = {
  success?: boolean;
  data?: {
    subscriptionId: string;
    keyId: string;
  };
  error?: string;
};

type RazorpayOptions = {
  key: string;
  name: string;
  description: string;
  subscription_id: string;
  recurring: 1;
  theme?: { color?: string };
  handler: (response: Record<string, string>) => void;
  modal?: { ondismiss?: () => void };
  prefill?: { email?: string };
};

type RazorpayInstance = {
  open: () => void;
};

type RazorpayCtor = new (options: RazorpayOptions) => RazorpayInstance;

type WindowWithRazorpay = Window & {
  Razorpay?: RazorpayCtor;
};

async function ensureRazorpayScript(): Promise<void> {
  const w = window as WindowWithRazorpay;
  if (w.Razorpay) return;
  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Failed to load Razorpay SDK")),
        { once: true },
      );
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
    document.head.appendChild(script);
  });
}

export default function BillingClient({
  plans,
  currentPlanId,
  currentCredits,
  transactions,
  subscriptions,
}: {
  plans: PlanRow[];
  currentPlanId: string | null;
  currentCredits: number;
  transactions: TransactionRow[];
  subscriptions: SubscriptionRow[];
}): React.ReactElement {
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [invoiceTxnId, setInvoiceTxnId] = useState<string | null>(null);

  const currentPlan = useMemo(
    () => plans.find((plan) => plan.id === currentPlanId) ?? null,
    [plans, currentPlanId],
  );

  const activeSubscription = subscriptions[0] ?? null;
  const statusLabel =
    activeSubscription?.status === "cancelled_pending"
      ? "active (cancel at cycle end)"
      : activeSubscription?.status ?? "inactive";

  const openSubscriptionCheckout = async (plan: PlanRow): Promise<void> => {
    try {
      setProcessingPlanId(plan.id);
      setCheckoutError(null);
      setCheckoutMessage(null);

      const response = await fetch("/api/payments/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
        }),
      });
      const payload = (await response.json()) as CreateSubscriptionResponse;
      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? "Unable to create Razorpay subscription");
      }

      await ensureRazorpayScript();
      const w = window as WindowWithRazorpay;
      if (!w.Razorpay) {
        throw new Error("Razorpay SDK unavailable");
      }

      const razorpay = new w.Razorpay({
        key: payload.data.keyId,
        name: "Humnexa Studio",
        description: `${plan.name} monthly subscription`,
        subscription_id: payload.data.subscriptionId,
        recurring: 1,
        theme: { color: "#FF6B2C" },
        handler: () => {
          setCheckoutMessage(
            "Subscription started. Plan and credits will update shortly.",
          );
          window.setTimeout(() => window.location.reload(), 1200);
        },
        modal: {
          ondismiss: () => {
            setCheckoutMessage("Checkout cancelled.");
          },
        },
      });
      razorpay.open();
    } catch (error) {
      setCheckoutError(
        error instanceof Error ? error.message : "Checkout failed unexpectedly",
      );
    } finally {
      setProcessingPlanId(null);
    }
  };

  const cancelSubscription = async (): Promise<void> => {
    if (!activeSubscription?.id) return;
    setCheckoutError(
      "Cancellation API endpoint is not enabled yet. Please contact support to cancel at cycle end.",
    );
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-brand-border bg-brand-card p-5">
        <p className="text-sm text-brand-sub">Current plan</p>
        <h1 className="mt-1 text-2xl font-bold">
          {currentPlan?.name ?? "Free"} — {currentPlan?.monthly_credits ?? 100} credits
        </h1>
        <p className="mt-1 text-sm text-brand-sub">
          Current balance: {currentCredits.toLocaleString("en-IN")} credits
        </p>
        <div className="mt-4 h-2 rounded-full bg-brand-card2">
          <div
            className="h-full rounded-full bg-brand-gradient"
            style={{
              width: `${Math.min(
                ((currentCredits ?? 0) / Math.max(currentPlan?.monthly_credits ?? 100, 1)) *
                  100,
                100,
              )}%`,
            }}
          />
        </div>
      </div>

      {checkoutError ? (
        <div className="rounded-xl border border-brand-error/50 bg-brand-error/10 p-3 text-sm text-brand-error">
          {checkoutError}
        </div>
      ) : null}
      {checkoutMessage ? (
        <div className="rounded-xl border border-brand-gr/40 bg-brand-gr/10 p-3 text-sm text-brand-gr">
          {checkoutMessage}
        </div>
      ) : null}

      <section className="rounded-2xl border border-brand-border bg-brand-card p-5">
        <h2 className="text-lg font-semibold">Subscription Management</h2>
        {activeSubscription ? (
          <div className="mt-3 space-y-2 text-sm text-brand-sub">
            <p>
              Status:{" "}
              <span className="font-medium text-brand-text">{statusLabel}</span>
            </p>
            {activeSubscription.plan_name ? (
              <p>
                Plan: <span className="font-medium text-brand-text">{activeSubscription.plan_name}</span>
              </p>
            ) : null}
            <p>
              Next billing:{" "}
              {activeSubscription.next_billing_at
                ? new Date(activeSubscription.next_billing_at).toLocaleString("en-IN")
                : "—"}
            </p>
            <p>
              Cancel at cycle end:{" "}
              {activeSubscription.cancel_at_cycle_end ? "Yes" : "No"}
            </p>
            <button
              type="button"
              onClick={() => void cancelSubscription()}
              className="mt-2 rounded-lg border border-brand-border px-3 py-2 text-xs text-brand-sub"
            >
              Cancel Subscription
            </button>
          </div>
        ) : (
          <p className="mt-2 text-sm text-brand-sub">
            No active subscription. Choose a paid plan below to start UPI AutoPay.
          </p>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-4">
        {plans.map((plan) => (
          <article
            key={plan.id}
            className="relative rounded-2xl border border-brand-border bg-brand-card p-4"
          >
            {plan.id === currentPlanId ? (
              <span className="absolute right-3 top-3 rounded-full bg-brand-or/20 px-2 py-1 text-xs text-brand-or">
                Current
              </span>
            ) : null}
            <h2 className="text-lg font-semibold">{plan.name}</h2>
            <p className="mt-1 text-2xl font-bold">{formatInr(plan.price_inr)}</p>
            <p className="text-sm text-brand-sub">
              {plan.monthly_credits.toLocaleString("en-IN")} credits/month
            </p>
            <button
              type="button"
              onClick={() => void openSubscriptionCheckout(plan)}
              disabled={processingPlanId === plan.id || plan.price_inr === 0}
              className="mt-4 w-full rounded-xl bg-brand-gradient px-3 py-2 text-sm font-semibold disabled:opacity-60"
            >
              {plan.price_inr === 0
                ? "Current Free Tier"
                : processingPlanId === plan.id
                  ? "Opening..."
                  : "Subscribe"}
            </button>
            {plan.code === "student" ? (
              <p className="mt-2 text-xs text-brand-sub">
                Student tier requires verification.
              </p>
            ) : null}
            {plan.code === "student" ? (
              <a href="/student" className="mt-1 block text-xs text-brand-or underline">
                Learn about student discount
              </a>
            ) : null}
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-brand-border bg-brand-card">
        <header className="border-b border-brand-border px-5 py-4">
          <h2 className="text-lg font-semibold">Transaction history</h2>
        </header>
        <div className="divide-y divide-brand-border">
          {transactions.length === 0 ? (
            <div className="px-5 py-6 text-sm text-brand-sub">No transactions yet.</div>
          ) : (
            transactions.map((txn) => (
              <div key={txn.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="font-medium capitalize">{txn.type}</p>
                  <p className="text-xs text-brand-muted">
                    {txn.reason ?? "—"} •{" "}
                    {new Date(txn.created_at).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="text-right">
                  <p>{txn.amount > 0 ? "+" : ""}{txn.amount}</p>
                  <p className="text-xs capitalize text-brand-gr">{txn.type}</p>
                  {txn.type === "purchase" ? (
                    <button
                      type="button"
                      onClick={() => setInvoiceTxnId(txn.id)}
                      className="mt-1 rounded border border-brand-border px-2 py-0.5 text-[10px] text-brand-sub"
                    >
                      Download GST Invoice
                    </button>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {invoiceTxnId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-brand-border bg-brand-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">GST Invoice</h3>
              <button
                type="button"
                onClick={() => setInvoiceTxnId(null)}
                className="rounded border border-brand-border px-2 py-1 text-xs text-brand-sub"
              >
                Close
              </button>
            </div>
            <GSTInvoice
              invoice={generateGSTInvoice({
                seller: {
                  name: "PLATINUMGOLD Partnership Firm",
                  gstin: "27AAPFP0000A1Z5",
                  address: "Mumbai, Maharashtra, India",
                },
                buyer: { name: "Customer" },
                lineItems: [
                  {
                    description: "Humnexa Studio subscription",
                    amount:
                      transactions.find((txn) => txn.id === invoiceTxnId)?.metadata
                        ?.amount_inr ??
                      Math.abs(
                        transactions.find((txn) => txn.id === invoiceTxnId)?.amount ?? 0,
                      ),
                  },
                ],
                isInterState: false,
                sacCode: "9983",
              })}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
