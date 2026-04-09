import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getRequiredAdminSupabaseEnv } from "@/lib/env/supabase";

let adminClient: ReturnType<typeof createClient<Database>> | null = null;

export function createSupabaseAdmin() {
  if (adminClient) return adminClient;

  const { url, serviceRoleKey } = getRequiredAdminSupabaseEnv();

  adminClient = createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: "public",
    },
  });

  return adminClient;
}
