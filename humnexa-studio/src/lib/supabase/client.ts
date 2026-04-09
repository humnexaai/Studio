"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { getPublicSupabaseEnvWarning, readPublicSupabaseEnv } from "@/lib/env/supabase";

const publicEnv = readPublicSupabaseEnv();

// Keep the app shell renderable even when env is missing, but never embed real secrets in code.
const fallbackClient = createBrowserClient<Database>(
  "https://invalid.supabase.local",
  "invalid-anon-key",
);

export const supabase = publicEnv.configured
  ? createBrowserClient<Database>(publicEnv.url, publicEnv.anonKey)
  : fallbackClient;

if (typeof window !== "undefined") {
  const warning = getPublicSupabaseEnvWarning();
  if (warning) {
    // eslint-disable-next-line no-console
    console.warn(warning);
  }
}
