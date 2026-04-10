import type { ProjectFile } from "@/types/studio";

export function detectLanguageFromPath(path: string): string {
  const lower = path.toLowerCase();
  if (lower.endsWith(".java")) return "java";
  if (lower.endsWith(".php")) return "php";
  if (lower.endsWith(".rb")) return "ruby";
  if (lower.endsWith(".swift")) return "swift";
  if (lower.endsWith(".c")) return "c";
  if (lower.endsWith(".cpp") || lower.endsWith(".cc") || lower.endsWith(".cxx")) {
    return "cpp";
  }
  if (lower.endsWith(".sh")) return "shell";
  if (lower.endsWith(".yaml") || lower.endsWith(".yml")) return "yaml";
  if (lower.endsWith(".toml")) return "toml";
  if (lower.endsWith(".xml")) return "xml";
  if (lower.endsWith(".html")) return "html";
  if (lower.endsWith(".scss")) return "scss";
  if (lower.endsWith(".sql")) return "sql";
  if (lower.endsWith(".tsx") || lower.endsWith(".ts")) return "typescript";
  if (lower.endsWith(".jsx") || lower.endsWith(".js")) return "javascript";
  if (lower.endsWith(".css")) return "css";
  if (lower.endsWith(".json")) return "json";
  if (lower.endsWith(".md")) return "markdown";
  if (lower.endsWith(".py")) return "python";
  if (lower.endsWith(".go")) return "go";
  if (lower.endsWith(".dart")) return "dart";
  if (lower.endsWith(".kt")) return "kotlin";
  if (lower.endsWith(".cs")) return "csharp";
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
