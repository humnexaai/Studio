"use client";

import {
  Rocket,
  Eye,
  MessageSquare,
  Coins,
  Home,
  GitBranch,
  Pencil,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";
import { NotificationsBell } from "@/components/notifications/NotificationsBell";

type StudioNavbarProps = {
  userId: string;
  projectName: string;
  credits: number;
  statusText?: string;
  onDeploy?: () => void;
  onPush?: () => void;
  pushLoading?: boolean;
  pushedRepoUrl?: string | null;
  onProjectNameChange?: (value: string) => void;
  onToggleChat?: () => void;
  onTogglePreview?: () => void;
  onToggleVersions?: () => void;
  onPublishTemplate?: () => void;
  visualEditEnabled?: boolean;
  onToggleVisualEdit?: () => void;
};

export function StudioNavbar({
  userId,
  projectName,
  credits,
  statusText = "Ready to build",
  onDeploy,
  onPush,
  pushLoading = false,
  pushedRepoUrl,
  onProjectNameChange,
  onToggleChat,
  onTogglePreview,
  onToggleVersions,
  onPublishTemplate,
  visualEditEnabled = false,
  onToggleVisualEdit,
}: StudioNavbarProps): React.ReactElement {
  return (
    <header className="flex h-[52px] items-center gap-3 border-b border-brand-border bg-brand-surf px-3">
      <button className="rounded-lg p-1.5 text-brand-sub transition hover:bg-brand-card hover:text-brand-text">
        <Home className="h-4 w-4" />
      </button>
      <Logo compact />
      <input
        value={projectName}
        onChange={(event) => onProjectNameChange?.(event.target.value)}
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
        <NotificationsBell userId={userId} compact />
        <span className="inline-flex items-center gap-1 rounded-md border border-brand-border bg-brand-card px-2 py-1 text-xs text-brand-text">
          <Coins className="h-3.5 w-3.5 text-brand-or" />
          {credits}
        </span>
        <button
          type="button"
          onClick={onToggleChat}
          className="rounded-lg p-1.5 text-brand-sub transition hover:bg-brand-card hover:text-brand-text"
        >
          <MessageSquare className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onTogglePreview}
          className="rounded-lg p-1.5 text-brand-sub transition hover:bg-brand-card hover:text-brand-text"
        >
          <Eye className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onToggleVisualEdit}
          className={cn(
            "rounded-lg border px-2 py-1 text-xs transition",
            visualEditEnabled
              ? "border-brand-or bg-brand-or/20 text-brand-or"
              : "border-brand-border bg-brand-card text-brand-sub hover:text-brand-text",
          )}
          title="Visual edit mode"
        >
          <span className="inline-flex items-center gap-1">
            <Pencil className="h-3.5 w-3.5" />
            Edit Mode
          </span>
        </button>
        <button
          type="button"
          onClick={onToggleVersions}
          className="rounded-lg border border-brand-border bg-brand-card px-2 py-1 text-xs text-brand-sub transition hover:text-brand-text"
        >
          Versions
        </button>
        <button
          type="button"
          onClick={onPublishTemplate}
          className="rounded-lg border border-brand-border bg-brand-card px-2 py-1 text-xs text-brand-sub transition hover:text-brand-text"
        >
          Publish Template
        </button>
        <button
          type="button"
          onClick={onDeploy}
          className="inline-flex items-center gap-1 rounded-lg bg-brand-gradient px-3 py-1.5 text-sm font-semibold text-white"
        >
          <Rocket className="h-4 w-4" />
          Deploy
        </button>
        <button
          type="button"
          onClick={onPush}
          disabled={pushLoading}
          className="inline-flex items-center gap-1 rounded-lg border border-brand-border bg-brand-card px-3 py-1.5 text-sm font-semibold text-brand-text disabled:opacity-60"
        >
          {pushLoading ? "Pushing..." : "Push"}
        </button>
      </div>
      {pushedRepoUrl ? (
        <a
          href={pushedRepoUrl}
          target="_blank"
          rel="noreferrer"
          className="ml-2 max-w-[220px] truncate text-xs text-brand-gr underline"
        >
          {pushedRepoUrl}
        </a>
      ) : null}
    </header>
  );
}
