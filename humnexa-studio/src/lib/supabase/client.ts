"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const safeSupabaseUrl = supabaseUrl ?? "http://127.0.0.1:54321";
const safeSupabaseAnonKey = supabaseAnonKey ?? "invalid-anon-key";

export const supabase = createBrowserClient<Database>(safeSupabaseUrl, safeSupabaseAnonKey);

if (typeof window !== "undefined" && (!supabaseUrl || !supabaseAnonKey)) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
}
