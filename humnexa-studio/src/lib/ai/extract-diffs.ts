import type { DiffBlock } from "@/types/studio";
import { nanoid } from "nanoid";

const FILE_BLOCK_REGEX = /=== FILE:\s*(.+?)\s*===\n([\s\S]*?)=== END FILE ===/g;

const SECURITY_GUARD_FILES = ["middleware.ts", "next.config.js", ".env"];

export function extractCodeDiffs(
  response: string,
  currentFiles?: Array<{ path: string; content: string }>,
): DiffBlock[] {
  const diffs: DiffBlock[] = [];
  const fileMap = new Map((currentFiles ?? []).map((file) => [file.path, file.content]));
  let match: RegExpExecArray | null = FILE_BLOCK_REGEX.exec(response);

  while (match) {
    const filePath = match[1].trim();
    const after = match[2].trim();
    const before = fileMap.get(filePath) ?? "";
    const securitySensitive = SECURITY_GUARD_FILES.some((guard) =>
      filePath.includes(guard),
    );

    diffs.push({
      id: nanoid(),
      filePath,
      before,
      after,
      summary: `${before ? "Update" : "Create"} ${filePath}`,
      securitySensitive,
    });

    match = FILE_BLOCK_REGEX.exec(response);
  }

  return diffs;
}
