"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { nanoid } from "nanoid";
import { useChatStore } from "@/store/chatStore";
import { ChatBubble } from "@/components/ui/ChatBubble";
import { TypingIndicator } from "@/components/ui/TypingIndicator";
import { DiffCard } from "@/components/ui/DiffCard";
import { PromptQueue } from "@/components/studio/PromptQueue";
import { ChatInput } from "@/components/studio/ChatInput";
import { CreditConfirmModal } from "@/components/studio/CreditConfirmModal";
import { useStudioStore } from "@/store/studioStore";
import { useChat } from "@/hooks/useChat";
import { estimateCredits } from "@/lib/credits/estimate";
import type { ProjectFile, QueueItem } from "@/types/studio";
import { useUserStore } from "@/store/userStore";

type ChatPanelProps = {
  projectId: string;
  conversationId: string | null;
  initialMessages: ReturnType<typeof useChatStore.getState>["messages"];
  currentFiles: ProjectFile[];
  onApplyFileChanges: (files: Array<{ path: string; content: string }>) => void;
  onRejectChanges: () => void;
};

export function ChatPanel({
  projectId,
  conversationId,
  initialMessages,
  currentFiles,
  onApplyFileChanges,
  onRejectChanges,
}: ChatPanelProps): React.ReactElement {
  const { messages, typing } = useChatStore();
  const setMessages = useChatStore((state) => state.setMessages);
  const addMessage = useChatStore((state) => state.addMessage);
  const queue = useStudioStore((state) => state.queue);
  const enqueuePrompt = useStudioStore((state) => state.enqueuePrompt);
  const dequeuePrompt = useStudioStore((state) => state.dequeuePrompt);
  const planMode = useStudioStore((state) => state.planMode);
  const setPlanMode = useStudioStore((state) => state.setPlanMode);
  const { streamChat, streaming } = useChat();
  const credits = useUserStore((state) => state.credits);
  const planCode = useUserStore((state) => state.planCode);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const [inputBlocked, setInputBlocked] = useState(false);
  const [keyWarning, setKeyWarning] = useState<string | null>(null);

  useEffect(() => {
    setInputBlocked(credits <= 0);
  }, [credits]);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages, setMessages]);

  const runPrompt = async (value: string, mode: "plan" | "agent"): Promise<void> => {
    addMessage("user", value);
    await streamChat({
      projectId,
      conversationId,
      message: value,
      mode,
      currentFiles: currentFiles.map((file) => ({
        path: file.path,
        content: file.content,
      })),
    });
  };

  const processNextQueue = async (): Promise<void> => {
    const next = queue[0];
    if (!next) return;
    dequeuePrompt();
    await runPrompt(next.prompt, next.mode);
  };

  useEffect(() => {
    if (!streaming && queue.length > 0) {
      void processNextQueue();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streaming, queue.length]);

  const handleSubmit = async (value: string): Promise<void> => {
    const hasApiKeyPattern = /(sk-[a-zA-Z0-9]{20,}|gsk_[a-zA-Z0-9]+|rzp_live_[a-zA-Z0-9]+)/.test(
      value,
    );
    if (hasApiKeyPattern) {
      setKeyWarning("⚠️ Possible API key detected. Don't share secrets in chat.");
      setTimeout(() => setKeyWarning(null), 3000);
    }

    const mode: "plan" | "agent" = planMode ? "plan" : "agent";
    const estimatedCost = estimateCredits(value, mode);
    if (!planMode && credits <= 0) {
      setInputBlocked(true);
      return;
    }
    if (!planMode && estimatedCost >= 5) {
      setPendingPrompt(value);
      setConfirmModalOpen(true);
      return;
    }

    if (streaming) {
      const maxQueue = planCode === "pro" ? 20 : 5;
      if (queue.length >= maxQueue) return;
      const item: QueueItem = {
        id: nanoid(),
        prompt: value,
        mode,
        estimatedCost,
        createdAt: new Date().toISOString(),
      };
      enqueuePrompt(item);
      return;
    }
    await runPrompt(value, mode);
  };

  const applyDiffs = (
    diffs: Array<{ filePath: string; after: string }>,
  ): void => {
    onApplyFileChanges(
      diffs.map((diff) => ({
        path: diff.filePath,
        content: diff.after,
      })),
    );
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-brand-border bg-brand-card">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {queue.length > 0 ? <PromptQueue /> : null}
        {messages.map((message) => (
          <div key={message.id} className="space-y-2">
            <ChatBubble
              message={message}
              onImplementPlan={(prompt) => {
                setPlanMode(false);
                void handleSubmit(prompt);
              }}
            />
            {message.diffs?.map((diff) => (
              <DiffCard
                key={diff.id}
                filePath={diff.filePath}
                summary={diff.summary}
                onApply={() => applyDiffs([diff])}
                onReject={onRejectChanges}
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
          disabled={inputBlocked}
        />
      </div>
      <CreditConfirmModal
        open={confirmModalOpen}
        cost={pendingPrompt ? estimateCredits(pendingPrompt, planMode ? "plan" : "agent") : 0}
        balance={credits}
        onCancel={() => {
          setConfirmModalOpen(false);
          setPendingPrompt(null);
        }}
        onConfirm={() => {
          if (!pendingPrompt) return;
          const prompt = pendingPrompt;
          setConfirmModalOpen(false);
          setPendingPrompt(null);
          void runPrompt(prompt, planMode ? "plan" : "agent");
        }}
      />
      {inputBlocked ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-brand-border bg-brand-card p-5">
            <h3 className="text-lg font-semibold">Credits exhausted</h3>
            <p className="mt-3 text-sm text-brand-sub">
              Your available credits are 0. Upgrade your plan to continue building.
            </p>
            <div className="mt-5 flex justify-end">
              <Link
                href="/billing"
                className="rounded-lg bg-brand-gradient px-4 py-2 text-sm font-semibold text-white"
              >
                Upgrade plan
              </Link>
            </div>
          </div>
        </div>
      ) : null}
      {keyWarning ? (
        <div className="border-t border-brand-border bg-brand-card2 px-4 py-3 text-sm text-brand-warn">
          {keyWarning}
        </div>
      ) : null}
    </div>
  );
}
