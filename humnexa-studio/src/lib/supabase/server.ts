import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseUrlWithPooling } from "@/lib/supabase/url";
import { getRequiredPublicSupabaseEnv } from "@/lib/env/supabase";

export function createSupabaseServer() {
  const cookieStore = cookies();
  const { anonKey } = getRequiredPublicSupabaseEnv();

  return createServerClient(
    getSupabaseUrlWithPooling(),
    anonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );
}
