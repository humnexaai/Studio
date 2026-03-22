"use client";

type Issue = {
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  file: string;
  issue: string;
};

export function SecurityScan({
  issues,
  blockDeploy,
}: {
  issues: Issue[];
  blockDeploy: boolean;
}): React.ReactElement {
  return (
    <section className="rounded-2xl border border-brand-border bg-brand-card p-4">
      <header className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">Pre-deploy security scan</h3>
        <span
          className={`rounded-full px-2 py-1 text-xs ${
            blockDeploy ? "bg-red-500/20 text-red-300" : "bg-green-500/20 text-green-300"
          }`}
        >
          {blockDeploy ? "Blocked" : "Ready"}
        </span>
      </header>
      <div className="space-y-2">
        {issues.length === 0 && (
          <p className="text-sm text-brand-sub">No critical issues detected.</p>
        )}
        {issues.map((issue, idx) => (
          <article
            key={`${issue.file}-${idx}`}
            className="rounded-lg border border-brand-border/60 bg-brand-card2 p-3 text-sm"
          >
            <p className="font-medium">{issue.issue}</p>
            <p className="mt-1 text-xs text-brand-sub">
              {issue.file} · {issue.severity}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
