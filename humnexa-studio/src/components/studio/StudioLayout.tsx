"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { nanoid } from "nanoid";
import { FileTree } from "@/components/studio/FileTree";
import { ChatPanel } from "@/components/studio/ChatPanel";
import { CodePanel } from "@/components/studio/CodePanel";
import { PreviewPanel } from "@/components/studio/PreviewPanel";
import { StudioNavbar } from "@/components/studio/StudioNavbar";
import { ResizeDivider } from "@/components/studio/ResizeDivider";
import { VersionHistory } from "@/components/studio/VersionHistory";
import { StatusBar } from "@/components/studio/StatusBar";
import { DeployModal } from "@/components/deploy/DeployModal";
import { useStudioStore } from "@/store/studioStore";
import { useUserStore } from "@/store/userStore";
import { supabase } from "@/lib/supabase/client";
import { detectLanguageFromPath } from "@/lib/studio/file-utils";
import { estimateCredits } from "@/lib/credits/estimate";
import type { ProjectFile } from "@/types/studio";

type DeployStreamEvent =
  | {
      type: "step";
      step: "security" | "build" | "deploy";
      status: "running" | "success" | "failed";
      message: string;
    }
  | {
      type: "security_report";
      critical: Array<{ file: string; issue: string }>;
      high: Array<{ file: string; issue: string }>;
      medium: Array<{ file: string; issue: string }>;
      blockDeploy: boolean;
    }
  | {
      type: "deploy_status";
      readyState: string;
      url: string | null;
      deploymentId: string;
    }
  | {
      type: "success";
      deploymentId: string;
      url: string;
      message: string;
    }
  | {
      type: "error";
      code: string;
      message: string;
      issues?: Array<{ file: string; issue: string }>;
    };

type DiffPatch = {
  path: string;
  content: string;
};

