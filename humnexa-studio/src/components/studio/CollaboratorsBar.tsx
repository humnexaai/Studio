"use client";

import type { CollaboratorPresence } from "@/lib/collaboration/presence";

type CollaboratorsBarProps = {
  collaborators: CollaboratorPresence[];
};

const ringClasses = [
  "ring-red-400",
  "ring-orange-400",
  "ring-amber-400",
  "ring-green-400",
  "ring-teal-400",
  "ring-cyan-400",
  "ring-blue-400",
  "ring-violet-400",
  "ring-fuchsia-400",
  "ring-pink-400",
];

function initials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (parts.length === 0) return "U";
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

export function CollaboratorsBar({
  collaborators,
}: CollaboratorsBarProps): React.ReactElement {
  const visible = collaborators.slice(0, 5);
  const hiddenCount = Math.max(0, collaborators.length - visible.length);

  return (
    <div className="inline-flex items-center gap-2">
      <span className="text-xs text-brand-sub">
        {collaborators.length} collaborator{collaborators.length === 1 ? "" : "s"}
      </span>
      <div className="flex items-center -space-x-2">
        {visible.map((collaborator, index) => (
          <div
            key={collaborator.userId}
            title={`${collaborator.name} • ${collaborator.activeFile ?? "No file selected"}`}
            className={`inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-card2 text-[10px] font-semibold text-brand-text ring-2 ring-offset-1 ring-offset-brand-bg ${ringClasses[index % ringClasses.length]}`}
          >
            {collaborator.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={collaborator.avatarUrl}
                alt={collaborator.name}
                loading="lazy"
                className="h-7 w-7 rounded-full object-cover"
              />
            ) : (
              initials(collaborator.name)
            )}
          </div>
        ))}
        {hiddenCount > 0 ? (
          <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-card2 text-[10px] font-semibold text-brand-sub ring-2 ring-brand-border ring-offset-1 ring-offset-brand-bg">
            +{hiddenCount}
          </div>
        ) : null}
      </div>
    </div>
  );
}
