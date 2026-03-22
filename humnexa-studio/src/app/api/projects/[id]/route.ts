import { z } from "zod";
import { NextRequest } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createSupabaseServer } from "@/lib/supabase/server";

const updateSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  status: z.enum(["idle", "building", "failed", "ready"]).optional(),
  framework: z.string().min(2).max(40).optional(),
  githubUrl: z.string().url().optional(),
  deployedUrl: z.string().url().optional(),
});

type Ctx = { params: { id: string } };

export async function GET(_: NextRequest, { params }: Ctx): Promise<Response> {
  try {
    const supabase = createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();

    if (error) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    return Response.json({ success: true, data });
  } catch (error) {
    Sentry.captureException(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Ctx): Promise<Response> {
  try {
    const supabase = createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = updateSchema.parse(body);

    const { data, error } = await supabase
      .from("projects")
      .update({
        name: validated.name,
        status: validated.status,
        framework: validated.framework,
        github_url: validated.githubUrl,
        deployed_url: validated.deployedUrl,
      })
      .eq("id", params.id)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error) {
      return Response.json({ error: "Update failed" }, { status: 400 });
    }

    return Response.json({ success: true, data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Validation failed" }, { status: 400 });
    }
    Sentry.captureException(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: Ctx): Promise<Response> {
  try {
    const supabase = createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", params.id)
      .eq("user_id", user.id);

    if (error) {
      return Response.json({ error: "Delete failed" }, { status: 400 });
    }

    return Response.json({ success: true, data: { id: params.id } });
  } catch (error) {
    Sentry.captureException(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
