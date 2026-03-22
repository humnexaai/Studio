"use client";

type VisualEditOverlayProps = {
  enabled: boolean;
};

export function VisualEditOverlay({
  enabled,
}: VisualEditOverlayProps): React.ReactElement | null {
  if (!enabled) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 border-2 border-dashed border-brand-info/60" />
  );
}
