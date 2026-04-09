export function getSupabaseUrlWithPooling(): string {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!rawUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is missing");
  }
  return rawUrl;
}

export function getSupabaseUrlForServer(): string {
  return getSupabaseUrlWithPooling();
}

