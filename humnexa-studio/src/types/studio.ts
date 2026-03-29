export type StudioMode = "agent" | "plan";
export type CenterTab = "chat" | "code";
export type PreviewDevice = "mobile" | "tablet" | "desktop";
export type AiMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ProjectFile = {
  id: string;
  path: string;
  content: string;
  language: string;
  updatedAt: string;
};

export type DiffBlock = {
  id: string;
  filePath: string;
  before: string;
  after: string;
  summary: string;
  securitySensitive?: boolean;
};

export type SelectedElementContext = {
  tagName: string;
  className: string;
  id: string;
  textContent: string;
  boundingClientRect: {
    x: number;
    y: number;
    width: number;
    height: number;
    top: number;
    left: number;
    right: number;
    bottom: number;
  };
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  diffs?: DiffBlock[];
  creditsUsed?: number;
  planMode?: boolean;
  implementPrompt?: string;
  optimistic?: boolean;
};

export type QueueItem = {
  id: string;
  prompt: string;
  mode: StudioMode;
  estimatedCost: number;
  createdAt: string;
};

export type StudioTab = "chat" | "code" | "tests" | "preview" | "files";

export type StudioPanelState = {
  chatWidth: number;
  previewWidth: number;
  chatCollapsed: boolean;
  previewCollapsed: boolean;
  activeTab: StudioTab;
  mobileTab: "chat" | "preview" | "files";
  mobilePlanMenuOpen: boolean;
  previewDevice: PreviewDevice;
  planMode: boolean;
  autoApply: boolean;
  visualEditEnabled: boolean;
  selectedElement: SelectedElementContext | null;
  queue: QueueItem[];
};

export type StudioProject = {
  id: string;
  name: string;
  framework: string;
  branch: string;
  status: "idle" | "building" | "failed" | "ready";
  files: ProjectFile[];
};

export type ProjectRecord = {
  id: string;
  name: string;
  framework: string;
  status: "idle" | "building" | "failed" | "ready" | string;
  branch_name?: string | null;
  github_url?: string | null;
  deployed_url?: string | null;
  created_at?: string;
  updated_at?: string;
};
