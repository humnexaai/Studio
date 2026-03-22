import type { ProjectFile } from "@/types/studio";

export function detectLanguageFromPath(path: string): string {
  const lower = path.toLowerCase();
  if (lower.endsWith(".tsx") || lower.endsWith(".ts")) return "typescript";
  if (lower.endsWith(".jsx") || lower.endsWith(".js")) return "javascript";
  if (lower.endsWith(".css")) return "css";
  if (lower.endsWith(".json")) return "json";
  if (lower.endsWith(".md")) return "markdown";
  if (lower.endsWith(".py")) return "python";
  if (lower.endsWith(".go")) return "go";
  if (lower.endsWith(".rs")) return "rust";
  return "plaintext";
}

export function normalizeProjectFiles(
  rows: Array<{
    id: string;
    file_path: string;
    content: string;
    updated_at: string;
  }>,
): ProjectFile[] {
  return rows.map((row) => ({
    id: row.id,
    path: row.file_path,
    content: row.content,
    updatedAt: row.updated_at,
    language: detectLanguageFromPath(row.file_path),
  }));
}
