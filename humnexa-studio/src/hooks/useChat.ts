"use client";

import { useState } from "react";
import { useChatStore } from "@/store/chatStore";

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

  const streamChat = async (input: StreamChatInput): Promise<void> => {
    setStreaming(true);
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
        throw new Error("Unable to stream response");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunk = decoder.decode(value ?? new Uint8Array(), {
          stream: !doneReading,
        });

        const events = chunk.split("\n\n");
        for (const event of events) {
          if (!event.startsWith("data:")) continue;
          const payload = event.replace("data:", "").trim();
          if (payload === "[DONE]") continue;
          try {
            const parsed = JSON.parse(payload) as { text?: string };
            if (parsed.text) {
              upsertStreamingMessage(parsed.text);
            }
          } catch {
            // Ignore malformed chunk and continue stream.
          }
        }
      }
      finishStreamingMessage();
    } finally {
      setStreaming(false);
    }
  };

  return {
    streaming,
    streamChat,
  };
}
