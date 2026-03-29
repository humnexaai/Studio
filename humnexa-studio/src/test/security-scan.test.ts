import { describe, expect, it } from "vitest";
import { scanProjectFiles } from "@/lib/security/scan";

describe("scanProjectFiles", () => {
  it("returns empty critical array for clean files", () => {
    const result = scanProjectFiles([
      {
        id: "1",
        path: "src/app/page.tsx",
        content: "export default function Page(){ return null }",
        language: "tsx",
        updatedAt: new Date().toISOString(),
      },
    ]);

    expect(result.critical).toEqual([]);
  });

  it("detects exposed API key pattern in client component file", () => {
    const result = scanProjectFiles([
      {
        id: "2",
        path: "src/components/Client.tsx",
        content: '"use client"; const key = "sk-SECRETKEYVALUEabcdef";',
        language: "tsx",
        updatedAt: new Date().toISOString(),
      },
    ]);

    expect(result.critical.length).toBeGreaterThan(0);
    expect(result.critical[0].issue).toContain("secret key");
  });

  it("returns blockDeploy true when critical issues found", () => {
    const result = scanProjectFiles([
      {
        id: "3",
        path: "src/components/Client.tsx",
        content: '"use client"; const key = "sk-SECRETKEYVALUEabcdef";',
        language: "tsx",
        updatedAt: new Date().toISOString(),
      },
    ]);

    expect(result.blockDeploy).toBe(true);
  });
});
