export async function captureServerEvent(
  event: string,
  properties: Record<string, unknown>,
): Promise<void> {
  try {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com";
    const distinctId = String(
      properties.userId ?? properties.user_id ?? properties.distinct_id ?? "server",
    );
    await fetch(`${host}/capture/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: key,
        event,
        distinct_id: distinctId,
        properties,
      }),
      cache: "no-store",
    });
  } catch {
    // Swallow analytics failures in server paths.
  }
}
