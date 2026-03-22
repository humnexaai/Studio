"use client";

import { useMemo } from "react";

const steps = ["Build", "Optimize", "Deploy to Edge", "SSL", "Domain"];

export function DeployModal({
  open,
  progress,
  logs,
  onClose,
}: {
  open: boolean;
  progress: number;
  logs: string[];
  onClose: () => void;
}): React.ReactElement | null {
  const activeStep = useMemo(
    () => Math.min(Math.floor(progress / 20), steps.length - 1),
    [progress],
  );

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-brand-border bg-brand-card p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl font-extrabold">Deploying</h3>
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
        <p className="mt-2 text-sm text-brand-sub">{progress}% complete</p>
        <div className="mt-4 grid gap-2 md:grid-cols-5">
          {steps.map((step, i) => (
            <div
              key={step}
              className={`rounded-lg border px-2 py-1 text-center text-xs ${
                i <= activeStep
                  ? "border-brand-or bg-brand-or/15 text-brand-text"
                  : "border-brand-border text-brand-sub"
              }`}
            >
              {step}
            </div>
          ))}
        </div>
        <div className="mt-4 max-h-48 overflow-auto rounded-xl border border-brand-border bg-brand-card2 p-3 font-code text-xs text-brand-sub">
          {logs.map((log, i) => (
            <p key={`${log}-${i}`}>{log}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
