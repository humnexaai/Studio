import { createSupabaseServer } from "@/lib/supabase/server";

export async function deductCreditsOnSuccess(
  userId: string,
  amount: number,
  reason = "AI generation success",
): Promise<void> {
  const supabase = createSupabaseServer();
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("credits_balance, monthly_used")
    .eq("id", userId)
    .single();
  if (profileError || !profile) {
    throw new Error("PROFILE_NOT_FOUND");
  }

  const currentBalance = profile.credits_balance ?? 0;
  const monthlyUsed = profile.monthly_used ?? 0;
  const newBalance = Math.max(0, currentBalance - amount);

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      credits_balance: newBalance,
      monthly_used: monthlyUsed + amount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
  if (updateError) {
    throw new Error("CREDIT_DEDUCTION_FAILED");
  }

  const { error: txnError } = await supabase.from("credit_transactions").insert({
    user_id: userId,
    amount: -amount,
    type: "usage",
    reason,
  });
  if (txnError) {
    throw new Error("CREDIT_DEDUCTION_TXN_LOG_FAILED");
  }
}
