"use client";

import * as Sentry from "@sentry/nextjs";
import { Component, type ReactNode } from "react";

type Props = {
  panelName: string;
  children: ReactNode;
};

type State = {
  hasError: boolean;
  message: string | null;
};

export class PanelErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    message: null,
  };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error.message || "Unknown panel error",
    };
  }

  componentDidCatch(error: Error): void {
    Sentry.captureException(error, { tags: { panel: this.props.panelName } });
  }

  private retry = (): void => {
    this.setState({ hasError: false, message: null });
  };

  private reportIssue = (): void => {
    Sentry.captureMessage(`Panel error report requested: ${this.props.panelName}`, "error");
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="m-3 rounded-2xl border border-brand-border bg-brand-card p-4">
        <div className="mb-2 inline-flex items-center gap-2 text-sm font-semibold">
          <span className="rounded bg-brand-card2 px-2 py-1 text-xs">Humnexa</span>
          Panel Error
        </div>
        <p className="text-sm text-brand-sub">Something went wrong in this panel.</p>
        {this.state.message ? (
          <p className="mt-2 rounded border border-brand-border bg-brand-card2 px-2 py-1 text-xs text-brand-muted">
            {this.state.message}
          </p>
        ) : null}
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={this.retry}
            className="rounded-md bg-brand-gradient px-3 py-1.5 text-xs font-semibold text-white"
          >
            Retry
          </button>
          <button
            type="button"
            onClick={this.reportIssue}
            className="rounded-md border border-brand-border px-3 py-1.5 text-xs text-brand-sub"
          >
            Report Issue
          </button>
        </div>
      </div>
    );
  }
}
