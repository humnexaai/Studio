import { z, ZodError } from "zod";
import * as Sentry from "@sentry/nextjs";
import { createSupabaseServer } from "@/lib/supabase/server";

const restoreSchema = z.object({
  versionId: z.string().uuid(),
});

type RouteParams = {
  params: {
    id: string;
  };
};

export async function GET(_: Request, { params }: RouteParams): Promise<Response> {
  try {
    const supabase = createSupabaseServer();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();
    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("project_versions")
      .select("id,label,bookmarked,created_at")
      .eq("project_id", params.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      throw error;
    }

    return Response.json({ success: true, data: data ?? [] });
  } catch (error) {
    Sentry.captureException(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: RouteParams): Promise<Response> {
  try {
    const supabase = createSupabaseServer();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = restoreSchema.parse(await req.json());

    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();
    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    const { data: version, error: versionError } = await supabase
      .from("project_versions")
      .select("id,snapshot")
      .eq("id", body.versionId)
      .eq("project_id", params.id)
      .single();
    if (versionError || !version) {
      return Response.json({ error: "Version not found" }, { status: 404 });
    }

    const snapshot = version.snapshot as Array<{ path: string; content: string }>;
    if (!Array.isArray(snapshot)) {
      return Response.json({ error: "Invalid snapshot format" }, { status: 400 });
    }

    await supabase.from("project_files").delete().eq("project_id", params.id);
    const rows = snapshot.map((file) => ({
      project_id: params.id,
      file_path: file.path,
      content: file.content,
    }));
    if (rows.length > 0) {
      const { error } = await supabase.from("project_files").insert(rows);
      if (error) {
        throw error;
      }
    }

    return Response.json({ success: true, data: { restored: true } });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: "Validation failed" }, { status: 400 });
    }
    Sentry.captureException(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
