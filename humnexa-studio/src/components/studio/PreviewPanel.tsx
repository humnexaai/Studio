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
  lowBandwidthMode?: boolean;
  onBuildApk?: () => void;
};

const PREVIEW_CHANNEL = "HUMNEXA_PREVIEW";
const VISUAL_RUNTIME_FLAG = "__HUMNEXA_VISUAL_RUNTIME__";
const SANDBOX_PREVIEW_ORIGIN = "https://sandpack.codesandbox.io";

function supportsLivePreview(framework: string): boolean {
  const normalized = framework.toLowerCase();
  return normalized === "nextjs" || normalized === "react" || normalized === "vue";
}

function isReactNativeFramework(framework: string): boolean {
  return framework.toLowerCase() === "react-native";
}

function isFlutterFramework(framework: string): boolean {
  return framework.toLowerCase() === "flutter";
}

function mapFrameworkToTemplate(framework: string): SandpackTemplate {
  const normalized = framework.toLowerCase();
  if (normalized === "react") return "create-react-app";
  if (normalized === "vue") return "vue-cli";
  return "nextjs";
}

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
  lowBandwidthMode = false,
  onBuildApk,
}: PreviewPanelProps): React.ReactElement {
  const device = useStudioStore((state) => state.previewDevice);
  const setDevice = useStudioStore((state) => state.setPreviewDevice);
  const visualEditEnabled = useStudioStore((state) => state.visualEditEnabled);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const clientRef = useRef<SandpackClient | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const [ready, setReady] = useState(false);
  const livePreview = supportsLivePreview(framework);
  const reactNativePreview = isReactNativeFramework(framework);
  const flutterPreview = isFlutterFramework(framework);

  const sandpackFiles = useMemo(() => mapFilesToSandpack(files), [files]);

  const postVisualState = (enabled: boolean): void => {
    iframeRef.current?.contentWindow?.postMessage(
      {
        channel: PREVIEW_CHANNEL,
        type: "VISUAL_EDIT_TOGGLE",
        enabled,
      },
      SANDBOX_PREVIEW_ORIGIN,
    );
  };

  const injectVisualOverlayScript = (): void => {
    const frameWindow = iframeRef.current?.contentWindow as
      | (Window & { [VISUAL_RUNTIME_FLAG]?: boolean })
      | null;
    const frameDocument = iframeRef.current?.contentDocument;
    if (!frameWindow || !frameDocument) return;
    if (frameWindow[VISUAL_RUNTIME_FLAG]) return;
    const parentOrigin = window.location.origin;
    const script = frameDocument.createElement("script");
    script.type = "text/javascript";
    script.textContent = `
      (function () {
        if (window.${VISUAL_RUNTIME_FLAG}) return;
        window.${VISUAL_RUNTIME_FLAG} = true;
        var enabled = false;
        var parentOrigin = ${JSON.stringify(parentOrigin)};
        var channel = "${PREVIEW_CHANNEL}";
        var currentEl = null;
        var prevOutline = "";
        var prevCursor = "";

        function isEditable(el) {
          return el instanceof HTMLElement && el !== document.body && el !== document.documentElement;
        }
        function clearHover() {
          if (!currentEl) return;
          currentEl.style.outline = prevOutline;
          currentEl.style.cursor = prevCursor;
          currentEl = null;
        }
        function setHover(el) {
          if (currentEl === el) return;
          clearHover();
          currentEl = el;
          prevOutline = el.style.outline || "";
          prevCursor = el.style.cursor || "";
          el.style.outline = "2px solid #FF6B2C";
          el.style.cursor = "crosshair";
        }

        document.addEventListener("mouseover", function (event) {
          if (!enabled) return;
          var el = event.target;
          if (!isEditable(el)) return;
          setHover(el);
        }, true);

        document.addEventListener("mouseout", function (event) {
          if (!enabled) return;
          if (event.target === currentEl) {
            clearHover();
          }
        }, true);

        document.addEventListener("click", function (event) {
          if (!enabled) return;
          var el = event.target;
          if (!isEditable(el)) return;
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          var rect = el.getBoundingClientRect();
          window.parent.postMessage({
            channel: channel,
            type: "ELEMENT_SELECTED",
            payload: {
              tagName: (el.tagName || "").toLowerCase(),
              className: (el.className || ""),
              id: (el.id || ""),
              textContent: (el.textContent || "").trim().slice(0, 50),
              boundingClientRect: {
                x: rect.x, y: rect.y, width: rect.width, height: rect.height,
                top: rect.top, left: rect.left, right: rect.right, bottom: rect.bottom
              }
            }
          }, parentOrigin);
        }, true);

        window.addEventListener("message", function (event) {
          var data = event.data || {};
          if (!data || data.channel !== channel) return;
          if (data.type === "VISUAL_EDIT_TOGGLE") {
            enabled = !!data.enabled;
            if (!enabled) clearHover();
          }
          if (data.type === "VISUAL_EDIT_CLEAR") {
            clearHover();
          }
        });
      })();
    `;
    frameDocument.head.appendChild(script);
    frameWindow[VISUAL_RUNTIME_FLAG] = true;
  };

  useEffect(() => {
    if (lowBandwidthMode) return;
    if (!livePreview || !iframeRef.current) return;
    const template = mapFrameworkToTemplate(framework);
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
      window.setTimeout(() => {
        injectVisualOverlayScript();
        postVisualState(visualEditEnabled);
      }, 500);
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
  }, [framework, sandpackFiles, livePreview, visualEditEnabled, lowBandwidthMode]);

  useEffect(() => {
    if (lowBandwidthMode) return;
    if (!livePreview || !ready) return;
    injectVisualOverlayScript();
    postVisualState(visualEditEnabled);
    const frame = iframeRef.current;
    if (!frame) return;
    const onLoad = (): void => {
      injectVisualOverlayScript();
      postVisualState(visualEditEnabled);
    };
    frame.addEventListener("load", onLoad);
    return () => frame.removeEventListener("load", onLoad);
  }, [ready, livePreview, visualEditEnabled, lowBandwidthMode]);

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
        {livePreview && !ready ? (
          <div className="absolute inset-3 animate-pulse rounded-xl border border-brand-border bg-brand-card2" />
        ) : null}
        {livePreview && !lowBandwidthMode ? (
          <iframe
            ref={iframeRef}
            title="Preview"
            className={cn(
              "h-full rounded-xl border border-brand-border bg-white transition-all",
              widthClass,
            )}
          />
        ) : livePreview && lowBandwidthMode ? (
          <div className="flex h-full w-full items-center justify-center rounded-xl border border-brand-border bg-brand-card2 p-6 text-center text-sm text-brand-sub">
            Low-bandwidth mode is enabled. Live preview is simplified to reduce network usage.
          </div>
        ) : reactNativePreview ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-4 rounded-xl border border-brand-border bg-brand-card2 p-6 text-center">
            <div className="relative mx-auto h-[360px] w-[190px] rounded-[2.5rem] border-4 border-brand-border bg-brand-bg p-3 shadow-2xl">
              <div className="h-full w-full rounded-[2rem] border border-brand-border bg-[#0d1324] px-3 py-5 text-center">
                <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-brand-border" />
                <p className="font-display text-lg font-bold text-brand-or">React Native App</p>
                <p className="mt-2 text-xs text-brand-sub">Use Expo Go for live device preview</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onBuildApk}
              className="rounded-lg bg-brand-gradient px-4 py-2 text-sm font-semibold text-white"
            >
              Build APK
            </button>
          </div>
        ) : flutterPreview ? (
          <div className="flex h-full w-full items-center justify-center rounded-xl border border-brand-border bg-brand-card2 p-6">
            <div className="w-full max-w-lg rounded-xl border border-brand-border bg-brand-bg p-5 text-left">
              <h3 className="text-base font-semibold text-brand-text">
                Flutter preview is not available in browser
              </h3>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-brand-sub">
                <li>Install Flutter SDK on your machine.</li>
                <li>Run <code className="rounded bg-brand-card px-1 py-0.5">flutter pub get</code>.</li>
                <li>
                  Run <code className="rounded bg-brand-card px-1 py-0.5">flutter run</code> on a device or emulator.
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-xl border border-brand-border bg-brand-card2 p-6 text-center text-sm text-brand-sub">
            Live preview not available for this framework. Server-side preview coming in
            Phase 4.
          </div>
        )}
      </div>
      <div className="border-t border-brand-border px-3 py-2 text-xs text-brand-sub">
        {livePreview
          ? ready
            ? lowBandwidthMode
              ? "● Low-bandwidth simplified preview"
              : `● Preview ready · Edit ${visualEditEnabled ? "on" : "off"}`
            : "● Building preview..."
          : reactNativePreview
            ? "● React Native local preview guidance"
            : flutterPreview
              ? "● Flutter local-run instructions"
              : `● ${framework} editor mode`}
      </div>
    </aside>
  );
}
