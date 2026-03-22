"use client";

import { useMemo, useState } from "react";

type DeployIssue = {
  file: string;
  issue: string;
};

type SecurityReport = {
  critical: DeployIssue[];
  high: DeployIssue[];
  medium: DeployIssue[];
  blockDeploy: boolean;
};

type DeployStep = "security" | "build" | "deploy";

const steps: Array<{ key: DeployStep; label: string }> = [
  { key: "security", label: "Security Scan" },
  { key: "build", label: "Build" },
  { key: "deploy", label: "Deploy" },
];

export function DeployModal({
  open,
  logs,
  statusText,
  currentStep,
  loading,
  liveUrl,
  errorMessage,
  securityReport,
  onStart,
  onFixWithAI,
  onClose,
}: {
  open: boolean;
  logs: string[];
  statusText: string;
  currentStep: DeployStep;
  loading: boolean;
  liveUrl: string | null;
  errorMessage: string | null;
  securityReport: SecurityReport | null;
  onStart: () => void;
  onFixWithAI: (error: string) => void;
  onClose: () => void;
}): React.ReactElement | null {
  const [copied, setCopied] = useState(false);
  const activeStep = useMemo(
    () => Math.max(0, steps.findIndex((item) => item.key === currentStep)),
    [currentStep],
  );
  const progress = useMemo(
    () => ((activeStep + 1) / steps.length) * 100,
    [activeStep],
  );

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className="w-full max-w-3xl rounded-2xl border border-brand-border bg-brand-card p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl font-extrabold">Deploy Project</h3>
          <button onClick={onClose} className="text-sm text-brand-sub">
            Close
          </button>
        </div>
        <div className="mt-4 h-2 rounded-full bg-brand-card2">
          <div
            className="h-2 rounded-full bg-brand-gradient transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-brand-sub">{statusText}</p>
        <div className="mt-4 grid gap-2 md:grid-cols-3">
          {steps.map((step, i) => (
            <div
              key={step.key}
              className={`rounded-lg border px-2 py-1 text-center text-xs ${
                i <= activeStep
                  ? "border-brand-or bg-brand-or/15 text-brand-text"
                  : "border-brand-border text-brand-sub"
              }`}
            >
              {step.label}
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <IssueGroup
            title="CRITICAL (blocks deploy)"
            tone="critical"
            issues={securityReport?.critical ?? []}
            emptyText="No critical issues"
          />
          <IssueGroup
            title="HIGH (warning)"
            tone="high"
            issues={securityReport?.high ?? []}
            emptyText="No high-risk warnings"
          />
          <IssueGroup
            title="MEDIUM (info)"
            tone="medium"
            issues={securityReport?.medium ?? []}
            emptyText="No medium info warnings"
          />
        </div>

        <div className="mt-4 max-h-48 overflow-auto rounded-xl border border-brand-border bg-brand-card2 p-3 font-code text-xs text-brand-sub">
          {logs.map((log, i) => (
            <p key={`${log}-${i}`}>{log}</p>
          ))}
        </div>
        {securityReport && !securityReport.blockDeploy ? (
          <p className="mt-3 text-sm text-brand-gr">Security scan passed.</p>
        ) : null}
        {liveUrl ? (
          <div className="mt-4 rounded-xl border border-brand-gr/30 bg-brand-gr/10 p-3">
            <p className="text-sm text-brand-text">Deployment is live.</p>
            <a
              href={liveUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 block truncate text-sm text-brand-gr underline"
            >
              {liveUrl}
            </a>
            <div className="mt-3 flex gap-2">
              <a
                href={liveUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg bg-brand-gradient px-3 py-1.5 text-xs font-semibold text-white"
              >
                Open App
              </a>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(liveUrl);
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 1500);
                }}
                className="rounded-lg border border-brand-border px-3 py-1.5 text-xs text-brand-sub"
              >
                {copied ? "Copied!" : "Copy URL"}
              </button>
            </div>
          </div>
        ) : null}
        {errorMessage ? (
          <div className="mt-4 rounded-xl border border-brand-error/40 bg-brand-error/10 p-3">
            <p className="text-sm font-semibold text-brand-error">Deployment failed</p>
            <p className="mt-1 text-xs text-brand-sub">{errorMessage}</p>
            <button
              type="button"
              onClick={() => onFixWithAI(errorMessage)}
              className="mt-3 rounded-lg bg-brand-gradient px-3 py-1.5 text-xs font-semibold text-white"
            >
              Fix with AI
            </button>
          </div>
        ) : null}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onStart}
            disabled={loading}
            className="rounded-lg bg-brand-gradient px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Deploying..." : "Start Deploy"}
          </button>
        </div>
      </div>
    </div>
  );
}

function IssueGroup({
  title,
  tone,
  issues,
  emptyText,
}: {
  title: string;
  tone: "critical" | "high" | "medium";
  issues: DeployIssue[];
  emptyText: string;
}): React.ReactElement {
  const toneClasses =
    tone === "critical"
      ? "border-brand-error/50 bg-brand-error/10"
      : tone === "high"
        ? "border-brand-warn/40 bg-brand-warn/10"
        : "border-brand-gr/30 bg-brand-gr/10";
  return (
    <div className={`rounded-xl border p-2 ${toneClasses}`}>
      <p className="text-[11px] font-semibold text-brand-text">{title}</p>
      {issues.length === 0 ? (
        <p className="mt-1 text-[11px] text-brand-sub">{emptyText}</p>
      ) : (
        <div className="mt-1 max-h-24 space-y-1 overflow-auto">
          {issues.map((issue, index) => (
            <div key={`${issue.file}-${index}`} className="text-[11px] text-brand-sub">
              <span className="font-code">{issue.file}</span>: {issue.issue}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
