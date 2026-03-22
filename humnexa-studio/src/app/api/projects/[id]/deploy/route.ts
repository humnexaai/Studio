import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import * as Sentry from "@sentry/nextjs";
import { createSupabaseServer } from "@/lib/supabase/server";
import { securityScan } from "@/lib/security/security-scan";
import { triggerVercelDeploy } from "@/lib/vercel/deploy";
import { deductCreditsOnSuccess } from "@/lib/credits/deduct";
import { refundCreditsOnFailure } from "@/lib/credits/refund";

const deploySchema = z.object({
  projectName: z.string().min(1),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  try {
    const supabase = createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    deploySchema.parse(body);

    const { data: files, error: fileError } = await supabase
      .from("project_files")
      .select("file_path, content")
      .eq("project_id", params.id);
    if (fileError) {
      throw fileError;
    }

    const scan = securityScan(
      (files ?? []).map((f) => ({ path: f.file_path, content: f.content })),
    );
    if (scan.blockDeploy) {
      return NextResponse.json(
        { error: "Critical security issues detected", issues: scan.critical },
        { status: 400 },
      );
    }

    const deployCost = 2;
    try {
      const deployment = await triggerVercelDeploy(params.id);
      await deductCreditsOnSuccess(user.id, deployCost, "deploy");

      await supabase.from("deployments").insert({
        project_id: params.id,
        status: "success",
        logs: "Deployed via Vercel API",
        deployed_url: `https://${deployment.deploymentId}.vercel.app`,
      });

      return NextResponse.json({ success: true, data: deployment });
    } catch (error) {
      await refundCreditsOnFailure(user.id, deployCost, "deploy_failed");
      throw error;
    }
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Validation failed" }, { status: 400 });
    }
    Sentry.captureException(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
