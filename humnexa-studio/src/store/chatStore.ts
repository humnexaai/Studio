"use client";

import { create } from "zustand";
import { nanoid } from "nanoid";
import type { ChatMessage } from "@/types/studio";

type ChatState = {
  messages: ChatMessage[];
  typing: boolean;
  streamingMessageId: string | null;
  pendingDiffs: ChatMessage["diffs"];
  streamMeta: {
    creditsUsed: number;
    planMode: boolean;
    implementPrompt: string | null;
  } | null;
  addMessage: (role: ChatMessage["role"], content: string) => void;
  removeLastUserMessage: () => void;
  setMessages: (messages: ChatMessage[]) => void;
  setTyping: (typing: boolean) => void;
  upsertStreamingMessage: (chunk: string) => void;
  setPendingDiffs: (diffs: ChatMessage["diffs"]) => void;
  setStreamMeta: (meta: {
    creditsUsed: number;
    planMode: boolean;
    implementPrompt: string | null;
  }) => void;
  clearPending: () => void;
  finishStreamingMessage: () => void;
  clear: () => void;
};

export const useChatStore = create<ChatState>()((set, get) => ({
  messages: [],
  typing: false,
  streamingMessageId: null,
  pendingDiffs: [],
  streamMeta: null,
  addMessage: (role, content) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: nanoid(),
          role,
          content,
          createdAt: new Date().toISOString(),
        },
      ],
    })),
  removeLastUserMessage: () =>
    set((state) => {
      for (let i = state.messages.length - 1; i >= 0; i -= 1) {
        if (state.messages[i].role === "user") {
          const next = [...state.messages];
          next.splice(i, 1);
          return { messages: next };
        }
      }
      return { messages: state.messages };
    }),
  setMessages: (messages) => set({ messages }),
  setTyping: (typing) => set({ typing }),
  upsertStreamingMessage: (chunk) => {
    const { streamingMessageId } = get();
    if (!streamingMessageId) {
      const id = nanoid();
      set((state) => ({
        streamingMessageId: id,
        messages: [
          ...state.messages,
          {
            id,
            role: "assistant",
            content: chunk,
            createdAt: new Date().toISOString(),
          },
        ],
      }));
      return;
    }

    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === streamingMessageId
          ? { ...msg, content: `${msg.content}${chunk}` }
          : msg,
      ),
    }));
  },
  setPendingDiffs: (diffs) => set({ pendingDiffs: diffs ?? [] }),
  setStreamMeta: (meta) => set({ streamMeta: meta }),
  clearPending: () => set({ pendingDiffs: [], streamMeta: null }),
  finishStreamingMessage: () => {
    const { streamingMessageId, messages, pendingDiffs, streamMeta } = get();
    if (!streamingMessageId) {
      set({ typing: false });
      return;
    }
    set({
      streamingMessageId: null,
      typing: false,
      pendingDiffs: [],
      streamMeta: null,
      messages: messages.map((msg) =>
        msg.id === streamingMessageId
          ? {
              ...msg,
              diffs: pendingDiffs ?? [],
              creditsUsed: streamMeta?.creditsUsed,
              planMode: streamMeta?.planMode,
              implementPrompt: streamMeta?.implementPrompt ?? undefined,
            }
          : msg,
      ),
    });
  },
  clear: () =>
    set({
      messages: [],
      streamingMessageId: null,
      typing: false,
      pendingDiffs: [],
      streamMeta: null,
    }),
}));
