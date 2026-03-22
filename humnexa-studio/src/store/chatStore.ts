"use client";

import { create } from "zustand";
import { nanoid } from "nanoid";
import type { ChatMessage } from "@/types/studio";

type ChatState = {
  messages: ChatMessage[];
  typing: boolean;
  streamingMessageId: string | null;
  addMessage: (role: ChatMessage["role"], content: string) => void;
  setTyping: (typing: boolean) => void;
  upsertStreamingMessage: (chunk: string) => void;
  finishStreamingMessage: () => void;
  clear: () => void;
};

export const useChatStore = create<ChatState>()((set, get) => ({
  messages: [],
  typing: false,
  streamingMessageId: null,
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
  finishStreamingMessage: () => {
    set({ streamingMessageId: null, typing: false });
  },
  clear: () => set({ messages: [], streamingMessageId: null, typing: false }),
}));
