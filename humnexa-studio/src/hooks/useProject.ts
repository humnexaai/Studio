import { useEffect, useState } from "react";
import type { ProjectRecord } from "@/types/studio";

export function useProject(projectId: string): {
  project: ProjectRecord | null;
  isLoading: boolean;
  error: string | null;
} {
  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId || projectId === "new") return;
    let isCancelled = false;

    async function fetchProject(): Promise<void> {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/projects/${projectId}`);
        if (!response.ok) throw new Error("Failed to fetch project");
        const payload = (await response.json()) as { data: ProjectRecord };
        if (!isCancelled) setProject(payload.data);
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : "Unexpected error");
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    void fetchProject();
    return () => {
      isCancelled = true;
    };
  }, [projectId]);

  return { project, isLoading, error };
}
