import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { createSupabaseServer } from "@/lib/supabase/server";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}): Promise<React.ReactElement> {
  return renderDashboardLayout(children);
}

async function renderDashboardLayout(
  children: ReactNode,
): Promise<React.ReactElement> {
  const supabase = createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("credits_balance, plan_id")
    .eq("id", user.id)
    .maybeSingle();
  const typedProfile = profile as {
    credits_balance?: number | null;
    plan_id?: string | null;
  } | null;

  const defaultPlanLimit = 100;
  let planLimit = defaultPlanLimit;

  if (typedProfile?.plan_id) {
    const { data: plan } = await supabase
      .from("plans")
      .select("monthly_credits")
      .eq("id", typedProfile.plan_id)
      .maybeSingle();
    const typedPlan = plan as { monthly_credits?: number | null } | null;
    planLimit = typedPlan?.monthly_credits ?? defaultPlanLimit;
  }

  return (
    <div className="flex min-h-screen bg-brand-bg">
      <DashboardSidebar
        userId={user.id}
        creditBalance={typedProfile?.credits_balance ?? 0}
        planLimit={planLimit}
      />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
