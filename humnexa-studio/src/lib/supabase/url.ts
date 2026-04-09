import { getRequiredPublicSupabaseEnv } from "@/lib/env/supabase";

export function getSupabaseUrlWithPooling(): string {
  return getRequiredPublicSupabaseEnv().url;
}

export function getSupabaseUrlForServer(): string {
  return getRequiredPublicSupabaseEnv().url;
}

