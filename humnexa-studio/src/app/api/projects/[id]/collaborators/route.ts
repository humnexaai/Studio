import * as Sentry from "@sentry/nextjs";
import { z, ZodError } from "zod";
import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

const schema = z.object({
  email: z.string().email(),
  role: z.enum(["viewer", "editor"]).default("viewer"),
});

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
    const supabase = createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = schema.parse(await request.json());
    const normalizedEmail = payload.email.trim().toLowerCase();

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id,user_id,name")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id,email")
      .eq("email", normalizedEmail)
      .maybeSingle();

    const target = profile as { id?: string; email?: string | null } | null;
    if (!target?.id) {
      return NextResponse.json(
        {
          error:
            "No user account found for this email. Ask collaborator to sign up first.",
        },
        { status: 404 },
      );
    }

    const { error: insertError } = await supabase
      .from("project_collaborators")
      .upsert({
        project_id: params.id,
        user_id: target.id,
        role: payload.role,
        invited_by: user.id,
      })
      .select("id")
      .maybeSingle();

    if (insertError) {
      throw new Error(insertError.message ?? "Failed to invite collaborator");
    }

    return NextResponse.json({
      success: true,
      data: {
        projectId: params.id,
        invitedUserId: target.id,
        role: payload.role,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Validation failed" }, { status: 400 });
    }
    Sentry.captureException(error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to invite collaborator",
      },
      { status: 500 },
    );
  }
}
