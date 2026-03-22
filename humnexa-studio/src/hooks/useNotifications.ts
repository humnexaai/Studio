"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export interface AppNotificationRow {
  id: string;
  title: string;
  body: string;
  type: string;
  readAt: string | null;
  isRead: boolean;
  createdAt: string;
}

function shouldDesktopNotify(type: string): boolean {
  return ["deploy_success", "deploy_failed", "credits_zero"].includes(type);
}

function hasNotificationApi(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState<AppNotificationRow[]>([]);
  const [permission, setPermission] = useState<NotificationPermission>(
    hasNotificationApi() ? window.Notification.permission : "default",
  );
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadInitial = async (): Promise<void> => {
      const { data } = await supabase
        .from("notifications")
        .select("id,title,body,type,read_at,is_read,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);
      if (!mounted) return;
      const rows = (data ??
        []) as Array<{
        id: string;
        title: string;
        body: string;
        type: string;
        read_at?: string | null;
        is_read?: boolean;
        created_at: string;
      }>;
      setNotifications(
        rows.map((row) => ({
          id: row.id,
          title: row.title,
          body: row.body,
          type: row.type,
          readAt: row.read_at ?? null,
          isRead: row.is_read ?? Boolean(row.read_at),
          createdAt: row.created_at,
        })),
      );
    };
    void loadInitial();

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const next = payload.new as {
            id: string;
            title: string;
            body: string;
            type: string;
            read_at?: string | null;
            is_read?: boolean;
            created_at: string;
          };
          const item: AppNotificationRow = {
            id: next.id,
            title: next.title,
            body: next.body,
            type: next.type,
            readAt: next.read_at ?? null,
            isRead: next.is_read ?? Boolean(next.read_at),
            createdAt: next.created_at,
          };
          setNotifications((prev) => [item, ...prev].slice(0, 10));
          setToast(next.title);
          if (
            permission === "granted" &&
            shouldDesktopNotify(next.type) &&
            hasNotificationApi()
          ) {
            new window.Notification(next.title, { body: next.body });
          }
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      void supabase.removeChannel(channel);
    };
  }, [userId, permission]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications],
  );

  const markAllRead = useCallback(async (): Promise<void> => {
    const db = supabase as unknown as {
      from: (table: string) => {
        update: (values: Record<string, unknown>) => {
          eq: (column: string, value: string) => Promise<{
            error: { message?: string } | null;
          }>;
        };
      };
    };
    await db
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("user_id", userId);
    setNotifications((prev) =>
      prev.map((item) => ({
        ...item,
        isRead: true,
        readAt: item.readAt ?? new Date().toISOString(),
      })),
    );
  }, [userId]);

  const requestDesktopPermission = useCallback(async (): Promise<void> => {
    if (!hasNotificationApi()) return;
    const next = await window.Notification.requestPermission();
    setPermission(next);
  }, []);

  return {
    notifications,
    unreadCount,
    markAllRead,
    requestDesktopPermission,
    permission,
    toast,
    clearToast: () => setToast(null),
  };
}
