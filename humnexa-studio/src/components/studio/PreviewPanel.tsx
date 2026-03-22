"use client";

import {
  SandpackLayout,
  SandpackPreview,
  SandpackProvider,
} from "@codesandbox/sandpack-react";
import { Monitor, RefreshCw, Smartphone, Tablet } from "lucide-react";
import { useStudioStore } from "@/store/studioStore";
import { cn } from "@/lib/utils";

export function PreviewPanel(): React.ReactElement {
  const device = useStudioStore((state) => state.previewDevice);
  const setDevice = useStudioStore((state) => state.setPreviewDevice);

  return (
    <aside className="flex h-full w-full flex-col border-l border-brand-border bg-brand-card">
      <div className="flex items-center justify-between border-b border-brand-border px-3 py-2">
        <div className="text-sm font-semibold">Preview</div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setDevice("mobile")}
            className={cn(
              "rounded p-1 text-brand-sub",
              device === "mobile" && "bg-brand-card2 text-brand-text"
            )}
          >
            <Smartphone className="h-4 w-4" />
          </button>
          <button
            onClick={() => setDevice("tablet")}
            className={cn(
              "rounded p-1 text-brand-sub",
              device === "tablet" && "bg-brand-card2 text-brand-text"
            )}
          >
            <Tablet className="h-4 w-4" />
          </button>
          <button
            onClick={() => setDevice("desktop")}
            className={cn(
              "rounded p-1 text-brand-sub",
              device === "desktop" && "bg-brand-card2 text-brand-text"
            )}
          >
            <Monitor className="h-4 w-4" />
          </button>
          <button className="rounded p-1 text-brand-sub hover:text-brand-text">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 p-3">
        <SandpackProvider
          template="react-ts"
          files={{
            "/App.tsx": `export default function App() {
  return (
    <main style={{ fontFamily: "DM Sans, sans-serif", padding: 16 }}>
      <h1>Humnexa Studio Preview</h1>
      <p>Your generated app appears here.</p>
    </main>
  )
}`,
          }}
          options={{ recompileMode: "delayed", recompileDelay: 300 }}
        >
          <SandpackLayout className="h-full rounded-xl border border-brand-border bg-brand-card2">
            <SandpackPreview
              className="h-full"
              showNavigator
              style={{ height: "100%", width: "100%" }}
            />
          </SandpackLayout>
        </SandpackProvider>
      </div>
    </aside>
  );
}
