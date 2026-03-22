import Link from "next/link";

type ProjectCardProps = {
  project: {
    id: string;
    name: string;
    status: string;
    framework: string;
    updatedAt?: string;
  };
};

export function ProjectCard({ project }: ProjectCardProps): React.ReactElement {
  return (
    <Link
      href={`/studio/${project.id}`}
      className="block rounded-2xl border border-brand-border bg-brand-card p-4 transition hover:border-brand-or"
    >
      <p className="text-xs uppercase tracking-wide text-brand-sub">
        {project.status}
      </p>
      <h3 className="mt-2 text-lg font-semibold text-brand-text">
        {project.name}
      </h3>
      <p className="mt-1 text-sm text-brand-muted">{project.framework}</p>
      {project.updatedAt ? (
        <p className="mt-2 text-xs text-brand-muted">Updated {project.updatedAt}</p>
      ) : null}
    </Link>
  );
}
