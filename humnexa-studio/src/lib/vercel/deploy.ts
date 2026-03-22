export async function triggerVercelDeploy(projectId: string): Promise<{
  deploymentId: string;
  status: "queued" | "building";
}> {
  if (!process.env.VERCEL_TOKEN) {
    return {
      deploymentId: `dev-${projectId}`,
      status: "queued",
    };
  }

  return {
    deploymentId: `vercel-${projectId}`,
    status: "building",
  };
}
