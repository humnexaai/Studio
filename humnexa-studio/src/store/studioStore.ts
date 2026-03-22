"use client";

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { QueueItem, StudioPanelState, StudioTab } from "@/types/studio";

type StudioStore = StudioPanelState & {
  setChatWidth: (width: number) => void;
  setPreviewWidth: (width: number) => void;
  toggleChatCollapsed: () => void;
  togglePreviewCollapsed: () => void;
  setActiveTab: (tab: StudioTab) => void;
  setPreviewDevice: (device: StudioPanelState["previewDevice"]) => void;
  setPlanMode: (enabled: boolean) => void;
  setAutoApply: (enabled: boolean) => void;
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
  previewDevice: "desktop",
  planMode: false,
  autoApply: false,
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
