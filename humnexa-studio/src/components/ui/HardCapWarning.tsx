"use client";

type HardCapWarningProps = {
  show: boolean;
};

export function HardCapWarning({ show }: HardCapWarningProps): React.ReactElement | null {
  if (!show) return null;

  return (
    <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
      Monthly hard cap reached. AI generation is blocked until your cycle resets or you
      upgrade your plan.
    </div>
  );
}
