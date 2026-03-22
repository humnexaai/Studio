import { notFound, redirect } from "next/navigation";
import { StudioLayout } from "@/components/studio/StudioLayout";
import { createSupabaseServer } from "@/lib/supabase/server";
import { normalizeProjectFiles } from "@/lib/studio/file-utils";
import type { ProjectFile } from "@/types/studio";

type Props = {
  params: { projectId: string };
};

export default async function StudioProjectPage({
  params,
}: Props): Promise<React.ReactElement> {
  const supabase = createSupabaseServer();
  type QueryResponse<T> = { data: T; error?: { message?: string } | null };
  type QueryBuilder<T> = {
    select: (columns: string) => QueryBuilder<T>;
    insert: (values: Record<string, unknown>) => QueryBuilder<T>;
    eq: (column: string, value: string) => QueryBuilder<T>;
    order: (
      column: string,
      options?: { ascending?: boolean },
    ) => QueryBuilder<T>;
    limit: (count: number) => QueryBuilder<T>;
    maybeSingle: () => Promise<QueryResponse<T | null>>;
    single: () => Promise<QueryResponse<T>>;
  };
  type DbClient = {
    from: <T = unknown>(table: string) => QueryBuilder<T>;
  };
  const db = supabase as unknown as DbClient;
  async function runQuery<T>(query: Promise<unknown>): Promise<QueryResponse<T>> {
    return (await query) as QueryResponse<T>;
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data: project } = await db
    .from<{
      id: string;
      name: string;
      framework: string;
      status: string;
      branch_name: string | null;
      deployed_url: string | null;
    }>(
      "projects",
    )
    .select("id,name,framework,status,branch_name,deployed_url")
    .eq("id", params.projectId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!project) {
    notFound();
  }

  const { data: fileRows } = await runQuery<
    Array<{ id: string; file_path: string; content: string; updated_at: string }>
  >(
    db
      .from<Array<{ id: string; file_path: string; content: string; updated_at: string }>>(
        "project_files",
      )
      .select("id,file_path,content,updated_at")
      .eq("project_id", project.id)
      .order("file_path", { ascending: true }) as unknown as Promise<unknown>,
  );
  const { data: conversation } = await db
    .from<{ id: string }>("conversations")
    .select("id")
    .eq("project_id", project.id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { data: versions } = await runQuery<
    Array<{ id: string; label: string; bookmarked: boolean; created_at: string }>
  >(
    db
      .from<Array<{ id: string; label: string; bookmarked: boolean; created_at: string }>>(
        "project_versions",
      )
      .select("id,label,bookmarked,created_at")
      .eq("project_id", project.id)
      .order("created_at", { ascending: false })
      .limit(20) as unknown as Promise<unknown>,
  );

  let conversationId = conversation?.id ?? null;
  if (!conversationId) {
    const { data: createdConversation } = await db
      .from<{ id: string }>("conversations")
      .insert({
        project_id: project.id,
        user_id: user.id,
        title: `Chat for ${project.name}`,
      })
      .select("id")
      .single();
    conversationId = createdConversation?.id ?? null;
  }

  const { data: messageRows } = conversationId
    ? await runQuery<
        Array<{
          id: string;
          role: string;
          content: string;
          code_diffs: unknown;
          credits_used: number;
          created_at: string;
        }>
      >(
        db
          .from<
            Array<{
              id: string;
              role: string;
              content: string;
              code_diffs: unknown;
              credits_used: number;
              created_at: string;
            }>
          >("messages")
          .select("id,role,content,code_diffs,credits_used,created_at")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true }) as unknown as Promise<unknown>,
      )
    : { data: [] as Array<{ id: string; role: string; content: string; code_diffs: unknown; credits_used: number; created_at: string }> };

  const initialFiles: ProjectFile[] = normalizeProjectFiles(fileRows ?? []);
  const initialVersions = (versions ?? []).map((version) => ({
    id: version.id,
    label: version.label,
    bookmarked: version.bookmarked,
    createdAt: new Date(version.created_at).toLocaleString("en-IN"),
  }));

  return (
    <main className="min-h-screen bg-brand-bg px-4 py-4 md:px-6">
      <StudioLayout
        projectId={project.id}
        initialProjectName={project.name}
        initialProjectMeta={{
          branchName: project.branch_name ?? null,
          deployedUrl: project.deployed_url ?? null,
        }}
        initialFiles={initialFiles}
        initialConversationId={conversationId}
        projectFramework={project.framework}
        initialMessages={
          (messageRows ?? []).map((row) => ({
            id: row.id,
            role: row.role === "assistant" ? "assistant" : "user",
            content: row.content,
            createdAt: row.created_at,
            diffs:
              Array.isArray(row.code_diffs)
                ? (row.code_diffs as Array<{
                    id?: string;
                    filePath?: string;
                    summary?: string;
                    before?: string;
                    after?: string;
                    securitySensitive?: boolean;
                  }>).map((diff, idx) => ({
                    id: diff.id ?? `${row.id}-${idx}`,
                    filePath: diff.filePath ?? "unknown",
                    summary: diff.summary ?? "Updated file",
                    before: diff.before ?? "",
                    after: diff.after ?? "",
                    securitySensitive: diff.securitySensitive,
                  }))
                : [],
            creditsUsed: row.credits_used,
            planMode: row.credits_used === 0 && row.role === "assistant",
            implementPrompt:
              row.credits_used === 0 && row.role === "assistant"
                ? "Implement this plan in build mode."
                : undefined,
          })) ?? []
        }
        initialVersions={initialVersions}
      />
    </main>
  );
}
