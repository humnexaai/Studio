import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";

type Props = {
  params: {
    projectId: string;
  };
};

export const metadata: Metadata = {
  title: "Public Project",
};

export default async function PublicProjectPage({
  params,
}: Props): Promise<React.ReactElement> {
  const supabase = createSupabaseServer();
  await supabase.auth.getUser();

  const { data: project } = await supabase
    .from("projects")
    .select("id,name,framework,is_public,user_id,created_at,project_instructions")
    .eq("id", params.projectId)
    .maybeSingle();

  const typedProject = project as
    | {
        id: string;
        name: string;
        framework: string;
        is_public?: boolean;
        user_id: string;
        created_at: string;
        project_instructions?: string | null;
      }
    | null;

  if (!typedProject || !typedProject.is_public) {
    notFound();
  }

  const { data: fileRows } = await supabase
    .from("project_files")
    .select("file_path,content")
    .eq("project_id", typedProject.id)
    .order("file_path", { ascending: true })
    .limit(200);

  const files = (fileRows ??
    []) as Array<{ file_path: string; content: string }>;

  const firstPreview = files
    .slice(0, 8)
    .map((row) => `// ${row.file_path}\n${row.content.slice(0, 200)}`)
    .join("\n\n");

  function getAppOrigin(): string {
    const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
    if (configured) {
      return configured.replace(/\/$/, "");
    }
    const requestHeaders = headers();
    const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
    const proto = requestHeaders.get("x-forwarded-proto") ?? "https";
    if (!host) {
      throw new Error("Unable to determine application host");
    }
    return `${proto}://${host}`;
  }

  async function remixProject(): Promise<void> {
    "use server";
    const requestHeaders = headers();
    const response = await fetch(`${getAppOrigin()}/api/projects/${params.projectId}/clone`, {
      method: "POST",
      headers: {
        cookie: requestHeaders.get("cookie") ?? "",
      },
      cache: "no-store",
    });
    const payload = (await response.json()) as { data?: { id?: string } };
    if (!response.ok || !payload.data?.id) {
      redirect("/dashboard");
    }
    redirect(`/studio/${payload.data.id}`);
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <header className="rounded-2xl border border-brand-border bg-brand-card p-5">
        <p className="text-xs uppercase tracking-wide text-brand-sub">Public Project</p>
        <h1 className="mt-2 text-2xl font-semibold">{typedProject.name}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-brand-sub">
          <span className="rounded bg-brand-card2 px-2 py-1">{typedProject.framework}</span>
          <span className="rounded bg-brand-card2 px-2 py-1">
            {new Date(typedProject.created_at).toLocaleDateString("en-IN")}
          </span>
        </div>
      </header>

      <section className="rounded-2xl border border-brand-border bg-brand-card p-5">
        <h2 className="text-lg font-semibold">Read-only Preview</h2>
        <p className="mt-1 text-sm text-brand-sub">
          This is a public read-only view. Use remix to clone into your workspace.
        </p>
        <pre className="mt-4 max-h-[460px] overflow-auto rounded-xl border border-brand-border bg-brand-bg p-3 text-xs text-brand-sub">
          {firstPreview || "// No files available"}
        </pre>
      </section>

      <div className="flex items-center justify-between rounded-2xl border border-brand-border bg-brand-card p-4">
        <Link
          href="/marketplace"
          className="rounded-lg border border-brand-border bg-brand-card2 px-3 py-2 text-sm text-brand-sub"
        >
          Back to Marketplace
        </Link>
        <form action={remixProject}>
          <button
            type="submit"
            className="rounded-lg bg-brand-gradient px-4 py-2 text-sm font-semibold text-white"
          >
            Remix this project
          </button>
        </form>
      </div>
    </main>
  );
}
