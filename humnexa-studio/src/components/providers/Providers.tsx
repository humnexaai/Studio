"use client";

import { useEffect } from "react";
import { PostHogProvider } from "posthog-js/react";
import posthog from "@/lib/analytics/posthog";
import { supabase } from "@/lib/supabase/client";
import { useUserStore } from "@/store/userStore";

export function Providers({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const setUser = useUserStore((state) => state.setUser);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user) return;
      const name = (user.user_metadata?.full_name as string | undefined) ?? "Builder";
      setUser({ userId: user.id, name, email: user.email ?? null });
      posthog.identify(user.id, {
        email: user.email ?? undefined,
        name,
      });
    });
  }, [setUser]);

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
