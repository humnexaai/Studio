"use client";

import Editor from "@monaco-editor/react";

interface CodePanelProps {
  path: string;
  content: string;
  onChange: (value: string) => void;
}

export function CodePanel({
  path,
  content,
  onChange,
}: CodePanelProps): React.ReactElement {
  return (
    <div className="h-full rounded-2xl border border-brand-border bg-brand-card">
      <div className="flex items-center justify-between border-b border-brand-border px-4 py-2 text-xs text-brand-sub">
        <span className="font-code">{path}</span>
        <button
          className="rounded-lg border border-brand-border bg-brand-card2 px-2 py-1"
          type="button"
        >
          Format
        </button>
      </div>
      <Editor
        height="calc(100% - 38px)"
        defaultLanguage="typescript"
        theme="vs-dark"
        value={content}
        onChange={(value) => onChange(value ?? "")}
        options={{
          fontFamily: "JetBrains Mono",
          fontSize: 13,
          minimap: { enabled: false },
          tabSize: 2,
        }}
      />
    </div>
  );
}
