"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";

export function NotificationsBell({
  userId,
  compact = false,
}: {
  userId: string;
  compact?: boolean;
}): React.ReactElement {
  const {
    notifications,
    unreadCount,
    markAllRead,
    requestDesktopPermission,
    permission,
  } = useNotifications(userId);
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`relative rounded-lg border border-brand-border bg-brand-card px-2 py-1.5 text-brand-sub transition hover:text-brand-text ${
          compact ? "text-xs" : "text-sm"
        }`}
      >
        <Bell className={compact ? "h-4 w-4" : "h-4 w-4"} />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-or px-1 text-[10px] font-semibold text-black">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-brand-border bg-brand-card shadow-xl">
          <div className="flex items-center justify-between border-b border-brand-border px-3 py-2">
            <p className="text-sm font-semibold">Notifications</p>
            <button
              type="button"
              onClick={() => void markAllRead()}
              className="text-xs text-brand-sub hover:text-brand-text"
            >
              Mark all read
            </button>
          </div>
          <div className="max-h-80 overflow-auto p-2">
            {notifications.length === 0 ? (
              <p className="rounded-lg px-2 py-3 text-xs text-brand-sub">
                No notifications yet.
              </p>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  className={`mb-2 rounded-lg border px-2 py-2 ${
                    item.isRead
                      ? "border-brand-border bg-brand-card2"
                      : "border-brand-or/40 bg-brand-or/10"
                  }`}
                >
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="mt-1 text-xs text-brand-sub">{item.body}</p>
                  <p className="mt-1 text-[10px] text-brand-muted">
                    {new Date(item.createdAt).toLocaleString("en-IN")}
                  </p>
                </div>
              ))
            )}
          </div>
          <div className="flex items-center justify-between border-t border-brand-border px-3 py-2">
            <p className="text-[11px] text-brand-sub">
              Desktop: {permission === "granted" ? "Enabled" : "Disabled"}
            </p>
            <button
              type="button"
              onClick={() => void requestDesktopPermission()}
              className="rounded-md border border-brand-border px-2 py-1 text-[11px] text-brand-sub"
            >
              Enable
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
