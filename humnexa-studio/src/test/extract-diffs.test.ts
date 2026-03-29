import { describe, expect, it } from "vitest";
import { extractCodeDiffs } from "@/lib/ai/extract-diffs";

describe("extractCodeDiffs", () => {
  it("returns empty array for plain text with no file markers", () => {
    expect(extractCodeDiffs("hello world")).toEqual([]);
  });

  it("correctly parses one file block", () => {
    const input = `=== FILE: src/test.tsx ===
console.log("hi")
=== END FILE ===`;
    const diffs = extractCodeDiffs(input);
    expect(diffs).toHaveLength(1);
    expect(diffs[0].filePath).toBe("src/test.tsx");
  });

  it("parses multiple file blocks and returns correct count", () => {
    const input = `=== FILE: src/a.ts ===
export const a = 1;
=== END FILE ===
=== FILE: src/b.ts ===
export const b = 2;
=== END FILE ===`;
    const diffs = extractCodeDiffs(input);
    expect(diffs).toHaveLength(2);
  });
});
