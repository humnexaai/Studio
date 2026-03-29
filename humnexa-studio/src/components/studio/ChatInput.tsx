"use client";

import { Mic, Send, ShieldAlert } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { PlanModeToggle } from "@/components/studio/PlanModeToggle";
import QuickChips from "@/components/studio/QuickChips";
import { CostPreview } from "@/components/ui/CostPreview";

type ChatInputProps = {
  onSubmit: (value: string) => void;
  planMode: boolean;
  onPlanModeChange: (enabled: boolean) => void;
  mobileView?: boolean;
  onLongPressToggleModeMenu?: () => void;
  hindiMode?: boolean;
  disabled?: boolean;
};

const keyRegex = /(sk-[a-zA-Z0-9]{20,}|gsk_[a-zA-Z0-9]+|rzp_live_[a-zA-Z0-9]+)/;

export function ChatInput({
  onSubmit,
  planMode,
  onPlanModeChange,
  mobileView = false,
  onLongPressToggleModeMenu,
  hindiMode = false,
  disabled = false,
}: ChatInputProps): React.ReactElement {
  const [value, setValue] = useState("");
  const [textareaRows, setTextareaRows] = useState(3);
  const [holdMenuOpen, setHoldMenuOpen] = useState(false);
  const holdTimerRef = useState<{ value: number | null }>({ value: null })[0];
  const keyDetected = keyRegex.test(value);

  const estimatedCost = planMode ? 0 : Math.min(10, Math.max(1, Math.ceil(value.length / 90)));
  const submitCurrent = useCallback(() => {
    if (!value.trim() || disabled) return;
    onSubmit(value);
    setValue("");
  }, [disabled, onSubmit, value]);

  useEffect(() => {
    const onShortcutSubmit = (): void => {
      submitCurrent();
    };
    window.addEventListener("humnexa-chat-submit", onShortcutSubmit);
    return () => {
      window.removeEventListener("humnexa-chat-submit", onShortcutSubmit);
    };
  }, [submitCurrent]);

  useEffect(() => {
    if (!mobileView) return;
    setTextareaRows(1);
  }, [mobileView]);

  const openHoldMenu = (): void => {
    if (!mobileView) return;
    if (onLongPressToggleModeMenu) {
      onLongPressToggleModeMenu();
      return;
    }
    holdTimerRef.value = window.setTimeout(() => {
      setHoldMenuOpen(true);
    }, 500);
  };

  const clearHoldMenuTimer = (): void => {
    if (holdTimerRef.value) {
      window.clearTimeout(holdTimerRef.value);
      holdTimerRef.value = null;
    }
  };

  return (
    <div className="border-t border-brand-border bg-brand-card p-4">
      {!mobileView ? (
        <QuickChips
          onSelect={(chip) =>
            setValue((prev) => (prev ? `${prev} ${chip}` : chip))
          }
        />
      ) : null}

      <div className="mt-3 rounded-2xl border border-brand-border bg-brand-card2 p-3">
        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
              event.preventDefault();
              submitCurrent();
            }
          }}
          placeholder="Describe what to build or fix..."
          rows={textareaRows}
          onFocus={() => {
            if (mobileView) setTextareaRows(3);
          }}
          onBlur={() => {
            if (mobileView && value.trim().length === 0) setTextareaRows(1);
          }}
          disabled={disabled}
          className="w-full resize-none bg-transparent text-sm outline-none"
        />
        <div className="mt-2 flex items-center gap-2">
          <button className="rounded-lg border border-brand-border p-2 text-brand-sub transition hover:text-brand-text">
            <Mic className="h-4 w-4" />
          </button>
          {!mobileView ? (
            <PlanModeToggle enabled={planMode} onChange={onPlanModeChange} />
          ) : null}
          <CostPreview estimatedCredits={estimatedCost} />
          <button
            type="button"
            onClick={submitCurrent}
            onMouseDown={openHoldMenu}
            onMouseUp={clearHoldMenuTimer}
            onMouseLeave={clearHoldMenuTimer}
            onTouchStart={openHoldMenu}
            onTouchEnd={clearHoldMenuTimer}
            disabled={disabled}
            className="ml-auto inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-4 py-2 text-sm font-semibold text-white"
          >
            {hindiMode ? (
              <span className="rounded bg-white/15 px-1.5 py-0.5 text-[10px] font-bold">
                हिंदी
              </span>
            ) : null}
            Send
            <Send className="h-4 w-4" />
          </button>
        </div>
        {mobileView && holdMenuOpen ? (
          <div className="mt-2 rounded-lg border border-brand-border bg-brand-card p-2">
            <p className="mb-2 text-[11px] text-brand-sub">Long-press menu</p>
            <PlanModeToggle
              enabled={planMode}
              onChange={(enabled) => {
                onPlanModeChange(enabled);
                setHoldMenuOpen(false);
              }}
            />
            <button
              type="button"
              onClick={() => setHoldMenuOpen(false)}
              className="mt-2 rounded border border-brand-border px-2 py-1 text-[11px] text-brand-sub"
            >
              Close
            </button>
          </div>
        ) : null}
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
