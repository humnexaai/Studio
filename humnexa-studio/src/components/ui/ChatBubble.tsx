"use client";

import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types/studio";

interface ChatBubbleProps {
  message: ChatMessage;
  onImplementPlan?: (prompt: string) => void;
}

export function ChatBubble({
  message,
  onImplementPlan,
}: ChatBubbleProps): React.ReactElement {
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
        {message.planMode && message.implementPrompt ? (
          <button
            type="button"
            onClick={() => onImplementPlan?.(message.implementPrompt!)}
            className="mt-3 rounded-md bg-brand-gradient px-2.5 py-1.5 text-xs font-semibold text-white"
          >
            Implement this plan
          </button>
        ) : null}
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
