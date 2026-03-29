import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServer } from "@/lib/supabase/server";

const requestSchema = z.object({
  domain: z
    .string()
    .trim()
    .min(3)
    .max(255)
    .regex(/^[a-zA-Z0-9.-]+$/, "Invalid domain"),
  verify: z.boolean().optional(),
});

type RouteContext = {
  params: {
    id: string;
  };
};

async function verifyDomainOnVercel(
  vercelProjectId: string,
  domain: string,
): Promise<boolean> {
  const token = process.env.VERCEL_TOKEN;
  if (!token) return false;

  const response = await fetch(
    `https://api.vercel.com/v9/projects/${vercelProjectId}/domains/${domain}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    },
  );

  if (!response.ok) return false;
  const payload = (await response.json()) as { verified?: boolean };
  return Boolean(payload.verified);
}

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

    const body = requestSchema.parse(await request.json());
    const domain = body.domain.toLowerCase();

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id,user_id,name,vercel_project_id")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const typedProject = project as {
      id: string;
      vercel_project_id?: string | null;
    };

    const token = process.env.VERCEL_TOKEN;
    const vercelProjectId =
      typedProject.vercel_project_id || process.env.VERCEL_PROJECT_ID || "vercel-project-id";
    let verified = false;

    if (token && vercelProjectId) {
      const addDomain = await fetch(
        `https://api.vercel.com/v9/projects/${vercelProjectId}/domains`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: domain }),
        },
      );

      if (!addDomain.ok && addDomain.status !== 409) {
        const payload = (await addDomain.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        throw new Error(payload.error?.message ?? "Failed to attach domain on Vercel");
      }

      if (body.verify) {
        verified = await verifyDomainOnVercel(vercelProjectId, domain);
      }
    }

    const { error: updateError } = await supabase
      .from("projects")
      .update({ custom_domain: domain })
      .eq("id", params.id)
      .eq("user_id", user.id);

    if (updateError) {
      throw new Error(updateError.message ?? "Failed to save custom domain");
    }

    return NextResponse.json({
      success: true,
      data: {
        domain,
        verified,
        verificationRecords: [
          {
            type: "CNAME",
            name: domain,
            value: "cname.vercel-dns.com",
          },
        ],
        instruction:
          "Add a CNAME record pointing your domain to cname.vercel-dns.com. After DNS propagation, click Verify.",
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Validation failed" },
        { status: 400 },
      );
    }
    Sentry.captureException(error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Domain configuration failed",
      },
      { status: 500 },
    );
  }
}
