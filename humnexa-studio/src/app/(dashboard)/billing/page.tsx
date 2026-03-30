import type { Metadata } from "next";
import { redirect } from "next/navigation";
import BillingClient from "./BillingClient";
import { createSupabaseServer } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Billing & Credits",
};

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

export default async function BillingPage(): Promise<React.ReactElement> {
  const supabase = createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth");
  }

  const [{ data: plans }, { data: profile }, { data: transactions }, { data: subscriptionsRows }] = await Promise.all([
    supabase
      .from("plans")
      .select("id,code,name,price_inr,monthly_credits")
      .order("price_inr", { ascending: true }),
    supabase.from("profiles").select("plan_id,credits_balance").eq("id", user.id).maybeSingle(),
    supabase
      .from("credit_transactions")
      .select("id,amount,type,reason,metadata,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("subscriptions")
      .select("id,plan_id,plan_name,status,next_billing_at,cancel_at_cycle_end,razorpay_subscription_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  const typedProfile = profile as
    | { plan_id?: string | null; credits_balance?: number | null }
    | null;

  const planNameById = new Map((plans ?? []).map((plan) => [plan.id, plan.name]));
  const subscriptions = ((subscriptionsRows ?? []) as SubscriptionRow[]).map((sub) => ({
    ...sub,
    plan_name: planNameById.get(sub.plan_id) ?? null,
  }));

  return (
    <BillingClient
      plans={(plans ?? []) as PlanRow[]}
      currentPlanId={typedProfile?.plan_id ?? null}
      currentCredits={typedProfile?.credits_balance ?? 0}
      transactions={(transactions ?? []) as TransactionRow[]}
      subscriptions={(subscriptions ?? []) as SubscriptionRow[]}
    />
  );
}
