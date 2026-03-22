"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FileTree } from "@/components/studio/FileTree";
import { ChatPanel } from "@/components/studio/ChatPanel";
import { CodePanel } from "@/components/studio/CodePanel";
import { PreviewPanel } from "@/components/studio/PreviewPanel";
import { StudioNavbar } from "@/components/studio/StudioNavbar";
import { ResizeDivider } from "@/components/studio/ResizeDivider";
import { VersionHistory } from "@/components/studio/VersionHistory";
import { StatusBar } from "@/components/studio/StatusBar";
import { useStudioStore } from "@/store/studioStore";
import { useUserStore } from "@/store/userStore";
import { supabase } from "@/lib/supabase/client";
import { detectLanguageFromPath } from "@/lib/studio/file-utils";
import type { ProjectFile } from "@/types/studio";

type StudioLayoutProps = {
  projectId: string;
  initialProjectName: string;
  initialFiles: ProjectFile[];
  initialConversationId: string | null;
  projectFramework: string;
  initialMessages: Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
    createdAt: string;
    diffs?: Array<{
      id: string;
      filePath: string;
      summary: string;
      before: string;
      after: string;
      securitySensitive?: boolean;
    }>;
    creditsUsed?: number;
  }>;
  initialVersions: Array<{
    id: string;
    label: string;
    bookmarked: boolean;
    createdAt: string;
  }>;
};

