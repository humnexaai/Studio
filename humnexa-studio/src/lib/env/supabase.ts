const PLACEHOLDER_MARKERS = [
  "your_",
  "your-project",
  "YOUR_PROJECT",
  "placeholder",
  "changeme",
  "<",
];

type PublicSupabaseEnv =
  | {
      configured: true;
      url: string;
      anonKey: string;
    }
  | {
      configured: false;
      missing: string[];
    };

function isUnsetOrPlaceholder(value: string | undefined): boolean {
  if (!value) return true;
  const normalized = value.trim();
  if (!normalized) return true;
  const lowered = normalized.toLowerCase();
  return PLACEHOLDER_MARKERS.some((marker) => lowered.includes(marker.toLowerCase()));
}

function buildMissingMessage(keys: string[]): string {
  return `Missing required Supabase env vars: ${keys.join(", ")}. Add them in environment variables (never hardcode secrets in source files).`;
}

export function readPublicSupabaseEnv(): PublicSupabaseEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const missing: string[] = [];

  if (isUnsetOrPlaceholder(url)) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (isUnsetOrPlaceholder(anonKey)) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (missing.length > 0) {
    return { configured: false, missing };
  }

  return {
    configured: true,
    url: url!.trim(),
    anonKey: anonKey!.trim(),
  };
}

export function getRequiredPublicSupabaseEnv(): { url: string; anonKey: string } {
  const env = readPublicSupabaseEnv();
  if (!env.configured) {
    throw new Error(buildMissingMessage(env.missing));
  }
  return {
    url: env.url,
    anonKey: env.anonKey,
  };
}

export function getRequiredAdminSupabaseEnv(): {
  url: string;
  serviceRoleKey: string;
} {
  const publicEnv = getRequiredPublicSupabaseEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const missing: string[] = [];

  if (isUnsetOrPlaceholder(serviceRoleKey)) {
    missing.push("SUPABASE_SERVICE_ROLE_KEY");
  }
  if (missing.length > 0) {
    throw new Error(buildMissingMessage(missing));
  }

  return {
    url: publicEnv.url,
    serviceRoleKey: serviceRoleKey!.trim(),
  };
}

export function getPublicSupabaseEnvWarning(): string | null {
  const env = readPublicSupabaseEnv();
  if (env.configured) return null;
  return buildMissingMessage(env.missing);
}
