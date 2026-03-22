"use client";

import { useEffect, useState } from "react";
import { cn, formatCredits } from "@/lib/utils";
import { supabase } from "@/lib/supabase/client";

type CreditBarProps = {
  userId?: string;
  balance: number;
  cap: number;
  className?: string;
};

export function CreditBar({
  userId,
  balance,
  cap,
  className,
}: CreditBarProps): React.ReactElement {
  const [liveBalance, setLiveBalance] = useState(balance);

  useEffect(() => {
    setLiveBalance(balance);
  }, [balance]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`credits-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          const next = payload.new as { credits_balance?: number };
          if (typeof next.credits_balance === "number") {
            setLiveBalance(next.credits_balance);
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  const percent = Math.max(0, Math.min(100, (liveBalance / Math.max(cap, 1)) * 100));

  return (
    <div className={cn("rounded-xl border border-brand-border bg-brand-card p-3", className)}>
      <div className="mb-2 flex items-center justify-between text-xs text-brand-sub">
        <span>Credits</span>
        <span>
          {formatCredits(liveBalance)} / {formatCredits(cap)}
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
