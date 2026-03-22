"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronRight,
  Copy,
  Edit3,
  File,
  Folder,
  FolderPlus,
  MoreHorizontal,
  Plus,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type FileTreeNode = {
  name: string;
  fullPath: string;
  type: "file" | "folder";
  children: Record<string, FileTreeNode>;
};

type FileTreeProps = {
  files: string[];
  folders?: string[];
  activeFile: string | null;
  onSelect: (path: string) => void;
  onCreateFile?: (path: string) => void;
  onCreateFolder?: (path: string) => void;
  onRenameFile?: (oldPath: string, newPath: string) => void;
  onDeleteFile?: (path: string) => void;
  onDuplicateFile?: (path: string) => void;
};

export function FileTree({
  files,
  folders = [],
  activeFile,
  onSelect,
  onCreateFile,
  onCreateFolder,
  onRenameFile,
  onDeleteFile,
  onDuplicateFile,
}: FileTreeProps): React.ReactElement {
  const tree = useMemo(() => buildTree(files, folders), [files, folders]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [contextPath, setContextPath] = useState<string | null>(null);
  const [contextX, setContextX] = useState(0);
  const [contextY, setContextY] = useState(0);

  const toggle = (path: string): void => {
    setExpanded((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  useEffect(() => {
    const onWindowClick = (): void => setContextPath(null);
    window.addEventListener("click", onWindowClick);
    return () => window.removeEventListener("click", onWindowClick);
  }, []);

  return (
    <aside className="h-full border-r border-brand-border bg-brand-surf p-3">
      <div className="mb-3 flex items-center justify-between">
        <div className="inline-flex items-center gap-2 text-sm font-medium text-brand-sub">
          <Folder className="h-4 w-4" />
          Files
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              const name = window.prompt("New file path", "src/new-file.tsx");
              if (!name?.trim()) return;
              onCreateFile?.(name.trim());
            }}
            className="rounded-md p-1 text-brand-muted hover:bg-brand-card2 hover:text-brand-text"
            title="New File"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              const name = window.prompt("New folder path", "src/components");
              if (!name?.trim()) return;
              onCreateFolder?.(name.trim());
            }}
            className="rounded-md p-1 text-brand-muted hover:bg-brand-card2 hover:text-brand-text"
            title="New Folder"
          >
            <FolderPlus className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="rounded-md p-1 text-brand-muted hover:bg-brand-card2 hover:text-brand-text"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="space-y-1">
        {Object.values(tree.children).map((node) => (
          <TreeNode
            key={node.fullPath}
            node={node}
            level={0}
            expanded={expanded}
            activeFile={activeFile}
            onToggle={toggle}
            onSelect={onSelect}
            onContext={(event, path) => {
              event.preventDefault();
              setContextPath(path);
              setContextX(event.clientX);
              setContextY(event.clientY);
            }}
          />
        ))}
      </div>
      {contextPath ? (
        <div
          className="fixed z-50 w-44 rounded-lg border border-brand-border bg-brand-card p-1 shadow-xl"
          style={{ left: contextX, top: contextY }}
          onClick={(event) => event.stopPropagation()}
        >
          <ContextAction
            icon={<Edit3 className="h-3.5 w-3.5" />}
            label="Rename"
            onClick={() => {
              const name = window.prompt("Rename file", contextPath);
              if (!name?.trim()) return;
              onRenameFile?.(contextPath, name.trim());
              setContextPath(null);
            }}
          />
          <ContextAction
            icon={<Copy className="h-3.5 w-3.5" />}
            label="Duplicate"
            onClick={() => {
              onDuplicateFile?.(contextPath);
              setContextPath(null);
            }}
          />
          <ContextAction
            icon={<Trash2 className="h-3.5 w-3.5" />}
            label="Delete"
            danger
            onClick={() => {
              onDeleteFile?.(contextPath);
              setContextPath(null);
            }}
          />
        </div>
      ) : null}
      <div className="mt-4 border-t border-brand-border pt-3 text-xs text-brand-muted">
        ● 5 changes | Push →
      </div>
    </aside>
  );
}

function buildTree(files: string[], folders: string[]): FileTreeNode {
  const root: FileTreeNode = {
    name: "",
    fullPath: "",
    type: "folder",
    children: {},
  };

  for (const folderPath of folders) {
    const parts = folderPath.split("/").filter(Boolean);
    let cursor = root;
    let runningPath = "";
    parts.forEach((part) => {
      runningPath = runningPath ? `${runningPath}/${part}` : part;
      if (!cursor.children[part]) {
        cursor.children[part] = {
          name: part,
          fullPath: runningPath,
          type: "folder",
          children: {},
        };
      }
      cursor = cursor.children[part];
    });
  }

  for (const filePath of files) {
    const parts = filePath.split("/").filter(Boolean);
    let cursor = root;
    let runningPath = "";

    parts.forEach((part, index) => {
      runningPath = runningPath ? `${runningPath}/${part}` : part;
      const isLast = index === parts.length - 1;
      if (!cursor.children[part]) {
        cursor.children[part] = {
          name: part,
          fullPath: runningPath,
          type: isLast ? "file" : "folder",
          children: {},
        };
      }
      cursor = cursor.children[part];
    });
  }

  return root;
}

function TreeNode({
  node,
  level,
  expanded,
  activeFile,
  onToggle,
  onSelect,
  onContext,
}: {
  node: FileTreeNode;
  level: number;
  expanded: Record<string, boolean>;
  activeFile: string | null;
  onToggle: (path: string) => void;
  onSelect: (path: string) => void;
  onContext: (event: React.MouseEvent<HTMLButtonElement>, path: string) => void;
}): React.ReactElement {
  if (node.type === "file") {
    return (
      <button
        type="button"
        onClick={() => onSelect(node.fullPath)}
        onContextMenu={(event) => onContext(event, node.fullPath)}
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm",
          activeFile === node.fullPath
            ? "bg-brand-or/20 text-brand-or"
            : "text-brand-sub hover:bg-brand-card hover:text-brand-text",
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        <File className="h-4 w-4" />
        <span className="truncate font-code">{node.name}</span>
      </button>
    );
  }

  const isOpen = expanded[node.fullPath] ?? level < 1;
  return (
    <div>
      <button
        type="button"
        onClick={() => onToggle(node.fullPath)}
        onContextMenu={(event) => onContext(event, node.fullPath)}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-brand-sub hover:bg-brand-card hover:text-brand-text"
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        <ChevronRight
          className={cn("h-3.5 w-3.5 transition", isOpen && "rotate-90")}
        />
        <Folder className="h-4 w-4" />
        <span className="truncate">{node.name}</span>
      </button>
      {isOpen ? (
        <div>
          {Object.values(node.children).map((child) => (
            <TreeNode
              key={child.fullPath}
              node={child}
              level={level + 1}
              expanded={expanded}
              activeFile={activeFile}
              onToggle={onToggle}
              onSelect={onSelect}
              onContext={onContext}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ContextAction({
  icon,
  label,
  danger = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
  onClick: () => void;
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-brand-card2",
        danger ? "text-brand-error" : "text-brand-sub",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
