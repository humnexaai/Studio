import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { checkRateLimitByIp, getClientIpFromHeaders } from "@/lib/rate-limit";

export const preferredRegion = "bom1";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function POST(
  request: Request,
  { params }: RouteContext,
): Promise<NextResponse> {
  try {
    const ip = getClientIpFromHeaders(request.headers);
    const rate = checkRateLimitByIp(ip, 20, 60_000);
    if (!rate.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait before retrying", retryAfter: rate.retryAfter },
        { status: 429, headers: { "Retry-After": String(rate.retryAfter) } },
      );
    }

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
              maybeSingle: () => Promise<{
                data: Record<string, unknown> | null;
                error: { message?: string } | null;
              }>;
            };
            maybeSingle: () => Promise<{
              data: Record<string, unknown> | null;
              error: { message?: string } | null;
            }>;
          };
        };
        insert: (values: Record<string, unknown> | Array<Record<string, unknown>>) => {
          select: (columns: string) => {
            single: () => Promise<{
              data: Record<string, unknown> | null;
              error: { message?: string } | null;
            }>;
          };
        };
      };
    };

    const { data: ownedProject } = await db
      .from("projects")
      .select("id,user_id,name,framework,description,project_instructions,is_public")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .maybeSingle();

    let sourceProject = ownedProject;
    if (!sourceProject) {
      const { data: publicProject } = await db
        .from("projects")
        .select("id,user_id,name,framework,description,project_instructions,is_public")
        .eq("id", params.id)
        .maybeSingle();
      const typed = publicProject as { is_public?: boolean } | null;
      if (!typed?.is_public) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }
      sourceProject = publicProject;
    }

    const typedSource = sourceProject as {
      id: string;
      name?: string | null;
      framework?: string | null;
      description?: string | null;
      project_instructions?: string | null;
    };

    const { data: clonedProject, error: createError } = await db
      .from("projects")
      .insert({
        user_id: user.id,
        name: `${typedSource.name ?? "Project"} (Copy)`,
        framework: typedSource.framework ?? "nextjs",
        description: typedSource.description ?? null,
        status: "idle",
        project_instructions: typedSource.project_instructions ?? "",
        is_public: false,
      })
      .select("id,name,framework")
      .single();

    if (createError || !clonedProject) {
      throw new Error(createError?.message ?? "Failed to create cloned project");
    }

    const { data: sourceFiles, error: filesError } = await supabase
      .from("project_files")
      .select("file_path,content")
      .eq("project_id", typedSource.id)
      .order("file_path", { ascending: true });

    if (filesError) {
      throw new Error(filesError.message ?? "Failed to load source files");
    }

    if ((sourceFiles ?? []).length > 0) {
      const rows = (sourceFiles ?? []).map((file) => ({
        project_id: (clonedProject as { id: string }).id,
        file_path: file.file_path,
        content: file.content,
      }));
      const { error: insertFilesError } = await supabase.from("project_files").insert(rows);
      if (insertFilesError) {
        throw new Error(insertFilesError.message ?? "Failed to clone files");
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: (clonedProject as { id: string }).id,
        name: (clonedProject as { name?: string }).name,
        framework: (clonedProject as { framework?: string }).framework,
      },
    });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to clone project",
      },
      { status: 500 },
    );
  }
}
