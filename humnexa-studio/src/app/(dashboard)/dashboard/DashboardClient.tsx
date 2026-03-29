"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { ProjectCard } from "@/components/dashboard/ProjectCard";

type ProjectRow = {
  id: string;
  name: string;
  framework: string;
  status: string;
  updated_at: string;
  is_public?: boolean;
};

type TransactionRow = {
  id: string;
  amount: number;
  type: "usage" | "purchase" | "refund" | "bonus";
  reason: string | null;
  created_at: string;
};

type DashboardClientProps = {
  userName: string;
  creditsBalance: number;
  projects: ProjectRow[];
  transactions: TransactionRow[];
};

type FrameworkOption =
  | "nextjs"
  | "react"
  | "vue"
  | "python"
  | "flutter"
  | "react-native";

const frameworkDisplayNames: Record<FrameworkOption, string> = {
  nextjs: "Next.js",
  react: "React",
  vue: "Vue",
  python: "Python",
  flutter: "Flutter",
  "react-native": "React Native (Expo)",
};

export default function DashboardClient({
  userName,
  creditsBalance,
  projects,
  transactions,
}: DashboardClientProps): React.ReactElement {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [framework, setFramework] = useState<FrameworkOption>("nextjs");
  const [error, setError] = useState<string | null>(null);

  const activityItems = useMemo(
    () =>
      transactions.map((item) => ({
        id: item.id,
        title: `${item.type.toUpperCase()} ${item.amount > 0 ? "+" : ""}${item.amount} credits${item.reason ? ` — ${item.reason}` : ""}`,
        time: new Date(item.created_at).toLocaleString("en-IN"),
        type: item.type,
      })),
    [transactions],
  );

  const createProject = async (): Promise<void> => {
    if (!projectName.trim()) {
      setError("Project name is required.");
      return;
    }
    setError(null);
    setCreating(true);

    const response = await fetch("/api/projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: projectName.trim(),
        framework,
      }),
    });

    const payload = (await response.json()) as {
      error?: string;
      data?: { id?: string };
    };

    if (!response.ok || !payload.data?.id) {
      setError(payload.error ?? "Failed to create project");
      setCreating(false);
      return;
    }

    router.push(`/studio/${payload.data.id}`);
    router.refresh();
  };

  const cloneProject = async (projectId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/projects/${projectId}/clone`, {
        method: "POST",
      });
      const payload = (await response.json()) as {
        error?: string;
        data?: { id?: string };
      };
      if (!response.ok || !payload.data?.id) {
        throw new Error(payload.error ?? "Failed to clone project");
      }
      router.push(`/studio/${payload.data.id}`);
      router.refresh();
    } catch (cloneError) {
      setError(cloneError instanceof Error ? cloneError.message : "Failed to clone project");
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-display font-extrabold">
            Good morning, {userName || "Builder"} 👋
          </h1>
          <p className="mt-1 text-brand-sub">
            Ship faster with AI-first full-stack workflows.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-xl bg-brand-gradient px-4 py-2 text-sm font-semibold text-white"
        >
          New Project
        </button>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Projects" value={String(projects.length)} />
        <StatCard
          label="Deployed"
          value={String(projects.filter((p) => p.status === "deployed").length)}
        />
        <StatCard label="Credits" value={String(creditsBalance)} />
        <StatCard label="API calls" value={String(transactions.length)} />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Your Projects</h2>
        {projects.length === 0 ? (
          <div className="rounded-2xl border border-brand-border bg-brand-card p-6 text-center">
            <p className="text-brand-sub">No projects yet.</p>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="mt-3 rounded-lg bg-brand-gradient px-4 py-2 text-sm font-semibold text-white"
            >
              Create your first project
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={{
                  id: project.id,
                  name: project.name,
                  framework: project.framework,
                  status: project.status,
                  is_public: Boolean(project.is_public),
                  updatedAt: new Date(project.updated_at).toLocaleString("en-IN"),
                }}
                onClone={() => {
                  void cloneProject(project.id);
                }}
              />
            ))}
          </div>
        )}
      </section>

      <ActivityFeed items={activityItems} />

      {open ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-brand-border bg-brand-card p-5">
            <h3 className="text-lg font-semibold">Create project</h3>
            <div className="mt-4 space-y-3">
              <input
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
                placeholder="Project name"
                className="w-full rounded-xl border border-brand-border bg-brand-card2 px-3 py-2 text-sm outline-none"
              />
              <select
                value={framework}
                onChange={(event) =>
                  setFramework(event.target.value as FrameworkOption)
                }
                className="w-full rounded-xl border border-brand-border bg-brand-card2 px-3 py-2 text-sm outline-none"
              >
                {(Object.keys(frameworkDisplayNames) as FrameworkOption[]).map(
                  (value) => (
                    <option key={value} value={value}>
                      {frameworkDisplayNames[value]}
                    </option>
                  ),
                )}
              </select>
              {error ? <p className="text-sm text-brand-error">{error}</p> : null}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-sub"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void createProject()}
                disabled={creating}
                className="rounded-lg bg-brand-gradient px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {creating ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
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
