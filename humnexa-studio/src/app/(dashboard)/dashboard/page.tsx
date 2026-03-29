import type { Metadata } from "next";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";
import { createSupabaseServer } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage(): Promise<React.ReactElement> {
  const supabase = createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const [{ data: projects }, { data: profile }, { data: transactions }] =
    await Promise.all([
      supabase
        .from("projects")
        .select("id,name,framework,status,updated_at,is_public")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("credits_balance, full_name")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("credit_transactions")
        .select("id, amount, type, reason, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const typedProfile = profile as {
    full_name?: string | null;
    credits_balance?: number | null;
  } | null;

  type ProjectRow = {
    id: string;
    name: string;
    framework: string;
    status: string;
    updated_at: string;
    is_public?: boolean;
  };

  return (
    <DashboardClient
      userName={typedProfile?.full_name || "Builder"}
      creditsBalance={typedProfile?.credits_balance ?? 0}
      projects={(projects ?? []) as ProjectRow[]}
      transactions={transactions ?? []}
    />
  );
}
