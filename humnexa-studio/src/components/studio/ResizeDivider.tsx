"use client";

import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

type ResizeDividerProps = {
  dragging?: boolean;
};

export function ResizeDivider({
  dragging = false,
}: ResizeDividerProps): React.ReactElement {
  return (
    <div
      className={cn(
        "group relative w-1.5 cursor-col-resize rounded-full bg-brand-border transition",
        dragging && "bg-brand-or shadow-[0_0_20px_rgba(255,107,44,0.55)]"
      )}
    >
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-brand-muted transition group-hover:text-brand-or">
        <GripVertical className="h-4 w-4" />
      </div>
    </div>
  );
}
