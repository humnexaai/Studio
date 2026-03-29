"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { supabase } from "@/lib/supabase/client";

export function SentryUserSync(): React.ReactElement | null {
  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user) return;
      Sentry.setUser({
        id: user.id,
        email: user.email ?? undefined,
        username:
          (user.user_metadata?.full_name as string | undefined) ??
          (user.email ?? undefined),
      });
    });
  }, []);

  return null;
}