type NotificationEventRow = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  created_at: string;
};

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
  const [pushLoading, setPushLoading] = useState(false);
  const [pushedRepoUrl, setPushedRepoUrl] = useState<string | null>(null);
  const [pushToast, setPushToast] = useState<string | null>(null);
  const [toastTone, setToastTone] = useState<"default" | "success" | "error">(
    "default",
  );
  const [deployOpen, setDeployOpen] = useState(false);
  const [deployLoading, setDeployLoading] = useState(false);
  const [deployLogs, setDeployLogs] = useState<string[]>([]);
  const [deployStep, setDeployStep] = useState<"security" | "build" | "deploy">(
    "security",
  );
  const [deployStatusText, setDeployStatusText] = useState("Ready to deploy.");
  const [deployLiveUrl, setDeployLiveUrl] = useState<string | null>(null);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [securityReport, setSecurityReport] = useState<{
    critical: Array<{ file: string; issue: string }>;
    high: Array<{ file: string; issue: string }>;
    medium: Array<{ file: string; issue: string }>;
    blockDeploy: boolean;
  } | null>(null);
  const desktopNotifiedRef = useRef<string[]>([]);
  const pushTimeoutRef = useRef<number | null>(null);
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
    enqueuePrompt,
    setPlanMode,
    autoApply,
    setAutoApply,
  } = useStudioStore();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("humnexa-auto-apply");
    if (stored === "true" || stored === "false") {
      setAutoApply(stored === "true");
    }
  }, [setAutoApply]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("humnexa-auto-apply", autoApply ? "true" : "false");
  }, [autoApply]);
  const credits = useUserStore((state) => state.credits);
  const userId = useUserStore((state) => state.userId);

  useEffect(() => {
    if (userId) return;
    void supabase.auth.getUser().then(({ data }) => {
      const id = data.user?.id;
      if (id) {
        useUserStore.getState().setUser({
          userId: id,
          name: data.user?.user_metadata?.full_name ?? "Builder",
        });
      }
    });
  }, [userId]);

  useEffect(() => {
    if (!userId || typeof window === "undefined" || !("Notification" in window)) return;
    const channel = supabase
      .channel(`studio-desktop-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const event = payload.new as NotificationEventRow;
          if (
            !["deploy_success", "deploy_failed", "credits_zero"].includes(event.type)
          ) {
            return;
          }
          if (Notification.permission !== "granted") return;
          if (desktopNotifiedRef.current.includes(event.id)) return;
          desktopNotifiedRef.current = [
            ...desktopNotifiedRef.current.slice(-20),
            event.id,
          ];
          new Notification(event.title, { body: event.body });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

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

  const pushToGitHub = async (): Promise<void> => {
    try {
      setPushLoading(true);
      setPushToast(null);
      const response = await fetch(`/api/projects/${projectId}/push`, {
        method: "POST",
      });
      const payload = (await response.json()) as {
        error?: string;
        repoUrl?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "Push failed");
      }
      setPushedRepoUrl(payload.repoUrl ?? null);
      setToastTone("success");
      setPushToast("✅ Pushed successfully");
    } catch (error) {
      setToastTone("error");
      setPushToast(
        `❌ ${
          error instanceof Error
            ? error.message
            : "Unable to push to GitHub"
        }`,
      );
    } finally {
      setPushLoading(false);
      if (pushTimeoutRef.current) {
        window.clearTimeout(pushTimeoutRef.current);
      }
      pushTimeoutRef.current = window.setTimeout(() => setPushToast(null), 3500);
    }
  };

  const syncDiffsToDatabase = async (changedFiles: DiffPatch[]): Promise<void> => {
    const db = supabase as unknown as {
      from: (table: string) => {
        upsert: (values: Record<string, unknown>) => Promise<{
          error: { message?: string } | null;
        }>;
      };
    };
    for (const changed of changedFiles) {
      const { error } = await db.from("project_files").upsert({
        project_id: projectId,
        file_path: changed.path,
        content: changed.content,
      });
      if (error) {
        throw new Error(error.message ?? `Failed to update ${changed.path}`);
      }
    }
  };

  const queueFixWithAI = (errorMessage: string): void => {
    const prompt = `Deployment failed with this error:\n${errorMessage}\nPlease fix the project files so deployment succeeds, then explain what changed.`;
    enqueuePrompt({
      id: nanoid(),
      prompt,
      mode: "agent",
      estimatedCost: estimateCredits(prompt, "agent"),
      createdAt: new Date().toISOString(),
    });
    setPlanMode(false);
    setDeployOpen(false);
    setToastTone("default");
    setPushToast("Queued deploy fix prompt for AI");
    if (pushTimeoutRef.current) {
      window.clearTimeout(pushTimeoutRef.current);
    }
    pushTimeoutRef.current = window.setTimeout(() => setPushToast(null), 3500);
  };

  const startDeploy = async (): Promise<void> => {
    try {
      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "default"
      ) {
        await Notification.requestPermission();
      }
      setDeployOpen(true);
      setDeployLoading(true);
      setDeployStep("security");
      setDeployStatusText("Starting deployment...");
      setDeployLogs(["Starting deploy pipeline..."]);
      setDeployLiveUrl(null);
      setDeployError(null);
      setSecurityReport(null);

      const response = await fetch(`/api/projects/${projectId}/deploy`, {
        method: "POST",
      });

      if (response.status === 400) {
        const payload = (await response.json()) as {
          error?: string;
          issues?: Array<{ file: string; issue: string }>;
        };
        setDeployStep("security");
        setDeployStatusText("Security scan failed.");
        setDeployError(payload.error ?? "Security issues found.");
        setSecurityReport({
          critical: payload.issues ?? [],
          high: [],
          medium: [],
          blockDeploy: true,
        });
        setDeployLogs((prev) => [...prev, "Deployment blocked by security scan."]);
        return;
      }

      if (!response.ok || !response.body) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? "Failed to start deployment");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        buffer += decoder.decode(value ?? new Uint8Array(), {
          stream: !doneReading,
        });

        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const event of events) {
          if (!event.startsWith("data:")) continue;
          const payload = event.replace("data:", "").trim();
          if (!payload || payload === "[DONE]") continue;
          const parsed = JSON.parse(payload) as DeployStreamEvent;
          if (parsed.type === "step") {
            setDeployStep(parsed.step);
            setDeployStatusText(parsed.message);
            setDeployLogs((prev) => [...prev, parsed.message]);
            continue;
          }
          if (parsed.type === "security_report") {
            setSecurityReport({
              critical: parsed.critical,
              high: parsed.high,
              medium: parsed.medium,
              blockDeploy: parsed.blockDeploy,
            });
            continue;
          }
          if (parsed.type === "deploy_status") {
            setDeployLogs((prev) => [
              ...prev,
              `Deploy status: ${parsed.readyState}${
                parsed.url ? ` (${parsed.url})` : ""
              }`,
            ]);
            continue;
          }
          if (parsed.type === "success") {
            setDeployLiveUrl(parsed.url);
            setDeployError(null);
            setDeployStatusText(parsed.message);
            setDeployLogs((prev) => [...prev, parsed.message]);
            continue;
          }
          if (parsed.type === "error") {
            setDeployError(parsed.message);
            setDeployStatusText(parsed.message);
            setDeployLogs((prev) => [...prev, parsed.message]);
            if (parsed.code === "SECURITY_ISSUES") {
              setDeployStep("security");
              setSecurityReport({
                critical: parsed.issues ?? [],
                high: [],
                medium: [],
                blockDeploy: true,
              });
            }
            if (parsed.code === "DEPLOY_FAILED" || parsed.code === "DEPLOY_TIMEOUT") {
              setDeployStep("deploy");
            }
          }
        }
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Deployment failed unexpectedly";
      setDeployError(message);
      setDeployStatusText(message);
      setDeployLogs((prev) => [...prev, message]);
    } finally {
      setDeployLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-brand-bg">
      <StudioNavbar
        userId={userId ?? ""}
        projectName={projectName}
        credits={credits}
        onDeploy={() => setDeployOpen(true)}
        onPush={() => {
          void pushToGitHub();
        }}
        pushLoading={pushLoading}
        pushedRepoUrl={pushedRepoUrl}
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
                autoApply={autoApply}
                onAutoApplyChange={setAutoApply}
                onApplyFileChanges={(changedFiles) => {
                  void syncDiffsToDatabase(changedFiles);
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
      {pushToast && typeof document !== "undefined"
        ? createPortal(
            <div
              className={`fixed bottom-16 right-3 z-50 rounded-md border px-3 py-2 text-xs ${
                toastTone === "success"
                  ? "border-brand-gr/40 bg-brand-gr/10 text-brand-gr"
                  : toastTone === "error"
                    ? "border-brand-error/40 bg-brand-error/10 text-brand-error"
                    : "border-brand-border bg-brand-card text-brand-text"
              }`}
            >
              {pushToast}
            </div>,
            document.body,
          )
        : null}
      <DeployModal
        open={deployOpen}
        logs={deployLogs}
        statusText={deployStatusText}
        currentStep={deployStep}
        loading={deployLoading}
        liveUrl={deployLiveUrl}
        errorMessage={deployError}
        securityReport={securityReport}
        onStart={() => {
          void startDeploy();
        }}
        onFixWithAI={queueFixWithAI}
        onClose={() => {
          if (!deployLoading) setDeployOpen(false);
        }}
      />
    </div>
  );
}
