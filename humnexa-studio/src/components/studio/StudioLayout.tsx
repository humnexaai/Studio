"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { nanoid } from "nanoid";
import FileTree from "@/components/studio/FileTree";
import { ChatPanel } from "@/components/studio/ChatPanel";
import { CodePanel } from "@/components/studio/CodePanel";
import { PreviewPanel } from "@/components/studio/PreviewPanel";
import { StudioNavbar } from "@/components/studio/StudioNavbar";
import { ResizeDivider } from "@/components/studio/ResizeDivider";
import VersionHistory from "@/components/studio/VersionHistory";
import { StatusBar } from "@/components/studio/StatusBar";
import { DeployModal } from "@/components/deploy/DeployModal";
import { PanelErrorBoundary } from "@/components/ui/PanelErrorBoundary";
import { useStudioStore } from "@/store/studioStore";
import { useUserStore } from "@/store/userStore";
import { supabase } from "@/lib/supabase/client";
import { createProjectPresence } from "@/lib/collaboration/presence";
import { detectLanguageFromPath } from "@/lib/studio/file-utils";
import { estimateCredits } from "@/lib/credits/estimate";
import type { ProjectFile } from "@/types/studio";

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(max-width: 767px)");
    const update = (): void => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return isMobile;
}

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
  metadata?: {
    project_name?: string;
    deployed_url?: string;
  } | null;
};

type TemplateCategory =
  | "ecommerce"
  | "education"
  | "portfolio"
  | "business"
  | "mobile"
  | "india"
  | "other";

