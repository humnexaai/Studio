import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import {
  createRepo,
  parseGitHubRepoFromUrl,
  parseRepoFullName,
  pushFiles,
} from "@/lib/github/push";
import {
  checkDeployStatus,
  createVercelProject,
  triggerDeploy,
} from "@/lib/vercel/deploy";
import { scanProjectFiles } from "@/lib/security/scan";
import type { ProjectFile } from "@/types/studio";

type DeployEvent =
  | {
      type: "step";
      step: "security" | "build" | "deploy";
      status: "running" | "success" | "failed";
      message: string;
    }
  | {
      type: "security_report";
      critical: Array<{ file: string; issue: string }>;
      high: Array<{ file: string; issue: string }>;
      medium: Array<{ file: string; issue: string }>;
      blockDeploy: boolean;
    }
  | {
      type: "deploy_status";
      readyState: string;
      url: string | null;
      deploymentId: string;
    }
  | {
      type: "success";
      deploymentId: string;
      url: string;
      message: string;
    }
  | {
      type: "error";
      code: string;
      message: string;
      issues?: Array<{ file: string; issue: string }>;
    };

type DbClient = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        eq: (column2: string, value2: string) => {
          single: () => Promise<{
            data:
              | {
                  id: string;
                  user_id: string;
                  name: string;
                  github_url: string | null;
                  github_full_name?: string | null;
                  vercel_project_id?: string | null;
                  deployed_url?: string | null;
                  branch_name?: string | null;
                }
              | null;
            error: { message?: string } | null;
          }>;
        };
      };
    };
    update: (values: Record<string, unknown>) => {
      eq: (column: string, value: string) => Promise<{
        error: { message?: string } | null;
      }>;
    };
    insert: (values: Record<string, unknown>) => {
      select: (columns: string) => {
        single: () => Promise<{
          data: { id: string } | null;
          error: { message?: string } | null;
        }>;
      };
    };
  };
};

const encoder = new TextEncoder();

function sanitizeProjectSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function writeEvent(
  controller: ReadableStreamDefaultController<Uint8Array>,
  event: DeployEvent,
): void {
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
}

