"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { loadSandpackClient } from "@codesandbox/sandpack-client";
import type { SandpackClient, SandpackTemplate } from "@codesandbox/sandpack-client";
import { ExternalLink, Monitor, RefreshCw, Smartphone, Tablet } from "lucide-react";
import { useStudioStore } from "@/store/studioStore";
import { cn } from "@/lib/utils";
import type { ProjectFile } from "@/types/studio";

type PreviewPanelProps = {
  files: ProjectFile[];
  framework: string;
};

function mapFilesToSandpack(files: ProjectFile[]): Record<string, { code: string }> {
  const mapped: Record<string, { code: string }> = {};
  for (const file of files) {
    const path = file.path.startsWith("/") ? file.path : `/${file.path}`;
    mapped[path] = { code: file.content };
  }

  if (!mapped["/App.tsx"] && !mapped["/src/App.tsx"]) {
    mapped["/App.tsx"] = {
      code: `export default function App() {
  return (
    <main style={{ fontFamily: "DM Sans, sans-serif", padding: 16 }}>
      <h1>Humnexa Studio Preview</h1>
      <p>Your generated app appears here.</p>
    </main>
  );
}`,
    };
  }
  return mapped;
}

export function PreviewPanel({
  files,
  framework,
}: PreviewPanelProps): React.ReactElement {
  const device = useStudioStore((state) => state.previewDevice);
  const setDevice = useStudioStore((state) => state.setPreviewDevice);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const clientRef = useRef<SandpackClient | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const [ready, setReady] = useState(false);

  const sandpackFiles = useMemo(() => mapFilesToSandpack(files), [files]);

  useEffect(() => {
    if (!iframeRef.current) return;
    const template: SandpackTemplate =
      framework.toLowerCase() === "react" ? "create-react-app" : "nextjs";
    void loadSandpackClient(
      iframeRef.current,
      {
        files: sandpackFiles,
        template,
      },
      {
        showLoadingScreen: true,
        showOpenInCodeSandbox: false,
      },
    ).then((client) => {
      clientRef.current = client;
      setReady(false);
      const unsubscribe = client.listen((msg) => {
          if (
            msg.type === "status" &&
            (msg as unknown as { status?: string }).status === "done"
          ) {
          setReady(true);
        }
      });
      cleanupRef.current = () => {
        unsubscribe();
        client.destroy();
        clientRef.current = null;
      };
    });
    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, [framework, sandpackFiles]);

  const widthClass =
    device === "mobile"
      ? "w-[375px]"
      : device === "tablet"
        ? "w-[768px]"
        : "w-full";

  return (
    <aside className="flex h-full w-full flex-col border-l border-brand-border bg-brand-card">
      <div className="flex items-center justify-between border-b border-brand-border px-3 py-2">
        <div className="text-sm font-semibold">Preview</div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setDevice("mobile")}
            className={cn(
              "rounded p-1 text-brand-sub",
              device === "mobile" && "bg-brand-card2 text-brand-text",
            )}
          >
            <Smartphone className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setDevice("tablet")}
            className={cn(
              "rounded p-1 text-brand-sub",
              device === "tablet" && "bg-brand-card2 text-brand-text",
            )}
          >
            <Tablet className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setDevice("desktop")}
            className={cn(
              "rounded p-1 text-brand-sub",
              device === "desktop" && "bg-brand-card2 text-brand-text",
            )}
          >
            <Monitor className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() =>
              clientRef.current?.dispatch({
                type: "refresh",
              } as unknown as Parameters<SandpackClient["dispatch"]>[0])
            }
            className="rounded p-1 text-brand-sub hover:text-brand-text"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => window.open("https://sandpack.codesandbox.io/", "_blank")}
            className="rounded p-1 text-brand-sub hover:text-brand-text"
          >
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="relative flex flex-1 items-start justify-center overflow-auto p-3">
        {!ready ? (
          <div className="absolute inset-3 animate-pulse rounded-xl border border-brand-border bg-brand-card2" />
        ) : null}
        <iframe
          ref={iframeRef}
          title="Preview"
          className={cn(
            "h-full rounded-xl border border-brand-border bg-white transition-all",
            widthClass,
          )}
        />
      </div>
      <div className="border-t border-brand-border px-3 py-2 text-xs text-brand-sub">
        {ready ? "● Preview ready" : "● Building preview..."}
      </div>
    </aside>
  );
}
