"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

type MobileDashboardShellProps = {
  userId: string;
  creditBalance: number;
  planLimit: number;
};

export default function MobileDashboardShell({
  userId,
  creditBalance,
  planLimit,
}: MobileDashboardShellProps): React.ReactElement {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-brand-border bg-brand-surf px-4 py-3 md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-lg border border-brand-border bg-brand-card p-2 text-brand-sub"
          aria-label="Open dashboard menu"
        >
          <Menu className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold">Humnexa Dashboard</span>
        <div className="w-8" />
      </div>

      {open ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
            aria-label="Close dashboard menu backdrop"
          />
          <div className="relative h-full w-[260px] border-r border-brand-border bg-brand-surf">
            <div className="flex items-center justify-end px-3 py-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-brand-border bg-brand-card p-1.5 text-brand-sub"
                aria-label="Close dashboard menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="h-[calc(100%-52px)] overflow-y-auto">
              <DashboardSidebar
                userId={userId}
                creditBalance={creditBalance}
                planLimit={planLimit}
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
