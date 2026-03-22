"use client";

import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types/studio";

interface ChatBubbleProps {
  message: ChatMessage;
}

export function ChatBubble({ message }: ChatBubbleProps): React.ReactElement {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl border p-3 text-sm",
          isUser
            ? "border-brand-or/40 bg-brand-or/20 text-white"
            : "border-brand-purple/40 bg-brand-purple/10 text-brand-text",
        )}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        <p className="mt-2 text-[11px] text-brand-sub">
          {new Date(message.createdAt).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}