export function StudioLayout({
  projectId,
  initialProjectName,
  initialFiles,
  initialConversationId,
  projectFramework,
  initialMessages,
  initialVersions,
}: StudioLayoutProps): React.ReactElement {
  const [files, setFiles] = useState<ProjectFile[]>(initialFiles);
  const [activeFilePath, setActiveFilePath] = useState<string | null>(
    initialFiles[0]?.path ?? null,
  );
  const [projectName, setProjectName] = useState(initialProjectName);
  const [versions, setVersions] = useState(initialVersions);
  const [versionOpen, setVersionOpen] = useState(false);
  const [chatDragging, setChatDragging] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const saveTimeoutRef = useRef<Record<string, number>>({});
  const {
    chatWidth,
    previewWidth,
    chatCollapsed,
    previewCollapsed,
    setChatWidth,
    setActiveTab,
    toggleChatCollapsed,
    togglePreviewCollapsed,
  } = useStudioStore();
  const credits = useUserStore((state) => state.credits);

  const activeFile = useMemo(
    () => files.find((file) => file.path === activeFilePath) ?? null,
    [files, activeFilePath],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("humnexa-chat-width");
    if (stored) {
      const width = Number(stored);
      if (!Number.isNaN(width)) {
        setChatWidth(Math.min(Math.max(width, 280), 680));
      }
    }
  }, [setChatWidth]);

  const filePaths = files.map((file) => file.path);

  const persistFile = async (
    path: string,
    content: string,
    fileId: string | null,
  ): Promise<void> => {
    const payload = {
      project_id: projectId,
      file_path: path,
      content,
      ...(fileId ? { id: fileId } : {}),
    };
    const db = supabase as unknown as {
      from: (table: string) => {
        upsert: (values: Record<string, unknown>) => {
          select: (columns: string) => {
            single: () => Promise<{ error: { message?: string } | null }>;
          };
        };
      };
    };
    const { error } = await db
      .from("project_files")
      .upsert(payload)
      .select("id")
      .single();
    if (error) {
      setSaveError(error.message ?? "Unable to save file");
    } else {
      setSaveError(null);
    }
  };

  const handleSelectFile = (path: string): void => {
    setActiveFilePath(path);
    setActiveTab("code");
  };

  const handleCodeChange = (value: string): void => {
    if (!activeFile) return;
    const current = activeFile;
    setFiles((prev) =>
      prev.map((file) =>
        file.path === current.path
          ? { ...file, content: value, updatedAt: new Date().toISOString() }
          : file,
      ),
    );

    if (saveTimeoutRef.current[current.path]) {
      window.clearTimeout(saveTimeoutRef.current[current.path]);
    }
    saveTimeoutRef.current[current.path] = window.setTimeout(() => {
      void persistFile(current.path, value, current.id);
    }, 500);
  };

  const startChatDrag = (event: React.MouseEvent<HTMLDivElement>): void => {
    event.preventDefault();
    setChatDragging(true);

    const onMove = (moveEvent: MouseEvent): void => {
      const nextWidth = Math.min(Math.max(moveEvent.clientX - 210, 280), 680);
      setChatWidth(nextWidth);
      window.localStorage.setItem("humnexa-chat-width", String(nextWidth));
    };

    const onUp = (): void => {
      setChatDragging(false);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const restoreVersion = async (versionId: string): Promise<void> => {
    const db = supabase as unknown as {
      from: (table: string) => {
        select: (columns: string) => {
          eq: (column: string, value: string) => {
            eq: (column2: string, value2: string) => {
              maybeSingle: () => Promise<{
                data: { snapshot: Array<{ path: string; content: string }> } | null;
                error: { message?: string } | null;
              }>;
            };
          };
        };
        delete: () => {
          eq: (column: string, value: string) => Promise<unknown>;
        };
        insert: (values: Array<Record<string, unknown>>) => Promise<unknown>;
      };
    };
    const { data: version, error } = await db
      .from("project_versions")
      .select("snapshot")
      .eq("id", versionId)
      .eq("project_id", projectId)
      .maybeSingle();
    if (error || !version?.snapshot) return;

    const snapshot = version.snapshot as Array<{
      path: string;
      content: string;
    }>;
    await db.from("project_files").delete().eq("project_id", projectId);
    if (snapshot.length > 0) {
      await db.from("project_files").insert(
        snapshot.map((file) => ({
          project_id: projectId,
          file_path: file.path,
          content: file.content,
        })),
      );
    }
    setFiles(
      snapshot.map((file, idx) => ({
        id: `restored-${idx}`,
        path: file.path,
        content: file.content,
        updatedAt: new Date().toISOString(),
        language: detectLanguageFromPath(file.path),
      })),
    );
    setActiveFilePath(snapshot[0]?.path ?? null);
  };

  const refreshVersions = async (): Promise<void> => {
    const db = supabase as unknown as {
      from: (table: string) => {
        select: (columns: string) => {
          eq: (column: string, value: string) => {
            order: (
              column2: string,
              options?: { ascending?: boolean },
            ) => {
              limit: (count: number) => Promise<{
                data: Array<{
                  id: string;
                  label: string;
                  bookmarked: boolean;
                  created_at: string;
                }> | null;
              }>;
            };
          };
        };
      };
    };
    const { data } = await db
      .from("project_versions")
      .select("id,label,bookmarked,created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) {
      setVersions(
        data.map((row) => ({
          id: row.id,
          label: row.label,
          bookmarked: row.bookmarked,
          createdAt: new Date(row.created_at).toLocaleString("en-IN"),
        })),
      );
    }
  };

  useEffect(() => {
    void refreshVersions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  return (
    <div className="flex min-h-screen flex-col bg-brand-bg">
      <StudioNavbar
        projectName={projectName}
        credits={credits}
        onProjectNameChange={setProjectName}
        onToggleChat={toggleChatCollapsed}
        onTogglePreview={togglePreviewCollapsed}
        onToggleVersions={() => setVersionOpen((v) => !v)}
      />
      <div className="relative flex flex-1 overflow-hidden">
        {versionOpen ? (
          <VersionHistory
            versions={versions}
            onRestore={(versionId) => {
              void restoreVersion(versionId);
            }}
          />
        ) : null}

        <aside className="w-[210px] border-r border-brand-border">
          <FileTree
            files={filePaths}
            activeFile={activeFilePath}
            onSelect={handleSelectFile}
          />
        </aside>

        <section className="flex min-w-0 flex-1">
          <div
            className={`${chatCollapsed ? "w-10" : ""} border-r border-brand-border`}
            style={chatCollapsed ? undefined : { width: chatWidth }}
          >
            {chatCollapsed ? (
              <button
                type="button"
                onClick={toggleChatCollapsed}
                className="h-full w-full bg-brand-card text-xs text-brand-sub [writing-mode:vertical-rl]"
              >
                💬 Chat
              </button>
            ) : (
              <ChatPanel
                projectId={projectId}
                conversationId={initialConversationId}
                initialMessages={initialMessages}
                currentFiles={files}
                onApplyFileChanges={(changedFiles) => {
                  setFiles((prev) => {
                    const map = new Map(prev.map((f) => [f.path, f]));
                    for (const changed of changedFiles) {
                      const existing = map.get(changed.path);
                      map.set(changed.path, {
                        id: existing?.id ?? `new-${changed.path}`,
                        path: changed.path,
                        content: changed.content,
                        language: detectLanguageFromPath(changed.path),
                        updatedAt: new Date().toISOString(),
                      });
                    }
                    return Array.from(map.values());
                  });
                }}
                onRejectChanges={() => {
                  if (versions[0]) {
                    void restoreVersion(versions[0].id);
                  }
                }}
              />
            )}
          </div>

          {!chatCollapsed ? (
            <ResizeDivider dragging={chatDragging} onMouseDown={startChatDrag} />
          ) : null}

          <div className="min-w-[320px] flex-1">
            {activeFile ? (
              <CodePanel
                path={activeFile.path}
                content={activeFile.content}
                language={activeFile.language}
                onChange={handleCodeChange}
              />
            ) : (
              <div className="flex h-full items-center justify-center rounded-2xl border border-brand-border bg-brand-card text-brand-sub">
                Select a file to start editing
              </div>
            )}
          </div>
        </section>

        {!previewCollapsed ? <ResizeDivider /> : null}

        <aside
          className={`${previewCollapsed ? "w-10" : ""} border-l border-brand-border`}
          style={previewCollapsed ? undefined : { width: previewWidth }}
        >
          {previewCollapsed ? (
            <button
              type="button"
              onClick={togglePreviewCollapsed}
              className="h-full w-full bg-brand-card text-xs text-brand-sub [writing-mode:vertical-rl]"
            >
              👁 Preview
            </button>
          ) : (
            <PreviewPanel files={files} framework={projectFramework} />
          )}
        </aside>
      </div>
      <StatusBar />
      {saveError && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed bottom-3 right-3 z-50 rounded-md border border-brand-error bg-brand-card px-3 py-2 text-xs text-brand-error">
              Save failed: {saveError}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
