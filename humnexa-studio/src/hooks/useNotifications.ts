"use client";

import { useCallback, useState } from "react";
import { nanoid } from "nanoid";

type NotificationTone = "info" | "success" | "warning" | "error";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  tone: NotificationTone;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const pushNotification = useCallback(
    (title: string, message: string, tone: NotificationTone = "info") => {
      setNotifications((prev) => [...prev, { id: nanoid(), title, message, tone }]);
    },
    [],
  );

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  }, []);

  return { notifications, pushNotification, dismissNotification };
}
