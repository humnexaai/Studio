"use client";

import { useMemo, useState } from "react";
import { ChevronRight, File, Folder, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

type FileTreeNode = {
  name: string;
  fullPath: string;
  type: "file" | "folder";
  children: Record<string, FileTreeNode>;
};

type FileTreeProps = {
  files: string[];
  activeFile: string | null;
  onSelect: (path: string) => void;
};

export function FileTree({
  files,
  activeFile,
  onSelect,
}: FileTreeProps): React.ReactElement {
  const tree = useMemo(() => buildTree(files), [files]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (path: string): void => {
    setExpanded((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  return (
    <aside className="h-full border-r border-brand-border bg-brand-surf p-3">
      <div className="mb-3 flex items-center justify-between">
        <div className="inline-flex items-center gap-2 text-sm font-medium text-brand-sub">
          <Folder className="h-4 w-4" />
          Files
        </div>
        <button className="rounded-md p-1 text-brand-muted hover:bg-brand-card2 hover:text-brand-text">
          <MoreHorizontal className="h-4 w-4" />
        </button>
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
          />
        ))}
      </div>
      <div className="mt-4 border-t border-brand-border pt-3 text-xs text-brand-muted">
        ● 5 changes | Push →
      </div>
    </aside>
  );
}

function buildTree(files: string[]): FileTreeNode {
  const root: FileTreeNode = {
    name: "",
    fullPath: "",
    type: "folder",
    children: {},
  };

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
}: {
  node: FileTreeNode;
  level: number;
  expanded: Record<string, boolean>;
  activeFile: string | null;
  onToggle: (path: string) => void;
  onSelect: (path: string) => void;
}): React.ReactElement {
  if (node.type === "file") {
    return (
      <button
        type="button"
        onClick={() => onSelect(node.fullPath)}
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
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
