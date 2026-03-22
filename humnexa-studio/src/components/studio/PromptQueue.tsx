"use client";

import { Clock3 } from "lucide-react";
import { useStudioStore } from "@/store/studioStore";
import type { QueueItem } from "@/types/studio";

export function PromptQueue(): React.ReactElement | null {
  const queue = useStudioStore((state) => state.queue);

  if (queue.length === 0) return null;

  return (
    <div className="mb-3 rounded-xl border border-brand-border bg-brand-card2 p-3">
      <p className="mb-2 inline-flex items-center gap-2 text-xs text-brand-sub">
        <Clock3 className="h-3.5 w-3.5" />
        Prompt queue
      </p>
      <div className="space-y-2">
        {queue.map((item: QueueItem) => (
          <div
            key={item.id}
            className="rounded-lg border border-brand-border/70 bg-brand-card px-3 py-2 text-sm"
          >
            <p className="line-clamp-1">{item.prompt}</p>
            <p className="text-xs text-brand-muted">~{item.estimatedCost} credits</p>
          </div>
        ))}
      </div>
    </div>
  );
}
