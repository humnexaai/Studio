import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import * as Sentry from "@sentry/nextjs";
import { createSupabaseServer } from "@/lib/supabase/server";

const publishTemplateSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().min(8).max(600),
  category: z.string().min(2).max(40),
  price_inr: z.number().min(0).max(1_000_000).default(0),
  tags: z.array(z.string().min(1).max(40)).max(20).default([]),
  is_india_specific: z.boolean().default(false),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  try {
    const supabase = createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = publishTemplateSchema.parse(await req.json());

    const dbReader = supabase as unknown as {
      from: (table: string) => {
        select: (columns: string) => {
          eq: (column: string, value: string) => {
            maybeSingle: () => Promise<{
              data: { id: string; user_id: string; framework?: string | null } | null;
              error: { message?: string } | null;
            }>;
          };
        };
      };
    };
    const dbWriter = supabase as unknown as {
      from: (table: string) => {
        insert: (values: Record<string, unknown>) => Promise<{
          data?: Array<{ id: string }>;
          error: { message?: string } | null;
        }>;
      };
    };

    const { data: project, error: projectError } = await dbReader
      .from("projects")
      .select("id,user_id,framework")
      .eq("id", params.id)
      .maybeSingle();

    if (projectError) {
      throw new Error(projectError.message ?? "Failed to load project");
    }
    if (!project || project.user_id !== user.id) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const tags = payload.tags
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 20);

    const slug = payload.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 64) || `template-${Date.now()}`;

    const baseRow = {
      slug,
      title: payload.name,
      category: payload.category,
      description: payload.description,
      price_inr: payload.price_inr,
      metadata: {
        tags,
        framework: project.framework ?? "nextjs",
        creator_id: user.id,
        source_project_id: project.id,
        is_india_specific: payload.is_india_specific,
        rating: 0,
      },
    };

    const extendedRow = {
      ...baseRow,
      creator_id: user.id,
      source_project_id: project.id,
      tags,
      is_india_specific: payload.is_india_specific,
      is_active: false,
      downloads: 0,
      framework: project.framework ?? "nextjs",
      rating: 0,
    };

    const firstInsert = await dbWriter.from("templates").insert(extendedRow);
    if (!firstInsert.error) {
      return NextResponse.json({
        success: true,
        message:
          "Template submitted for review. It will appear in marketplace within 24 hours.",
      });
    }

    // Fallback for schemas where templates table only has metadata fields.
    const fallbackInsert = await dbWriter.from("templates").insert(baseRow);
    if (fallbackInsert.error) {
      throw new Error(fallbackInsert.error.message ?? "Failed to publish template");
    }

    return NextResponse.json({
      success: true,
      message:
        "Template submitted for review. It will appear in marketplace within 24 hours.",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }
    Sentry.captureException(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
