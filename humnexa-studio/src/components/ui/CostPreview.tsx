"use client";

type CostPreviewProps = {
  estimatedCredits: number;
};

export function CostPreview({
  estimatedCredits,
}: CostPreviewProps): React.ReactElement {
  return (
    <p className="rounded-lg border border-brand-border bg-brand-card2 px-2 py-1 text-xs text-brand-sub">
      ~{estimatedCredits} credits
    </p>
  );
}
