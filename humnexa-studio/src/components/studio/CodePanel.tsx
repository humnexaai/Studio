"use client";

import Editor from "@monaco-editor/react";
import { useUserStore } from "@/store/userStore";

interface CodePanelProps {
  path: string;
  content: string;
  language: string;
  onChange: (value: string) => void;
}

export function CodePanel({
  path,
  content,
  language,
  onChange,
}: CodePanelProps): React.ReactElement {
  const fontFamily = useUserStore((state) => state.editorFontFamily);
  const fontSize = useUserStore((state) => state.editorFontSize);
  const tabSize = useUserStore((state) => state.editorTabSize);

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
        language={language}
        theme="vs-dark"
        value={content}
        onChange={(value) => onChange(value ?? "")}
        options={{
          fontFamily,
          fontSize,
          minimap: { enabled: false },
          tabSize,
        }}
      />
    </div>
  );
}
