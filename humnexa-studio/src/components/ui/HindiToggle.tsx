"use client";

import { useUserStore } from "@/store/userStore";
import { cn } from "@/lib/utils";

export function HindiToggle(): React.ReactElement {
  const hindiMode = useUserStore((s) => s.hindiMode);
  const setHindiMode = useUserStore((s) => s.setHindiMode);

  return (
    <button
      type="button"
      onClick={() => setHindiMode(!hindiMode)}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-semibold transition",
        hindiMode
          ? "border-brand-gr bg-brand-gr/10 text-brand-gr"
          : "border-brand-border bg-brand-card2 text-brand-sub"
      )}
    >
      {hindiMode ? "हिंदी" : "English"}
    </button>
  );
}
