import type { Metadata } from "next";
import { redirect } from "next/navigation";
import ArenaClient from "./ArenaClient";
import { createSupabaseServer } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Arena Mode",
};

type Props = {
  params: { projectId: string };
};

export default async function ArenaPage({ params }: Props): Promise<React.ReactElement> {
  const supabase = createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data: project } = await supabase
    .from("projects")
    .select("id,name,framework")
    .eq("id", params.projectId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!project) {
    redirect(`/studio/${params.projectId}`);
  }

  const { data: fileRows } = await supabase
    .from("project_files")
    .select("file_path,content")
    .eq("project_id", params.projectId)
    .order("file_path", { ascending: true });

  const currentFiles = (fileRows ?? []).map((row) => ({
    path: row.file_path,
    content: row.content,
  }));

  const typedProject = project as { id: string; name?: string | null; framework?: string | null };

  return (
    <ArenaClient
      projectId={typedProject.id}
      projectName={typedProject.name ?? "Project"}
      framework={typedProject.framework ?? "nextjs"}
      currentFiles={currentFiles}
    />
  );
}
