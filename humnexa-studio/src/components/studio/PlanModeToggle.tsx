"use client";

type PlanModeToggleProps = {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
};

export function PlanModeToggle({
  enabled,
  onChange,
}: PlanModeToggleProps): React.ReactElement {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`rounded-lg border px-3 py-1 text-xs font-semibold ${
        enabled
          ? "border-brand-gr bg-brand-gr/20 text-brand-gr"
          : "border-brand-border bg-brand-card2 text-brand-sub"
      }`}
    >
      {enabled ? "Plan Mode (0 credits)" : "Build Mode"}
    </button>
  );
}
