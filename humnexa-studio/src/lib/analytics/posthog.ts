import posthog from "posthog-js";

let initialized = false;

export function initPosthogClient(): void {
  if (initialized) return;
  if (typeof window === "undefined") return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;

  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com",
    capture_pageview: true,
    persistence: "localStorage",
    person_profiles: "identified_only",
  });
  initialized = true;
}

export default posthog;
