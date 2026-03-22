"use client";

import { RotateCcw, Star } from "lucide-react";

const versions = Array.from({ length: 6 }).map((_, index) => ({
  id: `v-${index + 1}`,
  label: `Version #${index + 1}`,
  createdAt: `${index + 1}h ago`,
  bookmarked: index === 1,
}));

export function VersionHistory(): React.ReactElement {
  return (
    <aside className="h-full w-80 overflow-y-auto border-r border-brand-border bg-brand-card p-3">
      <h3 className="mb-3 text-sm font-semibold text-brand-text">Version History</h3>
      <div className="space-y-2">
        {versions.map((item) => (
          <div
            key={item.id}
            className="rounded-lg border border-brand-border bg-brand-card2 p-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-brand-text">{item.label}</p>
              <button className="text-brand-sub transition hover:text-brand-text">
                <Star
                  className={`h-4 w-4 ${item.bookmarked ? "fill-brand-or text-brand-or" : ""}`}
                />
              </button>
            </div>
            <p className="mt-1 text-xs text-brand-muted">{item.createdAt}</p>
            <button className="mt-2 inline-flex items-center gap-1 text-xs text-brand-gr">
              <RotateCcw className="h-3.5 w-3.5" />
              Restore
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}