export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  const supabase = createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = supabase as unknown as DbClient;
  const { data: project, error: projectError } = await db
    .from("projects")
    .select(
      "id,user_id,name,github_url,github_full_name,vercel_project_id,deployed_url,branch_name",
    )
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
      { error: filesResult.error.message ?? "Unable to load files" },
      { status: 400 },
    );
  }

  const projectFiles: ProjectFile[] = (filesResult.data ?? []).map(
    (row, index) => ({
      id: `deploy-${index}`,
      path: row.file_path,
      content: row.content,
      language: "plaintext",
      updatedAt: new Date().toISOString(),
    }),
  );

  const security = scanProjectFiles(projectFiles);
  if (security.blockDeploy) {
    return NextResponse.json(
      {
        error: "SECURITY_ISSUES",
        issues: security.critical.map((issue) => ({
          file: issue.file,
          issue: issue.issue,
        })),
      },
      { status: 400 },
    );
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      void (async () => {
        let deploymentRowId: string | null = null;
        try {
          writeEvent(controller, {
            type: "step",
            step: "security",
            status: "running",
            message: "Running security scan...",
          });

          writeEvent(controller, {
            type: "security_report",
            critical: security.critical.map((issue) => ({
              file: issue.file,
              issue: issue.issue,
            })),
            high: security.high.map((issue) => ({
              file: issue.file,
              issue: issue.issue,
            })),
            medium: security.medium.map((issue) => ({
              file: issue.file,
              issue: issue.issue,
            })),
            blockDeploy: security.blockDeploy,
          });

          writeEvent(controller, {
            type: "step",
            step: "security",
            status: "success",
            message: "Security scan passed.",
          });

          writeEvent(controller, {
            type: "step",
            step: "build",
            status: "running",
            message: "Syncing source to GitHub...",
          });

          let githubUrl = project.github_url ?? "";
          let githubFullName = project.github_full_name ?? "";
          if (!githubUrl) {
            const repoName =
              sanitizeProjectSlug(project.name) || `humnexa-${project.id.slice(0, 8)}`;
            const created = await createRepo(repoName);
            githubUrl = created.html_url;
            githubFullName = created.full_name;
            await db
              .from("projects")
              .update({
                github_url: githubUrl,
                github_full_name: githubFullName,
              })
              .eq("id", project.id);
          } else if (!githubFullName) {
            const parsed = parseGitHubRepoFromUrl(githubUrl);
            githubFullName = parsed.fullName;
            await db
              .from("projects")
              .update({ github_full_name: githubFullName })
              .eq("id", project.id);
          }

          const { owner, repo } = parseRepoFullName(githubFullName);
          await pushFiles({
            owner,
            repo,
            files: projectFiles.map((file) => ({
              path: file.path,
              content: file.content,
            })),
            message: `chore: sync files for deployment of ${project.name}`,
          });

          writeEvent(controller, {
            type: "step",
            step: "build",
            status: "success",
            message: "GitHub sync complete.",
          });

          writeEvent(controller, {
            type: "step",
            step: "deploy",
            status: "running",
            message: "Starting Vercel deployment...",
          });

          let vercelProjectId = project.vercel_project_id ?? null;
          if (!vercelProjectId) {
            const createdProject = await createVercelProject(
              sanitizeProjectSlug(project.name) || `humnexa-${project.id.slice(0, 8)}`,
              githubFullName,
            );
            vercelProjectId = createdProject.id;
            await db
              .from("projects")
              .update({ vercel_project_id: vercelProjectId })
              .eq("id", project.id);
          }

          const deployment = await triggerDeploy(
            githubFullName,
            sanitizeProjectSlug(project.name) || `humnexa-${project.id.slice(0, 8)}`,
          );

          const inserted = await db
            .from("deployments")
            .insert({
              project_id: project.id,
              provider: "vercel",
              status: "building",
              logs: `Deployment ${deployment.id} started`,
              deployed_url: null,
            })
            .select("id")
            .single();
          deploymentRowId = inserted.data?.id ?? null;

          const startTime = Date.now();
          const timeoutMs = 10 * 60 * 1000;
          while (Date.now() - startTime < timeoutMs) {
            await sleep(3000);
            const status = await checkDeployStatus(deployment.id);
            writeEvent(controller, {
              type: "deploy_status",
              readyState: status.readyState,
              url: status.url,
              deploymentId: deployment.id,
            });

            const state = status.readyState.toUpperCase();
            if (state === "READY") {
              const deployedUrl = `https://${status.url ?? deployment.url}`;
              if (deploymentRowId) {
                await db
                  .from("deployments")
                  .update({
                    status: "ready",
                    logs: `Deployment ${deployment.id} is ready`,
                    deployed_url: deployedUrl,
                  })
                  .eq("id", deploymentRowId);
              }
              await db
                .from("projects")
                .update({
                  status: "ready",
                  deployed_url: deployedUrl,
                })
                .eq("id", project.id);

              writeEvent(controller, {
                type: "step",
                step: "deploy",
                status: "success",
                message: "Deployment is live.",
              });
              await db.from("notifications").insert({
                user_id: user.id,
                title: "Deploy successful",
                body: `Project ${project.name} is live at ${deployedUrl}`,
                type: "deploy_success",
              });
              writeEvent(controller, {
                type: "success",
                deploymentId: deployment.id,
                url: deployedUrl,
                message: "Deployment completed successfully",
              });
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
              return;
            }

            if (
              state === "ERROR" ||
              state === "CANCELED" ||
              state === "FAILED" ||
              state === "CANCELLED"
            ) {
              if (deploymentRowId) {
                await db
                  .from("deployments")
                  .update({
                    status: "failed",
                    logs: `Deployment failed with state ${status.readyState}`,
                  })
                  .eq("id", deploymentRowId);
              }
              await db.from("projects").update({ status: "failed" }).eq("id", project.id);
              await db.from("notifications").insert({
                user_id: user.id,
                title: "Deploy failed",
                body: `Project ${project.name} failed to deploy (${status.readyState}).`,
                type: "deploy_failed",
              });
              writeEvent(controller, {
                type: "step",
                step: "deploy",
                status: "failed",
                message: `Deployment failed (${status.readyState}).`,
              });
              writeEvent(controller, {
                type: "error",
                code: "DEPLOY_FAILED",
                message: `Vercel deploy failed with state: ${status.readyState}`,
              });
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
              return;
            }
          }

          if (deploymentRowId) {
            await db
              .from("deployments")
              .update({ status: "failed", logs: "Deployment timed out after 10 minutes" })
              .eq("id", deploymentRowId);
          }
          await db.from("projects").update({ status: "failed" }).eq("id", project.id);
          await db.from("notifications").insert({
            user_id: user.id,
            title: "Deploy timeout",
            body: `Project ${project.name} deployment timed out after 10 minutes.`,
            type: "deploy_failed",
          });
          writeEvent(controller, {
            type: "error",
            code: "DEPLOY_TIMEOUT",
            message: "Deployment timed out after 10 minutes.",
          });
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          if (deploymentRowId) {
            await db
              .from("deployments")
              .update({
                status: "failed",
                logs:
                  error instanceof Error
                    ? error.message
                    : "Deployment failed unexpectedly",
              })
              .eq("id", deploymentRowId);
          }
          await db.from("projects").update({ status: "failed" }).eq("id", project.id);
          await db.from("notifications").insert({
            user_id: user.id,
            title: "Deploy error",
            body:
              error instanceof Error
                ? error.message
                : `Project ${project.name} deploy encountered an unexpected error.`,
            type: "deploy_failed",
          });
          writeEvent(controller, {
            type: "error",
            code: "DEPLOY_ERROR",
            message:
              error instanceof Error
                ? error.message
                : "Unexpected deployment error",
          });
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }
      })();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
