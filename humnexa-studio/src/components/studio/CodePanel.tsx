"use client";

import Editor from "@monaco-editor/react";
import { useUserStore } from "@/store/userStore";

interface CodePanelProps {
  path: string;
  content: string;
  language: string;
  loading?: boolean;
  onChange: (value: string) => void;
  onErrorCountChange?: (count: number) => void;
}

export function CodePanel({
  path,
  content,
  language,
  loading = false,
  onChange,
  onErrorCountChange,
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
      {loading ? (
        <div className="space-y-2 p-4">
          {Array.from({ length: 9 }).map((_, idx) => (
            <div
              // eslint-disable-next-line react/no-array-index-key
              key={idx}
              className="h-4 w-full animate-pulse rounded bg-brand-card2"
            />
          ))}
        </div>
      ) : (
        <Editor
          height="calc(100% - 38px)"
          language={language}
          theme="vs-dark"
          value={content}
          onChange={(value) => onChange(value ?? "")}
          onValidate={(markers) => {
            const errors = markers.filter((marker) => marker.severity === 8).length;
            onErrorCountChange?.(errors);
          }}
          options={{
            fontFamily,
            fontSize,
            minimap: { enabled: false },
            tabSize,
          }}
        />
      )}
    </div>
  );
}
