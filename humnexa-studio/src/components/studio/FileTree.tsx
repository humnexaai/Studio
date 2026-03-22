"use client";

import { File, Folder, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileTreeProps {
  files: string[];
  activeFile: string;
  onSelect: (path: string) => void;
}

export function FileTree({
  files,
  activeFile,
  onSelect,
}: FileTreeProps): React.ReactElement {
  return (
    <aside className="h-full border-r border-brand-border bg-brand-surf p-3">
      <div className="mb-3 flex items-center justify-between">
        <div className="inline-flex items-center gap-2 text-sm font-medium text-brand-sub">
          <Folder className="h-4 w-4" />
          Files
        </div>
        <button className="rounded-md p-1 text-brand-muted hover:bg-brand-card2 hover:text-brand-text">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-1">
        {files.map((path) => (
          <button
            key={path}
            onClick={() => onSelect(path)}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm",
              activeFile === path
                ? "bg-brand-or/20 text-brand-or"
                : "text-brand-sub hover:bg-brand-card hover:text-brand-text",
            )}
          >
            <File className="h-4 w-4" />
            <span className="truncate font-code">{path}</span>
          </button>
        ))}
      </div>
      <div className="mt-4 border-t border-brand-border pt-3 text-xs text-brand-muted">
        ● 5 changes | Push →
      </div>
    </aside>
  );
}
