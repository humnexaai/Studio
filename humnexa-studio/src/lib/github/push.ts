type GitHubRepoResponse = {
  html_url: string;
  full_name: string;
};

type CreateRepoResult = {
  html_url: string;
  full_name: string;
};

type PushFilesInput = {
  owner: string;
  repo: string;
  files: Array<{ path: string; content: string }>;
  message: string;
};

export type ParsedRepoRef = {
  owner: string;
  repo: string;
};

function getGitHubToken(): string {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("GITHUB_TOKEN is missing");
  }
  return token;
}

function toBase64Utf8(content: string): string {
  return Buffer.from(content, "utf8").toString("base64");
}

export async function createRepo(name: string): Promise<CreateRepoResult> {
  const token = getGitHubToken();
  const response = await fetch("https://api.github.com/user/repos", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      private: false,
      auto_init: true,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub createRepo failed (${response.status}): ${body}`);
  }

  const parsed = (await response.json()) as GitHubRepoResponse;
  return {
    html_url: parsed.html_url,
    full_name: parsed.full_name,
  };
}

async function getExistingFileSha(
  owner: string,
  repo: string,
  path: string,
): Promise<string | null> {
  const token = getGitHubToken();
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURI(path)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
      cache: "no-store",
    },
  );

  if (response.status === 404) return null;
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub get file failed (${response.status}): ${body}`);
  }

  const data = (await response.json()) as { sha?: string };
  return data.sha ?? null;
}

export async function pushFiles({
  owner,
  repo,
  files,
  message,
}: PushFilesInput): Promise<void> {
  const token = getGitHubToken();

  for (const file of files) {
    const sha = await getExistingFileSha(owner, repo, file.path);
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURI(file.path)}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          content: toBase64Utf8(file.content),
          ...(sha ? { sha } : {}),
        }),
      },
    );

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `GitHub push failed for ${file.path} (${response.status}): ${body}`,
      );
    }
  }
}

export function parseRepoFullName(fullName: string): ParsedRepoRef {
  const [owner, repo] = fullName.split("/");
  if (!owner || !repo) {
    throw new Error(`Invalid repository full name: ${fullName}`);
  }
  return { owner, repo };
}

export function parseGitHubRepoFromUrl(url: string): {
  owner: string;
  repo: string;
  fullName: string;
} {
  const trimmed = url.trim().replace(/\.git$/, "");
  const match = trimmed.match(/github\.com\/([^/]+)\/([^/]+)$/i);
  if (!match) {
    throw new Error("Invalid github_url format");
  }
  return {
    owner: match[1],
    repo: match[2],
    fullName: `${match[1]}/${match[2]}`,
  };
}
