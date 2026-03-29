"use client";

import { useState } from "react";
import { useChatStore } from "@/store/chatStore";
import type { DiffBlock } from "@/types/studio";
import { useUserStore } from "@/store/userStore";

type StreamChatInput = {
  projectId: string;
  conversationId: string | null;
  message: string;
  mode: "agent" | "plan";
  currentFiles: Array<{ path: string; content: string }>;
};

export function useChat() {
  const [streaming, setStreaming] = useState(false);
  const upsertStreamingMessage = useChatStore((s) => s.upsertStreamingMessage);
  const finishStreamingMessage = useChatStore((s) => s.finishStreamingMessage);
  const setTyping = useChatStore((s) => s.setTyping);
  const setPendingDiffs = useChatStore((s) => s.setPendingDiffs);
  const setStreamMeta = useChatStore((s) => s.setStreamMeta);
  const clearPending = useChatStore((s) => s.clearPending);
  const removeLastUserMessage = useChatStore((s) => s.removeLastUserMessage);
  const setLastModel = useUserStore((s) => s.setLastModel);

  const streamChat = async (input: StreamChatInput): Promise<void> => {
    setStreaming(true);
    setTyping(true);
    clearPending();
    upsertStreamingMessage("");
    try {
      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });

      if (!response.ok || !response.body) {
        removeLastUserMessage();
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        const message = payload.error ?? "Unable to stream response";
        const error = new Error(message) as Error & { statusCode?: number };
        error.statusCode = response.status;
        throw error;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let buffer = "";

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
          if (payload === "[DONE]") continue;
          try {
            const parsed = JSON.parse(payload) as {
              text?: string;
              meta?: {
                creditsUsed?: number;
                planMode?: boolean;
                implementPrompt?: string | null;
              };
              provider?: string;
              diffs?: DiffBlock[];
            };
            if (parsed.text) {
              upsertStreamingMessage(parsed.text);
            }
            if (parsed.meta) {
              setStreamMeta({
                creditsUsed: parsed.meta.creditsUsed ?? 0,
                planMode: parsed.meta.planMode ?? false,
                implementPrompt: parsed.meta.implementPrompt ?? null,
              });
            }
            if (parsed.provider) {
              setLastModel(parsed.provider);
            }
            if (parsed.diffs) {
              setPendingDiffs(parsed.diffs);
            }
          } catch {
            // Ignore malformed chunk and continue stream.
          }
        }
      }
      finishStreamingMessage();
    } catch (error) {
      removeLastUserMessage();
      throw error;
    } finally {
      setTyping(false);
      setStreaming(false);
    }
  };

  return {
    streaming,
    streamChat,
  };
}
