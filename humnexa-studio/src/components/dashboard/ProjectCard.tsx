import Link from "next/link";
import { useState } from "react";

type ProjectCardProps = {
  project: {
    id: string;
    name: string;
    status: string;
    framework: string;
    is_public?: boolean;
    updated_at?: string;
    updatedAt?: string;
  };
  onClone?: (projectId: string) => void;
};

export function ProjectCard({
  project,
  onClone,
}: ProjectCardProps): React.ReactElement {
  const [menuOpen, setMenuOpen] = useState(false);
  const updatedText = project.updatedAt
    ? `Updated ${project.updatedAt}`
    : project.updated_at
      ? `Updated ${new Date(project.updated_at).toLocaleString("en-IN")}`
      : null;

  return (
    <div className="rounded-2xl border border-brand-border bg-brand-card p-4 transition hover:border-brand-or">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs uppercase tracking-wide text-brand-sub">
          {project.status}
        </p>
        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="rounded-md border border-brand-border px-2 py-0.5 text-xs text-brand-sub"
        >
          ⋯
        </button>
      </div>
      {menuOpen ? (
        <div className="mt-2 rounded-lg border border-brand-border bg-brand-card2 p-1 text-xs">
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              onClone?.(project.id);
            }}
            className="block w-full rounded px-2 py-1 text-left text-brand-sub hover:bg-brand-card hover:text-brand-text"
          >
            Clone Project
          </button>
        </div>
      ) : null}
      <Link href={`/studio/${project.id}`} className="mt-2 block">
        <h3 className="text-lg font-semibold text-brand-text">
          {project.name}
        </h3>
        <p className="mt-1 text-sm text-brand-muted">{project.framework}</p>
        {project.is_public ? (
          <p className="mt-1 text-xs text-brand-gr">Public</p>
        ) : null}
        {updatedText ? (
          <p className="mt-2 text-xs text-brand-muted">{updatedText}</p>
        ) : null}
      </Link>
    </div>
  );
}
