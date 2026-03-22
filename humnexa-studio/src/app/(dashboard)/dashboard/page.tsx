import Link from "next/link";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { ProjectCard } from "@/components/dashboard/ProjectCard";

const projects = [
  { id: "p1", name: "Bharat Billing", status: "ready", framework: "Next.js", updatedAt: "2h ago" },
  { id: "p2", name: "TutorFlow", status: "building", framework: "React", updatedAt: "20m ago" },
  { id: "p3", name: "News Hub", status: "idle", framework: "Vue", updatedAt: "1d ago" },
];

const activities = [
  { id: "a1", title: "Generated checkout flow", time: "10 mins ago", type: "build" as const },
  { id: "a2", title: "Deployed v1", time: "2 hours ago", type: "deploy" as const },
  { id: "a3", title: "Bought Starter plan", time: "Yesterday", type: "billing" as const },
];

export default function DashboardPage(): React.ReactElement {
  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-display font-extrabold">Good morning, Builder 👋</h1>
          <p className="mt-1 text-brand-sub">Ship faster with AI-first full-stack workflows.</p>
        </div>
        <Link
          href="/studio/new"
          className="rounded-xl bg-brand-gradient px-4 py-2 text-sm font-semibold text-white"
        >
          New Project
        </Link>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Projects" value="12" />
        <StatCard label="Deployed" value="7" />
        <StatCard label="Credits" value="847" />
        <StatCard label="API Calls" value="2,942" />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </section>

      <ActivityFeed items={activities} />
    </div>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}): React.ReactElement {
  return (
    <div className="rounded-2xl border border-brand-border bg-brand-card p-4">
      <p className="text-sm text-brand-sub">{label}</p>
      <p className="mt-2 text-3xl font-display font-bold">{value}</p>
    </div>
  );
}
