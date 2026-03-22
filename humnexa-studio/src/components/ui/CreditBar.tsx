"use client";

import { cn, formatCredits } from "@/lib/utils";

type CreditBarProps = {
  balance: number;
  cap: number;
  className?: string;
};

export function CreditBar({
  balance,
  cap,
  className,
}: CreditBarProps): React.ReactElement {
  const percent = Math.max(0, Math.min(100, (balance / Math.max(cap, 1)) * 100));

  return (
    <div className={cn("rounded-xl border border-brand-border bg-brand-card p-3", className)}>
      <div className="mb-2 flex items-center justify-between text-xs text-brand-sub">
        <span>Credits</span>
        <span>
          {formatCredits(balance)} / {formatCredits(cap)}
        </span>
      </div>
      <div className="h-2 rounded-full bg-brand-card2">
        <div
          className="h-full rounded-full bg-brand-gradient transition-all duration-300 ease-brand"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
