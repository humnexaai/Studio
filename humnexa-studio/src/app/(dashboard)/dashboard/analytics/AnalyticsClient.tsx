"use client";

import { useMemo } from "react";

type DailyPoint = {
  date: string;
  credits: number;
};

type TransactionRow = {
  id: string;
  amount: number;
  type: "usage" | "purchase" | "refund" | "bonus";
  reason: string | null;
  created_at: string;
};

type AnalyticsClientProps = {
  totalProjects: number;
  totalDeployments: number;
  totalMessages: number;
  monthlyCreditsUsed: number;
  deploymentSuccessRate: number;
  mostActiveProject: { id: string; name: string; messages: number } | null;
  daily30: DailyPoint[];
  daily7: DailyPoint[];
  transactions: TransactionRow[];
};

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function buildCsv(transactions: TransactionRow[]): string {
  const rows = [
    ["id", "amount", "type", "reason", "created_at"],
    ...transactions.map((tx) => [
      tx.id,
      String(tx.amount),
      tx.type,
      tx.reason ?? "",
      tx.created_at,
    ]),
  ];
  return rows
    .map((row) =>
      row
        .map((cell) => `"${cell.replace(/"/g, "\"\"")}"`)
        .join(","),
    )
    .join("\n");
}

export default function AnalyticsClient({
  totalProjects,
  totalDeployments,
  totalMessages,
  monthlyCreditsUsed,
  deploymentSuccessRate,
  mostActiveProject,
  daily30,
  daily7,
  transactions,
}: AnalyticsClientProps): React.ReactElement {
  const max30 = useMemo(
    () => Math.max(1, ...daily30.map((point) => point.credits)),
    [daily30],
  );
  const max7 = useMemo(
    () => Math.max(1, ...daily7.map((point) => point.credits)),
    [daily7],
  );

  const exportCsv = (): void => {
    const csv = buildCsv(transactions);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "credit-transactions.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <button
          type="button"
          onClick={exportCsv}
          className="rounded-lg border border-brand-border bg-brand-card px-3 py-2 text-sm text-brand-sub hover:text-brand-text"
        >
          Export CSV
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Projects" value={String(totalProjects)} />
        <MetricCard label="Total Deployments" value={String(totalDeployments)} />
        <MetricCard label="Credits Used (Month)" value={String(monthlyCreditsUsed)} />
        <MetricCard label="AI Messages Sent" value={String(totalMessages)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-brand-border bg-brand-card p-4">
          <h2 className="text-lg font-semibold">Credits Used per Day (Last 30 Days)</h2>
          <div className="mt-4 space-y-2">
            {daily30.map((point) => (
              <div key={point.date} className="flex items-center gap-2">
                <div className="w-16 text-xs text-brand-sub">{shortDate(point.date)}</div>
                <div className="h-3 flex-1 rounded bg-brand-card2">
                  <div
                    className="h-3 rounded bg-orange-500"
                    style={{ width: `${Math.max(2, (point.credits / max30) * 100)}%` }}
                  />
                </div>
                <div className="w-10 text-right text-xs text-brand-sub">{point.credits}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-brand-border bg-brand-card p-4">
          <h2 className="text-lg font-semibold">Credits Used (Last 7 Days)</h2>
          <div className="mt-4 space-y-2">
            {daily7.map((point) => (
              <div key={point.date} className="flex items-center gap-2">
                <div className="w-16 text-xs text-brand-sub">{shortDate(point.date)}</div>
                <div className="h-3 flex-1 rounded bg-brand-card2">
                  <div
                    className="h-3 rounded bg-orange-500"
                    style={{ width: `${Math.max(2, (point.credits / max7) * 100)}%` }}
                  />
                </div>
                <div className="w-10 text-right text-xs text-brand-sub">{point.credits}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-brand-border bg-brand-card p-4">
          <h2 className="text-lg font-semibold">Most Active Project</h2>
          {mostActiveProject ? (
            <p className="mt-2 text-sm text-brand-sub">
              {mostActiveProject.name} ({mostActiveProject.messages} messages)
            </p>
          ) : (
            <p className="mt-2 text-sm text-brand-sub">No activity yet.</p>
          )}
        </div>
        <div className="rounded-2xl border border-brand-border bg-brand-card p-4">
          <h2 className="text-lg font-semibold">Deployment Success Rate</h2>
          <p className="mt-2 text-3xl font-bold text-brand-or">{deploymentSuccessRate}%</p>
        </div>
      </div>
    </section>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string;
}): React.ReactElement {
  return (
    <div className="rounded-2xl border border-brand-border bg-brand-card p-4">
      <p className="text-sm text-brand-sub">{label}</p>
      <p className="mt-2 text-3xl font-display font-bold">{value}</p>
    </div>
  );
}
