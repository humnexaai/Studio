"use client";

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type {
  QueueItem,
  SelectedElementContext,
  StudioPanelState,
  StudioTab,
} from "@/types/studio";

type StudioStore = StudioPanelState & {
  setChatWidth: (width: number) => void;
  setPreviewWidth: (width: number) => void;
  toggleChatCollapsed: () => void;
  togglePreviewCollapsed: () => void;
  setActiveTab: (tab: StudioTab) => void;
  setPreviewDevice: (device: StudioPanelState["previewDevice"]) => void;
  setPlanMode: (enabled: boolean) => void;
  setAutoApply: (enabled: boolean) => void;
  setMobilePlanMenuOpen: (open: boolean) => void;
  setVisualEditEnabled: (enabled: boolean) => void;
  setSelectedElement: (selected: SelectedElementContext | null) => void;
  enqueuePrompt: (item: QueueItem) => void;
  setQueue: (items: QueueItem[]) => void;
  removeQueueItem: (id: string) => void;
  dequeuePrompt: () => void;
  clearQueue: () => void;
};

const initialState: StudioPanelState = {
  chatWidth: 420,
  previewWidth: 340,
  chatCollapsed: false,
  previewCollapsed: false,
  activeTab: "chat",
  mobileTab: "chat",
  previewDevice: "desktop",
  planMode: false,
  autoApply: false,
  mobilePlanMenuOpen: false,
  visualEditEnabled: false,
  selectedElement: null,
  queue: [],
};

export const useStudioStore = create<StudioStore>()(
  immer((set) => ({
    ...initialState,
    setChatWidth: (width) =>
      set((state) => {
        state.chatWidth = Math.min(Math.max(width, 300), 800);
      }),
    setPreviewWidth: (width) =>
      set((state) => {
        state.previewWidth = Math.min(Math.max(width, 280), 600);
      }),
    toggleChatCollapsed: () =>
      set((state) => {
        state.chatCollapsed = !state.chatCollapsed;
      }),
    togglePreviewCollapsed: () =>
      set((state) => {
        state.previewCollapsed = !state.previewCollapsed;
      }),
    setActiveTab: (tab) =>
      set((state) => {
        state.activeTab = tab;
      }),
    setMobilePlanMenuOpen: (open) =>
      set((state) => {
        state.mobilePlanMenuOpen = open;
      }),
    setPreviewDevice: (device) =>
      set((state) => {
        state.previewDevice = device;
      }),
    setPlanMode: (enabled) =>
      set((state) => {
        state.planMode = enabled;
      }),
    setAutoApply: (enabled) =>
      set((state) => {
        state.autoApply = enabled;
      }),
    setVisualEditEnabled: (enabled) =>
      set((state) => {
        state.visualEditEnabled = enabled;
      }),
    setSelectedElement: (selected) =>
      set((state) => {
        state.selectedElement = selected;
      }),
    enqueuePrompt: (item) =>
      set((state) => {
        state.queue.push(item);
      }),
    setQueue: (items) =>
      set((state) => {
        state.queue = items;
      }),
    removeQueueItem: (id) =>
      set((state) => {
        state.queue = state.queue.filter((item) => item.id !== id);
      }),
    dequeuePrompt: () =>
      set((state) => {
        state.queue.shift();
      }),
    clearQueue: () =>
      set((state) => {
        state.queue = [];
      }),
  })),
);
