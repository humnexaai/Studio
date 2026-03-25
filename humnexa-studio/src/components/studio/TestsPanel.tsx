"use client";

import { useMemo, useState } from "react";
import type { ProjectFile } from "@/types/studio";

type TestsPanelProps = {
  currentFiles: ProjectFile[];
};

export function TestsPanel({ currentFiles }: TestsPanelProps): React.ReactElement {
  const [testsOutput, setTestsOutput] = useState<string>("");
  const [testsRunning, setTestsRunning] = useState(false);
  const [testsGeneratedAt, setTestsGeneratedAt] = useState<string | null>(null);

  const generateBasicTests = useMemo(() => {
    const testFiles: Array<{ path: string; content: string }> = [];
    for (const file of currentFiles) {
      const isComponent =
        (file.path.endsWith(".tsx") || file.path.endsWith(".jsx")) &&
        !file.path.endsWith(".test.tsx") &&
        !file.path.endsWith(".test.jsx");
      if (!isComponent) continue;
      const testPath = file.path
        .replace(/\.tsx$/, ".test.tsx")
        .replace(/\.jsx$/, ".test.jsx");
      const importPath = `./${file.path.split("/").pop()?.replace(/\.(tsx|jsx)$/, "")}`;
      const testContent = [
        `import { render } from "@testing-library/react";`,
        `import Component from "${importPath}";`,
        ``,
        `describe("${file.path}", () => {`,
        `  it("renders without crashing", () => {`,
        `    render(<Component />);`,
        `  });`,
        `});`,
        ``,
      ].join("\n");
      testFiles.push({ path: testPath, content: testContent });
    }
    return testFiles;
  }, [currentFiles]);

  const runTests = async (): Promise<void> => {
    try {
      setTestsRunning(true);
      setTestsOutput("Starting test run...\n");
      setTestsGeneratedAt(new Date().toLocaleTimeString("en-IN"));
      const response = await fetch("/api/tests/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          generatedTests: generateBasicTests,
        }),
      });
      const payload = (await response.json()) as { output?: string; error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Test run failed");
      }
      setTestsOutput(payload.output ?? "No test output.");
    } catch (error) {
      setTestsOutput((error instanceof Error ? error.message : "Test run failed") + "\n");
    } finally {
      setTestsRunning(false);
    }
  };

  return (
    <div className="h-full overflow-auto p-4">
      <div className="rounded-xl border border-brand-border bg-brand-card2 p-3">
        <p className="text-sm font-semibold">Generated component tests</p>
        <p className="mt-1 text-xs text-brand-sub">
          {generateBasicTests.length} test files prepared
          {testsGeneratedAt ? ` · last generated at ${testsGeneratedAt}` : ""}
        </p>
        <div className="mt-3 space-y-2">
          {generateBasicTests.map((testFile) => (
            <details
              key={testFile.path}
              className="rounded-md border border-brand-border bg-brand-card px-2 py-1"
            >
              <summary className="cursor-pointer text-xs text-brand-sub">
                {testFile.path}
              </summary>
              <pre className="mt-2 overflow-auto text-[11px] text-brand-text">
                {testFile.content}
              </pre>
            </details>
          ))}
        </div>
        <button
          type="button"
          onClick={() => void runTests()}
          disabled={testsRunning}
          className="mt-3 rounded-lg bg-brand-gradient px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
        >
          {testsRunning ? "Running tests..." : "Run tests"}
        </button>
        <pre className="mt-3 max-h-64 overflow-auto rounded-md border border-brand-border bg-black/40 p-2 text-[11px] text-brand-sub">
          {testsOutput || "Test output will appear here."}
        </pre>
      </div>
    </div>
  );
}
