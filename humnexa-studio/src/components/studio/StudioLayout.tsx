"use client";

import { useState } from "react";
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
import type { ProjectFile } from "@/types/studio";

type StudioLayoutProps = {
  projectId: string;
};

const defaultFiles: ProjectFile[] = [
  {
    id: "1",
    path: "src/app/page.tsx",
    content:
      "export default function Page() {\n  return <main className=\"p-6 text-white\">Hello Humnexa</main>;\n}\n",
    language: "typescript",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    path: "src/app/layout.tsx",
    content:
      "export default function Layout({ children }: { children: React.ReactNode }) {\n  return <>{children}</>;\n}\n",
    language: "typescript",
    updatedAt: new Date().toISOString(),
  },
];

export function StudioLayout({ projectId }: StudioLayoutProps): React.ReactElement {
  const [activeFile, setActiveFile] = useState<ProjectFile>(defaultFiles[0]);
  const [files, setFiles] = useState<ProjectFile[]>(defaultFiles);
  const { chatWidth, previewWidth, chatCollapsed, previewCollapsed, activeTab } =
    useStudioStore();
  const credits = useUserStore((state) => state.credits);

  const filePaths = files.map((file) => file.path);

  const handleSelectFile = (path: string): void => {
    const selected = files.find((file) => file.path === path);
    if (selected) setActiveFile(selected);
  };

  const handleCodeChange = (value: string): void => {
    setFiles((prev) =>
      prev.map((file) =>
        file.path === activeFile.path
          ? { ...file, content: value, updatedAt: new Date().toISOString() }
          : file,
      ),
    );
    setActiveFile((prev) => ({ ...prev, content: value }));
  };

  return (
    <div className="flex min-h-screen flex-col bg-brand-bg">
      <StudioNavbar
        projectName={`Project ${projectId.slice(0, 8)}`}
        credits={credits}
      />
      <div className="relative flex flex-1 overflow-hidden">
        <VersionHistory />

        <aside className="w-[210px] border-r border-brand-border">
          <FileTree
            files={filePaths}
            activeFile={activeFile.path}
            onSelect={handleSelectFile}
          />
        </aside>

        <section className="flex min-w-0 flex-1">
          <div
            className={`${chatCollapsed ? "w-10" : ""} border-r border-brand-border`}
            style={chatCollapsed ? undefined : { width: chatWidth }}
          >
            {chatCollapsed ? (
              <button className="h-full w-full bg-brand-card text-xs text-brand-sub [writing-mode:vertical-rl]">
                💬 Chat
              </button>
            ) : activeTab === "chat" ? (
              <ChatPanel />
            ) : (
              <CodePanel
                path={activeFile.path}
                content={activeFile.content}
                onChange={handleCodeChange}
              />
            )}
          </div>

          <ResizeDivider />

          <div className="min-w-[320px] flex-1">
            {activeTab === "code" ? (
              <CodePanel
                path={activeFile.path}
                content={activeFile.content}
                onChange={handleCodeChange}
              />
            ) : (
              <ChatPanel />
            )}
          </div>
        </section>

        <ResizeDivider />

        <aside
          className={`${previewCollapsed ? "w-10" : ""} border-l border-brand-border`}
          style={previewCollapsed ? undefined : { width: previewWidth }}
        >
          {previewCollapsed ? (
            <button className="h-full w-full bg-brand-card text-xs text-brand-sub [writing-mode:vertical-rl]">
              👁 Preview
            </button>
          ) : (
            <PreviewPanel />
          )}
        </aside>
      </div>
      <StatusBar />
    </div>
  );
}
