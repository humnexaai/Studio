function parseSupabaseProjectRef(hostname: string): string | null {
  if (hostname.endsWith(".supabase.co")) {
    return hostname.split(".")[0] ?? null;
  }
  if (hostname.endsWith(".pooler.supabase.com")) {
    return hostname.split(".")[0] ?? null;
  }
  return null;
}

export function buildPooledSupabaseDbUrl(rawUrl?: string): string | null {
  if (!rawUrl) return null;
  try {
    const parsed = new URL(rawUrl);
    const projectRef = parseSupabaseProjectRef(parsed.hostname);
    if (!projectRef) return null;

    const dbUrl = new URL(`postgresql://postgres.${projectRef}:6543/postgres`);
    dbUrl.hostname = `${projectRef}.pooler.supabase.com`;
    dbUrl.searchParams.set("pgbouncer", "true");
    dbUrl.searchParams.set("sslmode", "require");
    return dbUrl.toString();
  } catch {
    return null;
  }
}

export function getSupabaseUrlWithPooling(): string {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!rawUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is missing");
  }
  return rawUrl;
}

export function getSupabaseUrlForServer(): string {
  const pooledDbUrl = buildPooledSupabaseDbUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  return pooledDbUrl ?? getSupabaseUrlWithPooling();
}

