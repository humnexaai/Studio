import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AnalyticsClient from "./AnalyticsClient";
import { createSupabaseServer } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Analytics",
};

type ProjectRow = {
  id: string;
  name: string;
  created_at: string;
};

type DeploymentRow = {
  id: string;
  project_id: string;
  status: string;
  created_at: string;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  created_at: string;
};

type TransactionRow = {
  id: string;
  amount: number;
  type: "usage" | "purchase" | "refund" | "bonus";
  reason: string | null;
  created_at: string;
};

function yyyyMmDd(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfMonth(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export default async function AnalyticsPage(): Promise<React.ReactElement> {
  const supabase = createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const now = new Date();
  const monthStartIso = startOfMonth(now).toISOString();
  const last30Days = new Date(now);
  last30Days.setDate(now.getDate() - 29);
  const last7Days = new Date(now);
  last7Days.setDate(now.getDate() - 6);

  const [
    projectsResult,
    deploymentsResult,
    transactionsResult,
    conversationsResult,
    messagesResult,
  ] = await Promise.all([
    supabase
      .from("projects")
      .select("id,name,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("deployments")
      .select("id,project_id,status,created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("credit_transactions")
      .select("id,amount,type,reason,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("conversations")
      .select("id,project_id")
      .eq("user_id", user.id),
    supabase
      .from("messages")
      .select("id,conversation_id,created_at")
      .order("created_at", { ascending: false }),
  ]);

  const projects = (projectsResult.data ?? []) as ProjectRow[];
  const projectIds = new Set(projects.map((project) => project.id));

  const deployments = ((deploymentsResult.data ?? []) as DeploymentRow[]).filter((row) =>
    projectIds.has(row.project_id),
  );

  const transactions = (transactionsResult.data ?? []) as TransactionRow[];

  const conversationProjectMap = new Map<string, string>();
  const conversationRows = (conversationsResult.data ??
    []) as Array<{ id: string; project_id: string }>;
  for (const row of conversationRows) {
    conversationProjectMap.set(row.id, row.project_id);
  }

  const messages = ((messagesResult.data ?? []) as MessageRow[]).filter((message) =>
    conversationProjectMap.has(message.conversation_id),
  );

  const totalProjects = projects.length;
  const totalDeployments = deployments.length;
  const totalMessages = messages.length;

  const monthlyCreditsUsed = transactions
    .filter((tx) => tx.type === "usage" && new Date(tx.created_at).toISOString() >= monthStartIso)
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  const deploymentSuccessCount = deployments.filter(
    (deployment) => deployment.status === "ready" || deployment.status === "success",
  ).length;
  const deploymentSuccessRate =
    totalDeployments === 0
      ? 0
      : Number(((deploymentSuccessCount / totalDeployments) * 100).toFixed(1));

  const messageCountByProject = new Map<string, number>();
  for (const message of messages) {
    const projectId = conversationProjectMap.get(message.conversation_id);
    if (!projectId) continue;
    messageCountByProject.set(projectId, (messageCountByProject.get(projectId) ?? 0) + 1);
  }

  let mostActiveProject: { id: string; name: string; messages: number } | null = null;
  for (const project of projects) {
    const count = messageCountByProject.get(project.id) ?? 0;
    if (!mostActiveProject || count > mostActiveProject.messages) {
      mostActiveProject = {
        id: project.id,
        name: project.name,
        messages: count,
      };
    }
  }

  const daily30 = Array.from({ length: 30 }, (_, index) => {
    const day = new Date(last30Days);
    day.setDate(last30Days.getDate() + index);
    return {
      date: yyyyMmDd(day),
      credits: 0,
    };
  });
  const daily30Map = new Map(daily30.map((item) => [item.date, item]));
  for (const tx of transactions) {
    if (tx.type !== "usage") continue;
    const key = yyyyMmDd(new Date(tx.created_at));
    const entry = daily30Map.get(key);
    if (!entry) continue;
    entry.credits += Math.abs(tx.amount);
  }

  const daily7 = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(last7Days);
    day.setDate(last7Days.getDate() + index);
    return {
      date: yyyyMmDd(day),
      credits: 0,
    };
  });
  const daily7Map = new Map(daily7.map((item) => [item.date, item]));
  for (const tx of transactions) {
    if (tx.type !== "usage") continue;
    const key = yyyyMmDd(new Date(tx.created_at));
    const entry = daily7Map.get(key);
    if (!entry) continue;
    entry.credits += Math.abs(tx.amount);
  }

  return (
    <AnalyticsClient
      totalProjects={totalProjects}
      totalDeployments={totalDeployments}
      totalMessages={totalMessages}
      monthlyCreditsUsed={monthlyCreditsUsed}
      deploymentSuccessRate={deploymentSuccessRate}
      mostActiveProject={mostActiveProject}
      daily30={daily30}
      daily7={daily7}
      transactions={transactions}
    />
  );
}
