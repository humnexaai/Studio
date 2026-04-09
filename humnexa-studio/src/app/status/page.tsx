import type { Metadata } from "next";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "System Status",
  description: "Live service health for Humnexa Studio.",
};

type ServiceStatus = "operational" | "degraded" | "down";

type CheckResult = {
  name: string;
  status: ServiceStatus;
  details: string;
};

async function checkGroqStatus(): Promise<ServiceStatus> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return "degraded";
  try {
    const response = await fetch("https://api.groq.com/openai/v1/models", {
      method: "GET",
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
    if (response.ok) return "operational";
    if (response.status >= 500) return "down";
    return "degraded";
  } catch {
    return "down";
  }
}

function aggregateStatus(checks: CheckResult[]): ServiceStatus {
  if (checks.some((check) => check.status === "down")) return "down";
  if (checks.some((check) => check.status === "degraded")) return "degraded";
  return "operational";
}

export default async function StatusPage(): Promise<React.ReactElement> {
  const checks: CheckResult[] = [];

  try {
    const supabase = createSupabaseAdmin();
    const { error } = await supabase.from("plans").select("id").limit(1);
    checks.push({
      name: "Supabase",
      status: error ? "down" : "operational",
      details: error ? error.message ?? "Connection error" : "Connected",
    });
  } catch (error) {
    checks.push({
      name: "Supabase",
      status: "down",
      details: error instanceof Error ? error.message : "Connection failed",
    });
  }

  try {
    const hasGroqKey = Boolean(process.env.GROQ_API_KEY);
    const groqStatus = await checkGroqStatus();
    checks.push({
      name: "Groq AI",
      status: hasGroqKey ? groqStatus : "degraded",
      details: hasGroqKey
        ? groqStatus === "operational"
          ? "API authenticated and reachable"
          : groqStatus === "degraded"
            ? "API key configured but model endpoint is degraded"
            : "API currently unavailable"
        : "Missing GROQ_API_KEY",
    });
  } catch (error) {
    checks.push({
      name: "Groq AI",
      status: "down",
      details: error instanceof Error ? error.message : "Unavailable",
    });
  }

  const overall = aggregateStatus(checks);

  return (
    <main className="mx-auto max-w-3xl space-y-5 px-4 py-10">
      <header className="rounded-2xl border border-brand-border bg-brand-card p-5">
        <h1 className="text-2xl font-semibold">Humnexa Status</h1>
        <p className="mt-1 text-sm text-brand-sub">
          Overall:{" "}
          <span
            className={
              overall === "operational"
                ? "text-brand-gr"
                : overall === "degraded"
                  ? "text-brand-or"
                  : "text-brand-error"
            }
          >
            {overall}
          </span>
        </p>
      </header>

      <section className="space-y-3">
        {checks.map((check) => (
          <article
            key={check.name}
            className="rounded-xl border border-brand-border bg-brand-card p-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-medium">{check.name}</h2>
              <span
                className={
                  check.status === "operational"
                    ? "text-brand-gr"
                    : check.status === "degraded"
                      ? "text-brand-or"
                      : "text-brand-error"
                }
              >
                {check.status}
              </span>
            </div>
            <p className="mt-1 text-xs text-brand-sub">{check.details}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
