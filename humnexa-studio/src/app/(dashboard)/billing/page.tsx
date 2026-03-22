import { redirect } from "next/navigation";
import BillingClient from "./BillingClient";
import { createSupabaseServer } from "@/lib/supabase/server";

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

export default async function BillingPage(): Promise<React.ReactElement> {
  const supabase = createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth");
  }

  const [{ data: plans }, { data: profile }, { data: transactions }] = await Promise.all([
    supabase
      .from("plans")
      .select("id,code,name,price_inr,monthly_credits")
      .order("price_inr", { ascending: true }),
    supabase.from("profiles").select("plan_id,credits_balance").eq("id", user.id).maybeSingle(),
    supabase
      .from("credit_transactions")
      .select("id,amount,type,reason,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const typedProfile = profile as
    | { plan_id?: string | null; credits_balance?: number | null }
    | null;

  return (
    <BillingClient
      plans={(plans ?? []) as PlanRow[]}
      currentPlanId={typedProfile?.plan_id ?? null}
      currentCredits={typedProfile?.credits_balance ?? 0}
      transactions={(transactions ?? []) as TransactionRow[]}
    />
  );
}
