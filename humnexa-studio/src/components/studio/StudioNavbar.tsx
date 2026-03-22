"use client";

import { Rocket, Eye, MessageSquare, Coins, Home, GitBranch } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

type StudioNavbarProps = {
  projectName: string;
  credits: number;
  statusText?: string;
  onDeploy?: () => void;
};

export function StudioNavbar({
  projectName,
  credits,
  statusText = "Ready to build",
  onDeploy,
}: StudioNavbarProps): React.ReactElement {
  return (
    <header className="flex h-[52px] items-center gap-3 border-b border-brand-border bg-brand-surf px-3">
      <button className="rounded-lg p-1.5 text-brand-sub transition hover:bg-brand-card hover:text-brand-text">
        <Home className="h-4 w-4" />
      </button>
      <Logo compact />
      <input
        defaultValue={projectName}
        className={cn(
          "max-w-[260px] rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm",
          "outline-none transition focus:border-brand-border focus:bg-brand-card2",
        )}
      />
      <span className="inline-flex items-center gap-1 rounded-md border border-brand-border bg-brand-card px-2 py-1 text-xs text-brand-sub">
        <GitBranch className="h-3.5 w-3.5" />
        main
      </span>
      <div className="mx-auto text-xs text-brand-sub">{statusText}</div>
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-md border border-brand-border bg-brand-card px-2 py-1 text-xs text-brand-text">
          <Coins className="h-3.5 w-3.5 text-brand-or" />
          {credits}
        </span>
        <button className="rounded-lg p-1.5 text-brand-sub transition hover:bg-brand-card hover:text-brand-text">
          <MessageSquare className="h-4 w-4" />
        </button>
        <button className="rounded-lg p-1.5 text-brand-sub transition hover:bg-brand-card hover:text-brand-text">
          <Eye className="h-4 w-4" />
        </button>
        <button
          onClick={onDeploy}
          className="inline-flex items-center gap-1 rounded-lg bg-brand-gradient px-3 py-1.5 text-sm font-semibold text-white"
        >
          <Rocket className="h-4 w-4" />
          Deploy
        </button>
      </div>
    </header>
  );
}
