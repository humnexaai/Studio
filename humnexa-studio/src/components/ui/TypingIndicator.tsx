"use client";

export function TypingIndicator(): React.ReactElement {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-brand-border bg-brand-card px-3 py-1.5">
      <span className="h-2 w-2 animate-bounce rounded-full bg-brand-or [animation-delay:0ms]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-brand-or [animation-delay:150ms]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-brand-or [animation-delay:300ms]" />
    </div>
  );
}
