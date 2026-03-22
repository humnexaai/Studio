"use client";

import { useMemo, useState } from "react";
import { formatInr } from "@/lib/utils";

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
  created_at: string;
};

type CreateOrderResponse = {
  success?: boolean;
  data?: {
    orderId: string;
    amount: number;
    currency: string;
    keyId: string;
  };
  error?: string;
};

type RazorpaySuccessPayload = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  theme?: { color?: string };
  handler: (response: RazorpaySuccessPayload) => void;
  modal?: { ondismiss?: () => void };
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
}: {
  plans: PlanRow[];
  currentPlanId: string | null;
  currentCredits: number;
  transactions: TransactionRow[];
}): React.ReactElement {
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const currentPlan = useMemo(
    () => plans.find((plan) => plan.id === currentPlanId) ?? null,
    [plans, currentPlanId],
  );

  const openCheckout = async (plan: PlanRow): Promise<void> => {
    try {
      setProcessingPlanId(plan.id);
      setCheckoutError(null);
      setCheckoutMessage(null);

      const response = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          amount_inr: plan.price_inr,
        }),
      });
      const payload = (await response.json()) as CreateOrderResponse;
      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? "Unable to create Razorpay order");
      }

      await ensureRazorpayScript();
      const w = window as WindowWithRazorpay;
      if (!w.Razorpay) {
        throw new Error("Razorpay SDK unavailable");
      }

      const razorpay = new w.Razorpay({
        key: payload.data.keyId,
        amount: payload.data.amount,
        currency: payload.data.currency,
        name: "Humnexa Studio",
        description: `${plan.name} plan`,
        order_id: payload.data.orderId,
        theme: { color: "#FF6B2C" },
        handler: () => {
          setCheckoutMessage(
            "Payment captured. Wallet and plan will update shortly.",
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
              onClick={() => void openCheckout(plan)}
              disabled={processingPlanId === plan.id}
              className="mt-4 w-full rounded-xl bg-brand-gradient px-3 py-2 text-sm font-semibold disabled:opacity-60"
            >
              {processingPlanId === plan.id ? "Opening..." : "Choose Plan"}
            </button>
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
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
