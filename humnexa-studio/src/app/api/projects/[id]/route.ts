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
  projectInstructions: z.string().max(10000).optional(),
  customDomain: z
    .string()
    .max(255)
    .regex(/^[a-zA-Z0-9.-]+$/)
    .optional(),
  isPublic: z.boolean().optional(),
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

    const updatePayload: Record<string, unknown> = {};
    if (validated.name !== undefined) updatePayload.name = validated.name;
    if (validated.status !== undefined) updatePayload.status = validated.status;
    if (validated.framework !== undefined) updatePayload.framework = validated.framework;
    if (validated.githubUrl !== undefined) updatePayload.github_url = validated.githubUrl;
    if (validated.deployedUrl !== undefined) updatePayload.deployed_url = validated.deployedUrl;
    if (validated.projectInstructions !== undefined) {
      updatePayload.project_instructions = validated.projectInstructions;
    }
    if (validated.customDomain !== undefined) {
      updatePayload.custom_domain = validated.customDomain || null;
    }
    if (validated.isPublic !== undefined) {
      updatePayload.is_public = validated.isPublic;
    }

    const { data, error } = await supabase
      .from("projects")
      .update(updatePayload)
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