type StudioLayoutProps = {
  projectId: string;
  initialProjectName: string;
  initialProjectMeta: {
    branchName: string | null;
    deployedUrl: string | null;
  };
  initialFiles: ProjectFile[];
  initialConversationId: string | null;
  projectFramework: string;
  initialProjectInstructions?: string | null;
  initialCustomDomain?: string | null;
  initialIsPublic?: boolean;
  initialLowBandwidthMode?: boolean;
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
  initialProjectMeta,
  initialFiles,
  initialConversationId,
  projectFramework,
  initialProjectInstructions,
  initialCustomDomain,
  initialIsPublic,
  initialLowBandwidthMode,
  initialMessages,
  initialVersions,
}: StudioLayoutProps): React.ReactElement {
  const isMobile = useIsMobile();
  const router = useRouter();
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
  const [deployedUrl, setDeployedUrl] = useState<string | null>(
    initialProjectMeta.deployedUrl ?? null,
  );
  const [deployError, setDeployError] = useState<string | null>(null);
  const [securityReport, setSecurityReport] = useState<{
    critical: Array<{ file: string; issue: string }>;
    high: Array<{ file: string; issue: string }>;
    medium: Array<{ file: string; issue: string }>;
    blockDeploy: boolean;
  } | null>(null);
  const [monacoErrorCount, setMonacoErrorCount] = useState(0);
  const [supabaseConnected, setSupabaseConnected] = useState(true);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [templateSubmitting, setTemplateSubmitting] = useState(false);
  const [templateName, setTemplateName] = useState(`${initialProjectName} Template`);
  const [templateDescription, setTemplateDescription] = useState("");
  const [templateCategory, setTemplateCategory] = useState<TemplateCategory>("business");
  const [templatePriceInr, setTemplatePriceInr] = useState(0);
  const [templateTagsInput, setTemplateTagsInput] = useState("");
  const [templateIndiaSpecific, setTemplateIndiaSpecific] = useState(true);
  const [apkModalOpen, setApkModalOpen] = useState(false);
  const [apkBuilding, setApkBuilding] = useState(false);
  const [apkBuildMessage, setApkBuildMessage] = useState<string | null>(null);
  const [apkBuildUrl, setApkBuildUrl] = useState<string | null>(null);
  const [projectInstructions, setProjectInstructions] = useState(
    initialProjectInstructions ?? "",
  );
  const [customDomain, setCustomDomain] = useState(initialCustomDomain ?? "");
  const [domainMessage, setDomainMessage] = useState<string | null>(null);
  const [domainModalOpen, setDomainModalOpen] = useState(false);
  const [domainVerifying, setDomainVerifying] = useState(false);
  const [publicProject, setPublicProject] = useState(Boolean(initialIsPublic));
  const [lowBandwidthMode] = useState(Boolean(initialLowBandwidthMode));
  const [savingProjectSettings, setSavingProjectSettings] = useState(false);
  const [collaborators, setCollaborators] = useState<
    Array<{ userId: string; name: string; avatarUrl: string | null; activeFile?: string | null }>
  >([]);
  const [collabInviteEmail, setCollabInviteEmail] = useState("");
  const [collabInviteRole, setCollabInviteRole] = useState<"viewer" | "editor">(
    "viewer",
  );
  const [mobileTab, setMobileTab] = useState<"chat" | "preview" | "files">("chat");
  const desktopNotifiedRef = useRef<string[]>([]);
  const pushTimeoutRef = useRef<number | null>(null);
  const saveTimeoutRef = useRef<Record<string, number>>({});
  const presenceRef = useRef<ReturnType<typeof createProjectPresence> | null>(null);
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
    planMode,
    setPlanMode,
    autoApply,
    setAutoApply,
    setMobilePlanMenuOpen,
    mobilePlanMenuOpen,
  } = useStudioStore();

  useEffect(() => {
    if (!isMobile) {
      setMobilePlanMenuOpen(false);
      return;
    }
    if (chatCollapsed) {
      toggleChatCollapsed();
    }
    if (previewCollapsed) {
      togglePreviewCollapsed();
    }
  }, [
    chatCollapsed,
    isMobile,
    previewCollapsed,
    setMobilePlanMenuOpen,
    toggleChatCollapsed,
    togglePreviewCollapsed,
  ]);

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
  const userName = useUserStore((state) => state.name);
  const lastModel = useUserStore((state) => state.lastModel);

  useEffect(() => {
    if (userId) return;
    void supabase.auth.getUser().then(({ data }) => {
      const id = data.user?.id;
      if (id) {
        useUserStore.getState().setUser({
          userId: id,
          name: data.user?.user_metadata?.full_name ?? "Builder",
          email: data.user?.email ?? null,
        });
      }
    });
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    void supabase
      .from("profiles")
      .select("credits_balance,plan_id,email,full_name")
      .eq("id", userId)
      .maybeSingle()
      .then(async ({ data }) => {
        const profile = data as
          | {
              credits_balance?: number | null;
              plan_id?: string | null;
              email?: string | null;
              full_name?: string | null;
            }
          | null;

        if (!profile) return;

        useUserStore.getState().setCredits(profile.credits_balance ?? 0);
        if (profile.full_name || profile.email) {
          useUserStore.getState().setUser({
            userId,
            name: profile.full_name ?? userName ?? "Builder",
            email: profile.email ?? null,
          });
        }

        if (profile.plan_id) {
          const { data: planRow } = await supabase
            .from("plans")
            .select("code")
            .eq("id", profile.plan_id)
            .maybeSingle();
          const planCode = (planRow as { code?: string | null } | null)?.code;
          if (
            planCode === "free" ||
            planCode === "starter" ||
            planCode === "pro" ||
            planCode === "business" ||
            planCode === "student"
          ) {
            useUserStore.getState().setPlanCode(planCode);
          }
        }
      });
  }, [userId, userName]);

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

  useEffect(() => {
    const channel = supabase.channel(`studio-health-${projectId}`);
    const timeout = window.setTimeout(() => setSupabaseConnected(false), 6000);
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        setSupabaseConnected(true);
        window.clearTimeout(timeout);
      }
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        setSupabaseConnected(false);
      }
    });
    return () => {
      window.clearTimeout(timeout);
      void supabase.removeChannel(channel);
    };
  }, [projectId]);

  useEffect(() => {
    if (!userId || lowBandwidthMode) {
      setCollaborators([]);
      return;
    }
    const presence = createProjectPresence(
      projectId,
      {
        id: userId,
        name: userName || "Builder",
        avatarUrl: null,
      },
      {
        onSync: (users) => {
          setCollaborators(
            users.map((u) => ({
              userId: u.userId,
              name: u.name,
              avatarUrl: u.avatarUrl,
              activeFile: u.activeFile,
            })),
          );
        },
      },
    );
    presenceRef.current = presence;
    return () => {
      void presence.leave();
      presenceRef.current = null;
    };
  }, [projectId, userId, userName, lowBandwidthMode]);

  useEffect(() => {
    if (lowBandwidthMode || !activeFilePath || !presenceRef.current) return;
    void presenceRef.current.broadcast({
      activeFile: activeFilePath,
    });
  }, [activeFilePath, lowBandwidthMode]);

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
    if (!lowBandwidthMode && presenceRef.current) {
      void presenceRef.current.broadcast({ activeFile: path });
    }
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
    if (!lowBandwidthMode && presenceRef.current) {
      void presenceRef.current.broadcast({ typing: true, activeFile: current.path });
    }
    saveTimeoutRef.current[current.path] = window.setTimeout(() => {
      void persistFile(current.path, value, current.id);
      if (!lowBandwidthMode && presenceRef.current) {
        void presenceRef.current.broadcast({ typing: false, activeFile: current.path });
      }
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

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      const target = event.target as HTMLElement | null;
      const inTextEntry =
        !!target &&
        (target.tagName === "TEXTAREA" ||
          target.tagName === "INPUT" ||
          target.isContentEditable);

      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === "p") {
        event.preventDefault();
        setPlanMode(!planMode);
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        if (inTextEntry) return;
        event.preventDefault();
        window.dispatchEvent(new Event("humnexa-chat-submit"));
        return;
      }

      if (event.key === "Escape") {
        if (deployOpen && !deployLoading) {
          setDeployOpen(false);
        }
        window.dispatchEvent(new Event("humnexa-close-modals"));
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [deployLoading, deployOpen, planMode, setPlanMode]);

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

  const normalizePath = (value: string): string =>
    value
      .trim()
      .replace(/^\/+/, "")
      .replace(/\/{2,}/g, "/");

  const createFileAtPath = async (pathInput: string): Promise<void> => {
    const path = normalizePath(pathInput);
    if (!path) return;
    if (files.some((file) => file.path === path)) {
      setToastTone("error");
      setPushToast("File already exists.");
      return;
    }
    try {
      await syncDiffsToDatabase([{ path, content: "" }]);
      setFiles((prev) => [
        ...prev,
        {
          id: `file-${Date.now()}`,
          path,
          content: "",
          language: detectLanguageFromPath(path),
          updatedAt: new Date().toISOString(),
        },
      ]);
      setActiveFilePath(path);
      setToastTone("success");
      setPushToast(`Created ${path}`);
    } catch (error) {
      setToastTone("error");
      setPushToast(error instanceof Error ? error.message : "Unable to create file");
    }
  };

  const createFolderAtPath = (pathInput: string): void => {
    const folder = normalizePath(pathInput).replace(/\/+$/, "");
    if (!folder) return;
    const placeholder = `${folder}/.gitkeep`;
    void createFileAtPath(placeholder);
  };

  const renameFilePath = async (oldPath: string, newPathInput: string): Promise<void> => {
    const newPath = normalizePath(newPathInput);
    if (!newPath || newPath === oldPath) return;
    const existing = files.find((file) => file.path === oldPath);
    if (!existing) return;
    try {
      await syncDiffsToDatabase([{ path: newPath, content: existing.content }]);
      const db = supabase as unknown as {
        from: (table: string) => {
          delete: () => {
            eq: (column: string, value: string) => {
              eq: (column2: string, value2: string) => Promise<{
                error: { message?: string } | null;
              }>;
            };
          };
        };
      };
      await db
        .from("project_files")
        .delete()
        .eq("project_id", projectId)
        .eq("file_path", oldPath);

      setFiles((prev) =>
        prev.map((file) =>
          file.path === oldPath
            ? {
                ...file,
                path: newPath,
                language: detectLanguageFromPath(newPath),
                updatedAt: new Date().toISOString(),
              }
            : file,
        ),
      );
      if (activeFilePath === oldPath) {
        setActiveFilePath(newPath);
      }
      setToastTone("success");
      setPushToast(`Renamed to ${newPath}`);
    } catch (error) {
      setToastTone("error");
      setPushToast(error instanceof Error ? error.message : "Rename failed");
    }
  };

  const deleteFilePath = async (path: string): Promise<void> => {
    try {
      const db = supabase as unknown as {
        from: (table: string) => {
          delete: () => {
            eq: (column: string, value: string) => {
              eq: (column2: string, value2: string) => Promise<{
                error: { message?: string } | null;
              }>;
            };
          };
        };
      };
      const { error } = await db
        .from("project_files")
        .delete()
        .eq("project_id", projectId)
        .eq("file_path", path);
      if (error) {
        throw new Error(error.message ?? "Delete failed");
      }
      setFiles((prev) => prev.filter((file) => file.path !== path));
      if (activeFilePath === path) {
        const next = files.find((file) => file.path !== path);
        setActiveFilePath(next?.path ?? null);
      }
      setToastTone("default");
      setPushToast(`Deleted ${path}`);
    } catch (error) {
      setToastTone("error");
      setPushToast(error instanceof Error ? error.message : "Delete failed");
    }
  };

  const duplicateFilePath = async (path: string): Promise<void> => {
    const source = files.find((file) => file.path === path);
    if (!source) return;
    const dotIndex = source.path.lastIndexOf(".");
    const copiedPath =
      dotIndex > 0
        ? `${source.path.slice(0, dotIndex)}_copy${source.path.slice(dotIndex)}`
        : `${source.path}_copy`;
    await createFileAtPath(copiedPath);
    setFiles((prev) =>
      prev.map((file) =>
        file.path === copiedPath
          ? { ...file, content: source.content, updatedAt: new Date().toISOString() }
          : file,
      ),
    );
    await syncDiffsToDatabase([{ path: copiedPath, content: source.content }]);
    setActiveFilePath(copiedPath);
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

  const publishAsTemplate = async (): Promise<void> => {
    if (!templateName.trim()) {
      setToastTone("error");
      setPushToast("Template name is required.");
      return;
    }
    try {
      setTemplateSubmitting(true);
      const response = await fetch(`/api/projects/${projectId}/publish-template`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: templateName.trim(),
          description: templateDescription.trim(),
          category: templateCategory,
          price_inr: Math.max(0, Number(templatePriceInr) || 0),
          tags: templateTagsInput
            .split(",")
            .map((part) => part.trim())
            .filter(Boolean),
          is_india_specific: templateIndiaSpecific,
        }),
      });
      const payload = (await response.json()) as { error?: string; success?: boolean };
      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "Failed to publish template");
      }
      setTemplateModalOpen(false);
      setToastTone("success");
      setPushToast(
        "Template submitted for review. It will appear in marketplace within 24 hours.",
      );
      if (pushTimeoutRef.current) {
        window.clearTimeout(pushTimeoutRef.current);
      }
      pushTimeoutRef.current = window.setTimeout(() => setPushToast(null), 4200);
    } catch (error) {
      setToastTone("error");
      setPushToast(error instanceof Error ? error.message : "Template publish failed");
    } finally {
      setTemplateSubmitting(false);
    }
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
            setDeployedUrl(parsed.url);
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

  const startApkBuild = async (): Promise<void> => {
    try {
      setApkBuilding(true);
      const response = await fetch(`/api/projects/${projectId}/build-apk`, {
        method: "POST",
      });
      const payload = (await response.json()) as {
        error?: string;
        data?: {
          message?: string;
          mockBuildUrl?: string;
          expoTestInstructions?: string[];
        };
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to start APK build");
      }

      setApkBuildMessage(payload.data?.message ?? "APK build request submitted.");
      setApkBuildUrl(payload.data?.mockBuildUrl ?? null);
      setToastTone("success");
      setPushToast("APK build queued successfully.");
    } catch (error) {
      setToastTone("error");
      setPushToast(error instanceof Error ? error.message : "APK build failed");
    } finally {
      setApkBuilding(false);
      if (pushTimeoutRef.current) {
        window.clearTimeout(pushTimeoutRef.current);
      }
      pushTimeoutRef.current = window.setTimeout(() => setPushToast(null), 3500);
    }
  };

  const saveProjectSettings = async (): Promise<void> => {
    try {
      setSavingProjectSettings(true);
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectInstructions: projectInstructions.slice(0, 10000),
          customDomain: customDomain.trim(),
          isPublic: publicProject,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to save project settings");
      }
      setToastTone("success");
      setPushToast("Project settings updated.");
    } catch (error) {
      setToastTone("error");
      setPushToast(error instanceof Error ? error.message : "Failed to save settings");
    } finally {
      setSavingProjectSettings(false);
      if (pushTimeoutRef.current) {
        window.clearTimeout(pushTimeoutRef.current);
      }
      pushTimeoutRef.current = window.setTimeout(() => setPushToast(null), 3200);
    }
  };

  const saveCustomDomain = async (): Promise<void> => {
    try {
      setDomainVerifying(true);
      const response = await fetch(`/api/projects/${projectId}/domain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: customDomain.trim() }),
      });
      const payload = (await response.json()) as {
        error?: string;
        data?: { verified?: boolean; instruction?: string };
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to configure custom domain");
      }
      setDomainMessage(
        payload.data?.verified
          ? "Domain verified successfully."
          : payload.data?.instruction ??
              "Add a CNAME record pointing your domain to cname.vercel-dns.com, then verify.",
      );
      setDomainModalOpen(true);
    } catch (error) {
      setToastTone("error");
      setPushToast(error instanceof Error ? error.message : "Domain setup failed");
    } finally {
      setDomainVerifying(false);
    }
  };

  const openArenaMode = (): void => {
    router.push(`/studio/${projectId}/arena`);
  };


  const inviteCollaborator = async (): Promise<void> => {
    if (!collabInviteEmail.trim()) return;
    try {
      const response = await fetch(`/api/projects/${projectId}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: collabInviteEmail.trim().toLowerCase(),
          role: collabInviteRole,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Invite failed");
      }
      setCollabInviteEmail("");
      setToastTone("success");
      setPushToast("Collaborator invited.");
    } catch (error) {
      setToastTone("error");
      setPushToast(error instanceof Error ? error.message : "Invite failed");
    } finally {
      if (pushTimeoutRef.current) {
        window.clearTimeout(pushTimeoutRef.current);
      }
      pushTimeoutRef.current = window.setTimeout(() => setPushToast(null), 2600);
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
        onPublishTemplate={() => setTemplateModalOpen(true)}
        onOpenArena={openArenaMode}
        collaboratorsCount={collaborators.length}
        collaboratorsSlot={null}
        onShareProject={() => {
          if (typeof window === "undefined") return;
          const shareUrl = `${window.location.origin}/projects/${projectId}`;
          void navigator.clipboard.writeText(shareUrl).then(() => {
            setToastTone("success");
            setPushToast("Share link copied.");
            if (pushTimeoutRef.current) {
              window.clearTimeout(pushTimeoutRef.current);
            }
            pushTimeoutRef.current = window.setTimeout(() => setPushToast(null), 2200);
          });
        }}
      />
      <div className="border-b border-brand-border bg-brand-surf px-3 py-2">
        <div className="grid gap-2 md:grid-cols-3">
          <button
            type="button"
            onClick={() => setTemplateModalOpen(true)}
            className="rounded-lg border border-brand-border bg-brand-card px-3 py-1.5 text-xs text-brand-sub hover:text-brand-text"
          >
            Publish as Template
          </button>
          <button
            type="button"
            onClick={() => {
              void saveProjectSettings();
            }}
            disabled={savingProjectSettings}
            className="rounded-lg border border-brand-border bg-brand-card px-3 py-1.5 text-xs text-brand-sub hover:text-brand-text disabled:opacity-60"
          >
            {savingProjectSettings ? "Saving..." : "Save Project Settings"}
          </button>
          <button
            type="button"
            onClick={() => {
              void inviteCollaborator();
            }}
            className="rounded-lg border border-brand-border bg-brand-card px-3 py-1.5 text-xs text-brand-sub hover:text-brand-text"
          >
            Invite Collaborator
          </button>
        </div>
        <div className="mt-2 grid gap-2 md:grid-cols-2">
          <textarea
            value={projectInstructions}
            maxLength={10000}
            onChange={(event) => setProjectInstructions(event.target.value)}
            rows={3}
            placeholder="Project Instructions (persistent context for this project)"
            className="w-full rounded-lg border border-brand-border bg-brand-card px-3 py-2 text-xs text-brand-text outline-none"
          />
          <div className="space-y-2">
            <input
              value={customDomain}
              onChange={(event) => setCustomDomain(event.target.value)}
              placeholder="Custom domain (e.g. myapp.com)"
              className="w-full rounded-lg border border-brand-border bg-brand-card px-3 py-2 text-xs text-brand-text outline-none"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  void saveCustomDomain();
                }}
                disabled={domainVerifying}
                className="rounded-lg border border-brand-border bg-brand-card px-3 py-1.5 text-xs text-brand-sub hover:text-brand-text disabled:opacity-60"
              >
                {domainVerifying ? "Verifying..." : "Configure Domain"}
              </button>
              <label className="inline-flex items-center gap-2 rounded-lg border border-brand-border bg-brand-card px-3 py-1.5 text-xs text-brand-sub">
                <input
                  type="checkbox"
                  checked={publicProject}
                  onChange={(event) => setPublicProject(event.target.checked)}
                  className="accent-brand-or"
                />
                Make Public
              </label>
              <input
                value={collabInviteEmail}
                onChange={(event) => setCollabInviteEmail(event.target.value)}
                placeholder="Invite email"
                className="min-w-0 flex-1 rounded-lg border border-brand-border bg-brand-card px-2 py-1.5 text-xs text-brand-text outline-none"
              />
              <select
                value={collabInviteRole}
                onChange={(event) =>
                  setCollabInviteRole(event.target.value as "viewer" | "editor")
                }
                className="rounded-lg border border-brand-border bg-brand-card px-2 py-1.5 text-xs text-brand-sub outline-none"
              >
                <option value="viewer">viewer</option>
                <option value="editor">editor</option>
              </select>
            </div>
            {domainMessage ? (
              <p className="text-[11px] text-brand-sub">{domainMessage}</p>
            ) : null}
          </div>
        </div>
      </div>
      <div className="relative flex flex-1 overflow-hidden pb-14 md:pb-0">
        {versionOpen ? (
          <VersionHistory
            versions={versions}
            onRestore={(versionId) => {
              void restoreVersion(versionId);
            }}
          />
        ) : null}

        <aside
          className={`w-[210px] border-r border-brand-border ${
            isMobile ? "hidden" : ""
          }`}
        >
          <PanelErrorBoundary panelName="FileTree">
            <FileTree
              files={filePaths}
              activeFile={activeFilePath}
              onSelect={handleSelectFile}
              onCreateFile={(path) => {
                void createFileAtPath(path);
              }}
              onCreateFolder={createFolderAtPath}
              onRenameFile={(oldPath, newPath) => {
                void renameFilePath(oldPath, newPath);
              }}
              onDeleteFile={(path) => {
                void deleteFilePath(path);
              }}
              onDuplicateFile={(path) => {
                void duplicateFilePath(path);
              }}
            />
          </PanelErrorBoundary>
        </aside>

        <section
          className={`flex min-w-0 flex-1 ${
            isMobile && mobileTab !== "chat" ? "hidden" : ""
          }`}
        >
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
              <PanelErrorBoundary panelName="ChatPanel">
                <ChatPanel
                  projectId={projectId}
                  conversationId={initialConversationId}
                  initialMessages={initialMessages}
                  currentFiles={files}
                  lowBandwidthMode={lowBandwidthMode}
                  mobileView={isMobile}
                  onLongPressToggleModeMenu={() => setMobilePlanMenuOpen(true)}
                  autoApply={autoApply}
                  onAutoApplyChange={setAutoApply}
                  selectedElement={null}
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
              </PanelErrorBoundary>
            )}
          </div>

          {!chatCollapsed ? (
            <ResizeDivider dragging={chatDragging} onMouseDown={startChatDrag} />
          ) : null}

          <div className="min-w-[320px] flex-1">
            {activeFile ? (
              <PanelErrorBoundary panelName="CodePanel">
                <CodePanel
                  path={activeFile.path}
                  content={activeFile.content}
                  language={activeFile.language}
                  onChange={handleCodeChange}
                  onErrorCountChange={setMonacoErrorCount}
                />
              </PanelErrorBoundary>
            ) : (
              <div className="flex h-full items-center justify-center rounded-2xl border border-brand-border bg-brand-card text-brand-sub">
                Select a file to start editing
              </div>
            )}
          </div>
        </section>

        {!previewCollapsed && !isMobile ? <ResizeDivider /> : null}

        <aside
          className={`${previewCollapsed ? "w-10" : ""} border-l border-brand-border ${
            isMobile && mobileTab !== "preview" ? "hidden" : ""
          }`}
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
            <PanelErrorBoundary panelName="PreviewPanel">
              <PreviewPanel
                files={files}
                framework={projectFramework}
                lowBandwidthMode={lowBandwidthMode}
                onBuildApk={() => setApkModalOpen(true)}
              />
            </PanelErrorBoundary>
          )}
        </aside>
      </div>
      {isMobile ? (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-brand-border bg-brand-card/95 backdrop-blur md:hidden">
          <div className="grid grid-cols-3">
            <button
              type="button"
              onClick={() => {
                setMobileTab("chat");
                setActiveTab("chat");
              }}
              className={`px-3 py-2 text-xs ${
                mobileTab === "chat" ? "text-brand-or" : "text-brand-sub"
              }`}
            >
              Chat
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileTab("preview");
                setActiveTab("code");
              }}
              className={`px-3 py-2 text-xs ${
                mobileTab === "preview" ? "text-brand-or" : "text-brand-sub"
              }`}
            >
              Preview
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileTab("files");
                setActiveTab("code");
              }}
              className={`px-3 py-2 text-xs ${
                mobileTab === "files" ? "text-brand-or" : "text-brand-sub"
              }`}
            >
              Files
            </button>
          </div>
        </div>
      ) : null}
      {isMobile && mobileTab === "files" ? (
        <div className="fixed inset-0 z-50 bg-black/60 md:hidden">
          <div className="absolute inset-0 top-14 overflow-auto bg-brand-surf">
            <div className="flex items-center justify-between border-b border-brand-border px-3 py-2">
              <p className="text-sm font-semibold">Files</p>
              <button
                type="button"
                onClick={() => setMobileTab("chat")}
                className="rounded-md border border-brand-border px-2 py-1 text-xs text-brand-sub"
              >
                Close
              </button>
            </div>
            <FileTree
              files={filePaths}
              activeFile={activeFilePath}
              onSelect={(path) => {
                handleSelectFile(path);
                setMobileTab("chat");
              }}
              onCreateFile={(path) => {
                void createFileAtPath(path);
              }}
              onCreateFolder={createFolderAtPath}
              onRenameFile={(oldPath, newPath) => {
                void renameFilePath(oldPath, newPath);
              }}
              onDeleteFile={(path) => {
                void deleteFilePath(path);
              }}
              onDuplicateFile={(path) => {
                void duplicateFilePath(path);
              }}
            />
          </div>
        </div>
      ) : null}
      <StatusBar
        branchName={initialProjectMeta.branchName}
        errorCount={monacoErrorCount}
        supabaseConnected={supabaseConnected}
        lastModel={lastModel}
        deployedUrl={deployedUrl}
      />
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
      {templateModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-brand-border bg-brand-card p-5">
            <h3 className="text-lg font-semibold">Publish as Template</h3>
            <div className="mt-4 grid gap-3">
              <input
                value={templateName}
                onChange={(event) => setTemplateName(event.target.value)}
                placeholder="Template name"
                className="w-full rounded-xl border border-brand-border bg-brand-card2 px-3 py-2 text-sm outline-none"
              />
              <textarea
                value={templateDescription}
                onChange={(event) => setTemplateDescription(event.target.value)}
                placeholder="Describe what this template includes"
                rows={3}
                className="w-full rounded-xl border border-brand-border bg-brand-card2 px-3 py-2 text-sm outline-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={templateCategory}
                  onChange={(event) => setTemplateCategory(event.target.value as TemplateCategory)}
                  className="rounded-xl border border-brand-border bg-brand-card2 px-3 py-2 text-sm outline-none"
                >
                  <option value="ecommerce">E-Commerce</option>
                  <option value="education">Education</option>
                  <option value="portfolio">Portfolio</option>
                  <option value="business">Business</option>
                  <option value="mobile">Mobile</option>
                  <option value="india">India</option>
                  <option value="other">Other</option>
                </select>
                <input
                  type="number"
                  min={0}
                  value={templatePriceInr}
                  onChange={(event) =>
                    setTemplatePriceInr(Math.max(0, Number(event.target.value) || 0))
                  }
                  placeholder="Price in INR"
                  className="rounded-xl border border-brand-border bg-brand-card2 px-3 py-2 text-sm outline-none"
                />
              </div>
              <input
                value={templateTagsInput}
                onChange={(event) => setTemplateTagsInput(event.target.value)}
                placeholder="Tags (comma separated)"
                className="w-full rounded-xl border border-brand-border bg-brand-card2 px-3 py-2 text-sm outline-none"
              />
              <label className="inline-flex items-center gap-2 text-sm text-brand-sub">
                <input
                  type="checkbox"
                  checked={templateIndiaSpecific}
                  onChange={(event) => setTemplateIndiaSpecific(event.target.checked)}
                  className="accent-brand-or"
                />
                India-specific template
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setTemplateModalOpen(false)}
                className="rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-sub"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  void publishAsTemplate();
                }}
                disabled={templateSubmitting}
                className="rounded-lg bg-brand-gradient px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {templateSubmitting ? "Submitting..." : "Submit for Review"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {apkModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-brand-border bg-brand-card p-5">
            <h3 className="text-lg font-semibold">Build APK with Expo</h3>
            <p className="mt-2 text-sm text-brand-sub">
              Direct cloud EAS build will be enabled once EXPO_TOKEN is configured. You can test immediately using Expo Go.
            </p>
            <div className="mt-4 rounded-xl border border-brand-border bg-brand-card2 p-3">
              <p className="text-xs uppercase tracking-wide text-brand-muted">Run locally</p>
              <code className="mt-2 block rounded bg-brand-bg px-2 py-1 font-code text-sm text-brand-or">
                npx expo start
              </code>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-brand-sub">
                <li>Install Expo Go on your phone.</li>
                <li>Run the command in your React Native project root.</li>
                <li>Scan the QR code to test instantly.</li>
              </ul>
            </div>
            {apkBuildMessage ? (
              <p className="mt-3 text-sm text-brand-gr">{apkBuildMessage}</p>
            ) : null}
            {apkBuildUrl ? (
              <a
                href={apkBuildUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 block text-sm text-brand-or underline"
              >
                {apkBuildUrl}
              </a>
            ) : null}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setApkModalOpen(false)}
                className="rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-sub"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  void startApkBuild();
                }}
                disabled={apkBuilding}
                className="rounded-lg bg-brand-gradient px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {apkBuilding ? "Starting..." : "Start Mock APK Build"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {domainModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-brand-border bg-brand-card p-5">
            <h3 className="text-lg font-semibold">DNS Configuration Instructions</h3>
            <p className="mt-2 text-sm text-brand-sub">
              Add a CNAME record pointing your domain to{" "}
              <code className="rounded bg-brand-card2 px-1 py-0.5">
                cname.vercel-dns.com
              </code>
              . After DNS propagation, click Verify again.
            </p>
            {domainMessage ? (
              <p className="mt-3 rounded-lg border border-brand-border bg-brand-card2 p-3 text-sm text-brand-text">
                {domainMessage}
              </p>
            ) : null}
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setDomainModalOpen(false)}
                className="rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-sub"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {isMobile && mobilePlanMenuOpen ? (
        <div className="fixed inset-0 z-[60] flex items-end bg-black/50 md:hidden">
          <div className="w-full rounded-t-2xl border border-brand-border bg-brand-card p-4">
            <p className="text-sm font-semibold">Send mode</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setPlanMode(true);
                  setMobilePlanMenuOpen(false);
                }}
                className="rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-sub"
              >
                Plan
              </button>
              <button
                type="button"
                onClick={() => {
                  setPlanMode(false);
                  setMobilePlanMenuOpen(false);
                }}
                className="rounded-lg bg-brand-gradient px-3 py-2 text-sm font-semibold text-white"
              >
                Build
              </button>
            </div>
            <button
              type="button"
              onClick={() => setMobilePlanMenuOpen(false)}
              className="mt-3 w-full rounded-lg border border-brand-border px-3 py-2 text-xs text-brand-sub"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
