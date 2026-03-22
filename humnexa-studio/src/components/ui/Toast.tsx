"use client";

import { useEffect } from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant = "success" | "error" | "info";

type ToastProps = {
  open: boolean;
  message: string;
  variant?: ToastVariant;
  onClose: () => void;
  autoCloseMs?: number;
};

const variantMap: Record<ToastVariant, string> = {
  success: "border-brand-gr/40 bg-brand-gr/10 text-brand-text",
  error: "border-brand-error/40 bg-brand-error/10 text-brand-text",
  info: "border-brand-info/40 bg-brand-info/10 text-brand-text",
};

export function Toast({
  open,
  message,
  variant = "info",
  onClose,
  autoCloseMs = 2500,
}: ToastProps): React.ReactElement | null {
  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(onClose, autoCloseMs);
    return () => window.clearTimeout(timer);
  }, [autoCloseMs, onClose, open]);

  if (!open) return null;

  const Icon = variant === "success" ? CheckCircle2 : variant === "error" ? AlertCircle : Info;
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className={cn("flex items-center gap-2 rounded-xl border px-4 py-3 shadow-xl", variantMap[variant])}>
        <Icon className="h-4 w-4" />
        <p className="text-sm">{message}</p>
      </div>
    </div>
  );
}
