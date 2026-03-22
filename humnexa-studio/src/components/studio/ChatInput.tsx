"use client";

import { Mic, Send, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { PlanModeToggle } from "@/components/studio/PlanModeToggle";
import { QuickChips } from "@/components/studio/QuickChips";
import { CostPreview } from "@/components/ui/CostPreview";

type ChatInputProps = {
  onSubmit: (value: string) => void;
  planMode: boolean;
  onPlanModeChange: (enabled: boolean) => void;
  disabled?: boolean;
};

const keyRegex = /(sk-[a-zA-Z0-9]{20,}|gsk_[a-zA-Z0-9]+|rzp_live_[a-zA-Z0-9]+)/;

export function ChatInput({
  onSubmit,
  planMode,
  onPlanModeChange,
  disabled = false,
}: ChatInputProps): React.ReactElement {
  const [value, setValue] = useState("");
  const keyDetected = keyRegex.test(value);

  const estimatedCost = planMode ? 0 : Math.min(10, Math.max(1, Math.ceil(value.length / 90)));

  return (
    <div className="border-t border-brand-border bg-brand-card p-4">
      <QuickChips
        onSelect={(chip) =>
          setValue((prev) => (prev ? `${prev} ${chip}` : chip))
        }
      />

      <div className="mt-3 rounded-2xl border border-brand-border bg-brand-card2 p-3">
        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Describe what to build or fix..."
          rows={3}
          disabled={disabled}
          className="w-full resize-none bg-transparent text-sm outline-none"
        />
        <div className="mt-2 flex items-center gap-2">
          <button className="rounded-lg border border-brand-border p-2 text-brand-sub transition hover:text-brand-text">
            <Mic className="h-4 w-4" />
          </button>
          <PlanModeToggle enabled={planMode} onChange={onPlanModeChange} />
          <CostPreview estimatedCredits={estimatedCost} />
          <button
            type="button"
            onClick={() => {
              if (!value.trim()) return;
              onSubmit(value);
              setValue("");
            }}
            disabled={disabled}
            className="ml-auto inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-4 py-2 text-sm font-semibold text-white"
          >
            Send
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>

      {keyDetected ? (
        <p className="mt-2 inline-flex items-center gap-2 text-xs text-brand-warn">
          <ShieldAlert className="h-3.5 w-3.5" />
          API key pattern detected. Never share secrets in prompts.
        </p>
      ) : null}
    </div>
  );
}
