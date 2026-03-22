import { createSupabaseServer } from "@/lib/supabase/server";

export async function refundCreditsOnFailure(
  userId: string,
  amount: number,
  reason = "AI failure auto-refund"
): Promise<void> {
  const supabase = createSupabaseServer();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("credits_balance")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    throw new Error("PROFILE_NOT_FOUND");
  }

  const nextBalance = (profile.credits_balance ?? 0) + amount;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ credits_balance: nextBalance })
    .eq("id", userId);

  if (updateError) {
    throw new Error("CREDIT_REFUND_FAILED");
  }

  const { error: txnError } = await supabase.from("credit_transactions").insert({
    user_id: userId,
    amount,
    type: "refund",
    reason,
  });

  if (txnError) {
    throw new Error("CREDIT_REFUND_TXN_LOG_FAILED");
  }
}
