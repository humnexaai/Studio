"use client";

import { useState } from "react";
import { useChatStore } from "@/store/chatStore";
import { ChatBubble } from "@/components/ui/ChatBubble";
import { TypingIndicator } from "@/components/ui/TypingIndicator";
import { DiffCard } from "@/components/ui/DiffCard";
import { PromptQueue } from "@/components/studio/PromptQueue";
import { ChatInput } from "@/components/studio/ChatInput";
import { useStudioStore } from "@/store/studioStore";
import { useChat } from "@/hooks/useChat";

export function ChatPanel(): React.ReactElement {
  const { messages, typing } = useChatStore();
  const queue = useStudioStore((state) => state.queue);
  const planMode = useStudioStore((state) => state.planMode);
  const setPlanMode = useStudioStore((state) => state.setPlanMode);
  const { streamChat, streaming } = useChat();
  const [conversationId] = useState<string | null>(null);

  const handleSubmit = async (value: string): Promise<void> => {
    useChatStore.getState().addMessage("user", value);
    await streamChat({
      projectId: "00000000-0000-0000-0000-000000000001",
      conversationId,
      message: value,
      mode: planMode ? "plan" : "agent",
      currentFiles: [],
    });
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-brand-border bg-brand-card">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {queue.length > 0 ? <PromptQueue /> : null}
        {messages.map((message) => (
          <div key={message.id} className="space-y-2">
            <ChatBubble message={message} />
            {message.diffs?.map((diff) => (
              <DiffCard
                key={diff.id}
                filePath={diff.filePath}
                summary={diff.summary}
              />
            ))}
          </div>
        ))}
        {typing || streaming ? <TypingIndicator /> : null}
      </div>
      <div className="border-t border-brand-border p-3">
        <ChatInput
          onSubmit={(value) => void handleSubmit(value)}
          planMode={planMode}
          onPlanModeChange={setPlanMode}
        />
      </div>
    </div>
  );
}
