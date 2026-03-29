"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactElement {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-bg px-4">
      <div className="w-full max-w-md rounded-2xl border border-brand-border bg-brand-card p-6 text-center">
        <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-brand-or/20 text-2xl font-black text-brand-or">
          H
        </div>
        <h1 className="text-xl font-bold text-brand-text">Something went wrong</h1>
        <p className="mt-2 text-sm text-brand-sub">
          We hit an unexpected error while loading this page.
        </p>
        <div className="mt-5 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="rounded-lg bg-brand-gradient px-4 py-2 text-sm font-semibold text-white"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => {
              Sentry.captureException(error);
              if (typeof window !== "undefined") {
                window.open("https://github.com/humnexaai/Studio/issues", "_blank");
              }
            }}
            className="rounded-lg border border-brand-border px-4 py-2 text-sm text-brand-sub"
          >
            Report Issue
          </button>
        </div>
      </div>
    </div>
  );
}
