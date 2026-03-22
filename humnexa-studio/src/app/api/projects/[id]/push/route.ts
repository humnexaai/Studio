import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createRepo, pushFiles } from "@/lib/github/push";

type Ctx = {
  params: {
    id: string;
  };
};

export async function POST(
  _request: Request,
  { params }: Ctx,
): Promise<NextResponse> {
  try {
    const supabase = createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = supabase as unknown as {
      from: (table: string) => {
        select: (columns: string) => {
          eq: (column: string, value: string) => {
            eq: (column2: string, value2: string) => {
              single: () => Promise<{
                data: {
                  id: string;
                  name: string;
                  github_url: string | null;
                  github_full_name?: string | null;
                } | null;
                error: { message?: string } | null;
              }>;
            };
          };
        };
        update: (values: Record<string, unknown>) => {
          eq: (column: string, value: string) => Promise<unknown>;
        };
      };
    };

    const { data: project, error: projectError } = await db
      .from("projects")
      .select("id,name,github_url,github_full_name")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const filesResult = (await (supabase as unknown as {
      from: (table: string) => {
        select: (columns: string) => {
          eq: (column: string, value: string) => Promise<{
            data:
              | Array<{
                  file_path: string;
                  content: string;
                }>
              | null;
            error: { message?: string } | null;
          }>;
        };
      };
    })
      .from("project_files")
      .select("file_path,content")
      .eq("project_id", project.id)) as {
      data: Array<{ file_path: string; content: string }> | null;
      error: { message?: string } | null;
    };

    if (filesResult.error) {
      return NextResponse.json(
        { error: filesResult.error.message ?? "Unable to load project files" },
        { status: 400 },
      );
    }

    const files = (filesResult.data ?? []).map((f) => ({
      path: f.file_path,
      content: f.content,
    }));

    let repoUrl = project.github_url ?? "";
    let fullName = project.github_full_name ?? "";

    if (!repoUrl || !fullName) {
      const repoName = project.name
        .toLowerCase()
        .replace(/[^a-z0-9-_]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80);
      const created = await createRepo(repoName || `humnexa-${project.id.slice(0, 8)}`);
      repoUrl = created.html_url;
      fullName = created.full_name;

      await db.from("projects").update({
        github_url: repoUrl,
        github_full_name: fullName,
      }).eq("id", project.id);
    }

    const [owner, repo] = fullName.split("/");
    if (!owner || !repo) {
      return NextResponse.json(
        { error: "Invalid GitHub repository name" },
        { status: 400 },
      );
    }

    await pushFiles({
      owner,
      repo,
      files,
      message: `chore: sync files for project ${project.name}`,
    });

    return NextResponse.json({
      success: true,
      repoUrl,
      fullName,
      pushedFiles: files.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "GitHub push failed unexpectedly",
      },
      { status: 500 },
    );
  }
}
