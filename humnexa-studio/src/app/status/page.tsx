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

async function checkServiceStatus(url: string): Promise<ServiceStatus> {
  try {
    const response = await fetch(url, { method: "GET", cache: "no-store" });
    if (!response.ok) return "down";
    return "operational";
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
    const groqReachable =
      hasGroqKey &&
      (await checkServiceStatus(
        "https://api.groq.com/openai/v1/models",
      )) === "operational";
    checks.push({
      name: "Groq AI",
      status: hasGroqKey ? (groqReachable ? "operational" : "degraded") : "degraded",
      details: hasGroqKey
        ? groqReachable
          ? "API reachable"
          : "API key configured but endpoint check degraded"
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
