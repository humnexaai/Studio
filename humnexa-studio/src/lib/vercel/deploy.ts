type VercelProjectResult = {
  id: string;
  name: string;
};

type VercelDeployResult = {
  id: string;
  url: string;
};

type VercelStatusResult = {
  readyState: string;
  url: string | null;
};

function getVercelToken(): string {
  const token = process.env.VERCEL_TOKEN;
  if (!token) {
    throw new Error("VERCEL_TOKEN is missing");
  }
  return token;
}

export async function createVercelProject(
  name: string,
  fullName: string,
): Promise<VercelProjectResult> {
  const token = getVercelToken();
  const response = await fetch("https://api.vercel.com/v1/projects", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      gitRepository: {
        type: "github",
        repo: fullName,
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`createVercelProject failed (${response.status}): ${body}`);
  }

  const data = (await response.json()) as { id: string; name: string };
  return {
    id: data.id,
    name: data.name,
  };
}

export async function triggerDeploy(
  fullName: string,
  projectName: string,
): Promise<VercelDeployResult> {
  const token = getVercelToken();
  const response = await fetch("https://api.vercel.com/v13/deployments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: projectName,
      gitSource: {
        type: "github",
        repo: fullName,
        ref: "main",
      },
      target: "production",
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`triggerDeploy failed (${response.status}): ${body}`);
  }

  const data = (await response.json()) as { id: string; url: string };
  return {
    id: data.id,
    url: data.url,
  };
}

export async function checkDeployStatus(
  deploymentId: string,
): Promise<VercelStatusResult> {
  const token = getVercelToken();
  const response = await fetch(
    `https://api.vercel.com/v13/deployments/${deploymentId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`checkDeployStatus failed (${response.status}): ${body}`);
  }

  const data = (await response.json()) as {
    readyState?: string;
    url?: string | null;
  };
  return {
    readyState: data.readyState ?? "UNKNOWN",
    url: data.url ?? null,
  };
}
