import { createSupabaseServer } from "@/lib/supabase/server";

export class CreditsError extends Error {
  constructor(public code: "INSUFFICIENT_CREDITS" | "MONTHLY_CAP_REACHED") {
    super(code);
  }
}

export async function preFlightCheck(
  userId: string,
  cost: number,
): Promise<{ proceed?: true; requiresConfirmation?: true; cost: number }> {
  const supabase = createSupabaseServer();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("credits_balance, monthly_used, plan_id")
    .eq("id", userId)
    .single();

  if (error || !profile) {
    throw new Error("PROFILE_NOT_FOUND");
  }

  if (profile.credits_balance < cost) {
    throw new CreditsError("INSUFFICIENT_CREDITS");
  }

  let monthlyCap = 50;
  if (profile.plan_id) {
    const { data: plan } = await supabase
      .from("plans")
      .select("hard_cap")
      .eq("id", profile.plan_id)
      .single();
    monthlyCap = plan?.hard_cap ?? monthlyCap;
  }

  if ((profile.monthly_used ?? 0) + cost > monthlyCap) {
    throw new CreditsError("MONTHLY_CAP_REACHED");
  }

  if (cost >= 5) {
    return { requiresConfirmation: true, cost };
  }

  return { proceed: true, cost };
}
